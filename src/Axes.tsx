import { PainterFont, Axis } from './Font';
import { Paper, Typography } from '@mui/material';
import { Box } from '@mui/system';
import * as React from 'react';
import { Slider, Table, TableBody, TableCell, TableHead, TableRow, Accordion, AccordionDetails, AccordionSummary } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';


interface AxesProps {
    font: PainterFont | null
    refresh: () => void
}


export function Axes(props: AxesProps) {
    let axes: Record<string, Axis> | undefined = props.font?.axes;
    if (!axes || Object.keys(axes).length == 0) {
        return null;
    }
    console.log(axes);
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
                        {axes && Object.keys(axes).map((name) => (
                            <TableRow key={name}>
                                <TableCell>{name}</TableCell>
                                <TableCell>
                                    <Slider
                                        defaultValue={axes![name].default}
                                        min={axes![name].min}
                                        max={axes![name].max}
                                        onChange={(event, newValue) => {
                                            props.font!.variations[name] = newValue as number;
                                            props.font?.setVariations();
                                            props.refresh();
                                        }}
                                        aria-labelledby="continuous-slider"
                                    />
                                </TableCell>
                                <TableCell>{props.font?.variations[name]}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </AccordionDetails>
        </Accordion>
    )
}