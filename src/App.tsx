import { StaticRouter } from "react-router-dom/server";
import "./App.css";
import DashBoard from "./pages/DashBoard";
import { MemoryRouter } from "react-router-dom";

function Router(props: { children?: React.ReactNode }) {
  const { children } = props;
  if (typeof window === 'undefined') {
    return <StaticRouter location="/">{children}</StaticRouter>;
  }

  return (
      <MemoryRouter initialEntries={['/']} initialIndex={0}>
        {children}
      </MemoryRouter>
  );
}

function App() {

  return (
      <Router>
        <DashBoard/>
      </Router>
  );
}

export default App;
