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
import { PainterFont } from "./Font";
import { FontContext, FontContextType } from "./App";

interface FontDropProps {
    open: boolean,
    setOpen: React.Dispatch<React.SetStateAction<boolean>>
};

function FontDrop(props: FontDropProps) {
    const [fileObjects, setFileObjects] = React.useState<any[]>([]);
    const fc: FontContextType = React.useContext(FontContext);

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
            acceptedFiles={['font/*']}
            fileObjects={[]}
            filesLimit={1}
            cancelButtonText={"cancel"}
            submitButtonText={"submit"}
            maxFileSize={5000000}
            open={props.open}
            onAdd={newFileObjs => {
                fc.setFont(new PainterFont(newFileObjs[0].data as string, newFileObjs[0].file.name));
                props.setOpen(false);
            }}
            onClose={() => props.setOpen(false)}
            onSave={() => props.setOpen(false)}
            showPreviews={false}
        />
    );
}

export default function TopMenu() {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const fc: FontContextType = React.useContext(FontContext);
    const [dropDialogOpen, setDropDialogOpen] = React.useState(!fc.font);
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
        fc.font?.download()
        handleClose()
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
                <FontDrop open={dropDialogOpen} setOpen={setDropDialogOpen} />
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    FontPainter
                </Typography>
            </Toolbar>
        </AppBar>
    )
}
