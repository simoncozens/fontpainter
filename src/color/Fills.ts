import { PainterFont } from '../font/Font';
import * as SVG from "@svgdotjs/svg.js";
import { VariableScalar, f2dot14 } from "../font/VariableScalar";
import { Compiler } from "../font/compiler";
import { deleteAllChildren } from "./Paints";
import { ColorStop, PaintLinearGradient, PaintVarLinearGradient, PaintSolid, PaintVarSolid, VarColorLine, VarColorStop } from './COLR';
var tinycolor = require("tinycolor2");

export class SolidFill {
    color: string;
    opacity: VariableScalar;
    _font: PainterFont;
    type: string;

    constructor(color: string, opacity: number, font: PainterFont) {
        this.color = color;
        this._font = font;
        this.type = "SolidFill";
        this.opacity = new VariableScalar(Object.keys(font.axes));
        this.opacity.addValue(font.defaultLocation, opacity);
    }

    public static inflate(s: any, f: PainterFont): SolidFill {
        let fill = new SolidFill(s.color, 1.0, f);
        fill.opacity = VariableScalar.inflate(s.opacity, f);
        return fill;
    }

    toOpenType(compiler: Compiler): PaintSolid | PaintVarSolid {
        const paletteIndex = compiler.palette!.indexOf(this.color);
        if (this.opacity.doesVary) {
            let varIndexBase = compiler.deltaset.length;
            compiler.deltaset.push({
                entry: this.opacity.addToVarStore(compiler.builder, f2dot14),
            });
            return {
                version: 3,
                paletteIndex: paletteIndex,
                alpha: this.opacity.defaultValue,
                varIndexBase
            } as PaintVarSolid;

        }
        return {
            version: 2,
            paletteIndex,
            alpha: this.current_opacity
        } as PaintSolid;
    }
    get current_opacity(): number {
        return this.opacity.valueAt(this._font.normalizedLocation);
    }
    get description(): string {
        return `SolidFill(${this.color}, ${this.current_opacity})`;
    }

    toCSS(): React.CSSProperties { return { "backgroundColor": this.color }; }

    clone(): SolidFill {
        let cloned = new SolidFill(this.color, this.current_opacity, this._font);
        cloned.opacity = this.opacity.clone() as VariableScalar;
        return cloned;

    }
}

export let SolidBlackFill = (font: PainterFont) => new SolidFill("#000000", 1, font);

export class GradientStop {
    color: string;
    offset: number;
    opacity: VariableScalar;
    _font: PainterFont;

    constructor(color: string, offset: number, opacity: number, font: PainterFont) {
        this.color = color;
        this.offset = offset;
        this._font = font;
        this.opacity = new VariableScalar(Object.keys(font.axes));
        this.opacity.addValue(font.defaultLocation, opacity);
    }

    public static inflate(s: any, f: PainterFont): GradientStop {
        let stop = new GradientStop(s.color, s.offset, 1.0, f);
        stop.opacity = VariableScalar.inflate(s.opacity, f);
        return stop;
    }

    get current_opacity(): number {
        return this.opacity.valueAt(this._font.normalizedLocation);
    }

    get multiplied_color(): string {
        let c = tinycolor(this.color);
        let o = this.current_opacity;
        return c.setAlpha(c.getAlpha() * o).toRgbString();
    }

    toOpenType(compiler: Compiler, variable: boolean): ColorStop | VarColorStop {
        const paletteIndex = compiler.palette!.indexOf(this.color);
        if (variable) {
            let varIndexBase = compiler.deltaset.length;
            compiler.deltaset.push({
                entry: this.opacity.addToVarStore(compiler.builder, f2dot14),
            });
            return {
                stopOffset: this.offset / 100,
                paletteIndex,
                alpha: this.opacity.defaultValue,
                varIndexBase
            } as VarColorStop;
        }
        return {
            stopOffset: this.offset / 100,
            paletteIndex,
            alpha: this.current_opacity
        } as ColorStop;
    }

    clone(): GradientStop {
        let cloned = new GradientStop(this.color, this.offset, this.current_opacity, this._font);
        cloned.opacity = this.opacity.clone() as VariableScalar;
        return cloned;
    }
}

export class LinearGradientFill {
    _element: SVG.Gradient | null = null;
    _font: PainterFont;
    stops: GradientStop[];
    type: string;
    x0: VariableScalar;
    y0: VariableScalar;
    x1: VariableScalar;
    y1: VariableScalar;
    x2: VariableScalar;
    y2: VariableScalar;

