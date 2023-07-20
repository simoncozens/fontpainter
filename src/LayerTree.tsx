import * as React from 'react';
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Icon from '@mui/material/Icon';
import KeylessTreeView from './mui-bits/TreeView';
import TreeItem, { TreeItemProps, treeItemClasses } from '@mui/lab/TreeItem';
import Typography from '@mui/material/Typography';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import DeleteIcon from '@mui/icons-material/Delete';
import LockIcon from '@mui/icons-material/Lock';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionDetails, AccordionSummary, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, InputAdornment, SelectChangeEvent, Tooltip } from '@mui/material';
import { Paint, SolidFill, SolidBlackFill, BlendMode, SELF_GID } from './Paints';
import { GlyphInfo } from './Font';
import { Color, ColorButton, ColorBox, createColor } from 'mui-color';
import { Autocomplete, ButtonBase, IconButton, Paper, Popover, TextField, Select, FormControl, MenuItem } from '@mui/material';
import { Matrix } from '@svgdotjs/svg.js';
import { createFilterOptions } from '@mui/material/Autocomplete';
import { ContentCopy, ContentPaste, ContentPasteGoTwoTone, MultipleStop } from '@mui/icons-material';
import { FontContext, FontContextType } from "./App";

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


type FillItemProps = TreeItemProps & {
    nodeId: String,
    paint: Paint;
    redrawPaints: () => void;
};

function FillItem(props: FillItemProps) {
    const fc: FontContextType = React.useContext(FontContext);
    const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const colorBoxOpen = Boolean(anchorEl);
    const [paintColor, setPaintColor] = React.useState(createColor((props.paint.fill as SolidFill).color));
    // XXX Too slow
    // let [_, basepalette] = props.paint._font.saveColr();
    let palette: Record<string, string> = {};
    // for (var colorString of basepalette.colors||[]) {
    //     palette[colorString] = colorString;
    // }

    const handleChange = (newValue: Color) => {
        (props.paint.fill as SolidFill).color = "#" + newValue.hex;
        setPaintColor(newValue);
        props.redrawPaints();
    }
    return <StyledTreeItemRoot nodeId={props.nodeId}
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
                        {props.paint.fill instanceof SolidFill ? "Solid " : "Gradient "}
                        Fill
                    </Typography>
                </Box>
                <Box sx={{ paddingRight: 2, flex: 1 }}>
                    <ButtonBase onClick={handleClick}>
                        <ColorButton color={createColor((props.paint.fill as SolidFill).color)} />
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
                <Box sx={{ paddingRight: 2 }}>
                    <Typography variant="caption" sx={{ fontWeight: 'inherit' }}>
                        Opacity:
                    </Typography>
                </Box>
                <TextField
                    type="number"
                    size="small"
                    variant="standard"
                    InputProps={{
                        inputProps: { min: 0, max: 100 }, endAdornment:
                            <InputAdornment position="end">%</InputAdornment>,
                    }}
                    value={(props.paint.fill as SolidFill).current_opacity * 100}
                    onChange={(evt) => {
                        (props.paint.fill as SolidFill).opacity.addValue(fc.font!.normalizedLocation, parseInt(evt.target.value) / 100.0);
                        props.redrawPaints();
                    }}
                />
                <Box sx={{ paddingRight: 2 }}>
                    <IconButton onClick={() => fc.selectVariableThing((props.paint.fill as SolidFill).opacity)}>
                        <Tooltip title="Edit variable">
                            <MultipleStop />
                        </Tooltip>
                    </IconButton>
                </Box>

            </Box>
        } />
}

type TransformItemProps = TreeItemProps & {
    nodeId: String,
    paint: Paint;
    redrawPaints: () => void;
};

