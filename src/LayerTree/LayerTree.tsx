import * as React from 'react';
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Icon from '@mui/material/Icon';
import KeylessTreeView from '../mui-bits/TreeView';
import TreeItem, { TreeItemProps, treeItemClasses } from '@mui/lab/TreeItem';
import Typography from '@mui/material/Typography';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import DeleteIcon from '@mui/icons-material/Delete';
import LockIcon from '@mui/icons-material/Lock';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Tooltip from '@mui/material/Tooltip';
import Autocomplete from '@mui/material/Autocomplete';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import { Paint, BlendMode, SELF_GID } from '../color/Paints';
import { SolidBlackFill } from "../color/SolidFill";
import { GlyphInfo, PainterFont } from '../font/Font';
import { Color, ColorButton, ColorBox, createColor } from 'mui-color';
import { Matrix } from '@svgdotjs/svg.js';
import { createFilterOptions } from '@mui/material/Autocomplete';
import ContentCopy from '@mui/icons-material/ContentCopy';
import ContentPaste from '@mui/icons-material/ContentPaste';
import DragHandle from '@mui/icons-material/DragHandle';
import ContentPasteGoTwoTone from '@mui/icons-material/ContentPasteGoTwoTone';
import { FillItem } from './FillItem';
import { TransformItem } from './TransformItem';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { ConfirmPasteAllDialog } from './PasteAllDialog';
import { DraggableLabel } from './DraggableLabel';
import { VariableThing } from '../font/VariableScalar';

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
    paint: Paint;
    font: PainterFont | null,
    redrawPaints: () => void;
    onNodeReOrder: (ev: React.DragEvent<HTMLDivElement>, nodeId: string, isBeforeDestinationNode: boolean) => void;
    selectVariableThing: React.Dispatch<React.SetStateAction<VariableThing<any> | null>>
};

