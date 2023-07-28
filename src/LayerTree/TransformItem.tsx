import * as React from 'react';
import Box from '@mui/material/Box';
import { TreeItemProps } from '@mui/lab/TreeItem';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import { Paint } from '../color/Paints';
import MultipleStop from '@mui/icons-material/MultipleStop';
import { StyledTreeItemRoot } from './LayerTree';
import { VariableThing } from '../font/VariableScalar';

type TransformItemProps = TreeItemProps & {
    nodeId: String;
    paint: Paint;
    redrawPaints: () => void;
    selectVariableThing: React.Dispatch<React.SetStateAction<VariableThing<any> | null>>
};

export function TransformItem(props: TransformItemProps) {
    let handleClick = () => {
        props.selectVariableThing(props.paint.matrix);
    };

    return <StyledTreeItemRoot nodeId={props.nodeId}
        label={<Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                pr: 0,
            }}
        >
            <Box sx={{ paddingRight: 2, flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'inherit' }}>
                    Transformation
                </Typography>
            </Box>
            <Box sx={{ paddingRight: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 'inherit' }}>
                    {props.paint.matrix.label_value(props.paint.current_matrix)}
                </Typography>
            </Box>
            <Box>
                <IconButton onClick={handleClick}>
                    <Tooltip title="Edit variable">
                        <MultipleStop />
                    </Tooltip>
                </IconButton>
            </Box>
        </Box>} />;
}
