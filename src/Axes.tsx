import { Axis, PainterFont } from './font/Font';
import * as React from 'react';
import Typography from '@mui/material/Typography';
import Slider, { SliderProps } from '@mui/material/Slider';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { styled } from '@mui/material/styles';
import { VariableThing } from './font/VariableScalar';


interface AxesProps {
    font: PainterFont | null,
    selectedVariableThing: VariableThing<any> | null,
    refresh: () => void
}

interface AxisSliderProps {
    font: PainterFont | null,
    axis: Axis,
    selectedVariableThing: VariableThing<any> | null,
    refresh: () => void
}

function AxisSlider(props: AxisSliderProps & SliderProps) {
    let { font, axis, selectedVariableThing, refresh, ...sliderProps } = props;

    let range = Math.abs(axis.max - axis.min);
    let snap = 0.02
    const [value, setValue] = React.useState(axis.default);
    let marks = [
        { value: axis.min },
        { value: axis.default },
        { value: axis.max },
    ]
    if (selectedVariableThing) {
        for (var loc of selectedVariableThing.locations(axis)) {
            marks.push({ value: loc })
        }

    }
    return <Slider
        value={value}
        min={axis.min}
        max={axis.max}
        marks={marks}
        onChange={(event, newValue) => {
            let v = newValue as number;
            for (var mark of marks) {
                if (Math.abs(v - mark.value) < range * snap) {
                    v = mark.value
                }
            }
            setValue(v)
            font!.variations[axis.tag] = v as number;
            font!.setVariations();
            refresh();
        }}
        aria-labelledby="continuous-slider"
        {...sliderProps}
        />
}

const StyledAxisSlider = styled(AxisSlider)(({ theme }) => ({
    '& .MuiSlider-mark': {
        backgroundColor: '#bfbfbf',
        height: 10,
        width: 4,
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
    let axes: Record<string, Axis> | undefined = props.font?.axes;
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
                                        <StyledAxisSlider axis={axis} {...props} />
                                    </TableCell>
                                    <TableCell>{props.font?.variations[name]}</TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </AccordionDetails>
        </Accordion>
    )
}