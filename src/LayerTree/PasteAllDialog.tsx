import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { FontContext, FontContextType } from "../App";



export interface ConfirmDialogProps {
    open: boolean;
    onClose: () => void;
}
export function ConfirmPasteAllDialog(props: ConfirmDialogProps) {
    const { onClose, open } = props;
    const fc: FontContextType = React.useContext(FontContext);
    const handleOk = () => {
        let gid = 0;
        while (gid < fc.font!.numGlyphs) {
            let clonedFromClipboard = fc.clipboard!.map(p => p.clone());
            fc.font!.paints.set(gid, clonedFromClipboard);
            gid += 1;
        }
        fc.font!.updatePalette();
        fc.selectLayer(null);
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
