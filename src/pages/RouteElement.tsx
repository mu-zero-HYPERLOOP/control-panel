import {Route, Routes, useLocation } from "react-router-dom";
import ControlPanel from "./ControlPanel";
import DebugPanel from "./DebugPanel";
import { Typography } from "@mui/material";

function Content() {
    const location = useLocation();
    return (
        <Typography variant="body2" sx={{ pb: 2 }} color="text.secondary">
            Current route: {location.pathname}
        </Typography>
    );
}
function RouteElement() {

    return (
        <Routes>
            <Route index element={<ControlPanel />} />
            <Route path="DebugPanel" element={<DebugPanel />} />
            <Route path="*" element={<Content />} />
        </Routes>
    );
}

export default RouteElement;