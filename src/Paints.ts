// This is our internal, slightly restricted version of paint layers.
import { Matrix } from "@svgdotjs/svg.js";
import { PainterFont } from './Font';
import { Paint as OTPaint } from "./fontkit-bits/tables/COLR";
import * as SVG from "@svgdotjs/svg.js";
import '@svgdotjs/svg.draggable.js'
import './svg.resize.js'

export let SELF_GID = -1

function getMouseDownFunc(eventName: string, el: any) {
    return function (ev: any) {
        ev.preventDefault()
        ev.stopPropagation()

        var x = ev.pageX || ev.touches[0].pageX
        var y = ev.pageY || ev.touches[0].pageY
        console.log("Got mouse down, calling " + eventName + " on " + el)
        el.fire("testevent")
        el.fire(eventName, { x: x, y: y, event: ev })
    }
}

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

export let SolidBlackFill = new SolidFill("#000000", 1.0);

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
    gid: number | null;
    fill: SolidFill | LinearGradientFill;
    matrix: Matrix;
    locked: boolean = false;
    rendering!: SVG.G
    _font: PainterFont

    constructor(storedGid: number | null, fill: SolidFill | LinearGradientFill, matrix: Matrix, font: PainterFont, contextGid: number) {
        this.gid = storedGid;
        this.fill = fill;
        this.matrix = matrix;
        this._font = font;
        this.render(contextGid)
    }


    public get label(): string {
        if (this.gid == SELF_GID) {
            return "<Self>"
        }
        if (this.gid == null) {
            return "<None>"
        }
        return this._font.glyphInfos()[this.gid].name;
    }

    matrixType(): MatrixType {
        if (this.matrix.a == 1 && this.matrix.b == 0 && this.matrix.c == 0 && this.matrix.d == 1 && this.matrix.e == 0 && this.matrix.f == 0) {
            return MatrixType.None
        }
        if (this.matrix.a == 1 && this.matrix.b == 0 && this.matrix.c == 0 && this.matrix.d == 1) {
            return MatrixType.Translation
        }
        if (this.matrix.b == 0 && this.matrix.c == 0 && this.matrix.e == 0 && this.matrix.f == 0) {
            if (this.matrix.a == this.matrix.d) {
                return MatrixType.ScaleUniform;
            } else {
                return MatrixType.ScaleNonUniform;
            }
        }
        return MatrixType.Transform;
    }

    matrixLabel(): string {
        let max2dp = (num: number) => num.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 0 });
        let style = this.matrixType();
        if (style == MatrixType.None) {
            return "";
        } else if (style == MatrixType.Translation) {
            return ` ${Math.round(this.matrix.e)}, ${Math.round(this.matrix.f)}`;
        } else {
            return ` (${max2dp(this.matrix.a)},${max2dp(this.matrix.b)},${max2dp(this.matrix.c)},${max2dp(this.matrix.d)},${Math.round(this.matrix.e)},${Math.round(this.matrix.f)})`;
        }
    }

    render(selectedGid: number) {
        this.rendering = new SVG.G();
        if (this.gid == null) {
            return;
        }
        let gid = this.gid;
        if (this.gid == SELF_GID) {
            gid = selectedGid;
        }
        const svgDoc = SVG.SVG(this._font.getSVG(gid));
        svgDoc.children().forEach((c) => this.rendering.add(c));

        if (this.fill instanceof SolidFill) {
            this.rendering.attr({ "fill": this.fill.color });
            this.rendering.attr({ "fill-opacity": this.fill.opacity.toString() });
        }
        this.rendering.transform(this.matrix);
    }

    toOpenType(palette: Palette, contextGid: number): any {
        if (this.gid == null) {
            return
        }
        let style = this.matrixType();
        let fillpaint = this.fill.toOpenType(palette);
        let glyphpaint = {
            version: 10,
            glyphID: this.gid == SELF_GID ? contextGid : this.gid,
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
        let wireframe = this.rendering.group().id("wireframe")
        let border = wireframe.rect(
            this.rendering.width() as number + 10,
            this.rendering.height() as number + 10
        )
        border.attr({
            "fill": "#00000000",
            "stroke": "black",
            "stroke-width": 1,
            "stroke-dasharray": "5,5",
            "x": fullbbox.x as number - 5,
            "y": fullbbox.y as number - 5
        })
        if (this.locked) {
            wireframe.css({ "cursor": "not-allowed" })
            return
        }
        let dotStyle = {
            "fill": "black",
        }
        let r1 = 10 * this.matrix.inverse().a
        let r2 = 10 * this.matrix.inverse().d

        let bl = wireframe.ellipse(r1, r2).attr({
            "cx": fullbbox.x as number - 5,
            "cy": fullbbox.y as number - 5,
            ...dotStyle
        })
        let l = wireframe.ellipse(r1, r2).attr({
            "cx": fullbbox.x as number - 5,
            "cy": (fullbbox.y + fullbbox.y2) / 2 as number,
            ...dotStyle
        })
        let br = wireframe.ellipse(r1, r2).attr({
            "cx": fullbbox.x2 as number + 5,
            "cy": fullbbox.y as number - 5,
            ...dotStyle
        })
        let r = wireframe.ellipse(r1, r2).attr({
            "cx": fullbbox.x2 as number + 5,
            "cy": (fullbbox.y + fullbbox.y2) / 2 as number,
            ...dotStyle
        })
        let tl = wireframe.ellipse(r1, r2).attr({
            "cx": fullbbox.x as number - 5,
            "cy": fullbbox.y2 as number + 5,
            ...dotStyle
        })
        let tr = wireframe.ellipse(r1, r2).attr({
            "cx": fullbbox.x2 as number + 5,
            "cy": fullbbox.y2 as number + 5,
            ...dotStyle
        })
        bl.css({ "cursor": "nesw-resize" })
        tr.css({ "cursor": "nesw-resize" })
        br.css({ "cursor": "nwse-resize" })
        tl.css({ "cursor": "nwse-resize" })
        l.css({ "cursor": "ew-resize" })
        r.css({ "cursor": "ew-resize" })
        this.rendering.draggable(true)
        // @ts-ignore
        this.rendering.resize(true)
        bl.on("mousedown.selection touchstart.selection", getMouseDownFunc("lt", this.rendering))
        tl.on("mousedown.selection touchstart.selection", getMouseDownFunc("lb", this.rendering))
        br.on("mousedown.selection touchstart.selection", getMouseDownFunc("rt", this.rendering))
        tr.on("mousedown.selection touchstart.selection", getMouseDownFunc("rb", this.rendering))
        l.on("mousedown.selection touchstart.selection", getMouseDownFunc("l", this.rendering))
        r.on("mousedown.selection touchstart.selection", getMouseDownFunc("r", this.rendering))
        let startX: number;
        let startY: number;
        let startWidth: number;
        let startHeight: number;
        this.rendering.on("dragstart", (e: any) => {
            startX = e.detail.box.x
            startY = e.detail.box.y
        })
        this.rendering.on("dragend", (e: any) => {
            let movedX = (e.detail.box.x - startX) * this.matrix.a
            let movedY = (e.detail.box.y - startY) * this.matrix.d
            let el = e.detail.handler.el
            this.matrix = this.matrix.translate(movedX, movedY)
            el.fire("refreshtree")
        })
        this.rendering.on("resizestart", (e: any) => {
            startX = this.rendering.bbox().x
            startY = this.rendering.bbox().y
            startWidth = this.rendering.bbox().width
            startHeight = this.rendering.bbox().height
        })

        this.rendering.on("resizedone", (e: any) => {
            let movedX = (this.rendering.bbox().x - startX)
            let movedY = (this.rendering.bbox().y - startY)
            let widthChange = this.rendering.bbox().width / startWidth
            let heightChange = this.rendering.bbox().height / startHeight
            let oldScaleOnly = (new Matrix()).scale(this.matrix.a, this.matrix.d)
            let newScaleOnly = (new Matrix()).scale(widthChange, heightChange)
            let pt = new SVG.Point(0, 0)
            pt = pt.transform(this.matrix).transform(newScaleOnly.inverse())
            console.log("InvPT:", pt)
            console.log("MovedX", movedX)
            console.log("MovedY", movedY)
            this.matrix = this.matrix.multiply(newScaleOnly).translate(pt.x, pt.y)

            console.log("Resize done", movedX, movedY)
            this.rendering.fire("refreshtree")
        })
    }

    onDeselected() {
        this.rendering.draggable(false)
        // @ts-ignore
        this.rendering.resize(false)

        this.rendering.css({ "cursor": "pointer" })
        let wf = this.rendering.find("#wireframe")
        if (wf.length) {
            wf[0].remove()
        }
    }
}
