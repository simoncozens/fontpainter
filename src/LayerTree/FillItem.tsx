import * as React from 'react';
import Box from '@mui/material/Box';
import { TreeItemProps } from '@mui/lab/TreeItem';
import Typography from '@mui/material/Typography';
import Input from '@mui/material/Input';
import Slider from '@mui/material/Slider';
import Tooltip from '@mui/material/Tooltip';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import { Paint } from '../color/Paints';
import { LinearGradientFill, SolidFill } from "../color/Fills";
import ColorPicker, { useColorPicker } from 'react-best-gradient-color-picker';
import MultipleStop from '@mui/icons-material/MultipleStop';
import { FontContext, FontContextType } from "../App";
import { StyledTreeItemRoot } from './LayerTree';


type FillItemProps = TreeItemProps & {
    nodeId: String;
    paint: Paint;
    redrawPaints: () => void;
};

function SolidFillOpacitySlider(props: FillItemProps) {
    const fc: FontContextType = React.useContext(FontContext);
    let fill = props.paint.fill as SolidFill;
    let opacity_pc = fill.current_opacity * 100;
    const [opacity, setOpacity] = React.useState<number>(opacity_pc);

    React.useEffect(() => {
        fill.opacity.addValue(fc.font!.normalizedLocation, opacity / 100);
        props.redrawPaints();
    }, [opacity]);

    const handleOpacitySliderChange = (event: Event, newValue: number | number[]) => {
        setOpacity(newValue as number);
    };

    const handleOpacityInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        let newOpacity = Number(event.target.value);
        setOpacity(newOpacity);
    };

    return <>
        <Box sx={{ paddingRight: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 'inherit' }}>
                Opacity:
            </Typography>
        </Box>
        <Slider
            value={typeof opacity === 'number' ? opacity : 0}
            onChange={handleOpacitySliderChange}
            aria-labelledby="input-slider"
            size="small"
            sx={{ maxWidth: 100, marginRight: 1 }} />
        <Input
            value={opacity}
            size="small"
            onChange={handleOpacityInputChange}
            inputProps={{
                min: 0,
                max: 100,
                type: 'number',
            }} />
        <Box>
            <IconButton onClick={() => fc.selectVariableThing(fill.opacity)}>
                <Tooltip title="Edit variable">
                    <MultipleStop />
                </Tooltip>
            </IconButton>
        </Box>
    </>
}

function GradientFillOpacitySliders(props: FillItemProps) {
    const fc: FontContextType = React.useContext(FontContext);
    let fill: LinearGradientFill = props.paint.fill as LinearGradientFill;
    let opacities: number[] = fill.stops.map((stop) => 100 * stop.opacity.valueAt(fc.font!.normalizedLocation));
    const [gradientFillOpacity, setGradientFillOpacity] = React.useState<number[]>(opacities);

    return <>
        {fill.stops.map((stop, stopIndex) => {
            return <StyledTreeItemRoot nodeId={props.nodeId + ".stop" + stopIndex + ".opacity"}
                label={<Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        pr: 0,
                    }}
                >
                    <Box sx={{ paddingRight: 2 }}>
                        <Typography variant="caption" sx={{ fontWeight: 'inherit' }}>
                            Stop {stopIndex} opacity:
                        </Typography>
                    </Box>
                    <Slider
                        value={gradientFillOpacity[stopIndex] * 100}
                        onChange={(event: Event, newValue: number | number[]) => {
                            let newOpacity = newValue as number;
                            setGradientFillOpacity((old) => {
                                let newOpacities = [...old];
                                newOpacities[stopIndex] = newOpacity / 100;
                                return newOpacities;
                            });
                            fill.stops[stopIndex].opacity.addValue(fc.font!.normalizedLocation, newOpacity / 100);
                            console.log(fill.stops[stopIndex]);
                            props.redrawPaints();
                        }}
                        aria-labelledby="input-slider"
                        size="small"
                        sx={{ marginRight: 1, flex: 1 }} />
                    <Input
                        value={gradientFillOpacity[stopIndex] * 100}
                        size="small"
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                            let newOpacity = Number(event.target.value);
                            setGradientFillOpacity((old) => {
                                let newOpacities = [...old];
                                newOpacities[stopIndex] = newOpacity / 100;
                                return newOpacities;
                            });
                            stop.opacity.addValue(fc.font!.normalizedLocation, newOpacity / 100);
                            console.log(stop.opacity);
                            props.redrawPaints();
                        }}
                        inputProps={{
                            min: 0,
                            max: 100,
                            type: 'number',
                        }} />
                    <Box>
                        <IconButton onClick={() => fc.selectVariableThing(stop.opacity)}>
                            <Tooltip title="Edit variable">
                                <MultipleStop />
                            </Tooltip>
                        </IconButton>
                    </Box>
                </Box>}></StyledTreeItemRoot>
        })}
    </>
}

export function FillItem(props: FillItemProps) {
    const fc: FontContextType = React.useContext(FontContext);
    const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const colorBoxOpen = Boolean(anchorEl);

    let startColor = Object.values(props.paint.fill.toCSS())[0];
    const [paintColor, setPaintColor] = React.useState(startColor);

    const { getGradientObject } = useColorPicker(paintColor, setPaintColor);

    let palette: Record<string, string> = {};
    for (var colorString of fc.font!.palette.colors || []) {
        palette[colorString] = colorString;
    }

    React.useEffect(() => {
        props.paint.setFill(getGradientObject());
        fc.font!.updatePalette();
        props.redrawPaints();
    }, [paintColor]);

    const handleChange = (newValue: string) => {
        setPaintColor(newValue);
    };

    return <StyledTreeItemRoot nodeId={props.nodeId}
        label={<Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                pr: 0,
            }}
        >
            <Box sx={{ paddingRight: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 'inherit' }}>
                    {props.paint.fill.type == "SolidFill" ? "Solid " : "Gradient "}
                    Fill
                </Typography>
            </Box>
            <Box sx={{ paddingRight: 2, flex: 1 }}>
                <ButtonBase onClick={handleClick}
                    sx={{
                        width: 24, height: 24,
                        ...props.paint.fill.toCSS()
                    }}>
                </ButtonBase>
                <Popover
                    open={colorBoxOpen}
                    anchorEl={anchorEl}
                    onClose={() => setAnchorEl(null)}
                >
                    <ColorPicker
                        value={paintColor}
                        onChange={handleChange} />
                </Popover>
            </Box>
            {(props.paint.fill.type == "SolidFill") && <SolidFillOpacitySlider {...props} />}
        </Box>}>
        {(props.paint.fill.type == "LinearGradientFill") && <GradientFillOpacitySliders {...props} />}

    </StyledTreeItemRoot>;
}