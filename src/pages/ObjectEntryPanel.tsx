import {NodeInformation} from "../types/NodeInformation";
import {useEffect, useState} from "react";
import {ObjectEntryInformation} from "../types/ObjectEntryInformation.ts";
import {invoke} from "@tauri-apps/api";
import ObjectEntryListenLatestResponse from "../types/ObjectEntryListenLatestResponse.ts";
import ObjectEntryEvent, {ObjectEntryComposite} from "../types/ObjectEntryEvent.ts";
import {Event, listen} from "@tauri-apps/api/event";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import ObjectEntryGraph from "../components/Graph.tsx";

interface ObjectEntryPanelProps {
    node: NodeInformation,
    name: string,   // name of obejct entry
}

interface DisplayObjectEntryEvent {
    currentValue: number | string | ObjectEntryComposite
    node: string
    objectEntry: string
}

function ObjectEntryValue({currentValue, node, objectEntry}: Readonly<DisplayObjectEntryEvent>) {
    const [newValue, setNewValue] = useState<string>("");


    return <Box
        component="form"
        sx={{
            '& > :not(style)': {m: 1, width: '25ch'},
        }}
        noValidate
        autoComplete="off"
    >
        <TextField
            key={"currentValue" + node + "/" + objectEntry}
            id={"currentValue"}
            label="Current value"
            variant="outlined"
            value={currentValue.toString()}
            InputProps={{
                readOnly: true,
            }}/>
        <TextField
            key={"setValue" + node + "/" + objectEntry}
            id={"setValue"}
            label="Set value"
            variant="outlined"
            error={false} //TODO type check and others
            onChange={(event) => {setNewValue(event.target.value)}}
            onKeyDown={(event) => {
                if (event.key == "Enter") {
                    event.preventDefault();
                    invoke("new_object_entry_value", {nodeName: node, objectEntryName: objectEntry, value: newValue})
                }
            }}
        />
    </Box>
}

function ObjectEntryPanel({node, name}: Readonly<ObjectEntryPanelProps>) {
    const [objectEntryInfo, setObjectEntryInfo] = useState<ObjectEntryInformation>({name: "name", id: -1, ty: "int"});
    const [objectEntryEvent, setObjectEntryEvent] = useState<ObjectEntryEvent>({value: 0, timestamp: 0, delta_time: 0})

    async function asyncFetchNetworkInfo() {

        let objectEntryInformation = await invoke<ObjectEntryInformation>("object_entry_information", {
            nodeName: node.name,
            objectEntryName: name
        });
        setObjectEntryInfo(objectEntryInformation);
    }

    async function asyncListenToEvents() {
        let objectEntryListenLatestResponse = await invoke<ObjectEntryListenLatestResponse>("listen_to_latest_object_entry_value", {
            nodeName: node.name,
            objectEntryName: name
        });

        if (objectEntryListenLatestResponse.latest != null) {
            setObjectEntryEvent(objectEntryListenLatestResponse.latest)
        }

        return await listen<ObjectEntryEvent>(objectEntryListenLatestResponse.event_name, (event: Event<ObjectEntryEvent>) => {
            setObjectEntryEvent(event.payload)
        })
    }

    useEffect(() => {
        asyncFetchNetworkInfo().catch(console.error);
        let unlisten = asyncListenToEvents();
        
        return () => {
            invoke("unlisten_from_latest_object_entry_value", {
                nodeName: node.name,
                objectEntryName: name
            })
            unlisten.then(f => f()).catch(console.error);
        }
    }, [node, name]);

    return <>
        <ObjectEntryGraph nodeName={node.name} oeName={name}/>
    </>
}

export default ObjectEntryPanel;

