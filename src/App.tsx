import * as React from 'react';
import { useState, useContext, createContext, Component } from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import { PainterFont } from './Font';
import { Paint } from './Paints';
import { GlyphGrid } from './GlyphGrid';
import { Developer } from "./Developer";
import TopMenu from './TopMenu';
import LayerTree from './LayerTree';
import EditScreen from './EditScreen';
import { Axes } from './Axes';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import CssBaseline from '@mui/material/CssBaseline';
import { VariableThing } from './VariableScalar';
import { Variability } from './Variability';

export type FontContextType = {
  font: PainterFont | null;
  setFont: React.Dispatch<React.SetStateAction<PainterFont | null>>;
  selectedGid: number | null;
  selectGid: React.Dispatch<React.SetStateAction<number | null>>;
  paintLayers: Paint[],
  setPaintLayers: (layers: Paint[]) => void;
  clipboard: Paint[] | null,
  setClipboard: React.Dispatch<React.SetStateAction<Paint[] | null>>;
  selectedLayer: number | null,
  selectLayer: React.Dispatch<React.SetStateAction<number | null>>;
  selectedVariableThing: VariableThing<any> | null,
  selectVariableThing: React.Dispatch<React.SetStateAction<VariableThing<any> | null>>;
};

export const FontContext = createContext<FontContextType>({
  font: null,
  setFont: (f) => { },
  selectedGid: null,
  selectGid: (f) => { },
  paintLayers: [],
  setPaintLayers: (f) => { },
  clipboard: null,
  setClipboard: (f) => { },
  selectedLayer: null,
  selectLayer: (f) => { },
  selectedVariableThing: null,
  selectVariableThing: (f) => { }
});


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
  const [paintLayers, setPaintLayers] = useState<Paint[]>([]);
  const [clipboard, setClipboard] = useState<Paint[] | null>(null);
  function doSelectGid(gid: React.SetStateAction<number | null>) {
    if (font && gid) {
      setPaintLayers(font.getPaintLayers(gid as number));
      selectLayer(null);
      selectGid(gid);
    }
  }
  let wrappedSetPaintLayers = (layers: Paint[]) => {
    setPaintLayers(layers);
    if (font && selectedGid) {
      font.paints.set(selectedGid, layers);
    }
  }


  return (
    <ThemeProvider theme={theme}>
      {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
      <CssBaseline />

      <FontContext.Provider value={{ font, setFont, selectedGid, selectGid: doSelectGid, paintLayers, setPaintLayers: wrappedSetPaintLayers, clipboard, setClipboard, selectedLayer, selectLayer, selectVariableThing, selectedVariableThing }}>
        <Box sx={{ flexGrow: 1 }}>
          <TopMenu />

          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Axes refresh={() => setPaintLayers([...paintLayers])} />
              <GlyphGrid />
              <LayerTree />

              {selectedVariableThing && <Variability variation={selectedVariableThing} />}
              <Developer />
            </Grid>
            <Grid item xs={8}>
              <EditScreen />
            </Grid>
          </Grid>
        </Box>
      </FontContext.Provider>
    </ThemeProvider>
  );
}
