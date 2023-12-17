import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { invoke } from "@tauri-apps/api";
import ObjectEntryListenHistoryResponse from "../types/ObjectEntryListenHistoryResponse";
import { listen, Event } from "@tauri-apps/api/event";
import { ObjectEntryHistoryEvent } from "../types/ObjectEntryHistoryEvent";
import ObjectEntryEvent from "../types/ObjectEntryEvent";
import { FormControl, InputLabel, MenuItem, Paper, Select, SelectChangeEvent, Stack, Typography } from "@mui/material";


enum D3InterpolationMode {
  BasisSpline,
  BezierCurve,
  CardinalSpline,
  CatmullRomSpline,
  Linear,
  MonotoneSpline,
  NaturalSpline,
  Step
}

enum D3PerformanceMode {
  Info,
  Realtime,
}

interface D3ObjectEntryGraph {
  nodeName: string,
  oeName: string,
  refreshRate: number,
  eventRate: number,
  property: (event: ObjectEntryEvent) => number,
  timeDomainSize: number,
  margin: { top: number, bottom: number, left: number, right: number },
  interpolation: D3InterpolationMode
  performanceMode: D3PerformanceMode,
  height: number
}

function D3ObjectEntryGraph({
  nodeName,
  oeName,
  height,
  refreshRate,
  timeDomainSize,
  property,
  eventRate,
  margin,
  interpolation,
  performanceMode
}: D3ObjectEntryGraph) {

  // use ref so that react can fill the reference before useEffect is called!
  // <svg ref={svgRef}></svg> makes this work!
  const svgRef = useRef() as any;
  const [width, setWidth] = useState(100);

  useEffect(function() {
    // used to scale the xScale so that the right most values are not included
    // this makes clipping pretty, but it also phase shifts all values.
    // bigger values look more pretty, but make the graph less responsive

    let clipInsertionOffset: number;
    switch (performanceMode) {
      case D3PerformanceMode.Info:
        clipInsertionOffset = Math.max(500, eventRate * 2, refreshRate * 2);
        break;
      case D3PerformanceMode.Realtime:
        clipInsertionOffset = 0;
        break;
    }

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    let resizeObserver = new ResizeObserver(
      entries => {
        if (!Array.isArray(entries)) return;
        if (!entries.length) return;
        const entry = entries[0];
        if (width != entry.contentRect.width) {
          setWidth(entry.contentRect.width);
        }
      }
    );
    let current = svgRef.current;
    resizeObserver.observe(current);

    let y = d3.scaleLinear().range([innerHeight, 0]);
    let x = d3.scaleLinear().range([0, innerWidth]);

    const line = d3.line();
    switch (interpolation) {
      case D3InterpolationMode.BasisSpline:
        line.curve(d3.curveBasis)
        break;
      case D3InterpolationMode.BezierCurve:
        line.curve(d3.curveBumpX)
        break;
      case D3InterpolationMode.CardinalSpline:
        line.curve(d3.curveCardinal)
        break;
      case D3InterpolationMode.CatmullRomSpline:
        line.curve(d3.curveCatmullRom)
        break;
      case D3InterpolationMode.Linear:
        line.curve(d3.curveLinear)
        break;
      case D3InterpolationMode.MonotoneSpline:
        line.curve(d3.curveMonotoneX)
        break;
      case D3InterpolationMode.NaturalSpline:
        line.curve(d3.curveNatural)
        break;
      case D3InterpolationMode.Step:
        line.curve(d3.curveStepAfter)
        break;
    }

    line.x(function(d: any) { return x(d.timestamp) })
    line.y(function(d: any) { return y(property(d)); });

    let timeAxis = d3.axisBottom(x)
      .tickFormat(x => `${x as number / 1000.0}s`)
      .ticks(5);

    let yAxis = d3.axisLeft(y).ticks(5);
    const yAxisGrid = d3.axisLeft(y).tickSize(-innerWidth).tickFormat("" as any).ticks(5);

    let history: ObjectEntryEvent[] = [];
    let latestValue : ObjectEntryEvent;
    let maxY = Number.NEGATIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;


    const svg = d3.select(svgRef.current)
      .attr("width", "100%")
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    svg.append("defs").append("clipPath")
      .attr("id", "clip")
      .append("rect")
      .attr("width", innerWidth)
      .attr("height", height);
    let graph = svg.append("g");
    graph.attr("clip-path", "url(#clip)")

    let a = svg.append("g")
      .attr("transform", "translate(0 " + innerHeight + ")")
      .call(timeAxis);

    let b = svg.append("g")
      .attr("transform", "translate(0 0)")
      .call(yAxis);

    let c = graph.append("g")
      .style("color", "#afcdfa")
      .style("stroke-width", 0.5)
      .call(yAxisGrid);


    let value = svg.append("text")
      .attr("x", 20)
      .attr("y", 30)
      .attr("text-anchor", "start")

    function updateValue() {
      value.text(`${Math.round(property(latestValue)*100.0)/100.0}`);
    }

    const group = graph.append("g");

    group.append("path")
      .datum(history)
      .attr("d", line(history as any))
      .attr("class", "line")
      .style("stroke", "#ff1e00")
      .style("stroke-width", 1.5)
      .style("fill", "none");



    let running = true;

    let timestamp = 0;

    function updateXScale() {
      x.domain([timestamp - timeDomainSize, timestamp - clipInsertionOffset]);
    }

    function updateYScale() {
      y.domain([minY, maxY * 1.25]);
    }

    function updateSvgLineGraph() {
      group
        .attr("transform", "");
      group.select(".line")
        .datum(history as any)
        .attr("d", line);
    }

    async function registerHistoryListener() {
      let response = await invoke<ObjectEntryListenHistoryResponse>("listen_to_history_of_object_entry",
        { nodeName, objectEntryName: oeName, frameSize: timeDomainSize, minInterval: eventRate });
      let unlisten = () => invoke("unlisten_from_history_of_object_entry",
        { nodeName, objectEntryName: oeName, eventName: response.event_name });
      return { response, unlisten };
    }

    function handleEvent(event: Event<ObjectEntryHistoryEvent>) {
      // update minY and maxY
      for (let oeEvent of event.payload.new_values) {
        let value = oeEvent.value as number;
        if (value >= maxY) {
          maxY = value;
        }
        if (value <= minY) {
          minY = value;
        }
      }
      
      if (event.payload.new_values.length != 0) {
        latestValue = event.payload.new_values[event.payload.new_values.length - 1];
        updateValue();
      }

      // update history
      history = history.slice(event.payload.deprecated_count);
      history.push(...event.payload.new_values);
    }

    async function listenToHistory(eventName: string) {
      return await listen<ObjectEntryHistoryEvent>(eventName, handleEvent);
    }

    async function asyncTask() {
      let { response: historyResponse, unlisten: unlistenBackend } = await registerHistoryListener();

      history = historyResponse.history;

      // initalize timestamp to the most recent value!
      timestamp = history[history.length - 1].timestamp;

      if (history.length != 0) {
        latestValue = history[history.length - 1];
        updateValue();
      }

      // initalize minX and minY
      for (let event of history) {
        let value = event.value as number;
        if (value >= maxY) {
          maxY = value;
        }
        if (value <= minY) {
          minY = value;
        }
      }

      let unsubscripeJSEvent = await listenToHistory(historyResponse.event_name);
      return () => {
        unsubscripeJSEvent();
        unlistenBackend().catch(console.error);
      };
    }

    let asyncCleanup = asyncTask();


    function renderX() {

      // update the timestamp independent of the actual values!
      // this is to make the transitions continous because if the 
      // delta time changes from transition to transition is doesn't 
      // look smooth
      // Interesstingly i assumed that timestamp would drift over time
      // because we are effectivly integrating a error. But i tested it 
      // for around 3min and it didn't drift a lot so maybe this is actually fine!
      timestamp += refreshRate;

      // update scales and svg graph
      updateXScale();
      updateYScale();
      updateSvgLineGraph();

      a.transition()
        .duration(refreshRate)
        .ease(d3.easeLinear)
        .call(timeAxis);
      b.call(yAxis);

      c.call(yAxisGrid);

      // append another shift animation to the current (active) once.
      // If not handled this would run a infinite transition even if the component or html 
      // element do no even exist.
      // running is set to false during destruction, which aborts the animations
      if (running) {
        d3.active(group.node())?.transition().on("start", renderX)
          .attr("transform", "translate(" + x(timestamp - timeDomainSize - refreshRate) + ",0)");
      }
    }

    // start the refresh loop, which refreshes every "refreshRate" ms.
    group.transition().on("start", renderX).ease(d3.easeLinear).duration(refreshRate);

    return () => {
      resizeObserver.unobserve(current);
      asyncCleanup.then(f => f()).catch(console.error);
      running = false;
      svg.remove()
    }

  }, [
    nodeName,
    oeName,
    eventRate,
    refreshRate,
    timeDomainSize,
    interpolation,
    performanceMode,
    width,
    height]);


  return <svg ref={svgRef as any}></svg>;

}

