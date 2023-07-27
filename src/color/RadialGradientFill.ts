import { PainterFont } from '../font/Font';
import * as SVG from "@svgdotjs/svg.js";
import { VariableScalar } from "../font/VariableScalar";
import { Compiler } from "../font/compiler";
import { deleteAllChildren } from "./Paints";
import { PaintRadialGradient, PaintVarRadialGradient, VarColorLine, VarColorStop } from './COLR';
import { GradientStop } from './GradientStop';


export class RadialGradientFill {
    _element: SVG.Gradient | null = null;
    _font: PainterFont;
    stops: GradientStop[];
    type: string;
    x0: VariableScalar;
    y0: VariableScalar;
    radius0: VariableScalar;
    x1: VariableScalar;
    y1: VariableScalar;
    radius1: VariableScalar;

    constructor(stops: GradientStop[],
        x0: number | VariableScalar,
        y0: number | VariableScalar,
        radius0: number | VariableScalar,
        x1: number | VariableScalar,
        y1: number | VariableScalar,
        radius1: number | VariableScalar,
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
        if (typeof radius0 == "number") {
            this.radius0 = new VariableScalar(Object.keys(this._font.axes));
            this.radius0.addValue(font.defaultLocation, radius0);
        } else {
            this.radius0 = radius0;
        }
        if (typeof radius1 == "number") {
            this.radius1 = new VariableScalar(Object.keys(this._font.axes));
            this.radius1.addValue(font.defaultLocation, radius1);
        } else {
            this.radius1 = radius1;
        }
        this.type = "radial-gradient";
        console.log(this);
    }

    public static inflate(s: any, f: PainterFont): RadialGradientFill {
        let stops = s.stops.map((stop: any) => GradientStop.inflate(stop, f));
        return new RadialGradientFill(stops,
            VariableScalar.inflate(s.x0, f),
            VariableScalar.inflate(s.y0, f),
            VariableScalar.inflate(s.radius0, f),
            VariableScalar.inflate(s.x1, f),
            VariableScalar.inflate(s.y1, f),
            VariableScalar.inflate(s.radius1, f),
            f);
    }

    doesVary(): boolean {
        if (this.x0.doesVary || this.y0.doesVary || this.x1.doesVary || this.y1.doesVary || this.radius0.doesVary || this.radius1.doesVary) {
            return true;
        }
        for (let stop of this.stops) {
            if (stop.opacity.doesVary) {
                return true;
            }
        }
        return false;
    }

    toOpenType(compiler: Compiler): PaintRadialGradient | PaintVarRadialGradient {
        if (!this.doesVary()) {
            return {
                version: 6,
                colorLine: {
                    extend: 0,
                    numStops: this.stops.length,
                    colorStops: this.stops.map((stop) => stop.toOpenType(compiler, false))
                },
                x0: this.x0.defaultValue,
                y0: this.y0.defaultValue,
                radius0: this.radius0.defaultValue,
                x1: this.x1.defaultValue,
                y1: this.y1.defaultValue,
                radius1: this.radius1.defaultValue,
            } as PaintRadialGradient;
        }
        let colorStops: VarColorStop[] = this.stops.map((stop) => stop.toOpenType(compiler, true) as VarColorStop);
        let varColorLine: VarColorLine = {
            extend: 0,
            numStops: this.stops.length,
            colorStops
        };
        let varIndexBase = compiler.deltaset.length;
        for (var element of ["x0", "y0", "radius0", "x1", "y1", "radius1"]) {
            compiler.deltaset.push({
                // @ts-ignore
                entry: this[element].addToVarStore(compiler.builder),
            });
        }
        return {
            version: 7,
            colorLine: varColorLine,
            x0: this.x0.defaultValue,
            y0: this.y0.defaultValue,
            radius0: this.radius0.defaultValue,
            x1: this.x1.defaultValue,
            y1: this.y1.defaultValue,
            radius1: this.radius1.defaultValue,
            varIndexBase
        } as PaintVarRadialGradient;


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
    get current_radius0(): number {
        return this.radius0.valueAt(this._font.normalizedLocation);
    }
    get current_radius1(): number {
        return this.radius1.valueAt(this._font.normalizedLocation);
    }

    toSVG(doc: SVG.Svg) {
        let grad = doc.gradient("radial", (add) => {
            for (let stop of this.stops) {
                add.stop(stop.offset / 100, stop.multiplied_color);
            }
        });
        grad.from(this.current_x0, this.current_y0);
        grad.to(this.current_x1, this.current_y1);
        grad.radius(this.current_radius1);
        grad.attr({ gradientUnits: "userSpaceOnUse", "fr": this.current_radius0 });
        this._element = grad;
        return grad;
    }
    toCSS(): React.CSSProperties {
        let grad = `radial-gradient(circle`;
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
        let end = wireframe.circle(15).attr({ "stroke": "black", "stroke-width": 0.5, "cx": this.current_x0, "cy": this.current_y0 + this.current_radius1, "fill": colorline[100] || "black" });
        wireframe.circle(this.current_radius1 * 2).attr({ "stroke": "black", "stroke-width": 0.5, "cx": this.current_x0, "cy": this.current_y0, "fill": "none" });
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
        start.on("dragend", (e: any) => {
            rendering.fire("refreshtree");
        });
        end.on("dragend", (e: any) => {
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
        end.on("dragmove", (e: any) => {
            this.x1.addValue(this._font.normalizedLocation, e.detail.box.x);
            this.y1.addValue(this._font.normalizedLocation, e.detail.box.y);
            updateBalls();
            if (this._element) {
                this._element.to(this.current_x1, this.current_y1);
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

    clone(): RadialGradientFill {
        let clonedstops = this.stops.map(s => s.clone());
        return new RadialGradientFill(clonedstops,
            this.x0.clone(),
            this.y0.clone(),
            this.radius0.clone(),
            this.x1.clone(),
            this.y1.clone(),
            this.radius1.clone(),
            this._font
        );
    }

}