function TransformItem(props: TransformItemProps) {
    const fc: FontContextType = React.useContext(FontContext);
    let matrix = props.paint.current_matrix
    let handleClick = () => {
        fc.selectVariableThing(props.paint.matrix)
    }

    return <StyledTreeItemRoot nodeId={props.nodeId}
        label={
            <Box
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
                <Box sx={{ paddingRight: 2 }}>
                    <IconButton onClick={handleClick}>
                        <Tooltip title="Edit variable">
                            <MultipleStop />
                        </Tooltip>
                    </IconButton>
                </Box>
            </Box>
        } />
}


function StyledTreeItem(props: StyledTreeItemProps) {
    const fc: FontContextType = React.useContext(FontContext);
    const theme = useTheme();
    const {
        bgColor,
        color,
        paint: Paint,
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
    const [renaming, setRenaming] = React.useState<boolean>(false);

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
                        <Typography sx={{ fontWeight: 'inherit' }}>
                            {label}
                        </Typography>
                    </Box>
                    <Box sx={{ paddingRight: 2 }}>
                        <IconButton onClick={toggleLocked}>
                            <Tooltip title="Locked">
                                {props.paint.locked ? <LockIcon /> : <Icon />}
                            </Tooltip>
                        </IconButton>
                    </Box>
                    <Box sx={{ paddingRight: 2 }}>
                        <ColorButton color={createColor((props.paint.fill as SolidFill).color)} />
                    </Box>
                    {renaming && fc.font ?
                        <Autocomplete
                            options={[
                                { id: SELF_GID, name: "<Self>", unicode: null },
                                ...fc.font!.glyphInfos()
                            ]}
                            getOptionLabel={(option) => option.name}
                            sx={{ fontWeight: 'inherit', flexGrow: 1 }}
                            value={props.paint.gid ? fc.font!.glyphInfos()[props.paint.gid] : null}
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
                </Box>
            }
            style={styleProps}
            {...other}
        >
            <FillItem nodeId={nodeId.toString() + ".fill"} paint={props.paint} redrawPaints={props.redrawPaints} />
            <TransformItem nodeId={nodeId.toString() + ".transform"} paint={props.paint} redrawPaints={props.redrawPaints} />
        </StyledTreeItemRoot>
    );
}


export interface ConfirmDialogProps {
    open: boolean;
    onClose: () => void;
}

function ConfirmPasteAllDialog(props: ConfirmDialogProps) {
    const { onClose, open } = props;
    const fc: FontContextType = React.useContext(FontContext);
    const handleOk = () => {
        let gid = 0;
        while (gid < fc.font!.numGlyphs) {
            let clonedFromClipboard = fc.clipboard!.map(p => p.clone())
            fc.font!.paints.set(gid, clonedFromClipboard)
            gid += 1;
        }
        fc.selectLayer(null);
        onClose();
    };

    return (
        <Dialog
            open={props.open}
            sx={{ '& .MuiDialog-paper': { width: '80%', maxHeight: 435 } }}
            maxWidth="xs"
        >
            <DialogTitle>Paste to all layers?</DialogTitle>
            <DialogContent dividers>
                <DialogContentText>
                    This will replace the contents of <i>all layers in all
                        glyphs</i> with the contents of the clipboard. This is
                    an extremely destructive operation. Are you sure you want
                    to do this?
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button autoFocus onClick={onClose}>
                    Cancel
                </Button>
                <Button onClick={handleOk}>Ok</Button>
            </DialogActions>
        </Dialog>
    );
}


