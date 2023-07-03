import * as React from 'react';
import { PainterFont } from './Font';
import { Paint } from './Paints';
import * as SVG from "@svgdotjs/svg.js";

interface EditScreenProps {
    font: PainterFont | null,
    paintLayers: Paint[],
    setPaintLayers: React.Dispatch<React.SetStateAction<Paint[]>>,
    selectLayer: React.Dispatch<React.SetStateAction<number | null>>,
    selectedLayer: number | null,
}

function deleteAllChildren(e: any) {
    let child = e.lastElementChild;
    while (child) {
        e.removeChild(child);
        child = e.lastElementChild;
    }
}

export default function EditScreen(props: EditScreenProps) {
    const svg = React.useRef(document.createElement("div"));
    if (props.font && props.paintLayers.length > 0) {
        let svgEl = props.font.renderPaints(props.paintLayers);
        if (props.selectedLayer != null) {
            props.paintLayers[props.selectedLayer].onSelected();
        }
        props.paintLayers.forEach((layer: Paint, index: number) => {
            layer.rendering.on("click", () => {
                props.selectLayer(index);
            })
            layer.rendering.on("refreshtree", () => {
                props.setPaintLayers([...props.paintLayers]);
            })
        })
        console.log("Rendered ",svgEl)
        deleteAllChildren(svg.current);
        svgEl.width(1000);
        svgEl.height(1000);
        svgEl.addTo(svg.current);
    }
    return (
        <div className="svgwrapper">
            <div ref={svg} className="svgbox" onClick={() => props.selectLayer(null)}/>
        </div>
    );

}