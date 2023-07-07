// This is our internal, slightly restricted version of paint layers.
import { Matrix } from "@svgdotjs/svg.js";
import { PainterFont } from './Font';
import { Paint as OTPaint } from "./fontkit-bits/tables/COLR";
import * as SVG from "@svgdotjs/svg.js";
import '@svgdotjs/svg.draggable.js'
import './svg.resize.js'
import { NormalizedLocation, VariationModel } from "./varmodel";

export let SELF_GID = -1

export enum BlendMode {
    Normal = -1,
    Clear = 0,
    Source,
    Destination,
    SourceOver,
    DestinationOver,
    SourceIn,
    DestinationIn,
    SourceOut,
    DestinationOut,
    SourceAtop,
    DestinationAtop,
    Xor,
    Plus,
    Screen,
    Overlay,
    Darken,
    Lighten,
    ColorDodge,
    ColorBurn,
    HardLight,
    SoftLight,
    Difference,
    Exclusion,
    Multiply,
    Hue,
    Saturation,
    Color,
    Luminosity,
}

function applyBlendMode(mode: BlendMode, el: SVG.Element) {
    if (mode == BlendMode.Normal) {
        return
    }
    let modestring: string = "normal"
    if (mode == BlendMode.Multiply) { modestring = "multiply" }
    if (mode == BlendMode.Screen) { modestring = "screen" }
    if (mode == BlendMode.Overlay) { modestring = "overlay" }
    if (mode == BlendMode.Darken) { modestring = "darken" }
    if (mode == BlendMode.Lighten) { modestring = "lighten" }
    if (mode == BlendMode.ColorDodge) { modestring = "color-dodge" }
    if (mode == BlendMode.ColorBurn) { modestring = "color-burn" }
    if (mode == BlendMode.HardLight) { modestring = "hard-light" }
    if (mode == BlendMode.SoftLight) { modestring = "soft-light" }
    if (mode == BlendMode.Difference) { modestring = "difference" }
    if (mode == BlendMode.Exclusion) { modestring = "exclusion" }
    if (mode == BlendMode.Hue) { modestring = "hue" }
    if (mode == BlendMode.Saturation) { modestring = "saturation" }
    if (mode == BlendMode.Color) { modestring = "color" }
    if (mode == BlendMode.Luminosity) { modestring = "luminosity" }
    // @ts-ignore
    el.css({ "mix-blend-mode": modestring })
}

function deleteAllChildren(e: any) {
    let child = e.lastElementChild;
    while (child) {
        e.removeChild(child);
        child = e.lastElementChild;
    }
}

