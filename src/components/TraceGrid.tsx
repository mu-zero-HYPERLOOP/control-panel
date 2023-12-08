import { Box, Collapse, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, styled, Stack, Typography, Switch } from "@mui/material";
import { invoke } from "@tauri-apps/api";
import { listen } from "@tauri-apps/api/event";
import React, { useEffect, useState, useRef } from "react";
import FrameName from "./FrameName";
import FrameId from "./FrameId";
import FrameData from "./FrameData";
import FrameDlc from "./FrameDlc";
import FrameTime from "./FrameTime";
import { TraceObjectEvent } from "../types/TraceObjectEvent";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import { TypeFrame } from "../types/TypeFrame";
import TypeFrameDetail from "./TypeFrameDetail";
import { SignalFrame } from "../types/SignalFrame";
import SignalFrameDetail from "./SignalFrameDetail";
import { UndefinedFrame } from "../types/UndefinedFrame";
import { ErrorFrame } from "../types/ErrorFrame";
import { Virtuoso, TableVirtuoso, TableComponents } from 'react-virtuoso';

import TraceSearchBar from "./TraceSearchBar";

// Main Paper component with gradient background
const StyledPaper = styled(Paper)({
  background: 'black',
  color: '#FFFFFF',
  overflow: 'hidden',
});

const TableHeaderCell = styled(TableCell)({
  backgroundColor: 'gray', // Black background for header
  color: '#FFFFFF', // White text
  position: 'relative', // For positioning the sorting icons
  cursor: 'pointer', // Change cursor to pointer on hover
});

const SignalFrameCell = styled(TableCell)(({ theme }) =>
  theme.unstable_sx({
    color: 'primary',
    backgroundColor: "#D3D3D3",
  }),
);

const TypeFrameCell = styled(TableCell)(({ theme }) =>
  theme.unstable_sx({
    color: 'primary',
    backgroundColor: "#D3D3D3",
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

const IconButtonStyled = styled(IconButton)({
  background: 'white',
  color: '#00d6ba', // Color for icons
});



interface SignalFrameRowProps {
  frame: SignalFrame,
  timestamp: string,
}

function SignalFrameRow({ frame, timestamp }: SignalFrameRowProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButtonStyled
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButtonStyled>
        </TableCell>
        <SignalFrameCell align="left"><FrameName frame={frame} /></SignalFrameCell>
        <SignalFrameCell align="left"><FrameId frame={frame} /></SignalFrameCell>
        <SignalFrameCell align="left"><FrameData frame={frame} /></SignalFrameCell>
        <SignalFrameCell align="left"><FrameDlc frame={frame} /></SignalFrameCell>
        <SignalFrameCell align="left"><FrameTime timestamp={timestamp} /></SignalFrameCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0, background: 'white' }} colSpan={6}>
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
  timestamp: string,
}


function TypeFrameRow({ frame, timestamp }: TypeFrameRowProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TypeFrameCell>
          <IconButtonStyled
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButtonStyled>
        </TypeFrameCell>
        <TypeFrameCell align="left"><FrameName frame={frame} /></TypeFrameCell>
        <TypeFrameCell align="left"><FrameId frame={frame} /></TypeFrameCell>
        <TypeFrameCell align="left"><FrameData frame={frame} /></TypeFrameCell>
        <TypeFrameCell align="left"><FrameDlc frame={frame} /></TypeFrameCell>
        <TypeFrameCell align="left"><FrameTime timestamp={timestamp} /></TypeFrameCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0,  background: 'white' }} colSpan={6}>
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
  timestamp: string,
}



function UndefinedFrameRow({ frame, timestamp }: UndefinedFrameRowProps) {
  return (
    <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
      <UndefinedFrameCell>
        <IconButtonStyled
          aria-label="expand row"
          size="small"
        />
      </UndefinedFrameCell>
      <UndefinedFrameCell align="left" />
      <UndefinedFrameCell align="left"><FrameId frame={frame} /></UndefinedFrameCell>
      <UndefinedFrameCell align="left"><FrameData frame={frame} /></UndefinedFrameCell>
      <UndefinedFrameCell align="left"><FrameDlc frame={frame} /></UndefinedFrameCell>
      <UndefinedFrameCell align="left"><FrameTime timestamp={timestamp} /></UndefinedFrameCell>
    </TableRow>
  );
}

interface ErrorFrameRowProps {
  frame: ErrorFrame,
  timestamp: string,
}


