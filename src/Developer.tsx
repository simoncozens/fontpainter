import * as React from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { styled } from '@mui/material/styles';
const Highlight = React.lazy(() => import('react-highlight'));

import "./Developer.css";
import { Paint } from './color/Paints';
import { PainterFont } from './font/Font';

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
    paintLayers: Paint[],
    selectedLayer: number | null,
    font: PainterFont | null,
};

export function Developer(props: DeveloperProps) {
    const [open, setOpen] = React.useState<boolean>(false);
    const [content, setContent] = React.useState<any>(null);


    let dumpLayer = () => {
        setContent(JSON.stringify(props.paintLayers![props.selectedLayer!], (key, value) => {
            if (key.startsWith("_") || key === "matrix") {
                return "[omitted]"
            } else {
                return value
            }
        }, 4))
        setOpen(true);
    }

    let dumpMatrix = () => {
        let positions: Record<string, string> = {}
        let matrix = props.paintLayers![props.selectedLayer!].matrix
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

    let dumpForSaving = () => {
        let dump = props.font!.deflate();
        setContent(dump);
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
                    <SimpleButton variant="outlined" onClick={dumpForSaving}>Compile font to Pntr project</SimpleButton>

                </Stack>
                <Modal
                    open={open}
                    onClose={() => setOpen(false)}
                >
                    <Box sx={style}>
                        <React.Suspense fallback={<div>Loading...</div>}>
                            <Highlight className="language-json">{content}</Highlight>
                        </React.Suspense>
                    </Box>
                </Modal>
            </AccordionDetails>
        </Accordion>
    )
}