import { Matrix } from "@svgdotjs/svg.js";
import { PainterFont } from "./Font";
import { BlendMode, Paint, Palette, SELF_GID } from "./Paints";
import { VarStore, VarStoreBuilder } from "./varstorebuilder";
import { MatrixType, VariableMatrix, matrixType } from "./VariableMatrix";

interface DeltaSetIndexMapEntry {
    entry: number;
}
type DeltaSetIndexMap = DeltaSetIndexMapEntry[];

enum PaintFormat {
    PaintColrLayers = 1,
    PaintSolid = 2,
    PaintVarSolid = 3,
    PaintLinearGradient = 4,
    PaintVarLinearGradient = 5,
    PaintRadialGradient = 6,
    PaintVarRadialGradient = 7,
    PaintSweepGradient = 8,
    PaintVarSweepGradient = 9,
    PaintGlyph = 10,
    PaintColrGlyph = 11,
    PaintTransform = 12,
    PaintVarTransform = 13,
    PaintTranslate = 14,
    PaintVarTranslate = 15,
    PaintScale = 16,
    PaintVarScale = 17,
    PaintScaleAroundCenter = 18,
    PaintVarScaleAroundCenter = 19,
    PaintScaleUniform = 20,
    PaintVarScaleUniform = 21,
    PaintScaleUniformAroundCenter = 22,
    PaintVarScaleUniformAroundCenter = 23,
    PaintRotate = 24,
    PaintVarRotate = 25,
    PaintRotateAroundCenter = 26,
    PaintVarRotateAroundCenter = 27,
    PaintSkew = 28,
    PaintVarSkew = 29,
    PaintSkewAroundCenter = 30,
    PaintVarSkewAroundCenter = 31,
    PaintComposite = 32,
}

interface COLRTable {
    version: number;
    numBaseGlyphRecords: number;
    baseGlyphRecord: any[];
    layerRecords: any[];
    numLayerRecords: number;
    baseGlyphList: any;
    layerList: any;
    clipList: any;
    varIndexMap: any;
    itemVariationStore: VarStore | null;
}

export class Compiler {
    font: PainterFont;
    builder: VarStoreBuilder;
    deltaset: DeltaSetIndexMap;
    colr: COLRTable | null = null;
    palette: Palette | null = null;

    constructor(font: PainterFont) {
        this.font = font;
        this.builder = new VarStoreBuilder(Object.keys(font.axes));
        this.deltaset = [];
    }

    compile() {
        this.palette = new Palette();
        var baseGlyphPaintRecords: any[] = [];
        var layers: any[] = [];
        this.font.paints.forEach((paints: Paint[], gid: number) => {
            let topPaint = this.compilePaints(paints, gid, layers);
            baseGlyphPaintRecords.push({
                gid,
                paint: topPaint,
            });
        });
        let layerList = {
            numLayers: layers.length,
            paint: layers,
        };
        let baseGlyphList = {
            numBaseGlyphPaintRecords: baseGlyphPaintRecords.length,
            baseGlyphPaintRecords,
        };
        this.colr = {
            version: 1,
            numBaseGlyphRecords: 0,
            baseGlyphRecord: [],
            layerRecords: [],
            numLayerRecords: 0,
            baseGlyphList,
            layerList,
            clipList: null,
            varIndexMap: null,
            itemVariationStore: null,
        };
        // Add variations
        if (this.deltaset.length > 0) {
            this.colr.varIndexMap = { mapData: this.deltaset };
            this.colr.itemVariationStore = this.builder.finish();
        }
        // console.log(this.colr);
    }

