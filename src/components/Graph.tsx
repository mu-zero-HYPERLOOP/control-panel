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
  const svgRef = useRef("graphRef");
  const lineRef = useRef<any>();
  const xScaleRef = useRef<d3.ScaleLinear<number, number, never>>(d3.scaleLinear().range([0, 100]));

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
        d3.select("path")
          .attr("d", lineRef.current)
          .attr("transform", null);
        // d3.active("path")
        //   .attr("transform", "translate(" + xScaleRef.current(0) + ",0)")
        //   .transition();
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
    const w = 700;
    const h = 300;
    const margin = 40;
    const svg = d3.select(svgRef.current)
      .attr("width", w)
      .attr("height", h)
      .style("background", "#d3d3d3")
      .style("margin", margin)
      .style("overflow", "visible")
    const group = svg.append("g");

    // setting up scaling
    xScaleRef.current = d3.scaleLinear()
      .range([0, w]);
    const yScale = d3.scaleLinear()
      .domain([200, 0])
      .range([h, 0]);

    // setting the axes
    const xAxis = d3.axisBottom(xScaleRef.current)
      .tickFormat(d3.timeFormat("%M:%S"));

    lineRef.current = d3.line()
      .curve(d3.curveBasis)
      .x((d: ObjectEntryEvent, i: number) => { return xScale(d.timestamp)})
      .y((d: ObjectEntryEvent, i: number) => { return yScale(d.value)});
    // setting up the data for svg

    group.append("defs").append("clipPath")
      .attr("id", "clip")
      .append("rect")
      .attr("width", w)
      .attr("height", h);
    group.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + h + ")")
      .call(d3.axisBottom(xScaleRef.current));
    group.append("g")
      .attr("class", "axis axis--y")
      .call(d3.axisLeft(yScale));
    group.append("g")
      .attr("clip-path", "url(#clip)")
      .append("path")
      .datum(history)
      .attr("class", "line")
      .transition()
      .duration(500)
      .ease(d3.easeLinear);

    if (history.length > 0) {
    }

  }, [history]);

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
