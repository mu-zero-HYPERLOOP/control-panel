import { Frame } from "./Frame";

export interface TraceObjectEvent {
  frame: Frame,
  timestamp: number,
  delta_time: number,
}
