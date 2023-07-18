import { PainterFont, Axis } from './Font';
import * as React from 'react';
import { Paint } from './Paints';
import { Modal, Box, Typography, Accordion, AccordionDetails, AccordionSummary, Button, Stack } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { styled } from '@mui/material/styles';
import Highlight from 'react-highlight'
import "./Developer.css";

const style = {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '75%',
    height: '75%',
    maxHeight: '75%',
    bgcolor: '#222222cc',
    border: '2px solid #000',
    boxShadow: 24,
    pt: 2,
    px: 4,
    pb: 3,
};


const SimpleButton = styled(Button)({
    textTransform: 'none',
})

interface DeveloperProps {
    font: PainterFont | null,
    selectedLayer: number | null,
    selectedGid: number | null,
    paintLayers: Paint[],
    clipboard: Paint[] | null,
}

export function Developer(props: DeveloperProps) {
    const [open, setOpen] = React.useState<boolean>(false);
    const [content, setContent] = React.useState<any>(null);


    let dumpLayer = () => {
        setContent(JSON.stringify(props.paintLayers[props.selectedLayer!], (key, value) => {
            if (key === "rendering" || key === "_font" || key === "matrix") {
                return "[omitted]"
            } else {
                return value
            }
        }, 4))
        setOpen(true);
    }

    let dumpMatrix = () => {
        let positions: Record<string, string> = {}
        let matrix = props.paintLayers[props.selectedLayer!].matrix
        for (var [k, v] of Array.from(matrix.values.entries())) {
            positions[k] = v.toString()
        }
        let loc = props.font!.normalizedLocation;
        let key = Object.keys(loc)
            .sort()
            .map((k) => `${k}:${loc[k]}`)
            .join(",");
        positions["Current: " + key] = matrix.valueAt(loc).toString()
        setContent(JSON.stringify(positions, undefined, 4))
        setOpen(true);
    }

    let dumpCompilation = () => {
        let [colr, cpal] = props.font!.saveColr()
        setContent(JSON.stringify(colr, undefined, 4))
        setOpen(true);
    }

    return (
        <Accordion sx={{ width: '100%' }}>
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
            >
                <Typography variant="h6" > Developer </Typography>
            </AccordionSummary>
            <AccordionDetails>
                <Stack direction="column" spacing={2}>
                    <SimpleButton variant="outlined" disabled={props.selectedLayer === null} onClick={dumpLayer}>Dump current paint layer</SimpleButton>
                    <SimpleButton variant="outlined" disabled={props.selectedLayer === null} onClick={dumpMatrix}>Dump current variable matrix</SimpleButton>
                    <SimpleButton variant="outlined" onClick={dumpCompilation}>Compile font to OT</SimpleButton>

                </Stack>
                <Modal
                    open={open}
                    onClose={() => setOpen(false)}
                >
                    <Box sx={style}>
                        <Highlight className="language-json">{content}</Highlight>
                    </Box>
                </Modal>
            </AccordionDetails>
        </Accordion>
    )
}