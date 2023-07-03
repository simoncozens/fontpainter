import { Paper, Typography } from '@mui/material';
import { PainterFont } from './Font';
import { Box } from '@mui/system';
import { DataGrid, GridRowsProp, GridColDef, GridValueFormatterParams } from '@mui/x-data-grid';
import * as React from 'react';

interface GlyphGridProps {
    font: PainterFont | null
    selectGid: React.Dispatch<React.SetStateAction<number | null>>
}


export function GlyphGrid(props: GlyphGridProps) {
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
        <Paper elevation={2} sx={{ width: '100%', p: 0.5, m: 1 }}>
            <Typography variant="h6"  sx={{ p: 1}}>Glyphs</Typography>
            <DataGrid
                rows={rows}
                columns={columns}
                hideFooterSelectedRowCount={true}
                style={{height: 300 }}
                onRowClick={(params, event, details) => {
                    props.selectGid(params.row.id);
                }}
            />
        </Paper>
    )
}