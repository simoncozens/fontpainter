import * as React from 'react';
import { PainterFont } from './Font';
import { Paint } from './Paints';
import * as SVG from "@svgdotjs/svg.js";
import useMediaQuery from '@mui/material/useMediaQuery';
import '@svgdotjs/svg.panzoom.js'

interface EditScreenProps {
    font: PainterFont | null,
    selectedGid: number | null,
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
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
    const [zoomValue, setZoomValue] = React.useState<any>(null)
    const backgroundColor = React.useMemo(
      () => prefersDarkMode ? '#AAA' : 'white',
      [prefersDarkMode],
    );
    
    const svg = React.useRef(document.createElement("div"));
    if (props.font && props.paintLayers.length > 0 && props.selectedGid != null) {
        let svgEl = props.font.renderPaints(props.paintLayers, props.selectedGid);
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
        deleteAllChildren(svg.current);
        // Add a grid
        svgEl.defs().svg('<pattern id="smallGrid" width="5" height="5" patternUnits="userSpaceOnUse"><path d="M 5 0 L 0 0 0 5" fill="none" stroke="gray" stroke-width="0.5"/></pattern>')
        svgEl.defs().svg('<pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse"><rect width="50" height="50" fill="url(#smallGrid)"/><path d="M 50 0 L 0 0 0 50" fill="none" stroke="gray" stroke-width="1"/></pattern>')
        svgEl.rect(1000, 1000).fill('url(#grid)').back()
        svgEl.width(1000);
        svgEl.height(1000).viewbox('0 0 1000 1000').panZoom({
            zoomFactor: 0.5,
            zoomMin: 0.5,
            zoomMax: 50
        });
        if (zoomValue) {
            svgEl.zoom(zoomValue.level, zoomValue.focus);
        }
        svgEl.on("zoom", (evt: any) => {
            setZoomValue(evt.detail)
        })
        svgEl.addTo(svg.current);
    }
    return (
        <div className="svgwrapper" style={{backgroundColor }}>
            <div ref={svg} className="svgbox" onClick={() => props.selectLayer(null)}/>
        </div>
    );

}