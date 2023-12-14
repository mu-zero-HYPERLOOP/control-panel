import { invoke } from '@tauri-apps/api/tauri'
import { listen, Event, UnlistenFn } from "@tauri-apps/api/event";
import { useEffect, useRef, useState } from "react";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import ObjectEntryListenHistoryResponse from '../types/ObjectEntryListenHistoryResponse';
import ObjectEntryEvent from '../types/ObjectEntryEvent';
import { ObjectEntryHistoryEvent } from '../types/ObjectEntryHistoryEvent';
import * as d3 from "d3";

interface GraphProps {
  nodeName: string,
  oeName: string,
}

function Graph({ nodeName, oeName }: GraphProps) {
  const [history, setHistory] = useState<ObjectEntryEvent[]>([]);
  const svgRef = useRef(null); // see react docs for DOM manipulation with refs
  const xScaleRef = useRef<d3.ScaleLinear<number, number, never>>(d3.scaleLinear().range([0, 100]));
  const yScaleRef = useRef<d3.ScaleLinear<number, number, never>>(d3.scaleLinear().range([0, 100]));
  const line = d3.line()
      .curve(d3.curveBasis)
      .x((d, i: number) => { 
        const oeEvt: ObjectEntryEvent = (d as unknown) as ObjectEntryEvent;
        return xScaleRef.current(i)})
      .y((d, i: number) => { 
        const oeEvt: ObjectEntryEvent = (d as unknown) as ObjectEntryEvent;
        return yScaleRef.current(oeEvt.value as number)});


  const frameSize: number = 1000; // in milliseconds
  const minInterval: number = 1000; // in milliseconds


  useEffect(() => {

    const asyncGetInitialData = async () => {

      let historyResponse = await invoke<ObjectEntryListenHistoryResponse>('listen_to_history_of_object_entry',
        { nodeName: nodeName, objectEntryName: oeName, frameSize, minInterval });

      setHistory(historyResponse.history);

      const handleNewEvent = (evt: Event<ObjectEntryHistoryEvent>) => {
        setHistory(oldVec => {
          // payload is a vector!
          // interesstingly concat performs a lot worse than push
          //return oldVec.concat(evt.payload) 
          let newVec = oldVec.slice(evt.payload.deprecated_count);
          newVec.push(...evt.payload.new_values);
          return newVec;
        })
        // redraw chart line
        let path = d3.select(svgRef.current).select("g g path.line")
          .attr("d", line(history))
          .attr("transform", null);
        path
          .attr("transform", "translate(" + xScaleRef.current(10) + ",0)")
          .transition()
          .on("start", () => { console.log("transition start listener") })
          .on("end", () => {console.log("transition ended")})
          .on("interrupt", () => {console.log("transition interrupted")})
          .on("cancel", () => {console.log("transition canceled")});
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
    console.log("d3 useEffect called");
    // setting up svg
    const width = 700;
    const height = 300;
    const margin = 40;
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .style("background", "#d3d3d3")
      .style("margin", margin)
      .style("overflow", "visible")
    const svgGroup = svg.append("g");

    // setting up scaling
    xScaleRef.current = d3.scaleLinear()
      .domain([0, 100])
      .range([0, width]);
    yScaleRef.current = d3.scaleLinear()
      .domain([0, 200])
      .range([height, 0]);

    // set up clipping of plot outside of chart rectangle
    svgGroup.append("defs").append("clipPath")
      .attr("id", "clip")
      .append("rect")
      .attr("width", width)
      .attr("height", height);
    // create subgroups for x- and y-axis
    svgGroup.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(xScaleRef.current));
    svgGroup.append("g")
      .attr("class", "axis axis--y")
      .call(d3.axisLeft(yScaleRef.current));
    // create subgroup for actual line of chart (path)
    svgGroup.append("g")
      .attr("clip-path", "url(#clip)")
      .append("path")
      .datum(history)
      .attr("class", "line")
      .transition()
      .duration(500)
      .ease(d3.easeLinear)
      .on("start", () => { console.log("transition start useEffect") });

    if (history.length > 0) {
    }

  }, []);

  return (<div>
    <svg ref={svgRef}></svg>

  </div>);

  return <LineChart width={600} height={500} data={history}>
    <Line type="linear" dataKey="value" stroke="black" isAnimationActive={false} dot={false} />
    <CartesianGrid stroke="secondary" strokeDasharray="5 5" />
    <XAxis dataKey="timestamp" />
    <YAxis />
    <Tooltip />
  </LineChart>
}

export default Graph;
