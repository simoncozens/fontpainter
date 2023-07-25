// This is our internal, slightly restricted version of paint layers.
import { Matrix } from "@svgdotjs/svg.js";
import { PainterFont } from '../font/Font';
import { Paint as OTPaint } from "../fontkit-bits/tables/COLR";
import * as SVG from "@svgdotjs/svg.js";
import '@svgdotjs/svg.draggable.js'
import '../svg.resize.js'
import { VariableMatrix } from "../font/VariableMatrix";
import { GradientObject } from 'react-best-gradient-color-picker'
import { SolidFill, LinearGradientFill, GradientStop } from "./Fills";

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

export function deleteAllChildren(e: any) {
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

export class Paint {
    gid: number | null;
    fill: SolidFill | LinearGradientFill;
    matrix: VariableMatrix;
    locked: boolean = false;
    visible: boolean = true;
    _rendering!: SVG.G
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

    public static inflate(obj: any, f: PainterFont): Paint {
        let fill: SolidFill | LinearGradientFill
        if (obj.fill.type == "SolidFill") {
            fill = SolidFill.inflate(obj.fill, f)
        } else {
            fill = LinearGradientFill.inflate(obj.fill, f)
        }
        let matrix =new SVG.Matrix();
        let self = new Paint(obj.gid, fill, matrix, f, obj.gid);
        self.locked = obj.locked;
        self.visible = obj.visible;
        self.matrix = VariableMatrix.inflate(obj.matrix, f);
        return self;
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

    setFill(newcolor: GradientObject) {
        if (!newcolor.isGradient) {
            if (this.fill instanceof SolidFill) {
                this.fill.color = newcolor.colors[0].value
            } else {
                this.fill = new SolidFill(newcolor.colors[0].value, 1.0, this._font);
            }
            console.log("New fill is ", this.fill)
            return;
        }

        // If we were a gradient before, just update the stops
        if (this.fill instanceof LinearGradientFill) {
            this.fill.stops = newcolor.colors.map((c) => new GradientStop(c.value, c.left!, 1.0, this._font))
        } else {
            let bbox = this._rendering.bbox().transform(this.current_matrix.inverse());
            let newfill = new LinearGradientFill([],
                bbox.x - 5,  // x0
                bbox.y - 5,  // y0,
                bbox.x2 + 5,  // x1,
                bbox.y2 + 5,  // y1, 
                bbox.x - 5,   // x2, ???
                bbox.y2 + 5,  // y2 ???
                this._font)
            newfill.stops = newcolor.colors.map((c) => new GradientStop(c.value, c.left!, 1.0, this._font))
            this.fill = newfill;
        }
        console.log("New fill is ", this.fill)
    }

    render(selectedGid: number, header: SVG.Svg | null = null) {
        // console.log("Re-rendering")
        // console.log(this)
        this._rendering = new SVG.G();
        if (this.gid == null || !this.visible) {
            return;
        }
        let gid = this.gid;
        if (this.gid == SELF_GID) {
            gid = selectedGid;
        }
        const svgDoc = SVG.SVG(this._font.getSVG(gid));
        svgDoc.children().forEach((c) => this._rendering.add(c));

        if (this.fill instanceof SolidFill) {
            this._rendering.attr({ "fill": this.fill.color });
            this._rendering.attr({ "fill-opacity": (this.fill.current_opacity * 100).toString() + "%" });
        } else if (this.fill instanceof LinearGradientFill && header != null) {
            let gradient = this.fill.toSVG(header)
            this._rendering.attr({ "fill": gradient })
        }
        this._rendering.transform(this.current_matrix);
        applyBlendMode(this.blendMode, this._rendering)
        // Hack
        if (this._rendering.find("#wireframe").length === 0 && this._keyhandler) {
            document.removeEventListener("keydown", this._keyhandler);
            this._keyhandler = null
        }
    }

    onSelected() {
        if (this._rendering.find("#wireframe").length) {
            return
        }
        console.log(this.matrix)
        // @ts-ignore
        let fullbbox = this._rendering.bbox()
        for (var child of this._rendering.children()) {
            fullbbox = fullbbox.merge(child.bbox())
        }
        let wireframe = this._rendering.group().id("wireframe")
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
            this._rendering.fire("refreshtree")
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
                    this._rendering.fire("refreshtree")
                }
            }
            document.addEventListener("keydown", this._keyhandler);
        }

        if (this.fill instanceof LinearGradientFill) {
            this.fill.onSelected(this._rendering)
        }
    }

    onDeselected() {
        if (this._keyhandler) {
            document.removeEventListener("keydown", this._keyhandler);
            this._keyhandler = null
        }
        let wf = this._rendering.find("#wireframe")
        this._rendering.css({ "cursor": "pointer" })
        if (wf.length) {
            wf[0].remove()
        }
        if (this.fill instanceof LinearGradientFill) {
            this.fill.onDeselected(this._rendering)
        }
    }
}
