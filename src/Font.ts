import * as SVG from "@svgdotjs/svg.js";
import '@svgdotjs/svg.draggable.js'

import { Font, create } from "fontkit";
import { Paint, Palette, SELF_GID, SolidBlackFill, SolidFill } from "./Paints";
import { COLR } from "./fontkit-bits/tables/COLR";
import CPAL from "./fontkit-bits/tables/CPAL";

import { NormalizedLocation, normalizeLocation, normalizeValue, UnnormalizedLocation } from "./varmodel";
import { Compiler } from "./compiler";
export interface Axis {
  tag: string;
  name?: string;
  min: number;
  max: number;
  default: number;
}

export interface GlyphInfo {
  id: number;
  name: string;
  unicode: number | null;
}

function base64ToUint8Array(base64: string) {
  var binaryString = atob(base64);
  var bytes = new Uint8Array(binaryString.length);
  for (var i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function uint8ArrayToBase64(bytes: Uint8Array) {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}


declare let window: any;

export class PainterFont {
  filename: string;
  base64: string;
  fontFace: string;
  fontBlob: Uint8Array;
  hbFont: any;
  hbFace: any;
  fkFont: Font;
  axes: Record<string, Axis>;
  variations: Record<string, number>;
  svgCache: Map<number, any>;
  paints: Map<number, Paint[]>;
  palette: Palette;
  glyphInfoCache: GlyphInfo[];

  constructor(base64: string, filename: string, faceIdx: number = 0) {
    let [_header, body] = base64.split(",", 2);
    this.filename = filename;
    this.fontBlob = base64ToUint8Array(body);
    this.svgCache = new Map();
    this.palette = new Palette();
    this.variations = {};
    this.base64 = base64;
    this.fontFace = `@font-face{font-family:"${name}"; src:url(${this.base64});}`;
    const { hbjs } = window;
    const blob = hbjs.createBlob(this.fontBlob.buffer);
    this.hbFace = hbjs.createFace(blob, faceIdx);
    this.hbFont = hbjs.createFont(this.hbFace);
    this.axes = this.hbFace.getAxisInfos();
    for (let axis of Object.keys(this.axes)) {
      this.axes[axis].tag = axis;
      this.variations[axis] = this.axes[axis].default;
    }
    this.fkFont = create(this.fontBlob as Buffer);
    this.glyphInfoCache = [];
    this.paints = new Map();
    this.saveColr()
    window["font"] = this
    return this;
  }

  getSVG(gid: number): any {
    let svgText = this.hbFont.glyphToPath(gid);
    if (svgText.length < 10) {
      const glyph = this.fkFont.getGlyph(gid);
      if (glyph) {
        svgText = glyph.path.toSVG();
      }
    } else {
      svgText = `<path d="${svgText}"/>`;
    }
    svgText = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">${svgText} </svg>`;
    return svgText;
  }

  setVariations() {
    this.hbFont.setVariations(this.variations);
  }

  get normalizedLocation(): NormalizedLocation {
    return normalizeLocation(this.variations as UnnormalizedLocation, Object.values(this.axes));
  }

  get defaultLocation(): NormalizedLocation {
    var loc = {} as NormalizedLocation
    for (var axis in this.axes) {
      loc[axis] = 0
    }
    return loc
  }

  getName(): string {
    return this.fkFont.familyName
  }

  get numGlyphs(): number {
    return this.fkFont.numGlyphs
  }

  glyphInfos(): GlyphInfo[] {
    if (this.glyphInfoCache.length == 0) {
      var id = 0;
      while (id < this.numGlyphs) {
        let glyph = this.fkFont.getGlyph(id)
        var name = glyph.name;
        var unicode = null;
        // @ts-ignore
        let codepoints = this.fkFont._cmapProcessor.codePointsForGlyph(id);
        if (codepoints.length > 0) {
          unicode = codepoints[0]
        }
        this.glyphInfoCache.push({
          id,
          name,
          unicode
        })
        id += 1;
      }
    }
    return this.glyphInfoCache
  }

  getPaintLayers(gid: number): Paint[] {
    if (!this.paints.has(gid)) {
      // if (gid == 1) {
      //   this.paints.set(gid, [
      //     new Paint(384, new LinearGradientFill([
      //       new GradientStop("#C8FFFF", 0.0, 1.0),
      //       new GradientStop("#968CFA", 0.25, 1.0),
      //       new GradientStop("#FF00DC", 0.5, 1.0),
      //       new GradientStop("#FF82AA", 0.75, 1.0),
      //       new GradientStop("#FFDCDC", 1.0, 1.0),
      //     ],
      //       0.0, 0.0, 1000.0, 1000.0, 0.0, -50.0
      //     ), new SVG.Matrix(), this, 384),
      //     new Paint(383, new LinearGradientFill([
      //       new GradientStop("#C8FFFF", 0.0, 1.0),
      //       new GradientStop("#968CFA", 0.25, 1.0),
      //       new GradientStop("#FF00DC", 0.5, 1.0),
      //       new GradientStop("#FF82AA", 0.75, 1.0),
      //       new GradientStop("#FFDCDC", 1.0, 1.0),
      //     ],
      //       0.0, 0.0, 1000.0, 1000.0, 0.0, -50.0
      //     ), new SVG.Matrix(), this, 383),
      //     new Paint(1, new LinearGradientFill([
      //       new GradientStop("#641EFF", 0.0, 1.0),
      //       new GradientStop("#E6E6C8", 0.5, 1.0),
      //       new GradientStop("#FF1463", 1.0, 1.0),
      //     ],
      //       0.0, 0.0, 1000.0, 1000.0, 0.0, -50.0
      //     ), new SVG.Matrix(), this, 1),
      //   ])
      //   this.paints.get(gid)![1].locked = true

      // } else {
      let basicPaint = new Paint(SELF_GID, SolidBlackFill(this), new SVG.Matrix(), this, gid);
        this.paints.set(gid, [basicPaint])
      // }
    }
    this.updatePalette();
    return this.paints.get(gid) as Paint[];
  }

  renderPaints(paints: Paint[], selectedGid: number): SVG.Svg {
    let svg = new SVG.Svg();
    let topgroup = svg.group();
    // Do them reversed (bottom to top)
    for (var i = paints.length - 1; i >= 0; i--) {
      paints[i].render(selectedGid, svg)
      paints[i].rendering.addTo(topgroup)
    }
    let matrix = new SVG.Matrix(1, 0, 0, -1, 0, 1000);
    topgroup.transform(matrix);
    return svg;
  }

  saveColr(): [any, any] {
    // Ensure all paint layers exist
    var id = 0;
    while (id < this.fkFont.numGlyphs) {
      this.getPaintLayers(id);
      id += 1;
    }
    let compiler = new Compiler(this);
    compiler.compile()
    return [compiler.colr, compiler.palette]
  }

  download() {
    let [colr, palette] = this.saveColr()
    let cpal = palette.toOpenType();
    let colr_blob = COLR.toBuffer(colr)
    let cpal_blob = CPAL.toBuffer(cpal)
    const { hbjs } = window;
    let newface = hbjs.buildFace();
    //@ts-ignore
    for (var table_tag in this.fkFont.directory.tables) {
      if (table_tag == "COLR" || table_tag == "CPAL") {
        continue;
      }
      let table = this.hbFace.reference_table(table_tag);
      console.log(table_tag, table);
      newface.addTable(table_tag, table)
    }

    newface.addTable("COLR", colr_blob);
    newface.addTable("CPAL", cpal_blob);
    let output = newface.save();

    let datauri = `data:application/octet-stream;base64,${uint8ArrayToBase64(output)}`;
    var element = document.createElement('a');
    element.setAttribute('href', datauri);
    element.setAttribute('download', this.filename.replace(/\.([ot]tf)$/, "-COLR.$1"));
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  updatePalette() {
    this.palette = new Palette()
    for (var paint of Array.from(this.paints.values())) {
      for (var p of paint) {
        if (p.fill instanceof SolidFill) {
          this.palette.indexOf(p.fill.color);
        }
      }
    }
  }
}
