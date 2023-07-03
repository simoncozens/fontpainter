// This is our internal, slightly restricted version of paint layers.
import { Matrix } from "@svgdotjs/svg.js";
import { PainterFont } from './Font';
import { Paint as OTPaint } from "./fontkit-bits/tables/COLR";
import * as SVG from "@svgdotjs/svg.js";
import '@svgdotjs/svg.draggable.js'

function toRGBA(hex: string) {
    hex = hex.charAt(0) === '#' ? hex.slice(1) : hex;
    const isShort = (hex.length === 3 || hex.length === 4);
    const twoDigitHexR = isShort ? `${hex.slice(0, 1)}${hex.slice(0, 1)}` : hex.slice(0, 2);
    const twoDigitHexG = isShort ? `${hex.slice(1, 2)}${hex.slice(1, 2)}` : hex.slice(2, 4);
    const twoDigitHexB = isShort ? `${hex.slice(2, 3)}${hex.slice(2, 3)}` : hex.slice(4, 6);
    const twoDigitHexA = ((isShort ? `${hex.slice(3, 4)}${hex.slice(3, 4)}` : hex.slice(6, 8)) || 'ff');
    console.log(twoDigitHexR, twoDigitHexG, twoDigitHexB)
    return {
        red: parseInt(twoDigitHexR, 16),
        green: parseInt(twoDigitHexG, 16),
        blue: parseInt(twoDigitHexB, 16),
        alpha: parseInt(twoDigitHexA, 16),
    }
}

export class Palette {
    colors: string[];
    constructor() {
        this.colors = [];
    }

    indexOf(color: string): number {
        let index = this.colors.indexOf(color);
        if (index == -1) {
            this.colors.push(color);
            index = this.colors.length - 1;
        }
        return index
    }

    toOpenType(): any {
        return {
            version: 0,
            numPaletteEntries: this.colors.length,
            numPalettes: 1,
            numColorRecords: this.colors.length,
            colorRecords: this.colors.map(toRGBA),
            colorRecordIndices: [0]
        }
    }
}

export class SolidFill {
    color: string;
    opacity: number;

    constructor(color: string, opacity: number) {
        this.color = color;
        this.opacity = opacity;
    }

    toOpenType(palette: Palette): any {
        return {
            version: 2,
            paletteIndex: palette.indexOf(this.color),
            alpha: this.opacity
        }
    }
}

export class GradientStop {
    color: string;
    offset: number;
    opacity: number;

    constructor(color: string, offset: number, opacity: number) {
        this.color = color;
        this.offset = offset;
        this.opacity = opacity;
    }

    toOpenType(palette: Palette): any {
        return {
            stopOffset: this.offset,
            paletteIndex: palette.indexOf(this.color),
            alpha: this.opacity
        }
    }
}

export class LinearGradientFill {
    stops: GradientStop[];
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    x2: number;
    y2: number;

    constructor(stops: GradientStop[], x0: number, y0: number, x1: number, y1: number, x2: number, y2: number) {
        this.stops = stops;
        this.x0 = x0;
        this.y0 = y0;
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
    }
    toOpenType(palette: Palette): any {
        let colorline = {
            extend: 0,
            numStops: this.stops.length,
            colorStops: this.stops.map((stop) => stop.toOpenType(palette))
        }
        return {
            version: 4,
            colorLine: colorline,
            x0: this.x0,
            y0: this.y0,
            x1: this.x1,
            y1: this.y1,
            x2: this.x2,
            y2: this.y2,
        }
    }
}

enum MatrixType {
    None,
    Translation,
    ScaleUniform,
    ScaleNonUniform,
    Transform
}

export class Paint {
    gid: number;
    fill: SolidFill | LinearGradientFill;
    matrix: Matrix;
    locked: boolean = false;
    rendering!: SVG.G
    _font: PainterFont

    constructor(gid: number, fill: SolidFill | LinearGradientFill, matrix: Matrix, font: PainterFont) {
        this.gid = gid;
        this.fill = fill;
        this.matrix = matrix;
        this._font = font;
        this.render()
    }


