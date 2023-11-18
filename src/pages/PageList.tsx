import * as React from 'react';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

import ListItem from '@mui/material/ListItem';
import InboxIcon from '@mui/icons-material/Inbox';
import {
    Link as RouterLink,
    LinkProps as RouterLinkProps,
} from 'react-router-dom';

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

function ListItemLink(props: ListItemLinkProps) {
    const { icon, primary, to } = props;

    return (
        <li>
            <ListItem button component={Link} to={to}>
                {icon ? <ListItemIcon>{icon}</ListItemIcon> : null}
                <ListItemText primary={primary} />
            </ListItem>
        </li>
    );
}

export const ListRouter = (
            <React.Fragment>
                <ListItemLink to="/" primary="Control Panel" icon={<InboxIcon/>}/>
                <ListItemLink to="/DebugPanel" primary="Debug Panel" icon={<InboxIcon/>}/>
            </React.Fragment>

    );
