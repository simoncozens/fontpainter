import * as React from 'react';
import { useState } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { PainterFont } from './font/Font';
import { Paint } from './color/Paints';
import { GlyphGrid } from './GlyphGrid';
import { Developer } from "./Developer";
import TopMenu from './TopMenu';
import LayerTree from './LayerTree/LayerTree';
import EditScreen from './EditScreen';
import { Axes } from './Axes';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import CssBaseline from '@mui/material/CssBaseline';
import { VariableThing } from './font/VariableScalar';
import { Variability } from './Variability';
import { useUndoableState } from './UndoHandler';

export default function App() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: prefersDarkMode ? 'dark' : 'light',
        },
      }),
    [prefersDarkMode],
  );



  const [font, setFont] = useState<PainterFont | null>(null);
  const [selectedGid, selectGid] = useState<number | null>(null);
  const [selectedLayer, selectLayer] = useState<number | null>(null);
  const [selectedVariableThing, selectVariableThing] = useState<VariableThing<any> | null>(null);
  const [paintLayers, setPaintLayers, { undo, redo, canUndo, canRedo, clearHistory, beginUndo }] = useUndoableState([]);
  const [clipboard, setClipboard] = useState<Paint[] | null>(null);
  function doSelectGid(gid: React.SetStateAction<number | null>) {
    if (font && gid) {
      setPaintLayers(font.getPaintLayers(gid as number));
      selectLayer(null);
      clearHistory();
      selectGid(gid);
    }
  }
  let wrappedSetPaintLayers = (layers: Paint[], doSnapshot: boolean) => {
    if (doSnapshot) {
      beginUndo();
    }
    setPaintLayers(layers);
    if (font && selectedGid) {
      font.paints.set(selectedGid, layers);
    }
  }

  let viewbox = React.useRef(null);

  return (
    <ThemeProvider theme={theme}>
      {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
      <CssBaseline />

      <Box sx={{ flexGrow: 1 }}>
        <TopMenu font={font} setFont={setFont} undo={undo} canUndo={canUndo} redo={redo} canRedo={canRedo} />

        <Grid container spacing={2}>
          <Grid item xs={4}>
            <GlyphGrid selectGid={doSelectGid} font={font} />
            <Axes
              refresh={() => setPaintLayers([...paintLayers])}
              font={font}
              selectedVariableThing={selectedVariableThing}
            />
            <LayerTree
              font={font}
              paintLayers={paintLayers}
              setPaintLayers={setPaintLayers}
              beginUndo={beginUndo}
              selectedLayer={selectedLayer}
              selectLayer={selectLayer}
              clipboard={clipboard}
              setClipboard={setClipboard}
              selectedGid={selectedGid}
              selectVariableThing={selectVariableThing}

            />

            {selectedVariableThing && <Variability variation={selectedVariableThing} />}
            <Developer paintLayers={paintLayers} font={font} selectedLayer={selectedLayer} />
          </Grid>
          <Grid item xs={8}>
            <EditScreen font={font}
              paintLayers={paintLayers}
              setPaintLayers={setPaintLayers}
              beginUndo={beginUndo}
              selectedGid={selectedGid}
              viewbox={viewbox}
              selectLayer={selectLayer}
              selectedLayer={selectedLayer} />
          </Grid>
        </Grid>
      </Box>
    </ThemeProvider>
  );
}
