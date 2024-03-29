import {useState} from "react";
import {invoke} from "@tauri-apps/api";
import {CircularProgress, IconButton, SxProps, Theme} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";

interface RefreshButtonProps {
    nodeName: string,
    objectEntryName: string,
    sx?: SxProps<Theme>
}

function RefreshButton({nodeName, objectEntryName, sx}: Readonly<RefreshButtonProps>) {
    const [getReqInProgess, setGetReqInProgess] = useState(false);

    function handleRefreshClick() {
        console.log("sending get request");
        setGetReqInProgess(true);
        invoke("request_object_entry_value",
            {nodeName, objectEntryName}).then(() => {
            setGetReqInProgess(false);
        }).catch(() => {
            setGetReqInProgess(false);
        });
    }

    return <IconButton
        size="small"
        onClick={handleRefreshClick}
        sx={sx}>
        {getReqInProgess ?
            <CircularProgress size={15} sx={{color: "grey"}}/> :
            <RefreshIcon fontSize="small"/>}
    </IconButton>
}

export default RefreshButton
