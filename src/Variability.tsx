import Typography from '@mui/material/Typography';
import { VariableScalar } from "./font/VariableScalar";
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import * as React from 'react';
import { VariableMatrix } from './font/VariableMatrix';

interface VariabilityProps {
    variation: VariableMatrix | VariableScalar | null
}

export function Variability(props: VariabilityProps) {
    const columns: GridColDef[] = [
        { field: 'id', headerName: 'Location', flex: 1 },
        { field: 'value', headerName: 'Value', flex: 1 },
    ];
    var rows = [];
    if (props.variation) {
        //@ts-ignore
        for (let [loc, val] of Array.from(props.variation.values.entries())) {
            rows.push({
                id: loc,
                //@ts-ignore
                value: props.variation.label_value(val)
            })

        }
    }
    return (
        <Accordion sx={{ width: '100%' }} disabled={!props.variation} defaultExpanded={true}>
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
            >
                <Typography variant="h6">Variation</Typography>
            </AccordionSummary>
            <AccordionDetails>
                <DataGrid
                    rows={rows}
                    columns={columns}
                    hideFooterSelectedRowCount={true}
                    style={{ height: 300 }}
                />
            </AccordionDetails>
        </Accordion>
    )
}