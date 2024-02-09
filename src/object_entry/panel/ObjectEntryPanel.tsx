import { useEffect, useState } from "react";
import { ObjectEntryInformation } from "../types/ObjectEntryInformation.ts";
import { invoke } from "@tauri-apps/api";
import {
  Paper,
  Skeleton,
  Typography
} from "@mui/material";
import { NodeInformation } from "../../nodes/types/NodeInformation.ts";
import RefreshButton from "./RefreshButton.tsx";
import ObjectEntryGraph from "../graph/ObjectEntryGraph.tsx";
import ExportButton from "./ExportButton.tsx";
import SetValueButton from "./SetValueButton.tsx";
import InterpolationModeButton from "./InterpolationModeButton.tsx";
import { GraphInterpolation } from "../../graph/GraphInterpolation.tsx";
import GraphBufferingButton from "./GraphBufferingButton.tsx";

interface ObjectEntryPanelProps {
  node: NodeInformation,
  name: string,
}

function ObjectEntryPanel({ node, name }: Readonly<ObjectEntryPanelProps>) {

  const [information, setInformation] = useState<ObjectEntryInformation | null>(null);

  const [interpolationMode, setInterpolationMode] = useState<GraphInterpolation>(GraphInterpolation.Step);
  const [buffering, setBuffering] = useState<boolean>(true);

  useEffect(() => {
    async function fetchInformation() {
      let information = await invoke<ObjectEntryInformation>("object_entry_information",
        { nodeName: node.name, objectEntryName: name });
      setInformation(information);
    }

    fetchInformation().catch(console.error);
    return () => {
      setInformation(null);
    };
  }, [node, name]);

  return <Paper sx={{
    marginTop: "30px",
    marginLeft: "8px",
    marginRight: "10px",
    paddingLeft: "12px",
    paddingRight: "12px",
    paddingTop: "45px",
    paddingBottom: "20px",
    width: "calc(100% - 16px)",
    position: "relative"
  }}>
    <Typography sx={{
      position: "absolute",
      top: "-12px",
      left: "12px",
      padding: "1px",

    }} variant="h5">{node.name}::{name}
    </Typography>
    {!information ? <Skeleton variant="rounded" height={"300px"} /> :
      <>
        {information.description ? <Typography sx={{
          position: "absolute",
          top: "18px",
          left: "20px",
          padding: "1px",

        }} variant="subtitle2">{information.description}</Typography>
          : <></>}
        <RefreshButton
          nodeName={node.name}
          objectEntryName={information.name}
          sx={{
            position: "absolute",
            top: "7px",
            left: "calc(100% - 50px)",
          }}
        />
        <ExportButton
          nodeName={node.name}
          objectEntryName={information.name}
          sx={{
            position: "absolute",
            top: "7px",
            left: "calc(100% - 90px)",
          }}
        />
        <SetValueButton
          nodeName={node.name}
          objectEntryInfo={information}
          sx={{
            position: "absolute",
            top: "7px",
            left: "calc(100% - 130px)",
          }}
        />
        <InterpolationModeButton
          sx={{
            position: "absolute",
            top: "7px",
            left: "calc(100% - 170px)",
          }}
          mode={interpolationMode}
          onClick={() => {
            setInterpolationMode(mode => {
              switch (mode) {
                case GraphInterpolation.Step:
                  return GraphInterpolation.Linear;
                case GraphInterpolation.Linear:
                  return GraphInterpolation.MonotoneSpline;
                default:
                  return GraphInterpolation.Step;
              }
            });
          }}
        />
        <GraphBufferingButton
          sx={{
            position: "absolute",
            top: "7px",
            left: "calc(100% - 210px)",
          }}
          buffer={buffering}
          onClick={() => {
            setBuffering(buffering => !buffering);
          }}
        />
        <ObjectEntryGraph
          nodeName={node.name}
          objectEntryName={name}
          timeDomain={1000}
          interpolation={interpolationMode}
          buffering={buffering}
        />
      </>
    }

  </Paper>
}


export default ObjectEntryPanel;

