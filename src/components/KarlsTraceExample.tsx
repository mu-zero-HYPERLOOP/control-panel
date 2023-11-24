import { Box, Collapse, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, styled } from "@mui/material";
import { invoke } from "@tauri-apps/api";
import { listen } from "@tauri-apps/api/event";

import React, { useEffect, useState } from "react";
import Frame from "../types/Frame";
import FrameName from "./FrameName";
import FrameId from "./FrameId";
import FrameData from "./FrameData";
import FrameDlc from "./FrameDlc";
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
}

function SignalFrameRow({ frame }: SignalFrameRowProps) {
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
}


function TypeFrameRow({ frame }: TypeFrameRowProps) {
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
}



function UndefinedFrameRow({ frame }: UndefinedFrameRowProps) {
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
    </TableRow>
  );
}

interface ErrorFrameRowProps {
  frame: ErrorFrame,
}


function ErrorFrameRow({ frame }: ErrorFrameRowProps) {
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
    </TableRow>
  );
}

interface RowProps {
  frame: Frame
}

function Row({ frame }: RowProps) {
  if (frame.TypeFrame != undefined) {
    return <TypeFrameRow frame={frame.TypeFrame} />
  } else if (frame.SignalFrame != undefined) {
    return <SignalFrameRow frame={frame.SignalFrame} />
  } else if (frame.UndefinedFrame != undefined) {
    return <UndefinedFrameRow frame={frame.UndefinedFrame} />
  } else if (frame.ErrorFrame != undefined) {
    return <ErrorFrameRow frame={frame.ErrorFrame} />
  }
}

function KarlsTraceExample() {

  const [rows, setRows] = useState<Frame[]>([]);
  const [filteredRows, setFilteredRows] = useState<Frame[]>([]);

  function handle_event(frame: Frame) {
    setRows((rows) => {
      let index = rows.findIndex((f) => {
        if (f.TypeFrame != undefined && frame.TypeFrame != undefined) {
          return f.TypeFrame.id === frame.TypeFrame.id &&
            f.TypeFrame.ide === frame.TypeFrame.ide;
        } else if (f.SignalFrame != undefined && frame.SignalFrame) {
          return f.SignalFrame.id === frame.SignalFrame.id &&
            f.SignalFrame.ide === frame.SignalFrame.ide;
        } else if (f.UndefinedFrame != undefined && frame.UndefinedFrame != undefined) {
          return f.UndefinedFrame.id === frame.UndefinedFrame.id &&
            f.UndefinedFrame.ide === frame.UndefinedFrame.ide;
        } else if (f.ErrorFrame != undefined && frame.ErrorFrame != undefined) {
          return f.ErrorFrame.data === frame.ErrorFrame.data;
        } else {
          return false;
        }
      });
      if (index == -1) {
        let new_rows = rows.slice();
        new_rows.push(frame);
        return new_rows;
      } else {
        let new_rows = rows.slice();
        new_rows[index] = frame;
        return new_rows;
      }
    });
  }

  useEffect(() => {
    invoke<Frame[]>("listen_to_trace").then((frames) => {
      for (let frame of frames) {
        console.log(frame);
        handle_event(frame);
      }
    });

    let trace_event_listener = listen<Frame[]>("trace", (event) => {
      for (let frame of event.payload) {
        handle_event(frame);
      }
    });
    return () => {
      invoke("unlisten_to_trace")
      trace_event_listener.then((f) => f());
    }
  }, []);

  const filterRows = (searchText: string) => {
    if (searchText === "") {
      setFilteredRows(rows);
    } else {
      const filtered = rows.filter((frame) => {
        const frameName =
          (frame.TypeFrame?.name ||
            frame.SignalFrame?.name ||
            frame.ErrorFrame?.name ||
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
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRows.map((frame, index) => {
              return <Row frame={frame} key={index} />;
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

export default KarlsTraceExample;
