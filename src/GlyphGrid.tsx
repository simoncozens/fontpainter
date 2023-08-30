import Typography from '@mui/material/Typography';
import { DataGrid, GridRowsProp, GridColDef, GridValueFormatterParams } from '@mui/x-data-grid';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import * as React from 'react';
import { PainterFont } from './font/Font';

interface GlyphGridProps {
    font: PainterFont | null,
    selectGid: React.Dispatch<React.SetStateAction<number | null>>
}

export function GlyphGrid(props: GlyphGridProps) {
    const [open, setOpen] = React.useState<undefined|boolean>(undefined);
    if (props.font && open == undefined) {
        setOpen(true);
    }

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
    if (props.font) {
        rows = props.font.glyphInfos() as unknown as GridRowsProp[];
    }
    return (
        <Accordion sx={{ width: '100%' }} disabled={!props.font}
            expanded={open || false}
            onChange={() => setOpen(!open)}
            >
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
                    props.selectGid(params.row.id);
                }}
            />
            </AccordionDetails>
        </Accordion>
    )
}