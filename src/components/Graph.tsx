import { invoke } from '@tauri-apps/api/tauri'
import { listen } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";

interface InitialGraphData {
  values: Graphable[],
  event: string
}

interface Graphable {
  x: number,
  y: number
}

interface GraphProps {
  name: string,
}


function Graph({name}: GraphProps) {
  const [points, setPoints] = useState<Graphable[]>([]);


  useEffect(() => {
    invoke<InitialGraphData>('initialize_graph' , { nodeName: "ab", oeName: "cde" })
      .then((initialGraphData) => {
        setPoints(initialGraphData.values);
      }).catch((error) => {
        console.error("error initializing graph " + error);
      });

    const handleRxPoint = (evt: any) => {
        setPoints(oldVec => {
          let newVec = oldVec.slice(1, oldVec.length);
          newVec.push(evt.payload);
          return newVec;
        })};

    let unsubscribe = listen<Graphable>(name , handleRxPoint);

    // the lambda returned will be executed on cleanup of the effect.
    return () => {
        console.log("graph destructor called");
        unsubscribe.then(f => f());
    };
  }, []);

    return <LineChart width={1200} height={500} data={points}>
      <Line type="linear" dataKey="y" stroke="#ff0000" isAnimationActive={false} dot={false} />
      <CartesianGrid stroke="#00ff00" strokeDasharray="5 5"/>
      <XAxis dataKey="x"/>
      <YAxis />
      <Tooltip />
    </LineChart>
}

export default Graph;
