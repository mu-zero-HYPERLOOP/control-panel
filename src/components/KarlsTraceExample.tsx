import { Box, Collapse, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, styled } from "@mui/material";
import { invoke } from "@tauri-apps/api";
import { listen } from "@tauri-apps/api/event";

import React, { useEffect, useState, useRef } from "react";
import Frame from "../types/Frame";
import FrameName from "./FrameName";
import FrameId from "./FrameId";
import FrameData from "./FrameData";
import FrameDlc from "./FrameDlc";
import FrameTime from "./FrameTime";
import { TraceObjectEvent } from "../types/TraceObjectEvent";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { TypeFrame } from "../types/TypeFrame";
import TypeFrameDetail from "./TypeFrameDetail";
import { SignalFrame } from "../types/SignalFrame";
import SignalFrameDetail from "./SignalFrameDetail";
import { UndefinedFrame } from "../types/UndefinedFrame";
import { ErrorFrame } from "../types/ErrorFrame";

import TraceSearchBar from "./TraceSearchBar";


const TableHeaderCell = styled(TableCell)(({ theme }) =>
  theme.unstable_sx({
    color: "primary",
    backgroundColor: "grey",
  }),
);

const SignalFrameCell = styled(TableCell)(({ theme }) =>
  theme.unstable_sx({
    color: "primary",
    backgroundColor: "grey",
  }),
);

const TypeFrameCell = styled(TableCell)(({ theme }) =>
  theme.unstable_sx({
    color: "primary",
    backgroundColor: "white",
  }),
);

const UndefinedFrameCell = styled(TableCell)(({ theme }) =>
  theme.unstable_sx({
    color: "primary",
    backgroundColor: "yellow",
  }),
);

const ErrorFrameCell = styled(TableCell)(({ theme }) =>
  theme.unstable_sx({
    color: "primary",
    backgroundColor: "red",
  }),
);



interface SignalFrameRowProps {
  frame: SignalFrame,
  timestamp: number,
  deltaTime: number,
}

