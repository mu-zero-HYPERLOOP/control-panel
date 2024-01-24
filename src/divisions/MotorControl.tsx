import {NodeInformation} from "../nodes/types/NodeInformation.ts";
import ObjectEntryPanel from "../nodes/ObjectEntryPanel.tsx";

interface NodesProps {
    nodes: NodeInformation[],
    useGraphScrolling?: boolean,
}

function MotorControl({nodes, useGraphScrolling = false}: NodesProps) {

    return (
        <>
            <h1>Motor Control</h1>
            {nodes.map((entry: NodeInformation) => {
                if (entry.name === "secu")
                    return (<>
                            <ObjectEntryPanel node={entry} name={"cooling_state"} 
                              useGraphScrolling={useGraphScrolling}/>
                            <ObjectEntryPanel node={entry} name={"position"} 
                              useGraphScrolling={useGraphScrolling}/>
                            <ObjectEntryPanel node={entry} name={"velocity"} 
                              useGraphScrolling={useGraphScrolling}/>
                            <ObjectEntryPanel node={entry} name={"acceleration_x"} 
                              useGraphScrolling={useGraphScrolling}/>
                            <ObjectEntryPanel node={entry} name={"acceleration_y"} 
                              useGraphScrolling={useGraphScrolling}/>
                            <ObjectEntryPanel node={entry} name={"acceleration_z"} 
                              useGraphScrolling={useGraphScrolling}/>
                        </>
                    )
            })}
        </>
    );
}

export default MotorControl;