function getMouseDownFunc(eventName: string, el: any) {
    return function (ev: any) {
        ev.preventDefault()
        ev.stopPropagation()

        var x = ev.pageX || ev.touches[0].pageX
        var y = ev.pageY || ev.touches[0].pageY
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
    get description(): string {
        return `SolidFill(${this.color}, ${this.opacity})`
    }
}

export let SolidBlackFill = () => new SolidFill("#000000", 1.0);

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
    _element: SVG.Gradient | null = null;
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
    get description(): string {
        return `GradientFill`
    }
    toSVG(doc: SVG.Svg) {
        let grad = doc.gradient("linear", (add) => {
            for (let stop of this.stops) {
                add.stop(stop.offset, stop.color)
            }
        })
        grad.from(this.x0, this.y0)
        grad.to(this.x1, this.y1)
        grad.attr({ gradientUnits: "userSpaceOnUse" })
        this._element = grad;
        return grad
    }

    onSelected(rendering: SVG.G) {
        let wireframe = rendering.group().id("wireframe-gradient")
        let colorline: Record<number, string> = {}
        for (var stop of this.stops) {
            colorline[stop.offset] = stop.color
        }
        let start = wireframe.circle(15).attr({ "stroke": "black", "stroke-width": 0.5, "cx": this.x0, "cy": this.y0, "fill": colorline[0] || "black" })
        let end = wireframe.circle(15).attr({ "stroke": "black", "stroke-width": 0.5, "cx": this.x1, "cy": this.y1, "fill": colorline[1] || "black" })
        let control = wireframe.circle(15).attr({ "stroke": "black", "stroke-width": 0.5, "cx": this.x2, "cy": this.y2, "fill": "black" })
        let line = wireframe.line(start.cx(), start.cy(), end.cx(), end.cy()).attr({ "stroke": "black", "stroke-width": 0.5 }).id("wireframe-line")
        let balls = wireframe.group()
        let makeballs = () => {
            deleteAllChildren(balls)
            for (let stop of this.stops) {
                if (stop.offset == 0 || stop.offset == 1) {
                    continue
                }
                balls.circle(15).attr({
                    cx: this.x0 + (this.x1 - this.x0) * stop.offset,
                    cy: this.y0 + (this.y1 - this.y0) * stop.offset,
                    fill: stop.color
                })
            }
        }
        makeballs()
        start.draggable(true)
        start.css({ "cursor": "grab" })
        end.draggable(true)
        end.css({ "cursor": "grab" })
        control.draggable(true)
        control.css({ "cursor": "grab" })
        start.on("dragend", (e: any) => {
            rendering.fire("refreshtree")
        })
        start.on("dragmove", (e: any) => {
            this.x0 = e.detail.box.x
            this.y0 = e.detail.box.y
            line.plot(this.x0, this.y0, this.x1, this.y1)
            if (this._element) {
                this._element.from(this.x0, this.y0)
            }
        })
        end.on("dragend", (e: any) => {
            this.x1 = e.detail.box.x
            this.y1 = e.detail.box.y
            rendering.fire("refreshtree")
        })
        end.on("dragmove", (e: any) => {
            this.x1 = e.detail.box.x
            this.y1 = e.detail.box.y
            line.plot(this.x0, this.y0, this.x1, this.y1)
            if (this._element) {
                this._element.to(this.x1, this.y1)
            }

        })
    }

    onDeselected(rendering: SVG.G) {
        let wf = rendering.find("#wireframe-gradient")
        if (wf.length) {
            wf[0].remove()
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

function matrixType(matrix: Matrix): MatrixType {
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

function mergeMatrixTypes(types: MatrixType[]): MatrixType {
    let outtype = MatrixType.None;
    for (let type of types) {
        if (outtype == MatrixType.None) {
            outtype = type
        }
        if (type != outtype) {
            return MatrixType.Transform;
        }
    }
    return outtype
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

export class Paint {
    gid: number | null;
    fill: SolidFill | LinearGradientFill;
    matrices: Map<string, Matrix>;
    locked: boolean = false;
    rendering!: SVG.G
    _font: PainterFont
    blendMode: BlendMode = BlendMode.Normal

    constructor(storedGid: number | null, fill: SolidFill | LinearGradientFill, matrix: Matrix, font: PainterFont, contextGid: number) {
        this.gid = storedGid;
        this.fill = fill;
        this.matrices = new Map();
        this._font = font;
        this.matrices.set(JSON.stringify(this._font.defaultLocation), matrix)
        this.render(contextGid)
    }

    storeMatrix(matrix: Matrix) {
        this.matrices.set(JSON.stringify(this._font.normalizedLocation), matrix)
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

    get matrix(): Matrix {
        if (this.matrices.size == 1) {
            return this.matrices.values().next().value;
        }
        let masterLocations: NormalizedLocation[] = Array.from(this.matrices.keys()).map((x) => JSON.parse(x))
        let varmodel = new VariationModel(masterLocations, Object.keys(this._font.axes));
        let scalars = varmodel.getScalars(this._font.normalizedLocation);
        let outmatrix = new Matrix();
        for (var element of ["a", "b", "c", "d", "e", "f"]) {
            let components: number[] = Array.from(this.matrices.values(), (matrix) => matrix[element]);
            outmatrix[element] = varmodel.interpolateFromMastersAndScalars(components, scalars);
        }
        return outmatrix
    }

    render(selectedGid: number, header: SVG.Svg | null = null) {
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
        } else if (this.fill instanceof LinearGradientFill && header != null) {
            let gradient = this.fill.toSVG(header)
            this.rendering.attr({ "fill": gradient })
        }
        this.rendering.transform(this.matrix);
        applyBlendMode(this.blendMode, this.rendering)
    }

    toOpenType(palette: Palette, contextGid: number): any {
        if (this.gid == null) {
            return
        }
        // XXX Support variable matrices here
        let style = matrixType(this.matrix);
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
        console.log("This layer's matrices are:")
        console.log(this.matrices)
        console.log("At ", this._font.defaultLocation)
        console.log("The value is ")
        console.log(this.matrix)
        if (this.rendering.find("#wireframe").length) {
            return
        }
        // @ts-ignore
        let fullbbox = this.rendering.bbox()
        for (var child of this.rendering.children()) {
            fullbbox = fullbbox.merge(child.bbox())
        }
        let wireframe = this.rendering.group().id("wireframe")
        wireframe.css({ "cursor": "move" })
        let border = wireframe.rect(
            fullbbox.width as number + 10,
            fullbbox.height as number + 10
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
        wireframe.draggable(true)
        // @ts-ignore
        wireframe.resize({ saveAspectRatio: true })
        bl.on("mousedown.selection touchstart.selection", getMouseDownFunc("lt", wireframe))
        tl.on("mousedown.selection touchstart.selection", getMouseDownFunc("lb", wireframe))
        br.on("mousedown.selection touchstart.selection", getMouseDownFunc("rt", wireframe))
        tr.on("mousedown.selection touchstart.selection", getMouseDownFunc("rb", wireframe))
        l.on("mousedown.selection touchstart.selection", getMouseDownFunc("l", wireframe))
        r.on("mousedown.selection touchstart.selection", getMouseDownFunc("r", wireframe))
        let startX: number;
        let startY: number;
        let startWidth: number;
        let startHeight: number;
        wireframe.on("dragstart", (e: any) => {
            startX = e.detail.box.x
            startY = e.detail.box.y
        })
        wireframe.on("dragmove", (e: any) => {
            // Move any non-wireframe groups
            let movedX = e.detail.box.x
            let movedY = e.detail.box.y
            let el = e.detail.handler.el
            for (let child of el.parent().children()) {
                if (child.id() != "wireframe") {
                    child.move(movedX, movedY)
                }
            }
        })

        wireframe.on("dragend", (e: any) => {
            let movedX = (e.detail.box.x - startX - 10) * this.matrix.a
            let movedY = (e.detail.box.y - startY - 10) * this.matrix.d
            let el = e.detail.handler.el
            console.log("Matrix at ", this._font.normalizedLocation, "was ", this.matrix)
            console.log("Setting this matrix to ", this.matrix.translate(movedX, movedY))
            this.storeMatrix(this.matrix.translate(movedX, movedY))
            el.fire("refreshtree")
        })
        wireframe.on("resizestart", (e: any) => {
            console.log("Resize start")
            startX = wireframe.bbox().x
            startY = wireframe.bbox().y
            startWidth = wireframe.bbox().width
            startHeight = wireframe.bbox().height
        })

        wireframe.on("resizedone", (e: any) => {
            console.log("The previous matrix placed the box at ", startX, startY)
            // Determine the untransformed start X and Y points of the box
            let untransformed = new SVG.Point(startX, startY).transform(this.matrix.inverse())
            console.log("The untransformed box was at ", untransformed.x, untransformed.y)
            console.log("The new box is at ", wireframe.bbox().x, wireframe.bbox().y)
            let movedX = (wireframe.bbox().x - startX)
            let movedY = (wireframe.bbox().y - startY)
            console.log("Having been moved by ", movedX, movedY)
            let widthChange = wireframe.bbox().width / startWidth
            let heightChange = wireframe.bbox().height / startHeight
            let oldScaleOnly = (new Matrix()).scale(this.matrix.a, this.matrix.d)
            let newScaleOnly = oldScaleOnly.scale(widthChange, heightChange)
            let retransformed = untransformed.transform(newScaleOnly)
            console.log(`A scale only matrix would be ${newScaleOnly} and would transform the untransformed box to ${retransformed.x}, ${retransformed.y}`)
            this.storeMatrix(newScaleOnly.translate(startX - retransformed.x - movedX, startY - retransformed.y - movedY))
            let testPoint = untransformed.transform(this.matrix)
            console.log(`Under the new matrix the point gets transformed to ${testPoint.x}, ${testPoint.y}`)
            console.log("Resize done")
            this.rendering.fire("refreshtree")
        })

        if (this.fill instanceof LinearGradientFill) {
            this.fill.onSelected(this.rendering)
        }


    }

    onDeselected() {
        let wf = this.rendering.find("#wireframe")
        this.rendering.css({ "cursor": "pointer" })
        if (wf.length) {
            wf[0].remove()
        }
        if (this.fill instanceof LinearGradientFill) {
            this.fill.onDeselected(this.rendering)
        }
    }
}
