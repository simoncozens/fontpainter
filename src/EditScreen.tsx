import * as React from 'react';
import { PainterFont } from './Font';
import { Paint } from './Paints';
import * as SVG from "@svgdotjs/svg.js";

interface EditScreenProps {
    font: PainterFont | null,
    paintLayers: Paint[],
    setPaintLayers: React.Dispatch<React.SetStateAction<Paint[]>>;
}

function deleteAllChildren(e: any) {
    let child = e.lastElementChild;
    while (child) {
        e.removeChild(child);
        child = e.lastElementChild;
    }
}

export default function EditScreen(props: EditScreenProps) {
    if (!props.font || props.paintLayers.length == 0) {
        return (
            <svg>
            </svg>
        );
    }
    let svgEl = props.font.renderPaints(props.paintLayers);

    const svg = React.useRef(document.createElement("div"));
    deleteAllChildren(svg.current);
    svgEl.width(1000);
    svgEl.height(1000);
    svgEl.addTo(svg.current);
    return (
        <div className="svgwrapper">
            <div ref={svg} className="svgbox" />
        </div>
    );

}