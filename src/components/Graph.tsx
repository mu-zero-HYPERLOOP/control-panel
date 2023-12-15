import { invoke } from '@tauri-apps/api/tauri'
import { listen, Event, UnlistenFn } from "@tauri-apps/api/event";
import { useEffect, useMemo, useRef, useState } from "react";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import ObjectEntryListenHistoryResponse from '../types/ObjectEntryListenHistoryResponse';
import ObjectEntryEvent from '../types/ObjectEntryEvent';
import { ObjectEntryHistoryEvent } from '../types/ObjectEntryHistoryEvent';
import * as d3 from "d3";
import { duration } from '@mui/material';

interface GraphProps {
  nodeName: string,
  oeName: string,
}

function Graph({ nodeName, oeName }: GraphProps) {
  const [history, setHistory] = useState<ObjectEntryEvent[]>([]);
  const svgRef = useRef(null); // see react docs for DOM manipulation with refs


  const frameSize: number = 1000; // in milliseconds
  const minInterval: number = 1000; // in milliseconds

  const svgWidth = 700;
  const svgHeight = 300;

  const xScale = d3.scaleLinear().range([0, svgWidth]).domain([0, 40]);
  const yScale = d3.scaleLinear().range([svgHeight, 0]).domain([0, 200]);

  const line = d3.line()
    .curve(d3.curveBasis)
    .x((d, i: number) => { 
      const oeEvt: ObjectEntryEvent = (d as unknown) as ObjectEntryEvent;
      return xScale(i)})
    .y((d, i: number) => { 
      const oeEvt: ObjectEntryEvent = (d as unknown) as ObjectEntryEvent;
      return yScale(oeEvt.value as number)});

  useEffect(() => {

    const asyncGetInitialData = async () => {

      let historyResponse = await invoke<ObjectEntryListenHistoryResponse>('listen_to_history_of_object_entry',
        { nodeName: nodeName, objectEntryName: oeName, frameSize, minInterval });

      setHistory(historyResponse.history);
      console.log("history response: " + historyResponse);

      const handleNewEvent = (evt: Event<ObjectEntryHistoryEvent>) => {
        setHistory(oldVec => {
          //d3.select(svgRef.current).selectAll("g g path")
          //  .attr("d", line(history));
          //console.log(d3.select(svgRef.current).selectAll("g g path"));
          //console.log(line(history));


          // payload is a vector!
          // interesstingly concat performs a lot worse than push
          //return oldVec.concat(evt.payload) 
          let newVec = oldVec.slice(evt.payload.deprecated_count);
          newVec.push(...evt.payload.new_values);
          console.log("history: " + history);
          console.log("event: " + evt);
          return newVec;
        });
      };

      let unsubscribe = await listen<ObjectEntryHistoryEvent>(historyResponse.event_name, handleNewEvent);

      return () => {
        unsubscribe()
        invoke("unlisten_from_history_of_object_entry",
          { nodeName, objectEntryName: oeName, eventName: historyResponse.event_name }
        ).catch(console.error);
      };
    };

    let unsubscribe: Promise<UnlistenFn> = asyncGetInitialData();
    return () => {
      unsubscribe.then(f => f()).catch(console.error);
    };
  }, [nodeName, oeName]);

  useEffect(() => {
    let svg = d3.select(svgRef.current);
    svg.style("background", "#888888");

    const t = d3.transition("test").duration(minInterval).ease(d3.easeLinear);

    const svgGroup = svg.append("g");

    svgGroup.append("g")
      .attr("clip-path", "url(#clip)")
      .append("path")
      .attr("class", "line")
      .attr("fill", "green")
      .attr("stroke", "red");

  }, []);

  return (<svg ref={svgRef} width={svgWidth} height={svgHeight} color="black"></svg>);


}

export default Graph;
