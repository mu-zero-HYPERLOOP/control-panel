import { StaticRouter } from "react-router-dom/server";
import "./App.css";
import DashBoard from "./dashboard/DashBoard.tsx";
import { MemoryRouter } from "react-router-dom";
import {ThemeProvider, createTheme} from "@mui/material";
import {SnackbarProvider} from "notistack";
import NotificationSystem from "./dashboard/NotificationSystem.tsx";
import React from "react";

function Router(props: Readonly<{ children?: React.ReactNode }>) {
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

const theme = createTheme({
    palette: {
        secondary: {
            main: '#E3D026',
            light: '#E9DB5D',
            dark: '#A29415',
            contrastText: '#242105',
        },
    },
});
function App() {

  return (
      <ThemeProvider theme={theme}>
          <SnackbarProvider preventDuplicate maxSnack={7}>
              <Router>
                  <DashBoard/>
                  <NotificationSystem/>
              </Router>
          </SnackbarProvider>
      </ThemeProvider>
  );
}

export default App;
