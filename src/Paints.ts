// This is our internal, slightly restricted version of paint layers.
import { Matrix } from "@svgdotjs/svg.js";
import { PainterFont } from './Font';

export class SolidFill {
    color: string;
    constructor(color: string) {
        this.color = color;
    }
}

export class GradientStop {
    color: string;
    offset: number;
    constructor(color: string, offset: number) {
        this.color = color;
        this.offset = offset;
    }
}

export class LinearGradientFill {
    stops: GradientStop[];
    constructor(stops: GradientStop[]) {
        this.stops = stops;
    }
}

export class Paint {
    gid: number;
    fill: SolidFill | LinearGradientFill;
    matrix: Matrix;
    opacity: number;

    constructor(gid: number, fill: SolidFill | LinearGradientFill, matrix: Matrix, opacity: number = 1.0) {
        this.gid = gid;
        this.fill = fill;
        this.matrix = matrix;
        this.opacity = opacity;
    }

    label(font: PainterFont | null): string {
        if (font) {
            return font.glyphInfos()[this.gid].name;
        }
        else { return `gid${this.gid}` }
    }

    matrixLabel(): string {
        if (this.matrix.a == 1 && this.matrix.b == 0 && this.matrix.c == 0 && this.matrix.d == 1 && this.matrix.e == 0 && this.matrix.f == 0) {
            return "";
        } else if (this.matrix.a == 1 && this.matrix.b == 0 && this.matrix.c == 0 && this.matrix.d == 1) {
            return ` ${this.matrix.e}, ${this.matrix.f}`;
        } else {
            return ` ${this.matrix.toString()}`;
        }
    }
}
