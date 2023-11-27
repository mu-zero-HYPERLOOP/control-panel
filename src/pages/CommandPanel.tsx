import { NodeInformation } from "../types/NodeInformation";

interface CommandPanelProps {
  node : NodeInformation,
  name : string,
}

function CommandPanel({node, name} : CommandPanelProps){
  return <h1> Hello {name} of {node.name}</h1>
}

export default CommandPanel;
