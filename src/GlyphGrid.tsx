import { PainterFont } from './Font';
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
        <div style={{ height: 300, width: '100%' }}>
            <DataGrid
                rows={rows}
                columns={columns}
                hideFooterSelectedRowCount={true}
                onRowClick={(params, event, details) => {
                    props.selectGid(params.row.id);
                }}
            />
        </div>
    )
}