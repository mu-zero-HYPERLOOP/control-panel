import {NodeInformation} from "../types/NodeInformation";
import {useEffect, useState} from "react";
import {ObjectEntryInformation} from "../types/ObjectEntryInformation.ts";
import {invoke} from "@tauri-apps/api";
import Graph from "../components/Graph.tsx";

interface ObjectEntryPanelProps {
    node: NodeInformation,
    name: string,   // name of obejct entry
}

function ObjectEntryPanel({node, name}: ObjectEntryPanelProps) {
    const [objectEntry, setObjectEntry] = useState<ObjectEntryInformation>({name: "", id: -1});

    async function asyncFetchNetworkInfo() {

        let objectEntryInformation = await invoke<ObjectEntryInformation>("object_entry_information", {
            nodeName: node.name,
            objectEntryName: name
        });
        setObjectEntry(objectEntryInformation);
    }

    useEffect(() => {
        asyncFetchNetworkInfo().catch(console.error);
    }, [node, name]);


    return <>
        <h1> Hello {objectEntry.name} of {node.name} </h1>
        <Graph nodeName={node.name} oeName={name} />
        <label>
            Value: <input name="SetObjectDictionaryValue"/>
        </label>
    </>
}

export default ObjectEntryPanel;

