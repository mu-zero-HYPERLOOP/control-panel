
interface FrameTimeProps {
  timestamp: string
}

function FrameTime({ timestamp }: FrameTimeProps) {

  return <p> {timestamp} </p>
}

export default FrameTime;
