import * as SVG from "@svgdotjs/svg.js";
import { Font, create } from "fontkit";
import { Paint, SolidFill } from "./Paints";

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

declare let window: any;

export class PainterFont {
  base64: string;
  fontFace: string;
  hbFont: any;
  fkFont: Font;
  axes: Map<string, Axis>;
  svgCache: Map<number, any>;
  paints: Map<number, Paint[]>;
  glyphInfoCache: GlyphInfo[];

  constructor(base64: string, faceIdx: number = 0) {
    let [_header, body] = base64.split(",", 2);
    let fontBlob = base64ToUint8Array(body);
    this.svgCache = new Map();
    this.base64 = base64;
    this.fontFace = `@font-face{font-family:"${name}"; src:url(${this.base64});}`;
    const { hbjs } = window;
    const blob = hbjs.createBlob(fontBlob.buffer);
    const face = hbjs.createFace(blob, faceIdx);
    this.hbFont = hbjs.createFont(face);
    this.axes = face.getAxisInfos();
    this.fkFont = create(fontBlob as Buffer);
    this.glyphInfoCache = [];
    this.paints = new Map();
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
          new Paint(1, new SolidFill("#000000"), new SVG.Matrix(), 1.0),
          new Paint(355, new SolidFill("#FF0000"), moveit, 1.0),
        ])

      } else {
        let basicPaint = new Paint(gid, new SolidFill("#000000"), new SVG.Matrix(), 1.0);
        this.paints.set(gid, [basicPaint])
      }
    }
    return this.paints.get(gid) as Paint[];
  }

  renderPaints(paints: Paint[]): SVG.Svg {
    let svg = new SVG.Svg();
    let topgroup = svg.group();
    for (let paint of paints) {
      let thisglyph = topgroup.group();
      const svgDoc = SVG.SVG(this.getSVG(paint.gid));
      svgDoc.children().forEach((c) => thisglyph.add(c));

      if (paint.fill instanceof SolidFill) {
        thisglyph.attr({ "fill": paint.fill.color });
      }
      thisglyph.attr({ "fill-opacity": paint.opacity.toString() });
      thisglyph.transform(paint.matrix);
    }
    let matrix = new SVG.Matrix(1, 0, 0, -1, 0, 1000);
    topgroup.transform(matrix);
    return svg;
  }
}
