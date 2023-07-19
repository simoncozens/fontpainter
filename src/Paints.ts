// This is our internal, slightly restricted version of paint layers.
import { Matrix } from "@svgdotjs/svg.js";
import { PainterFont } from './Font';
import { Paint as OTPaint } from "./fontkit-bits/tables/COLR";
import * as SVG from "@svgdotjs/svg.js";
import '@svgdotjs/svg.draggable.js'
import './svg.resize.js'
import { VariableMatrix } from "./VariableMatrix";
import { VariableScalar } from "./VariableScalar";

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
    opacity: VariableScalar;
    _font: PainterFont;

    constructor(color: string, opacity: number, font: PainterFont) {
        this.color = color;
        this._font = font;
        this.opacity = new VariableScalar(Object.keys(font.axes))
        this.opacity.addValue(font.defaultLocation, opacity)
    }

    toOpenType(palette: Palette): any {
        return {
            version: 2,
            paletteIndex: palette.indexOf(this.color),
            alpha: this.opacity
        }
    }
    get current_opacity(): number {
        return this.opacity.valueAt(this._font.normalizedLocation)
    }
    get description(): string {
        return `SolidFill(${this.color}, ${this.current_opacity})`
    }

    clone(): SolidFill {
        let cloned = new SolidFill(this.color, this.current_opacity, this._font);
        cloned.opacity = this.opacity.clone() as VariableScalar
        return cloned

    }
}

export let SolidBlackFill = (font: PainterFont) => new SolidFill("#000000", 1.0, font);

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

    clone(): GradientStop {
        return new GradientStop(this.color, this.offset, this.opacity)
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

    clone(): LinearGradientFill {
        let clonedstops = this.stops.map(s => s.clone())
        return new LinearGradientFill(clonedstops,
            this.x0,
            this.y0,
            this.x1,
            this.y1,
            this.x2,
            this.y2
        )
    }

}

export class Paint {
    gid: number | null;
    fill: SolidFill | LinearGradientFill;
    matrix: VariableMatrix;
    locked: boolean = false;
    rendering!: SVG.G
    _font: PainterFont
    blendMode: BlendMode = BlendMode.Normal
    _keyhandler: ((e: KeyboardEvent) => void) | null = null

    constructor(storedGid: number | null, fill: SolidFill | LinearGradientFill, matrix: Matrix, font: PainterFont, contextGid: number) {
        this.gid = storedGid;
        this.fill = fill;
        this._font = font;
        this.matrix = new VariableMatrix(Object.keys(this._font.axes));
        this.matrix.addValue(this._font.defaultLocation, matrix)
        this.render(contextGid)
    }

    clone(): Paint {
        let newVersion = new Paint(this.gid, this.fill.clone(), new SVG.Matrix(), this._font, this.gid!)
        newVersion.matrix = this.matrix.clone() as VariableMatrix
        return newVersion
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

    public get current_matrix(): Matrix {
        return this.matrix.valueAt(this._font.normalizedLocation)
    }

    render(selectedGid: number, header: SVG.Svg | null = null) {
        // console.log("Re-rendering")
        // console.log(this)
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
            this.rendering.attr({ "fill-opacity": (this.fill.current_opacity * 100).toString() + "%" });
        } else if (this.fill instanceof LinearGradientFill && header != null) {
            let gradient = this.fill.toSVG(header)
            this.rendering.attr({ "fill": gradient })
        }
        this.rendering.transform(this.current_matrix);
        applyBlendMode(this.blendMode, this.rendering)
        // Hack
        if (this.rendering.find("#wireframe").length === 0 && this._keyhandler) {
            document.removeEventListener("keydown", this._keyhandler);
            this._keyhandler = null
        }
    }

    onSelected() {
        if (this.rendering.find("#wireframe").length) {
            return
        }
        console.log(this.matrix)
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
        let inverse = this.current_matrix.inverse()
        let r1 = 10 * inverse.a
        let r2 = 10 * inverse.d

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
            let current = this.current_matrix
            let movedX = (e.detail.box.x - startX - 10) * current.a
            let movedY = (e.detail.box.y - startY - 10) * current.d
            let el = e.detail.handler.el
            console.log("Matrix at ", this._font.normalizedLocation, "was ", current)
            this.matrix.addValue(this._font.normalizedLocation, current.translate(movedX, movedY))
            console.log("Matrix values now")
            console.log(this.matrix)
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
            let current = this.current_matrix
            let untransformed = new SVG.Point(startX, startY).transform(current.inverse())
            console.log("The untransformed box was at ", untransformed.x, untransformed.y)
            console.log("The new box is at ", wireframe.bbox().x, wireframe.bbox().y)
            let movedX = (wireframe.bbox().x - startX)
            let movedY = (wireframe.bbox().y - startY)
            console.log("Having been moved by ", movedX, movedY)
            let widthChange = wireframe.bbox().width / startWidth
            let heightChange = wireframe.bbox().height / startHeight
            let oldScaleOnly = (new Matrix()).scale(current.a, current.d)
            let newScaleOnly = oldScaleOnly.scale(widthChange, heightChange)
            let retransformed = untransformed.transform(newScaleOnly)
            console.log(`A scale only matrix would be ${newScaleOnly} and would transform the untransformed box to ${retransformed.x}, ${retransformed.y}`)
            this.matrix.addValue(this._font.normalizedLocation, (newScaleOnly.translate(startX - retransformed.x - movedX, startY - retransformed.y - movedY)))
            let testPoint = untransformed.transform(current)
            console.log(`Under the new matrix the point gets transformed to ${testPoint.x}, ${testPoint.y}`)
            console.log("Resize done")
            this.rendering.fire("refreshtree")
        })
        if (this._keyhandler === null) {
            this._keyhandler = (e: KeyboardEvent) => {
                let dx = 0
                let dy = 0
                if (e.keyCode == 37) { dx = -1 }
                if (e.keyCode == 38) { dy = +1 }
                if (e.keyCode == 39) { dx = +1 }
                if (e.keyCode == 40) { dy = -1 }
                if (e.shiftKey) { dx *= 10; dy *= 10 }
                else if (e.ctrlKey) { dx *= 100; dy *= 100 }
                this.matrix.addValue(this._font.normalizedLocation, this.current_matrix.translate(dx, dy))
                if (dx || dy) {
                    e.preventDefault()
                    this.rendering.fire("refreshtree")
                }
            }
            document.addEventListener("keydown", this._keyhandler);
        }

        if (this.fill instanceof LinearGradientFill) {
            this.fill.onSelected(this.rendering)
        }
    }

    onDeselected() {
        if (this._keyhandler) {
            document.removeEventListener("keydown", this._keyhandler);
            this._keyhandler = null
        }
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
