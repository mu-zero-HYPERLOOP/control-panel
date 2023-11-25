import {Route, Routes, useLocation } from "react-router-dom";
import ControlPanel from "./ControlPanel";
import DebugPanel from "./DebugPanel";
import { Typography } from "@mui/material";
import {useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api";
import { NetworkInformation } from "../types/NetworkInformation";
import NodePanel from "./NodePanel";
import { NodeInformation } from "../types/NodeInformation";

function Content() {
    const location = useLocation();
    return (
        <Typography variant="body2" sx={{ pb: 2 }} color="text.secondary">
            Current route: {location.pathname}
        </Typography>
    );
}

function ShowPages() {
    const [nodes, setNodes] = useState<string[]>([]);
    const [entries, setEntries] = useState<string[]>([]);

    invoke<NetworkInformation>("network_information").then((networkInformation) => {
        setNodes(networkInformation.node_names)
    });

    useEffect(() => {
        for (let node in nodes) {
            invoke<NodeInformation>("node_information", {node_name: node}).then((nodeInformation) => {
                console.log(nodeInformation)
                entries.concat(nodeInformation.object_entries.concat(nodeInformation.commands).map((entry) => node + "/" + entry))
            });
        }
        setEntries(entries)

    }, []);

    return (
        <Routes>
            <Route index element={<ControlPanel />} />
            <Route path="DebugPanel" element={<DebugPanel />} />
            <Route path="*" element={<Content />} />
            {nodes.map((node) =>
                <Route path={node} element={<NodePanel name={node}/> } />)}
            {entries.map((entry) =>
                <Route path={entry} element={<NodePanel name={entry}/> } />)}
        </Routes>
    );
}

export default ShowPages;