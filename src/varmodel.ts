enum NormalizedTag { _ = '' };
enum UnnormalizedTag { _ = '' };

interface Axis {
	tag: string;
	name?: string;
	min: number;
	max: number;
	default: number;
}

export type UnnormalizedLocation = Record<string, number> & UnnormalizedTag;
export type NormalizedLocation = Record<string, number> & NormalizedTag;
type Location = NormalizedLocation | UnnormalizedLocation;
export type Support = Record<string, number[]>;
type SortFunction = (a: NormalizedLocation, b: NormalizedLocation) => number;

function isSuperset<T>(set: Set<T>, subset: Set<T>): boolean {
	for (let elem of Array.from(subset.values())) {
		if (!set.has(elem)) {
			return false;
		}
	}
	return true;
}

function subList(truth: any[], list: any[]): any[] {
	return list.filter((it, ix) => truth[ix]);
}

export function normalizeValue(v: number, axis: Axis): number {
	v = Math.max(Math.min(v, axis.max), axis.min);
	if (v < axis.default) {
		return (v - axis.default) / (axis.default - axis.min);
	}
	if (v > axis.default) {
		return (v - axis.default) / (axis.max - axis.default);
	}
	return 0;
}

export function normalizeLocation(location: Location, axes: Axis[]): NormalizedLocation {
	var out: NormalizedLocation = {} as NormalizedLocation;
	for (var axis of axes) {
		var loc_value;
		if (axis.tag in location) {
			loc_value = location[axis.tag];
		} else {
			loc_value = axis.default;
		}
		out[axis.tag] = normalizeValue(loc_value, axis);
	}
	return out;
}

export function supportScalar(location: NormalizedLocation, support: Support): number {
	let scalar = 1;
	for (var tag in support) {
		let [lower, peak, upper] = support[tag];
		if (peak == 0) {
			continue;
		}
		if (lower > peak || peak > upper) {
			continue;
		}
		if (lower < 0 && upper > 0) {
			continue;
		}
		var v = location[tag] || 0;
		if (v == peak) {
			continue;
		}
		if (v <= lower || upper <= v) {
			scalar = 0;
			break;
		}
		if (v < peak) {
			scalar *= (v - lower) / (peak - lower);
		} else {
			scalar *= (v - upper) / (peak - upper);
		}
	}
	return scalar;
}

export class VariationModel {
	origLocations: NormalizedLocation[];
	locations: NormalizedLocation[];
	supports: Support[];
	axisOrder: string[];
	mapping: number[];
	reverseMapping: number[];
	_subModels: Map<number[], VariationModel>;
	deltaWeights: Record<number, number>[];

	constructor(locations: NormalizedLocation[], axisOrder: string[]) {
		this.axisOrder = axisOrder;
		this.origLocations = locations;
		this.deltaWeights = []; // Make compiler happier
		this.supports = []; // Make compiler happier
		var loc2: NormalizedLocation[] = [];

		for (var loc of this.origLocations) {
			let activeAxes = Object.keys(loc).filter((tag) => loc[tag] != 0)
			let newLoc = {} as NormalizedLocation;
			for (var axis of activeAxes) {
				newLoc[axis] = loc[axis];
			}
			loc2.push(newLoc)
		}
		var [keyFunc, axisPoints] = this.getMasterLocationsSortKeyFunc(
			loc2,
			this.axisOrder
		);

		this.locations = loc2.sort(keyFunc);

		this.mapping = loc2.map((l) =>
			this.locations.map((x) => JSON.stringify(x)).indexOf(JSON.stringify(l))
		);
		this.reverseMapping = this.locations.map((l) =>
			loc2
				.map((x) => JSON.stringify(x))
				.indexOf(JSON.stringify(l))
		);
		this._computeMasterSupports(axisPoints);
		this._subModels = new Map<number[], VariationModel>();
	}

	getSubModel(items: (number | null)[]): [VariationModel, (number | null)[]] {
		if (!items.some((x) => x == null)) {
			return [this, items];
		}
		let key: number[] = items.filter((x) => x != null) as number[];
		let submodel = this._subModels.get(key);
		if (!submodel) {
			submodel = new VariationModel(subList(key, this.origLocations), []);
			this._subModels.set(key, submodel);
		}
		return [submodel, subList(key, items)];
	}

	getMasterLocationsSortKeyFunc(
		locations: Location[],
		axisOrder: string[]
	): [SortFunction, Record<string, Set<number>>] {
		var axisPoints: Record<string, Set<number>> = {};
		for (var loc of locations) {
			if (Object.keys(loc).length != 1) {
				continue;
			}
			let axis = Object.keys(loc)[0];
			let value = loc[axis];
			if (!(axis in axisPoints)) {
				axisPoints[axis] = new Set<number>().add(0);
			}
			axisPoints[axis].add(value);
		}

		var func = function (a: NormalizedLocation, b: NormalizedLocation): number {
			var keyLen = Object.keys(a).length - Object.keys(b).length;
			if (keyLen != 0) {
				return keyLen;
			}
			var onpoint_a: string[] = Object.keys(a).filter((axis) => {
				axis in axisPoints && axisPoints[axis].has(a[axis]);
			});
			var onpoint_b: string[] = Object.keys(b).filter((axis) => {
				axis in axisPoints && axisPoints[axis].has(b[axis]);
			});
			var onpoint = onpoint_a.length - onpoint_b.length;
			if (onpoint != 0) {
				return onpoint;
			}
			for (var axis of Object.keys(a)) {
				if (Math.sign(a[axis]) != Math.sign(b[axis])) {
					return Math.sign(a[axis]) - Math.sign(b[axis]);
				}
			}
			return 0;
		};
		return [func, axisPoints];
	}

