import * as React from 'react';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import TerminalIcon from '@mui/icons-material/Terminal';
import GamesIcon from '@mui/icons-material/Games';

import {
    Link as RouterLink,
    LinkProps as RouterLinkProps,
} from 'react-router-dom';
import { ListItemButton } from '@mui/material';

interface ListItemLinkProps {
    icon?: React.ReactElement;
    primary: string;
    to: string;
}

const Link = React.forwardRef<HTMLAnchorElement, RouterLinkProps>(function Link(
    itemProps,
    ref,
) {
    return <RouterLink ref={ref} {...itemProps} role={undefined} />;
});

function ListItemButtonLink(props: ListItemLinkProps) {
    const { icon, primary, to } = props;

    return (
        <li>
            <ListItemButton component={Link} to={to}>
                {icon ? <ListItemIcon>{icon}</ListItemIcon> : null}
                <ListItemText primary={primary} />
            </ListItemButton>
        </li>
    );
}

export const ListRouter = (
    <React.Fragment>
            <ListItemButtonLink to="/" primary="Control Panel" icon={<GamesIcon/>}/>
            <ListItemButtonLink to="/DebugPanel" primary="Debug Panel" icon={<TerminalIcon/>}/>
    </React.Fragment>
    );