function SignalFrameRow({ frame, timestamp, deltaTime }: SignalFrameRowProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <SignalFrameCell align="left"><FrameName frame={frame} /></SignalFrameCell>
        <SignalFrameCell align="left"><FrameId frame={frame} /></SignalFrameCell>
        <SignalFrameCell align="left"><FrameData frame={frame} /></SignalFrameCell>
        <SignalFrameCell align="left"><FrameDlc frame={frame} /></SignalFrameCell>
        <SignalFrameCell align="left"><FrameTime timestamp={timestamp} deltaTime={deltaTime} /></SignalFrameCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <SignalFrameDetail frame={frame} />
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

interface TypeFrameRowProps {
  frame: TypeFrame,
  timestamp: number,
  deltaTime: number,
}


function TypeFrameRow({ frame, timestamp, deltaTime }: TypeFrameRowProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TypeFrameCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TypeFrameCell>
        <TypeFrameCell align="left"><FrameName frame={frame} /></TypeFrameCell>
        <TypeFrameCell align="left"><FrameId frame={frame} /></TypeFrameCell>
        <TypeFrameCell align="left"><FrameData frame={frame} /></TypeFrameCell>
        <TypeFrameCell align="left"><FrameDlc frame={frame} /></TypeFrameCell>
        <TypeFrameCell align="left"><FrameTime timestamp={timestamp} deltaTime={deltaTime} /></TypeFrameCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <TypeFrameDetail frame={frame} />
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

interface UndefinedFrameRowProps {
  frame: UndefinedFrame
  timestamp: number,
  deltaTime: number,
}



function UndefinedFrameRow({ frame, timestamp, deltaTime }: UndefinedFrameRowProps) {
  return (
    <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
      <UndefinedFrameCell>
        <IconButton
          aria-label="expand row"
          size="small"
        />
      </UndefinedFrameCell>
      <UndefinedFrameCell align="left" />
      <UndefinedFrameCell align="left"><FrameId frame={frame} /></UndefinedFrameCell>
      <UndefinedFrameCell align="left"><FrameData frame={frame} /></UndefinedFrameCell>
      <UndefinedFrameCell align="left"><FrameDlc frame={frame} /></UndefinedFrameCell>
      <UndefinedFrameCell align="left"><FrameTime timestamp={timestamp} deltaTime={deltaTime} /></UndefinedFrameCell>
    </TableRow>
  );
}

interface ErrorFrameRowProps {
  frame: ErrorFrame,
  timestamp: number,
  deltaTime: number,
}


function ErrorFrameRow({ frame, timestamp, deltaTime }: ErrorFrameRowProps) {
  return (
    <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
      <ErrorFrameCell>
        <IconButton
          aria-label="expand row"
          size="small"
        />
      </ErrorFrameCell>
      <ErrorFrameCell align="left"><FrameName frame={frame} /></ErrorFrameCell>
      <ErrorFrameCell align="left" />
      <ErrorFrameCell align="left"><FrameData frame={frame} /></ErrorFrameCell>
      <ErrorFrameCell align="left" />
      <ErrorFrameCell align="left"><FrameTime timestamp={timestamp} deltaTime={deltaTime} /></ErrorFrameCell>
    </TableRow>
  );
}

interface RowProps {
  evt: TraceObjectEvent
}

function Row({ evt }: RowProps) {
  if (evt.frame.TypeFrame != undefined) {
    return <TypeFrameRow frame={evt.frame.TypeFrame}
      timestamp={evt.timestamp} deltaTime={evt.delta_time} />
  } else if (evt.frame.SignalFrame != undefined) {
    return <SignalFrameRow frame={evt.frame.SignalFrame}
      timestamp={evt.timestamp} deltaTime={evt.delta_time} />
  } else if (evt.frame.UndefinedFrame != undefined) {
    return <UndefinedFrameRow frame={evt.frame.UndefinedFrame}
      timestamp={evt.timestamp} deltaTime={evt.delta_time} />
  } else if (evt.frame.ErrorFrame != undefined) {
    return <ErrorFrameRow frame={evt.frame.ErrorFrame}
      timestamp={evt.timestamp} deltaTime={evt.delta_time} />
  }
}

function KarlsTraceExample() {

  const rowsRef = useRef<TraceObjectEvent[]>([]);
  const [filteredRows, setFilteredRows] = useState<TraceObjectEvent[]>([]);
  const searchStringRef = useRef("");

  function handle_event(event: TraceObjectEvent) {
    let index = rowsRef.current.findIndex((f) => {
      if (f.frame.TypeFrame != undefined && event.frame.TypeFrame != undefined) {
        return f.frame.TypeFrame.id === event.frame.TypeFrame.id &&
          f.frame.TypeFrame.ide === event.frame.TypeFrame.ide;
      } else if (f.frame.SignalFrame != undefined && event.frame.SignalFrame) {
        return f.frame.SignalFrame.id === event.frame.SignalFrame.id &&
          f.frame.SignalFrame.ide === event.frame.SignalFrame.ide;
      } else if (f.frame.UndefinedFrame != undefined && event.frame.UndefinedFrame != undefined) {
        return f.frame.UndefinedFrame.id === event.frame.UndefinedFrame.id &&
          f.frame.UndefinedFrame.ide === event.frame.UndefinedFrame.ide;
      } else if (f.frame.ErrorFrame != undefined && event.frame.ErrorFrame != undefined) {
        return f.frame.ErrorFrame.data === event.frame.ErrorFrame.data;
      } else {
        return false;
      }
    });
    if (index == -1) {
      rowsRef.current.push(event);
    } else {
      rowsRef.current[index] = event;
    }
  }

  useEffect(() => {
    invoke<TraceObjectEvent[]>("listen_to_trace").then((traceObjectEvents) => {
      for (let traceObjectEvent of traceObjectEvents) {
        console.log("initial frame: " + traceObjectEvent.frame);
        handle_event(traceObjectEvent);
      }
      filterRows(searchStringRef.current);
    });

    let trace_event_listener = listen<TraceObjectEvent[]>("trace", (event) => {
      console.log("trace listener triggered with:");
      console.log(event.payload);
      for (let traceObjectEvent of event.payload) {
        console.log(traceObjectEvent);
        handle_event(traceObjectEvent);
      }
      filterRows(searchStringRef.current);
    });
    return () => {
      invoke("unlisten_to_trace")
      trace_event_listener.then((f) => f());
    }
  }, []);

  const filterRows = (searchText: string) => {
    searchStringRef.current = searchText;
    if (searchText === "") {
      setFilteredRows(rowsRef.current.slice());
    } else {
      const filtered = rowsRef.current.filter((o) => {
        const frameName =
          (o.frame.TypeFrame?.name ||
            o.frame.SignalFrame?.name ||
            o.frame.ErrorFrame?.name ||
            "") as string; // Handle all possible frame types and cast to string
        return frameName.includes(searchText);
      });
      setFilteredRows(filtered);
    }
  };

  // maxHeight : 800 sucks asss
  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <Box sx={{ padding: "10px", textAlign: "center" }}>
        <TraceSearchBar onSearch={filterRows} />
      </Box>
      <TableContainer sx={{ maxHeight: 800 }}>
        <Table stickyHeader aria-label="sticky table">
          <TableHead sx={{
            backgroundColor: "primary",
          }}>
            <TableRow >
              <TableHeaderCell />
              <TableHeaderCell align="left">Name</TableHeaderCell>
              <TableHeaderCell align="left">Id</TableHeaderCell>
              <TableHeaderCell align="left">Data</TableHeaderCell>
              <TableHeaderCell align="left">Dlc</TableHeaderCell>
              <TableHeaderCell align="left">Time</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRows.map((evt, index) => {
              return <Row evt={evt} key={index} />;
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

export default KarlsTraceExample;
