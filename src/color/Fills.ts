import { PainterFont } from '../font/Font';
import * as SVG from "@svgdotjs/svg.js";
import { VariableScalar, f2dot14 } from "../font/VariableScalar";
import { Compiler } from "../font/compiler";
import { deleteAllChildren } from "./Paints";
import { Palette } from "./Palette";
import { ColorStop, PaintLinearGradient, PaintSolid, PaintVarSolid, VarColorStop } from './COLR';


export class SolidFill {
    color: string;
    opacity: VariableScalar;
    _font: PainterFont;

    constructor(color: string, opacity: number, font: PainterFont) {
        this.color = color;
        this._font = font;
        this.opacity = new VariableScalar(Object.keys(font.axes));
        this.opacity.addValue(font.defaultLocation, opacity);
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
                alpha: this.opacity.valueAt(this._font.defaultLocation),
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
    _parent: LinearGradientFill;

    constructor(color: string, offset: number, opacity: number, parent: LinearGradientFill) {
        this.color = color;
        this.offset = offset;
        this._parent = parent;
        let font = parent._font;
        this.opacity = new VariableScalar(Object.keys(font.axes));
        this.opacity.addValue(font.defaultLocation, opacity);
    }
    get current_opacity(): number {
        return this.opacity.valueAt(this._parent._font.normalizedLocation);
    }
    toOpenType(compiler: Compiler): ColorStop {
        const paletteIndex = compiler.palette!.indexOf(this.color);
        return {
            stopOffset: this.offset,
            paletteIndex,
            alpha: this.current_opacity // TODO: support variable opacity
        };
    }

    clone(): GradientStop {
        let cloned = new GradientStop(this.color, this.offset, this.current_opacity, this._parent);
        cloned.opacity = this.opacity.clone() as VariableScalar;
        return cloned;
    }
}

export class LinearGradientFill {
    _element: SVG.Gradient | null = null;
    _font: PainterFont;
    stops: GradientStop[];
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    x2: number;
    y2: number;

    constructor(stops: GradientStop[], x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, font: PainterFont) {
        this._font = font;
        this.stops = stops;
        this.x0 = x0;
        this.y0 = y0;
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
    }
    toOpenType(compiler: Compiler): PaintLinearGradient {
        let colorline = {
            extend: 0,
            numStops: this.stops.length,
            colorStops: this.stops.map((stop) => stop.toOpenType(compiler))
        };
        return {
            version: 4,
            colorLine: colorline,
            x0: this.x0,
            y0: this.y0,
            x1: this.x1,
            y1: this.y1,
            x2: this.x2,
            y2: this.y2,
        };
    }
    get description(): string {
        return `GradientFill`;
    }
    toSVG(doc: SVG.Svg) {
        let grad = doc.gradient("linear", (add) => {
            for (let stop of this.stops) {
                add.stop(stop.offset / 100, stop.color);
            }
        });
        grad.from(this.x0, this.y0);
        grad.to(this.x1, this.y1);
        grad.attr({ gradientUnits: "userSpaceOnUse" });
        this._element = grad;
        return grad;
    }
    toCSS(): React.CSSProperties {
        let angle = 90 - Math.atan2(this.y1 - this.y0, this.x1 - this.x0) * 180 / Math.PI;
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
        console.log(colorline);
        let start = wireframe.circle(15).attr({ "stroke": "black", "stroke-width": 0.5, "cx": this.x0, "cy": this.y0, "fill": colorline[0] || "black" });
        let end = wireframe.circle(15).attr({ "stroke": "black", "stroke-width": 0.5, "cx": this.x1, "cy": this.y1, "fill": colorline[100] || "black" });
        let control = wireframe.circle(15).attr({ "stroke": "black", "stroke-width": 0.5, "cx": this.x2, "cy": this.y2, "fill": "black" });
        let line = wireframe.line(start.cx(), start.cy(), end.cx(), end.cy()).attr({ "stroke": "black", "stroke-width": 0.5 }).id("wireframe-line");
        let balls = wireframe.group();
        let makeballs = () => {
            deleteAllChildren(balls);
            for (let stop of this.stops) {
                if (stop.offset == 0 || stop.offset == 100) {
                    continue;
                }
                balls.circle(15).attr({
                    cx: this.x0 + (this.x1 - this.x0) * stop.offset / 100,
                    cy: this.y0 + (this.y1 - this.y0) * stop.offset / 100,
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
                    cx: this.x0 + (this.x1 - this.x0) * stop.offset / 100,
                    cy: this.y0 + (this.y1 - this.y0) * stop.offset / 100,
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
        start.on("dragmove", (e: any) => {
            this.x0 = e.detail.box.x;
            this.y0 = e.detail.box.y;
            updateBalls();
            if (this._element) {
                this._element.from(this.x0, this.y0);
            }
            line.plot(start.cx(), start.cy(), end.cx(), end.cy());
        });
        end.on("dragend", (e: any) => {
            this.x1 = e.detail.box.x;
            this.y1 = e.detail.box.y;
            rendering.fire("refreshtree");
        });
        end.on("dragmove", (e: any) => {
            this.x1 = e.detail.box.x;
            this.y1 = e.detail.box.y;
            updateBalls();
            if (this._element) {
                this._element.to(this.x1, this.y1);
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
            this.x0,
            this.y0,
            this.x1,
            this.y1,
            this.x2,
            this.y2,
            this._font
        );
    }

}
