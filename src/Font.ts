import * as SVG from "@svgdotjs/svg.js";
import '@svgdotjs/svg.draggable.js'

import * as fontwriter from "fontwriter";

import { Font, create } from "fontkit";
import { Paint, Palette, SolidFill } from "./Paints";
import { COLR } from "./fontkit-bits/tables/COLR";
import CPAL from "./fontkit-bits/tables/CPAL";

export interface Axis {
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
  base64: string;
  fontFace: string;
  fontBlob: Uint8Array;
  hbFont: any;
  fkFont: Font;
  axes: Map<string, Axis>;
  svgCache: Map<number, any>;
  paints: Map<number, Paint[]>;
  glyphInfoCache: GlyphInfo[];

  constructor(base64: string, faceIdx: number = 0) {
    let [_header, body] = base64.split(",", 2);
    this.fontBlob = base64ToUint8Array(body);
    this.svgCache = new Map();
    this.base64 = base64;
    this.fontFace = `@font-face{font-family:"${name}"; src:url(${this.base64});}`;
    const { hbjs } = window;
    const blob = hbjs.createBlob(this.fontBlob.buffer);
    const face = hbjs.createFace(blob, faceIdx);
    this.hbFont = hbjs.createFont(face);
    this.axes = face.getAxisInfos();
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

  setVariations(variations: Map<string, number>) {
    this.hbFont.setVariations(variations);
  }

  getName(): string {
    return this.fkFont.familyName
  }

  glyphInfos(): GlyphInfo[] {
    if (this.glyphInfoCache.length == 0) {
      var id = 0;
      while (id < this.fkFont.numGlyphs) {
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
      if (gid == 2) {
        let moveit = new SVG.Matrix();
        moveit = moveit.translate(300, 180);
        this.paints.set(gid, [
          new Paint(355, new SolidFill("#FF0000", 1.0), moveit, this),
          new Paint(1, new SolidFill("#000000", 1.0), new SVG.Matrix(), this),
        ])
        this.paints.get(gid)![1].locked = true

      } else {
        let basicPaint = new Paint(gid, new SolidFill("#000000", 1.0), new SVG.Matrix(), this);
        this.paints.set(gid, [basicPaint])
      }
    }
    return this.paints.get(gid) as Paint[];
  }

  renderPaints(paints: Paint[]): SVG.Svg {
    let svg = new SVG.Svg();
    let topgroup = svg.group();
    // Do them reversed (bottom to top)
    for (var i = paints.length - 1; i >= 0; i--) {
      paints[i].render()
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

    var palette = new Palette();
    var baseGlyphPaintRecords: any[] = []
    var layers: any[] = []
    this.paints.forEach((paints: Paint[], gid: number) => {
      let topPaint;
      if (paints.length == 1) {
        topPaint = paints[0].toOpenType(palette);
      } else {
        topPaint = {
          version: 1,
          numLayers: paints.length,
          firstLayerIndex: layers.length
        }
        // Do them reversed (bottom to top)
        for (var i = paints.length - 1; i >= 0; i--) {
          layers.push(paints[i].toOpenType(palette))
        }
      }
      baseGlyphPaintRecords.push({
        gid,
        paint: topPaint
      })
    });
    let layerList = {
      numLayers: layers.length,
      paint: layers
    };
    let baseGlyphList = {
      numBaseGlyphPaintRecords: baseGlyphPaintRecords.length,
      baseGlyphPaintRecords
    }
    let colr = {
      version: 1,
      numBaseGlyphRecords: 0,
      baseGlyphRecord: [],
      layerRecords: [],
      numLayerRecords: 0,
      baseGlyphList,
      layerList,
      clipList: null,
      varIndexMap: null,
      itemVariationStore: null
    }
    let cpal = palette.toOpenType();
    return [colr, cpal]
  }

  download() {
    let [colr, cpal] = this.saveColr()
    let colr_blob = COLR.toBuffer(colr)
    let cpal_blob = CPAL.toBuffer(cpal)
    let output = fontwriter.add_table(this.fontBlob, "COLR", colr_blob)
    output = fontwriter.add_table(output, "CPAL", cpal_blob)
    let datauri = `data:application/octet-stream;base64,${uint8ArrayToBase64(output)}`;
    var element = document.createElement('a');
    element.setAttribute('href', datauri);
    element.setAttribute('download', "font.ttf");
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }
}
