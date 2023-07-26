import * as React from 'react';
import { PainterFont } from './font/Font';
import { Paint } from './color/Paints';
import * as SVG from "@svgdotjs/svg.js";
import useMediaQuery from '@mui/material/useMediaQuery';
import '@svgdotjs/svg.panzoom.js'
import { FontContext, FontContextType } from "./App";
import { IconButton, ToggleButton, ToggleButtonGroup, Toolbar } from '@mui/material';
import { AdsClick, PanTool } from '@mui/icons-material';

function deleteAllChildren(e: any) {
    let child = e.lastElementChild;
    while (child) {
        e.removeChild(child);
        child = e.lastElementChild;
    }
}

const normalizeEvent = (ev:any) =>
  ev.touches || [{ clientX: ev.clientX, clientY: ev.clientY }];

export default function EditScreen() {
    const fc: FontContextType = React.useContext(FontContext);
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
    const backgroundColor = React.useMemo(
      () => prefersDarkMode ? '#AAA' : 'white',
      [prefersDarkMode],
    );
    const [mode, setMode] = React.useState("select");
    const changeMode = (
        event: React.MouseEvent<HTMLElement>,
        newMode: string | null,
      ) => {
        if (newMode !== null) {
            setMode(newMode);
        }
      };
    let svgEl: SVG.Svg | null = null;

    const svg = React.useRef(document.createElement("div"));
    if (fc.font && fc.paintLayers.length > 0 && fc.selectedGid != null) {
        svgEl = fc.font.renderPaints(fc.paintLayers, fc.selectedGid);
        if (fc.selectedLayer != null && mode == "select") {
            fc.paintLayers[fc.selectedLayer].onSelected();
        }
        fc.paintLayers.forEach((layer: Paint, index: number) => {
            if (mode == "select") {
                layer._rendering.on("click", () => {
                    fc.selectLayer(index);
                })
            }
            layer._rendering.on("refreshtree", () => {
                fc.setPaintLayers([...fc.paintLayers]);
            })
        })
        deleteAllChildren(svg.current);
        // Add a grid
        svgEl.defs().svg('<pattern id="smallGrid" width="5" height="5" patternUnits="userSpaceOnUse"><path d="M 5 0 L 0 0 0 5" fill="none" stroke="gray" stroke-width="0.5"/></pattern>')
        svgEl.defs().svg('<pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse"><rect width="50" height="50" fill="url(#smallGrid)"/><path d="M 50 0 L 0 0 0 50" fill="none" stroke="gray" stroke-width="1"/></pattern>')
        svgEl.rect(1000, 1000).fill('url(#grid)').back()
        svgEl.width(1000);
        svgEl.height(1000).viewbox('0 0 1000 1000')
        if (fc.viewbox!.current! != null) {
            svgEl.viewbox(fc.viewbox!.current!);
        }
        svgEl.panZoom({
            zoomFactor: 0.5,
            zoomMin: 0.5,
            zoomMax: 50,
            panning: mode == "pan",
        });
        svgEl.on("zoom", (evt: any) => {
            svgEl!.zoom(evt.detail.level, evt.detail.focus);
            let vb = svgEl!.viewbox();
            fc.viewbox!.current! = svgEl!.viewbox()
        })
        if (mode == "pan") {
            var dx = 0; var dy = 0;
            svgEl.on("panEnd", (evt: any) => {
                fc.viewbox!.current! = svgEl!.viewbox()
                evt.preventDefault();
            });
        }
        svgEl.addTo(svg.current);
    }
    return (
        <>
        <Toolbar variant="dense" style={{backgroundColor }}>
            <ToggleButtonGroup value={mode as string} exclusive onChange={changeMode}>
                <ToggleButton value="select" color="primary">
                    <AdsClick />
                </ToggleButton>
                <ToggleButton value="pan" color="primary">
                    <PanTool />
                </ToggleButton>
            </ToggleButtonGroup>
            
        </Toolbar>
        <div className="svgwrapper" style={{backgroundColor }}>
            <div ref={svg} className="svgbox" onClick={() => fc.selectLayer(null)} />
        </div>
        </>
    );

}