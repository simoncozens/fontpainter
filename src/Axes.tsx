import { PainterFont, Axis } from './Font';
import { Paper, Typography } from '@mui/material';
import { Box } from '@mui/system';
import * as React from 'react';
import { Slider, Table, TableBody, TableCell, TableHead, TableRow, Accordion, AccordionDetails, AccordionSummary } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { styled } from '@mui/material/styles';
import { FontContext, FontContextType } from "./App";


interface AxesProps {
    refresh: () => void
}

interface AxisSliderProps {
    axis: Axis
    refresh: () => void
}

function AxisSlider(props: AxisSliderProps) {
    const fc: FontContextType = React.useContext(FontContext);
    let range = Math.abs(props.axis.max - props.axis.min);
    let snap = 0.02
    const [value, setValue] = React.useState(props.axis.default);
    let marks = [
        { value: props.axis.min },
        { value: props.axis.default },
        { value: props.axis.max },
    ]
    if (fc.selectedVariableThing) {
        for (var loc of fc.selectedVariableThing.locations(props.axis)) {
            marks.push({ value: loc })
        }

    }
    return <Slider
        value={value}
        min={props.axis.min}
        max={props.axis.max}
        marks={marks}
        onChange={(event, newValue) => {
            let v = newValue as number;
            for (var mark of marks) {
                if (Math.abs(v - mark.value) < range * snap) {
                    v = mark.value
                }
            }
            setValue(v)
            fc.font!.variations[props.axis.tag] = v as number;
            fc.font?.setVariations();
            props.refresh();
        }}
        aria-labelledby="continuous-slider" />
}

const StyledAxisSlider = styled(AxisSlider)(({ theme }) => ({
    '& .MuiSlider-mark': {
        backgroundColor: '#bfbfbf',
        height: 8,
        width: 1,
        '&.MuiSlider-markActive': {
            opacity: 1,
            backgroundColor: 'currentColor',
        },
    },
    '& .MuiSlider-track': {
        border: 'none',
    },
}));


export function Axes(props: AxesProps) {
    const fc: FontContextType = React.useContext(FontContext);
    let axes: Record<string, Axis> | undefined = fc.font?.axes;
    if (!axes || Object.keys(axes).length == 0) {
        return null;
    }
    return (
        <Accordion sx={{ width: '100%' }}>
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
            >
                <Typography variant="h6">Axes</Typography>
            </AccordionSummary>
            <AccordionDetails>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ width: 4 }}>Name</TableCell>
                            <TableCell sx={{ width: '100%' }}></TableCell>
                            <TableCell>Value</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {axes && Object.keys(axes).map((name) => {
                            let axis = axes![name];
                            return (
                                <TableRow key={name}>
                                    <TableCell>{name}</TableCell>
                                    <TableCell>
                                        <StyledAxisSlider axis={axis} refresh={props.refresh} />
                                    </TableCell>
                                    <TableCell>{fc.font?.variations[name]}</TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </AccordionDetails>
        </Accordion>
    )
}