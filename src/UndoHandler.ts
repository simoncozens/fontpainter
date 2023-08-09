import { useEffect, useState } from 'react';
import { Paint } from "./color/Paints";
import { PainterFont } from './font/Font';

type SerializedState = string;
interface UndoableState {
    past: SerializedState[];
    present: Paint[];
    future: SerializedState[];
}

function deflate(layers: Paint[]): SerializedState {
    return JSON.stringify(layers, (key, value) => {
        if (key.startsWith("_")) { return null }
        if (value && typeof value.deflate === "function") { return value.deflate() }
        return value
    })
}

function inflate(state: SerializedState, font: PainterFont): Paint[] {
    return JSON.parse(state).map((p: any) => Paint.inflate(p, font))
}

export function useUndoableState(
    initialState: Paint[]
): [
        Paint[],
        (newState: Paint[]) => void,
        {
            undo: (font: PainterFont) => boolean,
            redo: (font: PainterFont) => boolean,
            canUndo: () => boolean,
            canRedo: () => boolean,
            clearHistory: () => void,
            beginUndo: () => void
        }
    ] {
    let [state, _setState] = useState<UndoableState>({
        past: [],
        present: initialState,
        future: [],
    });

    let deflateState = () => {
        return JSON.stringify({
            past: state.past,
            present: deflate(state.present),
            future: state.future,
        }, null, 4)
    }

    let beginUndo = () => {
        state.past.push(deflate(state.present));
    };

    let setState = (newState: Paint[]) => {
        _setState({
            past: [...state.past],
            present: newState,
            future: [...state.future],
        })
    };

    let undo = (font: PainterFont): boolean => {
        if (state.past.length === 0) {
            return false;
        }
        let newPresent = inflate(state.past[state.past.length - 1], font);
        let newFuture = [deflate(state.present), ...state.future];
        if (newFuture.length > 100) {
            newFuture.shift();
        }
        _setState({
            past: state.past.slice(0, state.past.length - 1),
            present: newPresent,
            future: newFuture,
        })
        return true;
    };

    let redo = (font: PainterFont): boolean => {
        if (state.future.length === 0) {
            return false;
        }
        let newPresent = inflate(state.future.shift()!, font);
        let newPast = [...state.past, deflate(state.present)];
        if (newPast.length > 100) {
            newPast.shift();
        }
        _setState({
            past: newPast,
            present: newPresent,
            future: state.future,
        })
        return true;
    };

    let clearHistory = () => {
        _setState({
            past: [],
            present: state.present,
            future: [],
        })
    }

    const canUndo = () => state.past.length > 0;
    const canRedo = () => state.future.length > 0;

    return [
        state.present,
        setState,
        {
            undo, redo, canUndo, canRedo, clearHistory, beginUndo
        }
    ]

}