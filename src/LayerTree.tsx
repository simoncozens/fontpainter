import * as React from 'react';
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Icon from '@mui/material/Icon';
import TreeView from '@mui/lab/TreeView';
import TreeItem, { TreeItemProps, treeItemClasses } from '@mui/lab/TreeItem';
import Typography from '@mui/material/Typography';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import LockIcon from '@mui/icons-material/Lock';
import { Paint, SolidFill } from './Paints';
import { PainterFont } from './Font';
import { Color, ColorButton, ColorBox, createColor } from 'mui-color';
import { ButtonBase, Popover } from '@mui/material';

declare module 'react' {
    interface CSSProperties {
        '--tree-view-color'?: string;
        '--tree-view-bg-color'?: string;
    }
}

type StyledTreeItemProps = TreeItemProps & {
    bgColor?: string;
    bgColorForDarkMode?: string;
    color?: string;
    colorForDarkMode?: string;
    paint: Paint;
    font: PainterFont | null;
    colorSetter: () => void;
};

const StyledTreeItemRoot = styled(TreeItem)(({ theme }) => ({
    color: theme.palette.text.secondary,
    [`& .${treeItemClasses.content}`]: {
        color: theme.palette.text.secondary,
        borderTopRightRadius: theme.spacing(2),
        borderBottomRightRadius: theme.spacing(2),
        paddingRight: theme.spacing(1),
        fontWeight: theme.typography.fontWeightMedium,
        '&.Mui-expanded': {
            fontWeight: theme.typography.fontWeightRegular,
        },
        '&:hover': {
            backgroundColor: theme.palette.action.hover,
        },
        '&.Mui-focused, &.Mui-selected, &.Mui-selected.Mui-focused': {
            backgroundColor: `var(--tree-view-bg-color, ${theme.palette.action.selected})`,
            color: 'var(--tree-view-color)',
        },
        [`& .${treeItemClasses.label}`]: {
            fontWeight: 'inherit',
            color: 'inherit',
        },
    },
    [`& .${treeItemClasses.group}`]: {
        marginLeft: 0,
        [`& .${treeItemClasses.content}`]: {
            paddingLeft: theme.spacing(2),
        },
    },
}));

function StyledTreeItem(props: StyledTreeItemProps) {
    const theme = useTheme();
    const {
        bgColor,
        color,
        paint: Paint,
        font: PainterFont,
        nodeId,
        colorForDarkMode,
        bgColorForDarkMode,
        colorSetter,
        ...other
    } = props;

    const styleProps = {
        '--tree-view-color': theme.palette.mode !== 'dark' ? color : colorForDarkMode,
        '--tree-view-bg-color':
            theme.palette.mode !== 'dark' ? bgColor : bgColorForDarkMode,
    };
    const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const colorBoxOpen = Boolean(anchorEl);
    const [paintColor, setPaintColor] = React.useState(createColor((props.paint.fill as SolidFill).color));

    const handleChange = (newValue: Color) => {
        (props.paint.fill as SolidFill).color = "#" + newValue.hex;
        setPaintColor(newValue);
        colorSetter();
    }

    return (
        <StyledTreeItemRoot
            nodeId={nodeId}
            key={nodeId}
            label={
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        p: 0.5,
                        pr: 0,
                    }}
                >
                    <Box sx={{ paddingRight: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'inherit' }}>
                            {nodeId}
                        </Typography>
                    </Box>
                    <Box sx={{ paddingRight: 2 }}>
                        <Icon>
                            {props.paint.locked && <LockIcon />}
                        </Icon>
                    </Box>
                    <Box sx={{ paddingRight: 2 }}>
                        <ButtonBase onClick={handleClick}>
                            <ColorButton color={paintColor} />
                        </ButtonBase>
                        <Popover
                            open={colorBoxOpen}
                            anchorEl={anchorEl}
                            onClose={() => setAnchorEl(null)}
                        >
                            <ColorBox defaultValue={paintColor} onChange={handleChange} />
                        </Popover>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 'inherit', flexGrow: 1 }}>
                        {props.paint.label}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 'inherit' }}>
                        {props.paint.matrixLabel()}
                    </Typography>
                </Box>
            }
            style={styleProps}
            {...other}
        />
    );
}

interface LayerTreeProps {
    font: PainterFont | null,
    selectLayer: React.Dispatch<React.SetStateAction<number | null>>,
    selectedLayer: number | null,
    paintLayers: Paint[],
    setPaintLayers: React.Dispatch<React.SetStateAction<Paint[]>>;
}

export default function LayerTree(props: LayerTreeProps) {
    function nodeSelect(event: React.SyntheticEvent, nodeIds: Array<string> | string) {
        let selectedIndex = parseInt(nodeIds as string, 10);
        for (let i = 0; i < props.paintLayers.length; i++) {
            if (i == selectedIndex) {
                props.paintLayers[i].onSelected()
            } else {
                props.paintLayers[i].onDeselected()
            }
        }
        props.selectLayer(selectedIndex)
    }
    return (
        <TreeView
            defaultCollapseIcon={<ArrowDropDownIcon />}
            defaultExpandIcon={<ArrowRightIcon />}
            defaultEndIcon={<div style={{ width: 24 }} />}
            onNodeSelect={nodeSelect}
            selected={props.selectedLayer?.toString() || ""}
            sx={{ height: 264, flexGrow: 1, overflowY: 'auto' }}
        >
            {props.paintLayers.map((p: Paint, i: number) => <StyledTreeItem nodeId={i.toString()} paint={p} font={props.font} colorSetter={() => {
                props.setPaintLayers(([] as Paint[]).concat(props.paintLayers));
            }
            } />)}
        </TreeView>
    );
}

/*

            {props.paintLayers.map((p: Paint, index: number) => {
                <StyledTreeItem nodeId={index.toString()} labelText={props.font?.glyphInfos()[p.gid].name} labelIcon={Label} />
            })
            }
            */
