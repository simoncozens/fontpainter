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
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionDetails, AccordionSummary, SelectChangeEvent } from '@mui/material';
import { Paint, SolidFill, SolidBlackFill, matrixLabel, BlendMode, SELF_GID } from './Paints';
import { PainterFont, GlyphInfo } from './Font';
import { Color, ColorButton, ColorBox, createColor } from 'mui-color';
import { Autocomplete, ButtonBase, IconButton, Paper, Popover, TextField, Select, FormControl, MenuItem } from '@mui/material';
import { Matrix } from '@svgdotjs/svg.js';
import { createFilterOptions } from '@mui/material/Autocomplete';
import { ContentCopy, ContentPaste } from '@mui/icons-material';

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
        console.log("Setting colour of paint", props.paint, " to ", newValue);
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
                    { renaming && props.font ?
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
                        <Typography variant="body2" sx={{ fontWeight: 'inherit', flexGrow: 1 }} onDoubleClick={
                            () => {
                                setRenaming(true);
                            }
                        }>
                            {props.paint.label}
                        </Typography>
                    }
                    <Typography variant="caption" sx={{ fontWeight: 'inherit' }}>
                        {matrixLabel(props.paint.matrix)}
                    </Typography>
                </Box>
            }
            style={styleProps}
            {...other}
        >
            {null && 
            <StyledTreeItemRoot nodeId={nodeId.toString() + ".fill"}
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
                                Fill {props.paint.fill.description}
                            </Typography>
                        </Box>
                    </Box>
                } />
            }

        </StyledTreeItemRoot>
    );
}

interface LayerTreeProps {
    font: PainterFont | null,
    selectLayer: React.Dispatch<React.SetStateAction<number | null>>,
    selectedLayer: number | null,
    selectedGid: number | null,
    paintLayers: Paint[],
    setPaintLayers: React.Dispatch<React.SetStateAction<Paint[]>>,
    clipboard: Paint[] | null,
    setClipboard: React.Dispatch<React.SetStateAction<Paint[] | null>>,
}

export default function LayerTree(props: LayerTreeProps) {
    const [blendMode, setBlendMode] = React.useState<BlendMode>(BlendMode.Normal);

    function nodeSelect(event: React.SyntheticEvent, nodeIds: Array<string> | string) {
        let selectedIndex = parseInt(nodeIds as string, 10);
        for (let i = 0; i < props.paintLayers.length; i++) {
            if (i == selectedIndex) {
                props.paintLayers[i].onSelected()
                setBlendMode(props.paintLayers[i].blendMode)
            } else {
                props.paintLayers[i].onDeselected()
            }
        }
        props.selectLayer(selectedIndex)
    }

    function changeBlendMode(event: SelectChangeEvent<BlendMode>) {
        if (props.selectedLayer !== null) {
            props.paintLayers[props.selectedLayer].blendMode = event.target.value as BlendMode;
            setBlendMode(event.target.value as BlendMode)
            props.setPaintLayers(([] as Paint[]).concat(props.paintLayers));
            props.selectLayer(props.selectedLayer)
        }
    }

    return (
        <Accordion sx={{ width: '100%' }} defaultExpanded={true}>
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
                }>
                </StyledTreeItem>)}
            </TreeView>
                <Paper
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
                                    SELF_GID,
                                    SolidBlackFill(),
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
                    <Box>
                        <IconButton disabled={props.paintLayers.length === 0}
                            onClick={() => props.setClipboard(props.paintLayers.map(p => p.clone()))}
                        >
                            <ContentCopy />
                        </IconButton>
                    </Box>
                    <Box>
                        <IconButton disabled={!props.clipboard || !props.font || !props.selectedGid}
                            onClick={() => {
                                let clonedFromClipboard = props.clipboard!.map(p => p.clone())
                                props.font!.paints.set(props.selectedGid!, clonedFromClipboard)
                                console.log("Setting paints of ", props.selectedGid, " to")
                                props.setPaintLayers(clonedFromClipboard)
                                console.log(props.paintLayers)
                                props.selectLayer(null);
                            }}
                        >
                            <ContentPaste />
                        </IconButton>
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
