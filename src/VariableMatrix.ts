import { Matrix } from "@svgdotjs/svg.js";
import { NormalizedLocation, VariationModel } from "./varmodel";
import { VarStoreBuilder } from "./varstorebuilder";

export enum MatrixType {
    None,
    Translation,
    ScaleUniform,
    ScaleNonUniform,
    Transform
}

type OTConvertor = (n: number) => number;

export function matrixType(matrix: Matrix): MatrixType {
    if (matrix.a == 1 && matrix.b == 0 && matrix.c == 0 && matrix.d == 1 && matrix.e == 0 && matrix.f == 0) {
        return MatrixType.None
    }
    if (matrix.a == 1 && matrix.b == 0 && matrix.c == 0 && matrix.d == 1) {
        return MatrixType.Translation
    }
    if (matrix.b == 0 && matrix.c == 0 && matrix.e == 0 && matrix.f == 0) {
        if (matrix.a == matrix.d) {
            return MatrixType.ScaleUniform;
        } else {
            return MatrixType.ScaleNonUniform;
        }
    }
    return MatrixType.Transform;
}

export function matrixLabel(matrix: Matrix): string {
    let max2dp = (num: number) => (num || 0).toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 0 });
    let style = matrixType(matrix);
    if (style == MatrixType.None) {
        return "";
    } else if (style == MatrixType.Translation) {
        return ` ${Math.round(matrix.e)}, ${Math.round(matrix.f)}`;
    } else {
        return ` (${max2dp(matrix.a)},${max2dp(matrix.b)},${max2dp(matrix.c)},${max2dp(matrix.d)},${Math.round(matrix.e)},${Math.round(matrix.f)})`;
    }
}

function parseKey(s: string): NormalizedLocation {
    let out = {} as NormalizedLocation
    for (let part of s.split(",")) {
        let [k, v] = part.split(":")
        out[k] = Number(v)
    }
    return out
}

export class VariableMatrix {
    values: Map<string, Matrix>
    interpolation_cache: Map<string, Matrix>
    model: VariationModel | null = null
    axes: string[]

    constructor(axes: string[]) {
        this.values = new Map()
        this.interpolation_cache = new Map()
        this.model = null
        this.axes = axes
    }

    addValue(loc: NormalizedLocation, value: Matrix) {
        let key = Object.keys(loc).sort().map(k => `${k}:${loc[k]}`).join(",")
        this.values.set(key, value)
        this.interpolation_cache.clear()

        let masterLocations: NormalizedLocation[] = Array.from(this.values.keys()).map((x) => parseKey(x))
        this.model = new VariationModel(masterLocations, Object.keys(this.axes));
    }

    clone(): VariableMatrix {
        let out = new VariableMatrix([...this.axes])
        for (let [k, v] of Array.from(this.values.entries())) {
            out.values.set(k, v.clone())
        }
        return out
    }

    get doesVary(): boolean {
        return this.values.size > 1
    }

    valueAt(loc: NormalizedLocation): Matrix {
        let key = Object.keys(loc).sort().map(k => `${k}:${loc[k]}`).join(",")
        // console.log((new Error()).stack)
        if (this.values.size == 0) {
            // console.log("No values, returning identity")
            return new Matrix()
        }
        if (this.values.size == 1) {
            // console.log("One value, returning it: ", this.values.values().next().value)
            return this.values.values().next().value
        }

        if (this.values.has(key)) {
            // console.log("Found exact match: ", this.values.get(key))
            return this.values.get(key)!
        }
        
        let value = this.interpolation_cache.get(key)
        if (value) {
            // console.log("Found cached value: ", value)
            return value
        } else {
            let scalars = this.model!.getScalars(loc);
            let outmatrix = new Matrix();
            for (var element of ["a", "b", "c", "d", "e", "f"]) {
                let components: number[] = Array.from(this.values.values(), (matrix) => matrix[element]);
                outmatrix[element] = this.model!.interpolateFromMastersAndScalars(components, scalars);
            }
            // console.log("Interpolated value: ", outmatrix)
            this.interpolation_cache.set(key, outmatrix)
            return outmatrix
        }
    }

    mostComplexType(): MatrixType {
        let outtype = MatrixType.None;
        for (let matrix of Array.from(this.values.values())) {
            let type = matrixType(matrix)
            if (outtype == MatrixType.None) {
                outtype = type
            }
            if (type != outtype) {
                return MatrixType.Transform;
            }
        }
        return outtype
    }

    addToVarStore(builder: VarStoreBuilder, element: string, convertor: OTConvertor | null = null): number {
        let locations = [];
        let masters = [];
        if (!convertor) {
            convertor = (x) => x;
        }
        for (var [loc_key, matrix] of Array.from(this.values.entries())) {
            let loc = parseKey(loc_key)
            locations.push(loc)
            masters.push(convertor(matrix[element]))
        }
        builder.setModel(this.model!);
        let [_, varIndex] = builder.storeMasters(masters)
        return varIndex;
    }
        
}