// Typings for paint tables to be exported to fontkit

export interface PaintColrLayers {
    version: 1,
    numLayers: number,
    firstLayerIndex: number
}

export interface PaintSolid {
    version: 2,
    paletteIndex: number,
    alpha: number
}

export interface PaintVarSolid {
    version: 3,
    paletteIndex: number,
    alpha: number,
    varIndexBase: number
}

export interface ColorStop {
    stopOffset: number,
    paletteIndex: number,
    alpha: number
}

export interface VarColorStop {
    stopOffset: number,
    paletteIndex: number,
    alpha: number,
    varIndexBase: number
}

export interface ColorLine {
    extend: number,
    numStops: number,
    colorStops: ColorStop[]
}

export interface VarColorLine {
    extend: number,
    numStops: number,
    colorStops: VarColorStop[]
}

export interface PaintLinearGradient {
    version: 4,
    colorLine: ColorLine,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number
}

export interface PaintVarLinearGradient {
    version: 5,
    colorLine: VarColorLine,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    varIndexBase: number
}

export interface PaintGlyph {
    version: 10,
    paint: Paint,
    glyphID: number
}

export interface PaintColrGlyph {
    version: 11,
    paint: Paint,
}

export interface Affine2x3 {
    xx: number,
    xy: number,
    yx: number,
    yy: number,
    dx: number,
    dy: number,
}

export type VarAffine2x3 = Affine2x3 & { varIndexBase: number };

export interface PaintTransform {
    version: 12,
    paint: Paint,
    transform: Affine2x3,
}

export interface PaintVarTransform {
    version: 13,
    paint: Paint,
    transform: VarAffine2x3,
}

export interface PaintTranslate {
    version: 14,
    paint: Paint,
    dx: number,
    dy: number,
}

export interface PaintVarTranslate {
    version: 15,
    paint: Paint,
    dx: number,
    dy: number,
    varIndexBase: number
}

export type Paint = PaintColrLayers | PaintSolid | PaintVarSolid | PaintLinearGradient | PaintVarLinearGradient | PaintGlyph | PaintColrGlyph | PaintTransform | PaintVarTransform | PaintTranslate | PaintVarTranslate;