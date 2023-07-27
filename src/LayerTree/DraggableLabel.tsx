import * as React from 'react';
import { useTheme } from '@mui/material/styles';

export function DraggableLabel(props: { onNodeReOrder?: (ev: React.DragEvent<HTMLDivElement>, isBeforeDestinationNode: boolean) => void; children: React.ReactNode; }) {
    const theme = useTheme();

    const handleDragOver = (
        ev: React.DragEvent<HTMLDivElement>,
        isBeforeDestinationNode: boolean
    ) => {
        ev.stopPropagation();

        ev.preventDefault();
        ev.currentTarget.style.height = "30px";
        ev.currentTarget.style.borderWidth = "2px";
    };

    const handleDragLeave = (ev: React.DragEvent<HTMLDivElement>) => {
        ev.stopPropagation();
        ev.currentTarget.style.height = "3px";
        ev.currentTarget.style.borderWidth = "0px";
    };

    const handleOrderChange = (
        ev: React.DragEvent<HTMLDivElement>,
        isBeforeDestinationNode: boolean
    ) => {
        ev.stopPropagation();
        ev.preventDefault();

        if (props.onNodeReOrder) props.onNodeReOrder(ev, isBeforeDestinationNode);

        ev.currentTarget.style.height = "3px";
        ev.currentTarget.style.borderWidth = "0px";
    };
    return (
        <>
            <div
                onDrop={(ev) => handleOrderChange(ev, true)}
                onDragOver={(ev) => handleDragOver(ev, true)}
                onDragLeave={handleDragLeave}
                draggable={false}
                style={{
                    height: "3px",
                    border: "dotted 0px "+theme.palette.divider,
                    backgroundColor: "transparent !important",
                }} />
            {props.children}
            <div
                onDrop={(ev) => handleOrderChange(ev, false)}
                onDragOver={(ev) => handleDragOver(ev, false)}
                onDragLeave={handleDragLeave}
                draggable={false}
                style={{
                    height: "3px",
                    border: "dotted 0px "+theme.palette.divider,
                    backgroundColor: "transparent !important",
                }} />
        </>
    );
}