export const StyledTreeItemRoot = styled(TreeItem)(({ theme }) => ({
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
const TopTreeItemRoot = styled(StyledTreeItemRoot)(({ theme }) => ({
    "borderBottom": "1px solid " + theme.palette.divider,
}));


function TopTreeItem(props: StyledTreeItemProps) {
    const theme = useTheme();
    const {
        paint: Paint,
        nodeId,
        label,
        redrawPaints,
        ...other
    } = props;

    const [renaming, setRenaming] = React.useState<boolean>(false);

    let toggleLocked = () => {
        props.paint.locked = !props.paint.locked;
        redrawPaints();
    }

    let toggleVisible = () => {
        props.paint.visible = !props.paint.visible;
        redrawPaints();
    }

    return (
        <TopTreeItemRoot
            nodeId={nodeId}
            key={nodeId}
            draggable={true}
            onDragStart={props.onDragStart}
            label={
                <DraggableLabel onNodeReOrder={(ev, isBeforeDestinationNode) => {
                    props.onNodeReOrder(ev, nodeId, isBeforeDestinationNode)
                }
                }>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            pr: 0,
                        }}
                    >
                        <Box sx={{ paddingRight: 1 }}>
                            <Typography sx={{ fontWeight: 'inherit' }}>
                                {label}
                            </Typography>
                        </Box>
                        <Box>
                            <IconButton onClick={toggleLocked}>
                                <Tooltip title="Locked">
                                    {props.paint.locked ? <LockIcon /> : <Icon />}
                                </Tooltip>
                            </IconButton>
                        </Box>
                        <Box sx={{ paddingRight: 1 }}>
                            <IconButton onClick={toggleVisible}>
                                <Tooltip title="Visible">
                                    {props.paint.visible ? <VisibilityIcon /> : <Icon />}
                                </Tooltip>
                            </IconButton>
                        </Box>
                        <Box sx={{ paddingRight: 1 }}>
                            <Box
                                sx={{
                                    width: 24, height: 24,
                                    ...props.paint.fill.toCSS()
                                }}>
                            </Box>
                        </Box>
                        {renaming && props.font ?
                            <Autocomplete
                                options={[
                                    { id: SELF_GID, name: "<Self>", unicode: null },
                                    ...props.font!.glyphInfos()
                                ]}
                                getOptionLabel={(option) => option.name}
                                sx={{ fontWeight: 'inherit', flexGrow: 1 }}
                                value={props.paint.gid ? props.font!.glyphInfos()[props.paint.gid] : null}
                                renderInput={(params) => <TextField {...params} />}
                                filterOptions={filterOptions}
                                autoHighlight={true}
                                onChange={(evt, value) => {
                                    if (value) {
                                        props.paint.gid = value.id;
                                        setRenaming(false);
                                        redrawPaints();
                                    }
                                }}
                            />
                            :
                            <Typography sx={{ fontWeight: 'inherit', flexGrow: 1 }} onDoubleClick={
                                () => {
                                    setRenaming(true);
                                }
                            }>
                                {props.paint.label}
                            </Typography>
                        }
                        <Typography variant="caption" sx={{ fontWeight: 'inherit' }}>
                            {props.paint.matrix.label_value(props.paint.current_matrix)}
                        </Typography>
                        <Box sx={{ paddingRight: 1 }}>
                            <IconButton>
                                <DragHandle />
                            </IconButton>
                        </Box>
                    </Box>
                </DraggableLabel>
            }
            {...other}
        >
            <FillItem
                nodeId={nodeId.toString() + ".fill"}
                paint={props.paint}
                redrawPaints={props.redrawPaints}
                font={props.font}
                selectVariableThing={props.selectVariableThing}
            />
            <TransformItem
                nodeId={nodeId.toString() + ".transform"}
                paint={props.paint}
                redrawPaints={props.redrawPaints}
                selectVariableThing={props.selectVariableThing}
            />
        </TopTreeItemRoot>
    );
}

interface LayerTreeProps {
    paintLayers: Paint[] | null,
    selectedLayer: number | null,
    selectLayer: React.Dispatch<React.SetStateAction<number | null>>,
    font: PainterFont | null,
    selectedGid: number | null,
    setPaintLayers: (layers: Paint[]) => void,
    clipboard: Paint[] | null,
    setClipboard: React.Dispatch<React.SetStateAction<Paint[] | null>>,
    selectVariableThing: React.Dispatch<React.SetStateAction<VariableThing<any> | null>>
}

export default function LayerTree(props: LayerTreeProps) {
    const [blendMode, setBlendMode] = React.useState<BlendMode>(BlendMode.Normal);
    const [dialogOpen, setDialogOpen] = React.useState(false);
    let draggingId: number | null = null;

    function nodeSelect(event: React.SyntheticEvent, nodeIds: Array<string> | string) {
        let selectedIndex = parseInt(nodeIds as string, 10);
        if (props.paintLayers) {
            for (let i = 0; i < props.paintLayers.length; i++) {
                if (i == selectedIndex) {
                    props.selectLayer(i);
                    setBlendMode(props.paintLayers[i].blendMode)
                } else {
                    props.selectLayer(null);
                }
            }
            props.selectLayer(selectedIndex)
        }
    }

    function changeBlendMode(event: SelectChangeEvent<BlendMode>) {
        if (props.selectedLayer !== null) {
            props.paintLayers![props.selectedLayer].blendMode = event.target.value as BlendMode;
            setBlendMode(event.target.value as BlendMode)
            props.setPaintLayers(([] as Paint[]).concat(props.paintLayers!));
            props.selectLayer(props.selectedLayer)
        }
    }

    function handleDragReOrder(ev: React.DragEvent<HTMLDivElement>, nodeId: string, isBeforeDestinationNode: boolean) {
        if (draggingId === null) { return }
        let paints = props.paintLayers!;
        if (isBeforeDestinationNode) {
            paints.splice(parseInt(nodeId), 0, paints.splice(draggingId, 1)[0]);
        } else {
            paints.splice(parseInt(nodeId) + 1, 0, paints.splice(draggingId, 1)[0]);
        }
        props.setPaintLayers(([] as Paint[]).concat(paints));
    }


    return (
        <Accordion sx={{ width: '100%' }} defaultExpanded={props.font !== null} disabled={!props.font}>
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
            >
                <Typography variant="h6">Layers</Typography>
            </AccordionSummary>
            <AccordionDetails>
                <Paper sx={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                    backgroundColor: '#aaaaaa11',
                    paddingLeft: 2,
                }}
                >
                    <FormControl size="small">
                        <Select
                            SelectDisplayProps={{ style: { paddingTop: 8, paddingBottom: 8 } }}
                            variant="standard"
                            disableUnderline={true}
                            disabled={props.selectedLayer === null}
                            value={blendMode}
                            label="Blend Mode"
                            onChange={changeBlendMode}
                        >
                            <MenuItem value={BlendMode.Normal}>Normal</MenuItem>
                            <MenuItem value={BlendMode.Clear}>Clear</MenuItem>
                            <MenuItem value={BlendMode.Multiply}>Multiply</MenuItem>
                            <MenuItem value={BlendMode.Screen}>Screen</MenuItem>
                            <MenuItem value={BlendMode.Overlay}>Overlay</MenuItem>
                            <MenuItem value={BlendMode.Darken}>Darken</MenuItem>
                            <MenuItem value={BlendMode.Lighten}>Lighten</MenuItem>
                            <MenuItem value={BlendMode.ColorDodge}>Color Dodge</MenuItem>
                            <MenuItem value={BlendMode.ColorBurn}>Color Burn</MenuItem>
                            <MenuItem value={BlendMode.HardLight}>Hard Light</MenuItem>
                            <MenuItem value={BlendMode.SoftLight}>Soft Light</MenuItem>
                            <MenuItem value={BlendMode.Difference}>Difference</MenuItem>
                            <MenuItem value={BlendMode.Exclusion}>Exclusion</MenuItem>
                            <MenuItem value={BlendMode.Hue}>Hue</MenuItem>
                            <MenuItem value={BlendMode.Saturation}>Saturation</MenuItem>
                            <MenuItem value={BlendMode.Color}>Color</MenuItem>
                            <MenuItem value={BlendMode.Luminosity}>Luminosity</MenuItem>
                        </Select>
                    </FormControl>
                </Paper>
                {/* 
                // @ts-ignore */}
                <KeylessTreeView
                    defaultCollapseIcon={<ArrowDropDownIcon />}
                    defaultExpandIcon={<ArrowRightIcon />}
                    defaultEndIcon={<div style={{ width: 24 }} />}
                    onNodeSelect={nodeSelect}
                    selected={props.selectedLayer?.toString() || ""}
                    sx={{ flexGrow: 1, overflowY: 'auto' }}
                >
                    {props.paintLayers!.map((p: Paint, i: number) => <TopTreeItem
                        nodeId={i.toString()}
                        label={(props.paintLayers!.length - i).toString()}
                        paint={p} redrawPaints={() => {
                            props.setPaintLayers(([] as Paint[]).concat(props.paintLayers!));
                        }}
                        onDragStart={(ev) => {
                            draggingId = i;
                        }}
                        onNodeReOrder={handleDragReOrder}
                        font={props.font}
                        selectVariableThing={props.selectVariableThing}
                    >

                    </TopTreeItem>)}
                </KeylessTreeView>
                <Paper
                    sx={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        backgroundColor: '#aaaaaa11',
                    }}
                >
                    <Box>
                        <IconButton
                            disabled={props.selectedLayer === null || props.paintLayers![props.selectedLayer]?.locked}
                            onClick={() => {
                                if (props.selectedLayer !== null) {
                                    props.paintLayers!.splice(props.selectedLayer, 1);
                                    props.setPaintLayers(([] as Paint[]).concat(props.paintLayers!));
                                    props.selectLayer(null);
                                }
                            }}
                        >
                            <Tooltip title="Delete layer">
                                <DeleteIcon />
                            </Tooltip>
                        </IconButton>
                    </Box>
                    <Box sx={{ "flex": 1 }}>
                        <IconButton disabled={!props.font} onClick={
                            () => {
                                props.paintLayers!.splice(0, 0, new Paint(
                                    SELF_GID,
                                    SolidBlackFill(props.font!),
                                    new Matrix(),
                                    props.font!,
                                    props.selectedGid!
                                ));
                                props.setPaintLayers(([] as Paint[]).concat(props.paintLayers!));
                                props.selectLayer(0);
                            }
                        } >
                            <Tooltip title="Add new layer">
                                <NoteAddIcon />
                            </Tooltip>
                        </IconButton>
                    </Box>
                    <Box>
                        <IconButton disabled={props.paintLayers!.length === 0}
                            onClick={() => props.setClipboard(props.paintLayers!.map(p => p.clone()))}
                        >
                            <Tooltip title="Copy all layers to clipboard">
                                <ContentCopy />
                            </Tooltip>
                        </IconButton>
                    </Box>
                    <Box>
                        <IconButton disabled={!props.clipboard || !props.font || !props.selectedGid}
                            onClick={() => {
                                let clonedFromClipboard = props.clipboard!.map(p => p.clone())
                                props.font!.paints.set(props.selectedGid!, clonedFromClipboard)
                                props.setPaintLayers(clonedFromClipboard)
                                props.font!.updatePalette();
                                props.selectLayer(null);
                            }}
                        >
                            <Tooltip title="Paste all layers from clipboard">
                                <ContentPaste />
                            </Tooltip>
                        </IconButton>
                    </Box>
                    <Box>
                        <IconButton disabled={!props.clipboard || !props.font || !props.selectedGid}
                            onClick={() => setDialogOpen(true)}
                        >
                            <Tooltip title="Paste all layers to all glyphs">
                                <ContentPasteGoTwoTone />
                            </Tooltip>
                        </IconButton>
                        <ConfirmPasteAllDialog
                            open={dialogOpen}
                            onClose={() => setDialogOpen(false)}
                            font={props.font}
                            clipboard={props.clipboard!}
                            selectLayer={props.selectLayer}
                        />

                    </Box>

                </Paper>
            </AccordionDetails>
        </Accordion>
    );
}

/*

            {props.paintLayers.map((p: Paint, index: number) => {
                <StyledTreeItem nodeId={index.toString()} labelText={props.font?.glyphInfos()[p.gid].name} labelIcon={Label} />
            })
            }
            */
