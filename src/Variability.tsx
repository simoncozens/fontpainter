import { Paper, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { VariableScalar, VariableThing } from "./VariableScalar";
import { DataGrid, GridRowsProp, GridColDef, GridValueFormatterParams } from '@mui/x-data-grid';
import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import * as React from 'react';
import { VariableMatrix } from './VariableMatrix';

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
        <Accordion sx={{ width: '100%' }} disabled={!props.variation}>
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