interface ObjectEntryGraph {
  nodeName: string,
  oeName: string,
}

// horrible solution to perserve the state, but it works pretty well =^)
let defaultInterpolation = D3InterpolationMode.Linear;
let defaultMode = D3PerformanceMode.Info;

function ObjectEntryGraph({
  nodeName,
  oeName,
}: ObjectEntryGraph) {

  const [interpolation, setInterpolation] = useState(defaultInterpolation);

  const [timeDomain, setTimeDomain] = useState(5000.0);

  const [performanceMode, setPerformanceMode] = useState(defaultMode);

  const handleInterpolationChange = (event: SelectChangeEvent) => {
    defaultInterpolation = event.target.value as any as D3InterpolationMode;
    setInterpolation(event.target.value as any as D3InterpolationMode);
  };

  const handlePerformanceModeChange = (event: SelectChangeEvent) => {
    defaultMode = event.target.value as any as D3PerformanceMode;
    setPerformanceMode(event.target.value as any as D3PerformanceMode);
  };

  let refreshRate: number;
  let eventRate: number;
  switch (performanceMode) {
    case D3PerformanceMode.Info:
      refreshRate = 100;
      eventRate = 2000;
      break;
    case D3PerformanceMode.Realtime:
      refreshRate = 10;
      eventRate = 10;
      break;
  }

  useEffect(() => {
    // if the performance mode changes the domain also has to be updated!
    setTimeDomain(oldDomain => clampTimeDomain(oldDomain));
  }, [performanceMode]);

  const clampTimeDomain = (domain: number) => {
    if (domain <= eventRate * 5 / 2) {
      return eventRate * 5 / 2;
    } else if (domain <= 1000.0) {
      return 1000.0;
    } else if (domain >= 60000 * 3) {
      return 60000 * 3;
    }
    return domain;
  }

  const handleScrollWheel = (event: any) => {
    setTimeDomain(oldDomain => {
      let factor: number;
      if (event.altKey) {
        factor = 1;
      } else if (event.shiftKey) {
        factor = 100;
      } else {
        factor = 10;
      }
      let newDomain = oldDomain + (event.deltaY + event.deltaX) * factor;
      return clampTimeDomain(newDomain);
    });
  };

  return <Paper sx={{ 
      marginTop : "24px",
      marginLeft: "8px", 
      marginRight: "10px", 
      paddingLeft: "12px", 
      paddingRight: "12px", 
      paddingTop : "20px",
      paddingBottom : "20px",
      width: "calc(100% - 16px)" ,
      position :"relative"
    }} >
    <Typography sx={{
        position: "absolute",
        top : "-15px",
        left : "12px",
        padding : "1px",

    }} variant="h5">{nodeName}::{oeName}</Typography>
    <Stack direction="row">
      <Paper sx={{ width: "100%", backgroundColor: "#f2f2f2" }}>
        <div onWheel={handleScrollWheel}>
          <D3ObjectEntryGraph
            nodeName={nodeName}
            oeName={oeName}
            refreshRate={refreshRate}
            eventRate={eventRate}
            height={300}
            timeDomainSize={timeDomain}
            property={event => event.value as number}
            margin={{ top: 20, bottom: 20, left: 50, right: 0 }}
            interpolation={interpolation}
            performanceMode={performanceMode}
          />
        </div>
      </Paper>
      <Stack sx={{ marginLeft: 1, marginRight: 1, padding: 0, width: 200 }} >
        <FormControl sx={{ m: 0, minWidth: 150 }} size="small">
          <InputLabel id="interpolation-select">Interpolation</InputLabel>
          <Select
            labelId="interpolation-select-label"
            id="interpolation-select"
            value={interpolation as any as string}
            label="Interpolation"
            onChange={handleInterpolationChange}
          >
            <MenuItem value={D3InterpolationMode.Step}>Step</MenuItem>
            <MenuItem value={D3InterpolationMode.Linear}>Linear</MenuItem>
            <MenuItem value={D3InterpolationMode.BezierCurve}>Bezier Curve</MenuItem>
            <MenuItem value={D3InterpolationMode.BasisSpline}>Basis Spline</MenuItem>
            <MenuItem value={D3InterpolationMode.CardinalSpline}>Cardinal Spline</MenuItem>
            <MenuItem value={D3InterpolationMode.CatmullRomSpline}>CatmullRom Spline</MenuItem>
            <MenuItem value={D3InterpolationMode.MonotoneSpline}>Monotone Spline</MenuItem>
            <MenuItem value={D3InterpolationMode.NaturalSpline}>Natural Spline</MenuItem>
          </Select>
        </FormControl>
        <FormControl sx={{ marginTop: 2, minWidth: 150 }} size="small">
          <InputLabel id="mode-select">Mode</InputLabel>
          <Select
            labelId="mode-select-label"
            id="mode-select"
            value={performanceMode as any as string}
            label="Mode"
            onChange={handlePerformanceModeChange}
          >
            <MenuItem value={D3PerformanceMode.Info}>Info</MenuItem>
            <MenuItem value={D3PerformanceMode.Realtime}>Realtime</MenuItem>
          </Select>
        </FormControl>
      </Stack>
    </Stack>
  </Paper>
}

export default ObjectEntryGraph;