    compilePaints(paints: Paint[], gid: number, layers: any[]): any | null {
        if (paints.length == 1) {
            // console.log("Single layer : ", paints[0])
            return this.compileSinglePaint(paints[0], this.palette!, gid);
        }
        let topPaint: any = {
            version: 1,
            numLayers: paints.length,
            firstLayerIndex: layers.length,
        };
        // Do them reversed (bottom to top)
        let newlayers: any[] = [];
        // console.log("Paints")
        // console.log(paints);
        let bottom = layers.length;
        for (var i = paints.length - 1; i >= 0; i--) {
            let thisPaint = this.compileSinglePaint(
                paints[i],
                this.palette!,
                gid
            );
            if (thisPaint === null) {
                // Raise some error here
            } else {
                // console.log("Compiling layer ", i, " : ", paints[i])
                if (paints[i].blendMode != BlendMode.Normal) {
                    // Group lower layers
                    let lowerLayers = {
                        version: PaintFormat.PaintColrLayers,
                        firstLayerIndex: bottom,
                        numLayers: newlayers.length - bottom,
                    };
                    // console.log("Composite! Lower layer paint, ", lowerLayers)
                    bottom += newlayers.length;
                    // Add a composite layer
                    thisPaint = {
                        version: PaintFormat.PaintComposite,
                        compositeMode: paints[i].blendMode,
                        sourcePaint: thisPaint,
                        backdropPaint: lowerLayers,
                    };
                    // console.log("Composite layer, ", thisPaint)
                    topPaint.firstLayerIndex = bottom;
                }
                newlayers.push(thisPaint);
            }
        }
        layers.push(...newlayers);
        topPaint.numLayers = layers.length - bottom;
        if (topPaint.numLayers == 1) {
            return layers[topPaint.firstLayerIndex];
        }
        return topPaint;
    }

    compileSinglePaint(
        paint: Paint,
        palette: Palette,
        contextGid: number
    ): any {
        if (paint.gid == null) {
            console.log("Paint has no gid", paint);
            return;
        }
        let fillpaint = paint.fill.toOpenType(palette);
        let glyphpaint = {
            version: 10,
            glyphID: paint.gid == SELF_GID ? contextGid : paint.gid,
            paint: fillpaint,
        };

        let matrix = paint.matrix;
        if (!matrix.doesVary) {
            return this.compileStaticMatrix(
                matrix.values.values().next().value,
                glyphpaint
            );
        }
        return this.compileVariableMatrix(matrix, glyphpaint);
    }

    compileStaticMatrix(matrix: Matrix, glyphpaint: any) {
        let style = matrixType(matrix);
        if (style == MatrixType.None) {
            return glyphpaint;
        } else if (style == MatrixType.Translation) {
            return {
                version: PaintFormat.PaintTranslate,
                paint: glyphpaint,
                dx: matrix.e,
                dy: matrix.f,
            };
        } else {
            return {
                version: PaintFormat.PaintTransform,
                paint: glyphpaint,
                transform: {
                    xx: matrix.a,
                    xy: matrix.b,
                    yx: matrix.c,
                    yy: matrix.d,
                    dx: matrix.e,
                    dy: matrix.f,
                },
            };
        }
    }

    compileVariableMatrix(matrix: VariableMatrix, glyphpaint: any) {
        let highestType = matrix.mostComplexType();
        if (highestType == MatrixType.None) {
            return glyphpaint;
        }
        let varIndexBase = this.deltaset.length;
        let def = matrix.valueAt(this.font.defaultLocation);
        if (highestType == MatrixType.Translation) {
            for (var element of ["e", "f"]) {
                this.deltaset.push({
                    entry: matrix.addToVarStore(this.builder, element),
                });
            }
            return {
                version: PaintFormat.PaintVarTranslate,
                paint: glyphpaint,
                dx: def.e,
                dy: def.f,
                varIndexBase,
            };
        } else {
            for (var element of ["a", "b", "c", "d", "e", "f"]) {
                this.deltaset.push({
                    entry: matrix.addToVarStore(this.builder, element),
                });
            }
            return {
                version: PaintFormat.PaintVarTransform,
                paint: glyphpaint,
                transform: {
                    xx: def.a,
                    xy: def.b,
                    yx: def.c,
                    yy: def.d,
                    dx: def.e,
                    dy: def.f,
                    varIndexBase,
                },
            };
        }
    }
}
