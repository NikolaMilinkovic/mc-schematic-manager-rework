import { createRoot } from "react-dom/client";
import "./global/colors.scss";
import "./global/animations.scss";
import "./index.css";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import { Bounce, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { BrowserRouter } from "react-router-dom";
import { appTheme } from "./theme/mantine_theme";
import { ThemeProvider, useThemeContext } from "./store/theme_context";
import App from "./App";

function AppRoot() {
  const { colorScheme } = useThemeContext();

  return (
    <MantineProvider
      forceColorScheme={colorScheme}
      defaultColorScheme="dark"
      theme={appTheme}
    >
      <App />
      <ToastContainer
        theme="dark"
        position="bottom-right"
        autoClose={3000}
        hideProgressBar
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        transition={Bounce}
      />
    </MantineProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <BrowserRouter>
      <AppRoot />
    </BrowserRouter>
  </ThemeProvider>,
);
