import { Matrix } from "@svgdotjs/svg.js";
import { VariableThing } from "./VariableScalar";
import { NormalizedLocation, VariationModel } from "./varmodel";
import { VarStoreBuilder } from "./varstorebuilder";

export enum MatrixType {
    None,
    Translation,
    ScaleUniform,
    ScaleNonUniform,
    Transform,
}

export function matrixType(matrix: Matrix): MatrixType {
    if (
        matrix.a == 1 &&
        matrix.b == 0 &&
        matrix.c == 0 &&
        matrix.d == 1 &&
        matrix.e == 0 &&
        matrix.f == 0
    ) {
        return MatrixType.None;
    }
    if (matrix.a == 1 && matrix.b == 0 && matrix.c == 0 && matrix.d == 1) {
        return MatrixType.Translation;
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

export class VariableMatrix extends VariableThing<Matrix> {

    identity(): Matrix { return new Matrix(); }
    factory(axes: string[]): VariableMatrix { return new VariableMatrix(axes) }
    clone_value(v: Matrix): Matrix { return v.clone() }
    label_value(matrix: Matrix): string {
        let max2dp = (num: number) =>
            (num || 0).toLocaleString(undefined, {
                maximumFractionDigits: 2,
                minimumFractionDigits: 0,
            });
        let style = matrixType(matrix);
        if (style == MatrixType.None) {
            return "";
        } else if (style == MatrixType.Translation) {
            return ` ${Math.round(matrix.e)}, ${Math.round(matrix.f)}`;
        } else {
            return ` (${max2dp(matrix.a)},${max2dp(matrix.b)},${max2dp(
                matrix.c
            )},${max2dp(matrix.d)},${Math.round(matrix.e)},${Math.round(
                matrix.f
            )})`;
        }
    }
    _valueFromMastersAndScalars(masters: Matrix[], scalars: number[]): Matrix {
        let outmatrix = new Matrix();
        for (var element of ["a", "b", "c", "d", "e", "f"]) {
            let components: number[] = masters.map(
                (matrix) => matrix[element]
            );
            outmatrix[
                element
            ] = this.model!.interpolateFromMastersAndScalars(
                components,
                scalars
            );
        }
        return outmatrix;
    }

    mostComplexType(): MatrixType {
        let outtype = MatrixType.None;
        for (let matrix of Array.from(this.values.values())) {
            let type = matrixType(matrix);
            if (outtype == MatrixType.None) {
                outtype = type;
            }
            if (type != outtype) {
                return MatrixType.Transform;
            }
        }
        return outtype;
    }

}
