import { Paint } from "./color/Paints";
import { PainterFont } from './font/Font';

type SerializedState = string;

export function deflate(layers: Paint[]): SerializedState {
    return JSON.stringify(layers, (key, value) => {
        if (key.startsWith("_")) { return null }
        if (value && typeof value.deflate === "function") { return value.deflate() }
        return value
    })
}

export function inflate(state: SerializedState, font: PainterFont): Paint[] {
    return JSON.parse(state).map((p: any) => Paint.inflate(p, font))
}
