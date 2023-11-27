import { NodeInformation } from "../types/NodeInformation";

interface ObjectEntryPanelProps {
  node : NodeInformation,
  name : string,
}

function ObjectEntryPanel({node, name} : ObjectEntryPanelProps) {
  return <h1> Hello {name} of {node.name} </h1>
}

export default ObjectEntryPanel;