export default function LayerTree() {
    const fc: FontContextType = React.useContext(FontContext);

    const [blendMode, setBlendMode] = React.useState<BlendMode>(BlendMode.Normal);
    const [dialogOpen, setDialogOpen] = React.useState(false);

    function nodeSelect(event: React.SyntheticEvent, nodeIds: Array<string> | string) {
        let selectedIndex = parseInt(nodeIds as string, 10);
        if (fc.paintLayers) {
            for (let i = 0; i < fc.paintLayers.length; i++) {
                if (i == selectedIndex) {
                    fc.paintLayers[i].onSelected()
                    setBlendMode(fc.paintLayers[i].blendMode)
                } else {
                    fc.paintLayers[i].onDeselected()
                }
            }
            fc.selectLayer(selectedIndex)
        }
    }

    function changeBlendMode(event: SelectChangeEvent<BlendMode>) {
        if (fc.selectedLayer !== null) {
            fc.paintLayers![fc.selectedLayer].blendMode = event.target.value as BlendMode;
            setBlendMode(event.target.value as BlendMode)
            fc.setPaintLayers(([] as Paint[]).concat(fc.paintLayers!));
            fc.selectLayer(fc.selectedLayer)
        }
    }

    return (
        <Accordion sx={{ width: '100%' }} defaultExpanded={fc.font !== null} disabled={!fc.font}>
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
                            disabled={fc.selectedLayer === null}
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
                    selected={fc.selectedLayer?.toString() || ""}
                    sx={{ flexGrow: 1, overflowY: 'auto' }}
                >
                    {fc.paintLayers!.map((p: Paint, i: number) => <StyledTreeItem
                        nodeId={i.toString()}
                        label={(fc.paintLayers!.length - i).toString()}
                        paint={p} redrawPaints={() => {
                            fc.setPaintLayers(([] as Paint[]).concat(fc.paintLayers!));
                        }
                        }>
                    </StyledTreeItem>)}
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
                            disabled={fc.selectedLayer === null || fc.paintLayers![fc.selectedLayer]?.locked}
                            onClick={() => {
                                if (fc.selectedLayer !== null) {
                                    fc.paintLayers!.splice(fc.selectedLayer, 1);
                                    fc.setPaintLayers(([] as Paint[]).concat(fc.paintLayers!));
                                    fc.selectLayer(null);
                                }
                            }}
                        >
                            <Tooltip title="Delete layer">
                                <DeleteIcon />
                            </Tooltip>
                        </IconButton>
                    </Box>
                    <Box>
                        <IconButton disabled={!fc.font} onClick={
                            () => {
                                fc.paintLayers!.splice(0, 0, new Paint(
                                    SELF_GID,
                                    SolidBlackFill(fc.font!),
                                    new Matrix(),
                                    fc.font!,
                                    fc.selectedGid!
                                ));
                                fc.setPaintLayers(([] as Paint[]).concat(fc.paintLayers!));
                                fc.selectLayer(0);
                            }
                        } >
                            <Tooltip title="Add new layer">
                                <NoteAddIcon />
                            </Tooltip>
                        </IconButton>
                    </Box>
                    <Box>
                        <IconButton disabled={fc.paintLayers!.length === 0}
                            onClick={() => fc.setClipboard(fc.paintLayers!.map(p => p.clone()))}
                        >
                            <Tooltip title="Copy all layers to clipboard">
                                <ContentCopy />
                            </Tooltip>
                        </IconButton>
                    </Box>
                    <Box>
                        <IconButton disabled={!fc.clipboard || !fc.font || !fc.selectedGid}
                            onClick={() => {
                                let clonedFromClipboard = fc.clipboard!.map(p => p.clone())
                                fc.font!.paints.set(fc.selectedGid!, clonedFromClipboard)
                                fc.setPaintLayers(clonedFromClipboard)
                                fc.selectLayer(null);
                            }}
                        >
                            <Tooltip title="Paste all layers from clipboard">
                                <ContentPaste />
                            </Tooltip>
                        </IconButton>
                    </Box>
                    <Box>
                        <IconButton disabled={!fc.clipboard || !fc.font || !fc.selectedGid}
                            onClick={() => setDialogOpen(true)}
                        >
                            <Tooltip title="Paste all layers to all glyphs">
                                <ContentPasteGoTwoTone />
                            </Tooltip>
                        </IconButton>
                        <ConfirmPasteAllDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
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
