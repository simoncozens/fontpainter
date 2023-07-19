import { Paper, Typography } from '@mui/material';
import { PainterFont } from './Font';
import { Box } from '@mui/system';
import { DataGrid, GridRowsProp, GridColDef, GridValueFormatterParams } from '@mui/x-data-grid';
import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import * as React from 'react';
import { FontContext, FontContextType } from "./App";


export function GlyphGrid() {
    const fc: FontContextType = React.useContext(FontContext);
    const columns: GridColDef[] = [
        { field: 'id', headerName: 'GID', width: 10 },
        { field: 'name', headerName: 'Name', flex: 1 },
        {
            field: 'unicode', headerName: 'Unicode', width: 100, valueFormatter: (params: GridValueFormatterParams<number>) => {
                if (params.value == null) {
                    return '';
                }
                return `U+${params.value.toString(16).padStart(4, '0')}`
            }
        },
    ];
    var rows: GridRowsProp = [];
    if (fc.font) {
        rows = fc.font.glyphInfos() as unknown as GridRowsProp[];
    }
    return (
        <Accordion sx={{ width: '100%' }} disabled={!fc.font}>
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
            >
                <Typography variant="h6">Glyphs</Typography>
            </AccordionSummary>
            <AccordionDetails>
            <DataGrid
                rows={rows}
                columns={columns}
                hideFooterSelectedRowCount={true}
                style={{height: 300 }}
                onRowClick={(params, event, details) => {
                    fc.selectGid(params.row.id);
                }}
            />
            </AccordionDetails>
        </Accordion>
    )
}