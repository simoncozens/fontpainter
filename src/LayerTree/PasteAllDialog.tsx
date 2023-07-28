import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { PainterFont } from '../font/Font';
import { Paint } from '../color/Paints';



export interface ConfirmDialogProps {
    open: boolean;
    onClose: () => void;
    font: PainterFont | null;
    clipboard: Paint[];
    selectLayer: React.Dispatch<React.SetStateAction<number | null>>;
}

export function ConfirmPasteAllDialog(props: ConfirmDialogProps) {
    const { onClose, open } = props;
    const handleOk = () => {
        let gid = 0;
        while (gid < props.font!.numGlyphs) {
            let clonedFromClipboard = props.clipboard!.map(p => p.clone());
            props.font!.paints.set(gid, clonedFromClipboard);
            gid += 1;
        }
        props.font!.updatePalette();
        props.selectLayer(null);
        onClose();
    };

    return (
        <Dialog
            open={props.open}
            sx={{ '& .MuiDialog-paper': { width: '80%', maxHeight: 435 } }}
            maxWidth="xs"
        >
            <DialogTitle>Paste to all glyphs?</DialogTitle>
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
