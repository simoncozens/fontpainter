import * as React from 'react';
import { PainterFont } from './font/Font';
import { Paint } from './color/Paints';
import * as SVG from "@svgdotjs/svg.js";
import useMediaQuery from '@mui/material/useMediaQuery';
import '@svgdotjs/svg.panzoom.js'
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

interface EditScreenProps {
    font: PainterFont | null,
    paintLayers: Paint[],
    setPaintLayers: (layers: Paint[]) => void,
    selectedGid: number | null,
    selectedLayer: number | null,
    viewbox: React.MutableRefObject<SVG.Box | null> | null,
    selectLayer: React.Dispatch<React.SetStateAction<number | null>>,
};

export default function EditScreen(props: EditScreenProps) {
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
    if (props.font && props.paintLayers.length > 0 && props.selectedGid != null) {
        svgEl = props.font.renderPaints(props.paintLayers, props.selectedGid);
        if (props.selectedLayer != null && mode == "select") {
            props.paintLayers[props.selectedLayer].onSelected();
        }
        props.paintLayers.forEach((layer: Paint, index: number) => {
            if (mode == "select") {
                layer._rendering.on("click", () => {
                    props.selectLayer(index);
                })
            }
            layer._rendering.on("refreshtree", () => {
                props.setPaintLayers([...props.paintLayers]);
            })
        })
        deleteAllChildren(svg.current);
        // Add a grid
        svgEl.defs().svg('<pattern id="smallGrid" width="5" height="5" patternUnits="userSpaceOnUse"><path d="M 5 0 L 0 0 0 5" fill="none" stroke="gray" stroke-width="0.5"/></pattern>')
        svgEl.defs().svg('<pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse"><rect width="50" height="50" fill="url(#smallGrid)"/><path d="M 50 0 L 0 0 0 50" fill="none" stroke="gray" stroke-width="1"/></pattern>')
        svgEl.rect(1000, 1000).fill('url(#grid)').back()
        svgEl.width(1000);
        svgEl.height(1000).viewbox('0 0 1000 1000')
        if (props.viewbox!.current! != null) {
            svgEl.viewbox(props.viewbox!.current!);
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
            props.viewbox!.current! = svgEl!.viewbox()
        })
        if (mode == "pan") {
            var dx = 0; var dy = 0;
            svgEl.on("panEnd", (evt: any) => {
                props.viewbox!.current! = svgEl!.viewbox()
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
                <div ref={svg} className="svgbox" onClick={() => props.selectLayer(null)} />
        </div>
        </>
    );

}