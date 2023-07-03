import * as React from 'react';
import { useState, useContext, createContext, Component } from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import ProTip from './ProTip';
import Grid from '@mui/material/Grid';
import { PainterFont } from './Font';
import { Paint } from './Paints';
import { GlyphGrid } from './GlyphGrid';
import TopMenu from './TopMenu';
import LayerTree from './LayerTree';
import EditScreen from './EditScreen';

function Copyright() {
  return (
    <Typography variant="body2" color="text.secondary" align="center">
      {'Copyright © '}
      <Link color="inherit" href="https://mui.com/">
        Your Website
      </Link>{' '}
      {new Date().getFullYear()}.
    </Typography>
  );
}

export type FontContextType = {
  font: PainterFont | null;
  setFont: React.Dispatch<React.SetStateAction<PainterFont | null>>;
  selectedGid: number | null;
  selectGid: React.Dispatch<React.SetStateAction<number | null>>;
  paintLayers: Paint[] | null,
  setPaintLayers: React.Dispatch<React.SetStateAction<Paint[]>>;
};

export const FontContext = createContext<FontContextType>({
  font: null,
  setFont: (f) => { },
  selectedGid: null,
  selectGid: (f) => { },
  paintLayers: null,
  setPaintLayers: (f) => { }
});


export default function App() {

  const [font, setFont] = useState<PainterFont | null>(null);
  const [selectedGid, selectGid] = useState<number | null>(null);
  const [selectedLayer, selectLayer] = useState<number | null>(null);
  const [paintLayers, setPaintLayers] = useState<Paint[]>([]);
  function doSelectGid(gid: React.SetStateAction<number | null>) {
    if (font && gid) {
      setPaintLayers(font.getPaintLayers(gid as number));
      selectLayer(null);
      selectGid(gid);
    }
  }

  return (
    <FontContext.Provider value={{ font, setFont, selectedGid, selectGid, paintLayers, setPaintLayers }}>
      <Box sx={{ flexGrow: 1 }}>
        <TopMenu />

        <Grid container spacing={2}>
          <Grid item xs={4}>
            <GlyphGrid font={font} selectGid={doSelectGid} />
            <LayerTree font={font} selectLayer={selectLayer} selectedLayer={selectedLayer} paintLayers={paintLayers} setPaintLayers={setPaintLayers} />
          </Grid>
          <Grid item xs={8}>
            <EditScreen font={font} selectLayer={selectLayer} selectedLayer={selectedLayer} paintLayers={paintLayers} setPaintLayers={setPaintLayers} />
          </Grid>
        </Grid>
      </Box>
    </FontContext.Provider>
  );
}
