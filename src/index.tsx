import * as React from 'react';
// import * as ReactDOM from 'react-dom/client';
import ReactDOM from 'react-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import App from './App';
import theme from './theme';
import hbjs from "./hbjs";

const rootElement = document.getElementById('root');
// const root = ReactDOM.createRoot(rootElement!);

declare let window: any;

fetch(`${process.env.PUBLIC_URL}/harfbuzz.wasm`)
  .then((response) => response.arrayBuffer())
  .then((bytes) => WebAssembly.instantiate(bytes))
  .then((results) => {
    // @ts-ignore
    const hb = hbjs(results.instance); // Dirty but works
    window.harfbuzz = results.instance;
    window.hbjs = hb;


    ReactDOM.render(
      <ThemeProvider theme={theme}>
        {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
        <CssBaseline />
        <App />
      </ThemeProvider>,
      rootElement
    );
  });
