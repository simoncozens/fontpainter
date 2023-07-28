import * as React from 'react';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import AppBar from '@mui/material/AppBar';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { DropzoneDialogBase } from "mui-file-dropzone";
import { PainterFont } from "./font/Font";
import Chip from '@mui/material/Chip';
import Snackbar from '@mui/material/Snackbar';
import { Redo, Undo } from '@mui/icons-material';
import Box from '@mui/material/Box';

interface FontDropProps {
    open: boolean,
    setOpen: React.Dispatch<React.SetStateAction<boolean>>,
    snackOpener: (message: string) => void,
    setFont: React.Dispatch<React.SetStateAction<PainterFont | null>>
};

function FontDrop(props: FontDropProps) {
    const [fileObjects, setFileObjects] = React.useState<any[]>([]);

    const dialogTitle = () => (
        <>
            <span>Upload file</span>
            <IconButton
                style={{ right: '12px', top: '8px', position: 'absolute' }}
                onClick={() => props.setOpen(false)}>
                <CloseIcon />
            </IconButton>
        </>
    );

    return (
        <DropzoneDialogBase
            dialogTitle={dialogTitle()}
            acceptedFiles={
                ['font/*', "*.ttf", "*.otf", "*.woff", "*.woff2"]
            }
            fileObjects={[]}
            filesLimit={1}
            cancelButtonText={"cancel"}
            submitButtonText={"submit"}
            maxFileSize={5000000}
            open={props.open}
            onAdd={newFileObjs => {
                props.setFont(new PainterFont(newFileObjs[0].data as string, newFileObjs[0].file.name, props.snackOpener));
                props.setOpen(false);
            }}
            onClose={() => props.setOpen(false)}
            onSave={() => props.setOpen(false)}
            showPreviews={false}
        />
    );
}

interface TopMenuProps {
    setFont: React.Dispatch<React.SetStateAction<PainterFont | null>>,
    font: PainterFont | null,
    undo: (font: PainterFont) => boolean,
    redo: (font: PainterFont) => boolean,
    canUndo: () => boolean,
    canRedo: () => boolean,
}

export default function TopMenu(props: TopMenuProps) {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const [snackIsOpen, setOpenSnack] = React.useState(false);
    const [snackMessage, setSnackMessage] = React.useState("");
    const handleSnackClose = (event: React.SyntheticEvent | Event, reason?: string) => {
      if (reason === 'clickaway') { return; }
      setOpenSnack(false);
    };
    const openSnack = (message: string) => {
        setSnackMessage(message);
        setOpenSnack(true);
    }

    let messageSnack = <Snackbar
        open={snackIsOpen}
        autoHideDuration={5000}
        onClose={handleSnackClose}
        message={snackMessage}
        action={<React.Fragment>
            <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={handleSnackClose}
            >
            <CloseIcon fontSize="small" />
            </IconButton>
        </React.Fragment>
        }
    />;
    const [dropDialogOpen, setDropDialogOpen] = React.useState(!props.font);
    const open = Boolean(anchorEl);
    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const openDropZone = () => {
        setDropDialogOpen(true);
        setAnchorEl(null);
    };

    const handleSave = () => {
        props.font?.download()
        handleClose()
    }

    const handleUndo = () => {
        if (props.font && props.undo(props.font!)) {
            openSnack("Undo successful");
        }
    }

    const handleRedo = () => {
        if (props.font && props.redo(props.font!)) {
            openSnack("Redo successful");
        }
    }
    return (
        <AppBar position="static">
            <Toolbar>
                <IconButton
                    size="large"
                    edge="start"
                    color="inherit"
                    aria-label="menu"
                    sx={{ mr: 2 }}
                    onClick={handleClick}
                >
                    <MenuIcon />
                </IconButton>
                <Menu
                    id="long-menu"
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleClose}
                >
                    <MenuItem key={"Open"} onClick={openDropZone}>
                        Open
                    </MenuItem>
                    <MenuItem key={"Save"} onClick={handleSave}>
                        Save
                    </MenuItem>
                </Menu>
                <FontDrop open={dropDialogOpen} setOpen={setDropDialogOpen} snackOpener={(message: string) => openSnack(message)} setFont={props.setFont} />
                <Typography variant="h6" component="div" sx={{ mr: 2}}>
                    FontPainter
                </Typography>
                <Chip label="alpha" color="error" />
                <Box sx={{ flexGrow: 1 }} />
                <IconButton disabled={!props.font || !props.canUndo()} onClick={handleUndo}>
                    <Undo />
                </IconButton>
                <IconButton disabled={!props.font || !props.canRedo()} onClick={handleRedo}>
                    <Redo />
                </IconButton>
                <Box sx={{ flexGrow: 1 }} />

                {messageSnack}
            </Toolbar>
        </AppBar>
    )
}
