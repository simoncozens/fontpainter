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

export type FontContextType = {
  font: PainterFont | null;
  setFont: React.Dispatch<React.SetStateAction<PainterFont | null>>;
  selectedGid: number | null;
  selectGid: React.Dispatch<React.SetStateAction<number | null>>;
  paintLayers: Paint[] | null,
  setPaintLayers: React.Dispatch<React.SetStateAction<Paint[]>>;
  clipboard: Paint[] | null,
  setClipboard: React.Dispatch<React.SetStateAction<Paint[] | null>>;
};

export const FontContext = createContext<FontContextType>({
  font: null,
  setFont: (f) => { },
  selectedGid: null,
  selectGid: (f) => { },
  paintLayers: null,
  setPaintLayers: (f) => { },
  clipboard: null,
  setClipboard: (f) => { }
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

      <FontContext.Provider value={{ font, setFont, selectedGid, selectGid, paintLayers, setPaintLayers, clipboard, setClipboard }}>
      <Box sx={{ flexGrow: 1 }}>
        <TopMenu />

        <Grid container spacing={2}>
          <Grid item xs={4}>
              <Axes font={font} refresh={() => setPaintLayers([...paintLayers])} />
              <GlyphGrid font={font} selectGid={doSelectGid} />
              <LayerTree font={font} clipboard={clipboard} setClipboard={setClipboard} selectedGid={selectedGid} selectLayer={selectLayer} selectedLayer={selectedLayer} paintLayers={paintLayers} setPaintLayers={wrappedSetPaintLayers} />
              <Developer font={font} clipboard={clipboard} selectedGid={selectedGid} selectedLayer={selectedLayer} paintLayers={paintLayers} />
          </Grid>
          <Grid item xs={8}>
              <EditScreen font={font} selectedGid={selectedGid} selectedLayer={selectedLayer} selectLayer={selectLayer} paintLayers={paintLayers} setPaintLayers={setPaintLayers} />
          </Grid>
        </Grid>
      </Box>
    </FontContext.Provider>
    </ThemeProvider>
  );
}