    constructor(stops: GradientStop[],
        x0: number | VariableScalar,
        y0: number | VariableScalar,
        x1: number | VariableScalar,
        y1: number | VariableScalar,
        x2: number | VariableScalar,
        y2: number | VariableScalar,
        font: PainterFont) {
        this._font = font;
        this.stops = stops;
        if (typeof x0 == "number") {
            this.x0 = new VariableScalar(Object.keys(this._font.axes));
            this.x0.addValue(font.defaultLocation, x0);
        } else {
            this.x0 = x0;
        }
        if (typeof y0 == "number") {
            this.y0 = new VariableScalar(Object.keys(this._font.axes));
            this.y0.addValue(font.defaultLocation, y0);
        } else {
            this.y0 = y0;
        }
        if (typeof x1 == "number") {
            this.x1 = new VariableScalar(Object.keys(this._font.axes));
            this.x1.addValue(font.defaultLocation, x1);
        } else {
            this.x1 = x1;
        }
        if (typeof y1 == "number") {
            this.y1 = new VariableScalar(Object.keys(this._font.axes));
            this.y1.addValue(font.defaultLocation, y1);
        } else {
            this.y1 = y1;
        }
        if (typeof x2 == "number") {
            this.x2 = new VariableScalar(Object.keys(this._font.axes));
            this.x2.addValue(font.defaultLocation, x2);
        } else {
            this.x2 = x2;
        }
        if (typeof y2 == "number") {
            this.y2 = new VariableScalar(Object.keys(this._font.axes));
            this.y2.addValue(font.defaultLocation, y2);
        } else {
            this.y2 = y2;
        }
        this.type = "LinearGradientFill"
        console.log(this);
    }

    public static inflate(s: any, f: PainterFont): LinearGradientFill {
        let stops = s.stops.map((stop: any) => GradientStop.inflate(stop, f));
        return new LinearGradientFill(stops,
            VariableScalar.inflate(s.x0, f),
            VariableScalar.inflate(s.y0, f),
            VariableScalar.inflate(s.x1, f),
            VariableScalar.inflate(s.y1, f),
            VariableScalar.inflate(s.x2, f),
            VariableScalar.inflate(s.y2, f),
            f);
    }

    doesVary(): boolean {
        if (this.x0.doesVary || this.y0.doesVary || this.x1.doesVary || this.y1.doesVary || this.x2.doesVary || this.y2.doesVary) {
            return true
        }
        for (let stop of this.stops) {
            if (stop.opacity.doesVary) {
                return true;
            }
        }
        return false;
    }

    toOpenType(compiler: Compiler): PaintLinearGradient | PaintVarLinearGradient {
        if (!this.doesVary()) {
            return {
                version: 4,
                colorLine: {
                    extend: 0,
                    numStops: this.stops.length,
                    colorStops: this.stops.map((stop) => stop.toOpenType(compiler, false))
                },
                x0: this.x0.defaultValue,
                y0: this.y0.defaultValue,
                x1: this.x1.defaultValue,
                y1: this.y1.defaultValue,
                x2: this.x2.defaultValue,
                y2: this.y2.defaultValue,
            } as PaintLinearGradient;
        }
        let colorStops: VarColorStop[] = this.stops.map((stop) => stop.toOpenType(compiler, true) as VarColorStop);
        let varColorLine: VarColorLine = {
                extend: 0,
                numStops: this.stops.length,
                colorStops
        };
        let varIndexBase = compiler.deltaset.length;
        for (var element of ["x0", "y0", "x1", "y1", "x2", "y2"]) {
            compiler.deltaset.push({
                // @ts-ignore
                entry: this[element].addToVarStore(compiler.builder),
            });
        }
        return {
            version: 5,
            colorLine: varColorLine,
            x0: this.x0.defaultValue,
            y0: this.y0.defaultValue,
            x1: this.x1.defaultValue,
            y1: this.y1.defaultValue,
            x2: this.x2.defaultValue,
            y2: this.y2.defaultValue,
            varIndexBase
        } as PaintVarLinearGradient;


    }
    get description(): string {
        return `GradientFill`;
    }

    get current_x0(): number {
        return this.x0.valueAt(this._font.normalizedLocation);
    }
    get current_y0(): number {
        return this.y0.valueAt(this._font.normalizedLocation);
    }
    get current_x1(): number {
        return this.x1.valueAt(this._font.normalizedLocation);
    }
    get current_y1(): number {
        return this.y1.valueAt(this._font.normalizedLocation);
    }
    get current_x2(): number {
        return this.x2.valueAt(this._font.normalizedLocation);
    }
    get current_y2(): number {
        return this.y2.valueAt(this._font.normalizedLocation);
    }
    endPoints(): [number, number] {
        let d1x = this.current_x1 - this.current_x0;
        let d1y = this.current_y1 - this.current_y0;
        let d2x = this.current_x2 - this.current_x0;
        let d2y = this.current_y2 - this.current_y0;
        let dotProd = d1x * d2x + d1y * d2y;
        let rotLenSq = d2x * d2x + d2y * d2y;
        let magnitude = dotProd / rotLenSq;
        return [this.current_x1 - magnitude * d2x, this.current_y1 - magnitude * d2y];
    }

