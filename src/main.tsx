import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./global/colors.scss";
import "./global/animations.scss";
import "./index.css";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { BrowserRouter } from "react-router-dom";
import { appTheme } from "./theme/mantine_theme";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <MantineProvider defaultColorScheme="dark" theme={appTheme}>
        <App />
        <ToastContainer theme="dark" />
      </MantineProvider>
    </BrowserRouter>
  </StrictMode>,
);
