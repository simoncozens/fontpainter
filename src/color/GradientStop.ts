import { PainterFont } from '../font/Font';
import { VariableScalar, f2dot14 } from "../font/VariableScalar";
import { Compiler } from "../font/compiler";
import { ColorStop, VarColorStop } from './COLR';
var tinycolor = require("tinycolor2");


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
        let stop = new GradientStop(s.color, s.offset, 1, f);
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
