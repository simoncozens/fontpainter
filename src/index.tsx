import * as React from 'react';
// import * as ReactDOM from 'react-dom/client';
import ReactDOM from 'react-dom';
import App from './App';
import hbjs from "./hbjs";
// @ts-ignore
import BZip2 from "bzip2-wasm";

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
    window.bzip2 = new BZip2();
    window.bzip2.init()
   }).then(() => {
    ReactDOM.render(
        <App />,
      rootElement
    );
  });
