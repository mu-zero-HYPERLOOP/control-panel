import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import TerminalIcon from '@mui/icons-material/Terminal';
import GamesIcon from '@mui/icons-material/Games';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FlightTakeoff from '@mui/icons-material/FlightTakeoff';
import Speed from '@mui/icons-material/Speed';
import EditRoad from '@mui/icons-material/EditRoad';
import clsx from 'clsx';
import { Link as RouterLink, LinkProps as RouterLinkProps, useNavigate, } from 'react-router-dom';
import { Divider, ListItemButton, Typography } from '@mui/material';
import { TreeItem, TreeItemContentProps, TreeItemProps, TreeView, useTreeItem } from '@mui/x-tree-view';
import { NetworkInformation } from '../nodes/types/NetworkInformation.ts';
import { NodeInformation } from '../nodes/types/NodeInformation.ts';
import React, { useEffect, useState } from "react";
import { invoke } from '@tauri-apps/api';
import Box from "@mui/material/Box";
import SaveIcon from '@mui/icons-material/Save';

interface ListItemLinkProps {
  icon?: React.ReactElement;
  primary: string;
  to: string;
}

const CustomContent = React.forwardRef(function CustomContent(
  props: TreeItemContentProps,
  ref,
) {
  const {
    classes,
    className,
    label,
    nodeId,
    icon: iconProp,
    expansionIcon,
    displayIcon,
  } = props;

  const {
    disabled,
    expanded,
    selected,
    focused,
    handleExpansion,
    preventSelection,
  } = useTreeItem(nodeId);

  const icon = iconProp || expansionIcon || displayIcon;
  const navigate = useNavigate();

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    preventSelection(event);
  };

  const handleExpansionClick = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    handleExpansion(event);
  };

  const handleSelectionClick = () => {
    navigate(nodeId)
  };

  return (
    <div
      className={clsx(className, classes.root, {
        [classes.expanded]: expanded,
        [classes.selected]: selected,
        [classes.focused]: focused,
        [classes.disabled]: disabled,
      })}
      onMouseDown={handleMouseDown}
      ref={ref as React.Ref<HTMLDivElement>}
    >
      <div onClick={handleExpansionClick} className={classes.iconContainer}>
        {icon}
      </div>
      <Typography
        onClick={handleSelectionClick}
        onDoubleClick={handleExpansionClick}
        component="div"
        className={classes.label}
      >
        {label}
      </Typography>
    </div>

  );
});

const CustomTreeItem = React.forwardRef(function CustomTreeItem(
  props: TreeItemProps,
  ref: React.Ref<HTMLLIElement>,
) {
  return <TreeItem ContentComponent={CustomContent} {...props} ref={ref} />;
});

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

export const RouterList = (
  <React.Fragment>
    <ListItemButtonLink to="/" primary="Overview" icon={<GamesIcon />} />
    <ListItemButtonLink to="/TracePanel" primary="Trace" icon={<TerminalIcon />} />
    <ListItemButtonLink to="/LevitationControl" primary="Levitation Control" icon={<FlightTakeoff />} />
    <ListItemButtonLink to="/GuidanceControl" primary="Guidance Control" icon={<EditRoad />} />
    <ListItemButtonLink to="/MotorControl" primary="Motor Control" icon={<Speed />} />
  </React.Fragment>
);

interface NodeEntriesProps {
  nodeInfo: NodeInformation,
}

function NodeEntries({ nodeInfo }: Readonly<NodeEntriesProps>) {

  /*Page name has to equal the nodeId!*/
  return (<>
    {nodeInfo.object_entries.map((entry) =>
      <CustomTreeItem key={nodeInfo.name + "/" + entry} nodeId={nodeInfo.name + "/" + entry} label={entry} />
    )}
  </>);

}

export function NodeList() {
  const [nodes, setNodes] = useState<NodeInformation[]>();

  useEffect(() => {
    async function asyncFetchNetworkInfo() {

      let networkInfo = await invoke<NetworkInformation>("network_information");
      let nodes = [];
      for (let nodeName of networkInfo.node_names) {
        let node_info = await invoke<NodeInformation>("node_information", { nodeName: nodeName });
        nodes.push(node_info);
      }
      setNodes(nodes);
    }
    if (nodes === undefined) {
      asyncFetchNetworkInfo().catch(console.error);
    }
  }, []);

  return (
    <TreeView
      aria-label="icon expansion"
      defaultCollapseIcon={<ExpandMoreIcon />}
      defaultExpandIcon={<ChevronRightIcon />}
    >
      {nodes === undefined 
      ? <></> 
      : nodes.map((node) =>
        <CustomTreeItem key={node.name} nodeId={node.name} label={node.name}>
          <NodeEntries nodeInfo={node} />
        </CustomTreeItem>)
      }

    </TreeView>
  );
}


function ExportListButton() {
  return (
    <li>
      <ListItemButton>
        <ListItemIcon><SaveIcon /></ListItemIcon>
        <ListItemText primary="Export" onClick={() => invoke("export").catch(console.error)} />
      </ListItemButton>
    </li>
  );
}

interface ListEntriesProps {
  open: boolean,
}

export function ListEntries({ open }: Readonly<ListEntriesProps>) {
  if (open) {
    return <>
      {RouterList}
      <Divider sx={{ my: 1 }} />
      <ExportListButton />
      <Divider sx={{ my: 1 }} />
      <Box component="div" sx={{
        height: "calc(100vh - 353px)",
        overflow: 'auto'
      }}>
        <NodeList />
      </Box>
    </>;
  } else {
    return RouterList;
  }
}
