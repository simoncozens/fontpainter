import { PainterFont } from '../font/Font';
import { VariableScalar, f2dot14 } from "../font/VariableScalar";
import { Compiler } from "../font/compiler";
import { PaintSolid, PaintVarSolid } from './COLR';

export class SolidFill {
    color: string;
    opacity: VariableScalar;
    _font: PainterFont;
    type: string;

    constructor(color: string, opacity: number, font: PainterFont) {
        this.color = color;
        this._font = font;
        this.type = "solid";
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


