import { useEffect, type ReactNode } from "react";
import { ActionIcon, Affix, Transition } from "@mantine/core";
import { useWindowScroll } from "@mantine/hooks";
import { IconArrowUp } from "@tabler/icons-react";
import { Navigate, Outlet, Route, Routes, useNavigate } from "react-router-dom";
import "./App.css";
import { selectIsAuthenticated, useUserStore } from "./store/user_store";
import Login from "./pages/login/Login";
import Register from "./pages/register/Register";
import ResetPassword from "./pages/reset_password/ResetPassword";
import ResetNewPassword from "./pages/reset_password_input_new/ResetNewPassword";
import BrowseSchematics from "./pages/browse_schematics/BrowseSchematics";
import Navbar from "./components/navbar/Navbar";

type StackGuardProps = {
  redirectTo: string;
  allowAccess: boolean;
  children?: ReactNode;
};

function StackGuard({ redirectTo, allowAccess, children }: StackGuardProps) {
  if (!allowAccess) {
    return <Navigate to={redirectTo} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}

function AuthenticatedStack() {
  const isAuthenticated = useUserStore(selectIsAuthenticated);
  return <StackGuard allowAccess={isAuthenticated} redirectTo="/login" />;
}

function UnauthenticatedStack() {
  const isAuthenticated = useUserStore(selectIsAuthenticated);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  return <StackGuard allowAccess={!isAuthenticated} redirectTo="/" />;
}

function AuthenticatedLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

type PlaceholderPageProps = {
  title: string;
};

function PlaceholderPage({ title }: PlaceholderPageProps) {
  const navigate = useNavigate();
  const isAuthenticated = useUserStore(selectIsAuthenticated);
  const clearActiveUser = useUserStore((state) => state.clearActiveUser);

  function handleLogout() {
    clearActiveUser();
    navigate("/login", { replace: true });
  }

  return (
    <main className="app-placeholder">
      <h1>{title}</h1>
      <p>Route scaffold ready. Replace with real screen component.</p>
      {isAuthenticated && (
        <button type="button" onClick={handleLogout}>
          Logout
        </button>
      )}
    </main>
  );
}

function App() {
  const [scroll, scrollTo] = useWindowScroll();

  return (
    <>
      {/* UNAUTHENTICATED ROUTES */}
      <Routes>
        <Route element={<UnauthenticatedStack />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/set-new-password/:token"
            element={<ResetNewPassword />}
          />
        </Route>

        {/* AUTHENTICATED ROUTES */}
        <Route element={<AuthenticatedStack />}>
          <Route element={<AuthenticatedLayout />}>
            <Route path="/" element={<BrowseSchematics />} />
            <Route
              path="/collections"
              element={<PlaceholderPage title="Collections" />}
            />
            <Route
              path="/collections/:id"
              element={<PlaceholderPage title="Collection Details" />}
            />
            <Route
              path="/upload-schematic"
              element={<PlaceholderPage title="Upload Schematic" />}
            />
            <Route
              path="/edit-schematic/:id"
              element={<PlaceholderPage title="Edit Schematic" />}
            />
            <Route
              path="/profile/:id"
              element={<PlaceholderPage title="Profile" />}
            />
          </Route>
        </Route>

        <Route
          path="/error/401"
          element={<PlaceholderPage title="Error 401" />}
        />
        <Route
          path="/error/403"
          element={<PlaceholderPage title="Error 403" />}
        />
        <Route
          path="/error/404"
          element={<PlaceholderPage title="Error 404" />}
        />
        <Route path="*" element={<Navigate to="/error/404" replace />} />
      </Routes>

      <Affix position={{ bottom: 24, right: 24 }}>
        <Transition transition="slide-up" mounted={scroll.y > 140}>
          {(transitionStyles) => (
            <ActionIcon
              aria-label="Scroll to top"
              radius="xl"
              size="lg"
              variant="filled"
              style={transitionStyles}
              onClick={() => scrollTo({ y: 0 })}
            >
              <IconArrowUp size={18} />
            </ActionIcon>
          )}
        </Transition>
      </Affix>
    </>
  );
}

export default App;