    toSVG(doc: SVG.Svg) {
        let grad = doc.gradient("linear", (add) => {
            for (let stop of this.stops) {
                add.stop(stop.offset / 100, stop.multiplied_color);
            }
        });
        let [x2, y2] = this.endPoints();
        grad.from(this.current_x0, this.current_y0);
        grad.to(x2, y2);
        grad.attr({ gradientUnits: "userSpaceOnUse" });
        this._element = grad;
        return grad;
    }
    toCSS(): React.CSSProperties {
        let [x2, y2] = this.endPoints();
        let angle = 90 - Math.atan2(y2 - this.current_y0, x2) * 180 / Math.PI;
        let grad = `linear-gradient(${angle}deg`;
        for (let stop of this.stops) {
            grad += `, ${stop.color} ${stop.offset}%`;
        }
        grad += ")";
        return { "backgroundImage": grad };
    }

    onSelected(rendering: SVG.G) {
        let wireframe = rendering.group().id("wireframe-gradient");
        let colorline: Record<number, string> = {};
        for (var stop of this.stops) {
            colorline[stop.offset] = stop.color;
        }
        let start = wireframe.circle(15).attr({ "stroke": "black", "stroke-width": 0.5, "cx": this.current_x0, "cy": this.current_y0, "fill": colorline[0] || "black" });
        let end = wireframe.circle(15).attr({ "stroke": "black", "stroke-width": 0.5, "cx": this.current_x1, "cy": this.current_y1, "fill": colorline[100] || "black" });
        let control = wireframe.circle(15).attr({ "stroke": "black", "stroke-width": 0.5, "cx": this.current_x2, "cy": this.current_y2, "fill": "black" });
        let line = wireframe.line(start.cx(), start.cy(), end.cx(), end.cy()).attr({ "stroke": "black", "stroke-width": 0.5 }).id("wireframe-line");
        let balls = wireframe.group();
        let makeballs = () => {
            deleteAllChildren(balls);
            for (let stop of this.stops) {
                if (stop.offset == 0 || stop.offset == 100) {
                    continue;
                }
                balls.circle(15).attr({
                    cx: this.current_x0 + (this.current_x1 - this.current_x0) * stop.offset / 100,
                    cy: this.current_y0 + (this.current_y1 - this.current_y0) * stop.offset / 100,
                    fill: stop.color,
                    stroke: "white",
                    "stroke-width": 0.5
                });
            }
        };
        let updateBalls = () => {
            for (let i = 0; i < balls.children().length; i++) {
                let ball = balls.children()[i];
                let stop = this.stops[i + 1];
                ball.attr({
                    cx: this.current_x0 + (this.current_x1 - this.current_x0) * stop.offset / 100,
                    cy: this.current_y0 + (this.current_y1 - this.current_y0) * stop.offset / 100,
                    fill: stop.color
                });
            }
        };
        makeballs();
        start.draggable(true);
        start.css({ "cursor": "grab" });
        end.draggable(true);
        end.css({ "cursor": "grab" });
        control.draggable(true);
        control.css({ "cursor": "grab" });
        start.on("dragend", (e: any) => {
            rendering.fire("refreshtree");
        });
        end.on("dragend", (e: any) => {
            rendering.fire("refreshtree");
        });
        control.on("dragend", (e: any) => {
            rendering.fire("refreshtree");
        });
        start.on("dragmove", (e: any) => {
            this.x0.addValue(this._font.normalizedLocation, e.detail.box.x);
            this.y0.addValue(this._font.normalizedLocation, e.detail.box.y);
            updateBalls();
            if (this._element) {
                this._element.from(this.current_x0, this.current_y0);
            }
            line.plot(start.cx(), start.cy(), end.cx(), end.cy());
        });
        control.on("dragmove", (e: any) => {
            this.x2.addValue(this._font.normalizedLocation, e.detail.box.x);
            this.y2.addValue(this._font.normalizedLocation, e.detail.box.y);
            updateBalls();
            if (this._element) {
                this._element.to(...this.endPoints());
            }
            line.plot(start.cx(), start.cy(), end.cx(), end.cy());
        });
        end.on("dragmove", (e: any) => {
            this.x1.addValue(this._font.normalizedLocation, e.detail.box.x);
            this.y1.addValue(this._font.normalizedLocation, e.detail.box.y);
            updateBalls();
            if (this._element) {
                this._element.to(...this.endPoints());
            }
            line.plot(start.cx(), start.cy(), end.cx(), end.cy());

        });
    }

    onDeselected(rendering: SVG.G) {
        let wf = rendering.find("#wireframe-gradient");
        if (wf.length) {
            wf[0].remove();
        }
    }

    clone(): LinearGradientFill {
        let clonedstops = this.stops.map(s => s.clone());
        return new LinearGradientFill(clonedstops,
            this.x0.clone(),
            this.y0.clone(),
            this.x1.clone(),
            this.y1.clone(),
            this.x2.clone(),
            this.y2.clone(),
            this._font
        );
    }

}
