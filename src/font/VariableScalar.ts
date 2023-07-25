import { Matrix } from "@svgdotjs/svg.js";
import { NormalizedLocation, VariationModel } from "./varmodel";
import { Axis, PainterFont } from "./Font";
import { VarStoreBuilder } from "./varstorebuilder";
import { MatrixType, matrixType } from "./VariableMatrix";

function parseKey(s: string): NormalizedLocation {
    let out = {} as NormalizedLocation;
    for (let part of s.split(",")) {
        let [k, v] = part.split(":");
        out[k] = Number(v);
    }
    return out;
}

export function f2dot14(f: number): number {
    return Math.round(f * 16384);
}

type OTConvertor<T> = (n: T) => number;

export abstract class VariableThing<T> {
    values: Map<string, T>;
    interpolation_cache: Map<string, T>;
    _model: VariationModel | null = null;
    axes: string[];

    constructor(axes: string[]) {
        this.values = new Map();
        this.interpolation_cache = new Map();
        this._model = null;
        this.axes = axes;
    }

    deflate(): object {
        let out = "";
        for (let [k, v] of Array.from(this.values.entries())) {
            out += `${k}=${v};`;
        }
        return {
            axes: this.axes,
            values: out,
        }
    }

    locations(axis: Axis): number[] {
        let out: number[] = [];
        for (let k of Array.from(this.values.keys())) {
            let loc = parseKey(k);
            let val: number = loc[axis.tag];
            // Denormalize value
            if (val > 0) {
                val = val * (axis.max - axis.default) + axis.default;
            } else {
                val = val * (axis.default - axis.min) + axis.default;
            }
            out.push(val);
        }
        console.log("locations: ", out);
        return out;

    }

    addValue(loc: NormalizedLocation, value: T) {
        let key = Object.keys(loc)
            .sort()
            .map((k) => `${k}:${loc[k]}`)
            .join(",");
        this.values.set(key, value);
        this.interpolation_cache.clear();
        this._model = null;
    }

    get model(): VariationModel {
        if (!this._model) {
            let masterLocations: NormalizedLocation[] = Array.from(
                this.values.keys()
            ).map((x) => parseKey(x));
            this._model = new VariationModel(
                masterLocations,
                Object.keys(this.axes)
            );
        }
        return this._model;
    }

    clone(): VariableThing<T> {
        let out = this.factory([...this.axes]);
        for (let [k, v] of Array.from(this.values.entries())) {
            out.values.set(k, this.clone_value(v));
        }
        return out;
    }
    abstract factory(axes: string[]): VariableThing<T>;
    abstract clone_value(v: T): T;
    abstract label_value(v: T): string;

    get doesVary(): boolean {
        return this.values.size > 1;
    }

    valueAt(loc: NormalizedLocation): T {
        let key = Object.keys(loc)
            .sort()
            .map((k) => `${k}:${loc[k]}`)
            .join(",");
        // console.log((new Error()).stack)
        if (this.values.size == 0) {
            // console.log("No values, returning identity")
            return this.identity();
        }
        if (this.values.size == 1) {
            // console.log("One value, returning it: ", this.values.values().next().value)
            return this.values.values().next().value;
        }

        if (this.values.has(key)) {
            // console.log("Found exact match: ", this.values.get(key))
            return this.values.get(key)!;
        }

        let value = this.interpolation_cache.get(key);
        if (value) {
            // console.log("Found cached value: ", value)
            return value;
        } else {
            let scalars = this.model!.getScalars(loc);
            let masters = Array.from(this.values.values());
            let val = this._valueFromMastersAndScalars(masters, scalars);
            this.interpolation_cache.set(key, val);
            return val;
        }
    }

    addToVarStore(
        builder: VarStoreBuilder,
        convertor: OTConvertor<T> | null = null
    ): number {
        let masters: number[] = [];
        if (convertor === null) {
            convertor = (x: T) => x as unknown as number;
        }
        for (var master of Array.from(this.values.values())) {
            masters.push(convertor(master));
        }
        builder.setModel(this.model!);
        let [_, varIndex] = builder.storeMasters(masters);
        return varIndex;
    }

    abstract identity(): T
    abstract _valueFromMastersAndScalars(masters: T[], scalars: number[]): T
}

export class VariableScalar extends VariableThing<number> {
    identity() { return 0 }
    factory(axes: string[]): VariableScalar {
        return new VariableScalar(axes)
    }
    clone_value(v: number) { return v }
    label_value(v: number) { return v.toString() }
    _valueFromMastersAndScalars(masters: number[], scalars: number[]): number {
        return this.model!.interpolateFromMastersAndScalars(
            masters,
            scalars
        ) || 0;
    }
    public static inflate(obj: any, _f: PainterFont): VariableScalar {
        let out = new VariableScalar(obj.axes);
        for (let part of obj.values.split(";")) {
            if (part.length == 0) {
                continue;
            }
            let [k, v] = part.split("=");
            out.values.set(k, Number(v));
        }
        return out;
    }

}
