var tinycolor = require("tinycolor2");

function toRGBA(color: string) {
    let rgba = tinycolor(color).toRgb();
    return {
        red: rgba.r,
        green: rgba.g,
        blue: rgba.b,
        alpha: rgba.a * 255
    };
}

export class Palette {
    colors: string[];
    constructor() {
        this.colors = [];
    }

    indexOf(color: string): number {
        let rgb = tinycolor(color).toRgbString();
        let index = this.colors.indexOf(color);
        if (index == -1) {
            this.colors.push(color);
            index = this.colors.length - 1;
        }
        return index;
    }

    toOpenType(): any {
        return {
            version: 0,
            numPaletteEntries: this.colors.length,
            numPalettes: 1,
            numColorRecords: this.colors.length,
            colorRecords: this.colors.map(toRGBA),
            colorRecordIndices: [0]
        };
    }
}
