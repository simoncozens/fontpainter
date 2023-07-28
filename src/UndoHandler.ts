import { useState } from 'react';
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
        }
    ] {
    let [state, _setState] = useState<UndoableState>({
        past: [],
        present: initialState,
        future: []
    });

    let setState = (newState: Paint[]) => {
        // Deflate the current state and place onto undo stack
        let deflated = deflate(state.present);
        let newPast = state.past;
        if (deflated !== state.past[state.past.length - 1]) {
            newPast = [...state.past, deflated];
            if (newPast.length > 100) {
                newPast.shift();
            }
        }
        _setState({
            past: newPast,
            present: newState,
            future: [...state.future]
        })
        console.log("New state:", state);
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
            future: []
        })
    }

    const canUndo = () => state.past.length > 0;
    const canRedo = () => state.future.length > 0;

    return [
        state.present,
        setState,
        {
            undo, redo, canUndo, canRedo, clearHistory
        }
    ]

}