	_computeMasterSupports(axisPoints: Record<string, Set<number>>) {
		let supports: Support[] = [];
		let regions = this._locationsToRegions();
		for (var i in regions) {
			var region: Support = regions[i];
			let locAxes = new Set(Object.keys(region));
			for (var j in Array.from(Array(i).keys())) {
				var prev_region = regions[j];
				if (!isSuperset(locAxes, new Set(Object.keys(prev_region)))) {
					continue;
				}

				var relevant = true;
				for (var axis of Object.keys(region)) {
					var [lower, peak, upper] = region[axis];
					if (
						!(axis in prev_region) ||
						!(
							prev_region[axis][1] == peak ||
							(lower < prev_region[axis][1] && prev_region[axis][1] < upper)
						)
					) {
						relevant = false;
						break;
					}
				}
				if (!relevant) {
					continue;
				}

				// Split the box
				let bestAxes: Support = {};
				let bestRatio = -1;
				for (axis in prev_region) {
					let val = prev_region[axis][1];
					console.assert(axis in region);
					let [lower, locV, upper] = region[axis];
					let [newLower, newUpper] = [lower, upper];
					var ratio;
					if (val < locV) {
						newLower = val;
						ratio = (val - locV) / (lower - locV);
					} else if (locV < val) {
						newUpper = val;
						ratio = (val - locV) / (upper - locV);
					} else {
						// Can't split box in this direction.
						continue;
					}
					if (ratio > bestRatio) {
						bestAxes = {};
						bestRatio = ratio;
					}
					if (ratio == bestRatio) {
						bestAxes[axis] = [newLower, locV, newUpper];
					}
				}
				for (var axis in bestAxes) {
					region[axis] = bestAxes[axis];
				}
			}
			supports.push(region);
		}
		this.supports = supports;
		this._computeDeltaWeights();
	}

	_locationsToRegions(): Support[] {
		let locations: NormalizedLocation[] = this.locations;
		let minV: NormalizedLocation = {} as NormalizedLocation;
		let maxV: NormalizedLocation = {} as NormalizedLocation;
		for (var l of locations) {
			for (var k of Object.keys(l)) {
				let v = l[k];
				if (!(k in minV)) {
					minV[k] = v;
				}
				if (!(k in maxV)) {
					maxV[k] = v;
				}
				minV[k] = Math.min(v, minV[k]);
				maxV[k] = Math.max(v, maxV[k]);
			}
		}
		let regions = [];
		for (var i in locations) {
			let loc = locations[i];
			let region: Support = {};
			for (var axis in loc) {
				let locV = loc[axis];
				if (locV > 0) {
					region[axis] = [0, locV, maxV[axis]];
				} else {
					region[axis] = [minV[axis], locV, 0];
				}
			}
			regions.push(region);
		}
		return regions;
	}

	_computeDeltaWeights() {
		let deltaWeights: Record<number, number>[] = [];
		this.locations.forEach((loc, i) => {
			let deltaWeight: Record<number, number> = {};
			this.locations.slice(0, i).forEach((m, j) => {
				let scalar = supportScalar(loc, this.supports[j]);
				if (scalar) {
					deltaWeight[j] = scalar;
				}
			});
			deltaWeights.push(deltaWeight);
		});
		this.deltaWeights = deltaWeights;
	}

	getDeltas(masterValues: number[]): number[] {
		console.assert(masterValues.length == this.deltaWeights.length);
		let mapping = this.reverseMapping;
		let out: number[] = [];
		this.deltaWeights.forEach((weights, i) => {
			let delta = masterValues[mapping[i]];
			for (var j in weights) {
				var weight = weights[j];
				if (weight == 1) {
					delta -= out[j];
				} else {
					delta -= out[j] * weight;
				}
			}
			out.push(delta);
		});
		return out;
	}

	getScalars(loc: NormalizedLocation): number[] {
		return this.supports.map((support) => supportScalar(loc, support));
	}

	interpolateFromDeltasAndScalars(
		deltas: number[],
		scalars: number[]
	): number | null {
		let v: number | null = null;
		console.assert(deltas.length == scalars.length);
		deltas.forEach((delta, ix) => {
			let scalar = scalars[ix];
			if (!scalar) {
				return;
			}
			let contribution = delta * scalar;
			if (v == null) {
				v = contribution;
			} else {
				v += contribution;
			}
		});
		return v;
	}

	interpolateFromDeltas(loc: NormalizedLocation, deltas: number[]): number | null {
		let scalars = this.getScalars(loc);
		return this.interpolateFromDeltasAndScalars(deltas, scalars);
	}

	interpolateFromMasters(loc: NormalizedLocation, masterValues: number[]) {
		let deltas = this.getDeltas(masterValues);
		return this.interpolateFromDeltas(loc, deltas);
	}

	interpolateFromMastersAndScalars(masterValues: number[], scalars: number[]) {
		let deltas = this.getDeltas(masterValues);
		return this.interpolateFromDeltasAndScalars(deltas, scalars);
	}
}
