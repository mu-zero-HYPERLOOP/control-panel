import { Frame } from "./Frame";

export interface TraceObjectEvent {
  frame: Frame,
  timestamp: string,
  delta_time: string,
}
