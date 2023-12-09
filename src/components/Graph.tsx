import { invoke } from '@tauri-apps/api/tauri'
import { UnlistenFn, listen } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import ObjectEntryListenHistoryResponse from '../types/ObjectEntryListenHistoryResponse';
import ObjectEntryEvent from '../types/ObjectEntryEvent';

interface GraphProps {
  nodeName: string,
  oeName: string,
}


function Graph({ nodeName, oeName }: GraphProps) {
  const [history, setHistory] = useState<ObjectEntryEvent[]>([]);


  useEffect(() => {
    console.log("graph useEffect called");

    const asyncGetInitialData = async () => {

      const handleInitialGraphData = (initialGraphData: ObjectEntryListenHistoryResponse) => {
        console.log("graph handling initial data");
        setHistory(initialGraphData.history);
        // set type of oe

      };

      let historyResponse = await invoke<ObjectEntryListenHistoryResponse>('listen_to_history_of_object_entry',
        { nodeName: nodeName, objectEntryName: oeName });

      handleInitialGraphData(historyResponse);

      const handleNewEvent = (evt: any) => {
        console.log("graph received batch event: " + evt);
        setHistory(oldVec => {
          let newVec = oldVec.slice(evt.payload.length);
          newVec.push(evt.payload);
          return newVec;
        })
      };

      console.log("graph listening to events of name: " + historyResponse.event_name);
      return await listen<ObjectEntryEvent[]>(historyResponse.event_name, handleNewEvent);

    };

    let unsubscribe = asyncGetInitialData();


    return () => {
      console.log("graph destructor called");
      unsubscribe.then(f => f()).catch(console.error);
    };
  }, [nodeName, oeName]);

  console.log("graph rendered");
  return <>kdsla</>
  return <LineChart width={1200} height={500} data={history}>
    <Line type="linear" dataKey="value" stroke="black" isAnimationActive={false} dot={false} />
    <CartesianGrid stroke="secondary" strokeDasharray="5 5" />
    <XAxis dataKey="timestamp" />
    <YAxis />
    <Tooltip />
  </LineChart>
}

export default Graph;