function ErrorFrameRow({ frame, timestamp }: ErrorFrameRowProps) {
  return (
    <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
      <ErrorFrameCell>
        <IconButtonStyled
          aria-label="expand row"
          size="small"
        />
      </ErrorFrameCell>
      <ErrorFrameCell align="left"><FrameName frame={frame} /></ErrorFrameCell>
      <ErrorFrameCell align="left" />
      <ErrorFrameCell align="left"><FrameData frame={frame} /></ErrorFrameCell>
      <ErrorFrameCell align="left" />
      <ErrorFrameCell align="left"><FrameTime timestamp={timestamp} /></ErrorFrameCell>
    </TableRow>
  );
}

interface RowProps {
  evt: TraceObjectEvent,
  timeAbsolute: boolean,
}

function Row({ evt, timeAbsolute }: RowProps) {
  if (evt.frame.TypeFrame != undefined) {
    return <TypeFrameRow frame={evt.frame.TypeFrame}
      timestamp={timeAbsolute ? evt.timestamp : evt.delta_time} />
  } else if (evt.frame.SignalFrame != undefined) {
    return <SignalFrameRow frame={evt.frame.SignalFrame}
      timestamp={timeAbsolute ? evt.timestamp : evt.delta_time} />
  } else if (evt.frame.UndefinedFrame != undefined) {
    return <UndefinedFrameRow frame={evt.frame.UndefinedFrame}
      timestamp={timeAbsolute ? evt.timestamp : evt.delta_time} />
  } else if (evt.frame.ErrorFrame != undefined) {
    return <ErrorFrameRow frame={evt.frame.ErrorFrame}
      timestamp={timeAbsolute ? evt.timestamp : evt.delta_time} />
  }
}

// Define a state to manage the sorting direction
const useSortState = () => {
  const [sortField, setSortField] = useState('Name');
  const [sortDirection, setSortDirection] = useState('asc');

  const toggleSortDirection = (field: React.SetStateAction<string>) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return { sortField, sortDirection, toggleSortDirection };
};

function TraceGrid() {

  const rowsRef = useRef<TraceObjectEvent[]>([]);
  const [filteredRows, setFilteredRows] = useState<TraceObjectEvent[]>([]);
  const { sortField, sortDirection, toggleSortDirection } = useSortState();
  const searchStringRef = useRef("");
  const [timeAbsolute, setTimeAbsolute] = useState(false);

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
    <StyledPaper sx={{ width: '100%' }}>
      <Box sx={{ padding: "10px", textAlign: "center" }}>
        <TraceSearchBar onSearch={filterRows} />
      </Box>
      <TableContainer sx={{ maxHeight: 800 }}>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow >
              <TableHeaderCell />
              <TableHeaderCell align="left" onClick={() => toggleSortDirection('Name')}>
                Name
                {sortField === 'Name' && (sortDirection === 'asc' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />)}
              </TableHeaderCell>
              <TableHeaderCell align="left" onClick={() => toggleSortDirection('Id')}>
                Id
                {sortField === 'Id' && (sortDirection === 'asc' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />)}
              </TableHeaderCell>
              <TableHeaderCell align="left" onClick={() => toggleSortDirection('Data')}>
                Data
                {sortField === 'Data' && (sortDirection === 'asc' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />)}
              </TableHeaderCell>
              <TableHeaderCell align="left" onClick={() => toggleSortDirection('Dlc')}>
                Dlc
                {sortField === 'Dlc' && (sortDirection === 'asc' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />)}
              </TableHeaderCell>
              <TableHeaderCell align="left" onClick={() => toggleSortDirection('Time')}>
                {timeAbsolute ? "Absolute Time" : "Relative Time"}
          <Stack direction="row" spacing={1} alignItems="center">
            <Switch onChange={() => {setTimeAbsolute((absolute) => !absolute)}}
              size="small" sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                    '&+.MuiSwitch-track': {
                    opacity: 1,
                    backgroundColor: 'white',
                  }
                },
                '& .MuiSwitch-track': {
                  opacity: 1,
                  backgroundColor: 'white',
                },
                '& .MuiSwitch-thumb': {
                  backgroundColor: '#00d6ba'
                },
              }} />
          </Stack>
                {sortField === 'Time' && (sortDirection === 'asc' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />)}
              </TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRows.map((evt, index) => {
              return <Row evt={evt} key={index} timeAbsolute={timeAbsolute} /> 
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </StyledPaper>
  );
}

export default TraceGrid;