    public get label(): string {
        return this._font.glyphInfos()[this.gid].name;
    }

    matrixType(): MatrixType {
        if (this.matrix.a == 1 && this.matrix.b == 0 && this.matrix.c == 0 && this.matrix.d == 1 && this.matrix.e == 0 && this.matrix.f == 0) {
            return MatrixType.None
        }
        if (this.matrix.a == 1 && this.matrix.b == 0 && this.matrix.c == 0 && this.matrix.d == 1) {
            return MatrixType.Transform
        }
        if (this.matrix.b == 0 && this.matrix.c == 0 && this.matrix.e == 0 && this.matrix.f == 0) {
            if (this.matrix.a == this.matrix.d) {
                return MatrixType.ScaleUniform;
            } else {
                return MatrixType.ScaleNonUniform;
            }
        }
        return MatrixType.Translation;
    }

    matrixLabel(): string {
        let style = this.matrixType();
        if (style == MatrixType.None) {
            return "";
        } else if (style == MatrixType.Translation) {
            return ` ${this.matrix.e}, ${this.matrix.f}`;
        } else {
            return ` ${this.matrix.toString()}`;
        }
    }

    render() {
        let thisglyph = new SVG.G();
        const svgDoc = SVG.SVG(this._font.getSVG(this.gid));
        svgDoc.children().forEach((c) => thisglyph.add(c));

        if (this.fill instanceof SolidFill) {
            thisglyph.attr({ "fill": this.fill.color });
            thisglyph.attr({ "fill-opacity": this.fill.opacity.toString() });
        }
        thisglyph.transform(this.matrix);
        this.rendering = thisglyph;
    }

    toOpenType(palette: Palette): any {
        let style = this.matrixType();
        let fillpaint = this.fill.toOpenType(palette);
        let glyphpaint = {
            version: 10,
            glyphID: this.gid,
            paint: fillpaint,
        }
        if (style == MatrixType.None) {
            return glyphpaint
        } else if (style == MatrixType.Translation) {
            return {
                version: 14,
                paint: glyphpaint,
                dx: this.matrix.e,
                dy: this.matrix.f,
            }
        } else {
            return {
                version: 12,
                paint: glyphpaint,
                transform: {
                    xx: this.matrix.a,
                    xy: this.matrix.b,
                    yx: this.matrix.c,
                    yy: this.matrix.d,
                    dx: this.matrix.e,
                    dy: this.matrix.f,
                }
            }
        }
    }

    onSelected() {
        if (this.rendering.find("#wireframe").length) {
            return
        }
        // @ts-ignore
        console.log("Selecting", this)
        this.rendering.css({ "cursor": "move" })
        let fullbbox = this.rendering.bbox()
        for (var child of this.rendering.children()) {
            console.log(child, child.bbox())
            fullbbox = fullbbox.merge(child.bbox())
        }
        let border = this.rendering.rect(
            this.rendering.width() as number + 10,
            this.rendering.height() as number + 10
        ).id("wireframe")
        border.attr({
            "fill": "#00000000",
            "stroke": "black",
            "stroke-width": 1,
            "stroke-dasharray": "5,5",
            "x": fullbbox.x as number - 5,
            "y": fullbbox.y as number - 5
        })
        this.rendering.css({ "outline": "1px dotted black" })
        if (this.locked) {
            return
        }
        this.rendering.draggable(true)
        let startX: number;
        let startY: number;
        this.rendering.on("dragstart", (e: any) => {
            startX = e.detail.box.x
            startY = e.detail.box.y
        })
        this.rendering.on("dragend", (e: any) => {
            let movedX = e.detail.box.x - startX
            let movedY = e.detail.box.y - startY
            let el = e.detail.handler.el
            this.matrix = this.matrix.translate(movedX, movedY)
            el.fire("refreshtree")
        })
    }

    onDeselected() {
        this.rendering.draggable(false)
        this.rendering.css({ "cursor": "pointer" })
        let wf = this.rendering.find("#wireframe")
        if (wf.length) {
            wf[0].remove()
        }
    }
}
