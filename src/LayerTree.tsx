import * as React from 'react';
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Icon from '@mui/material/Icon';
import TreeView from '@mui/lab/TreeView';
import TreeItem, { TreeItemProps, treeItemClasses } from '@mui/lab/TreeItem';
import Typography from '@mui/material/Typography';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import DeleteIcon from '@mui/icons-material/Delete';
import LockIcon from '@mui/icons-material/Lock';
import { Paint, SolidFill, SolidBlackFill } from './Paints';
import { PainterFont, GlyphInfo } from './Font';
import { Color, ColorButton, ColorBox, createColor } from 'mui-color';
import { Autocomplete, ButtonBase, IconButton, Paper, Popover, TextField } from '@mui/material';
import { Matrix } from '@svgdotjs/svg.js';
import { createFilterOptions } from '@mui/material/Autocomplete';

const filterOptions = createFilterOptions({
  matchFrom: 'start',
  stringify: (option: GlyphInfo) => option.name,
});

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
    redrawPaints: () => void;
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
        label,
        colorForDarkMode,
        bgColorForDarkMode,
        redrawPaints,
        ...other
    } = props;

    const styleProps = {
        '--tree-view-color': theme.palette.mode !== 'dark' ? color : colorForDarkMode,
        '--tree-view-bg-color':
            theme.palette.mode !== 'dark' ? bgColor : bgColorForDarkMode,
    };
    const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);
    const [renaming, setRenaming] = React.useState<boolean>(false);
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const colorBoxOpen = Boolean(anchorEl);
    const [paintColor, setPaintColor] = React.useState(createColor((props.paint.fill as SolidFill).color));

    const handleChange = (newValue: Color) => {
        (props.paint.fill as SolidFill).color = "#" + newValue.hex;
        setPaintColor(newValue);
        redrawPaints();
    }

    let [_, basepalette] = props.paint._font.saveColr();
    let palette: Record<string, string> = {};
    for (var colorString of basepalette.colors||[]) {
        palette[colorString] = colorString;
    }

    let toggleLocked = () => {
        props.paint.locked = !props.paint.locked;
        redrawPaints();
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
                        pr: 0,
                    }}
                >
                    <Box sx={{ paddingRight: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'inherit' }}>
                            {label}
                        </Typography>
                    </Box>
                    <Box sx={{ paddingRight: 2 }}>
                        <IconButton onClick={toggleLocked}>
                            {props.paint.locked ? <LockIcon /> : <Icon />}
                        </IconButton>
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
                            <ColorBox
                                defaultValue={paintColor}
                                onChange={handleChange}
                                palette={palette}
                            />
                        </Popover>
                    </Box>
                    { renaming && props.font ?
                        <Autocomplete
                            options={props.font!.glyphInfos()}
                            getOptionLabel={(option) => option.name}
                            sx={{ fontWeight: 'inherit', flexGrow: 1 }}
                            value={props.paint.gid ? props.font!.glyphInfos()[props.paint.gid] : null}
                            renderInput={(params) => <TextField {...params} />}
                            filterOptions={filterOptions}
                            onChange={(evt, value) => {
                                if (value) {
                                    props.paint.gid = value.id;
                                    setRenaming(false);
                                    redrawPaints();
                                }
                            }}
                        />
                        :
                        <Typography variant="body2" sx={{ fontWeight: 'inherit', flexGrow: 1 }} onDoubleClick={
                            () => {
                                setRenaming(true);
                            }
                        }>
                            {props.paint.label}
                        </Typography>
                    }
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
        <Paper elevation={2} sx={{ width: '100%', p: 0.5, m:1 }}>
            <Typography variant="h6" sx={{ p: 1 }}>Layers            
            </Typography>
            <TreeView
                defaultCollapseIcon={<ArrowDropDownIcon />}
                defaultExpandIcon={<ArrowRightIcon />}
                defaultEndIcon={<div style={{ width: 24 }} />}
                onNodeSelect={nodeSelect}
                selected={props.selectedLayer?.toString() || ""}
                sx={{ flexGrow: 1, overflowY: 'auto' }}
            >
                {props.paintLayers.map((p: Paint, i: number) => <StyledTreeItem
                    nodeId={i.toString()}
                    label={(props.paintLayers.length - i).toString()}
                    paint={p} font={props.font} redrawPaints={() => {
                    props.setPaintLayers(([] as Paint[]).concat(props.paintLayers));
                }
                } />)}
            </TreeView>
            <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        backgroundColor: '#aaaaaa11',
                    }}
                >
                    <Box>
                    <IconButton
                        disabled={props.selectedLayer === null || props.paintLayers[props.selectedLayer]?.locked}
                        onClick={ () => {
                            if (props.selectedLayer !== null) {
                                props.paintLayers.splice(props.selectedLayer, 1);
                                props.setPaintLayers(([] as Paint[]).concat(props.paintLayers));
                                props.selectLayer(null);
                            }
                        }}
                    >
                        <DeleteIcon />
                    </IconButton>
                    </Box>
                    <Box>
                    <IconButton disabled={!props.font}  onClick={
                            () => {
                                props.paintLayers.splice(0, 0, new Paint(
                                        null,
                                        SolidBlackFill,
                                        new Matrix(),
                                    props.font!,
                                    props.selectedGid!
                                ));
                                props.setPaintLayers(([] as Paint[]).concat(props.paintLayers));
                                props.selectLayer(0);
                            }
                        } >
                        <NoteAddIcon/>
                    </IconButton>
                    </Box>
                </Box>

        </Paper>
    );
}

/*

            {props.paintLayers.map((p: Paint, index: number) => {
                <StyledTreeItem nodeId={index.toString()} labelText={props.font?.glyphInfos()[p.gid].name} labelIcon={Label} />
            })
            }
            */
