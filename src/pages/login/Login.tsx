import { useEffect, useState } from "react";
import {
  Anchor,
  Button,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { Link, useNavigate } from "react-router-dom";
import { getAuthUrl } from "../../lib/auth.ts";
import { selectIsAuthenticated, useUserStore } from "../../store/user_store";
import "./login.scss";

type LoginForm = {
  email: string;
  password: string;
};

type LoginResponse = {
  token?: string;
  studioUser?: Record<string, unknown>;
  user?: Record<string, unknown>;
};

const DEMO_EMAIL = "test_account@gmail.com";
const DEMO_PASSWORD = "Vsi85JCFmfbSbnt";

function setTokenCookie(token: string) {
  const maxAge = 365 * 24 * 60 * 60;
  document.cookie = `token=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function Login() {
  const navigate = useNavigate();
  const isAuthenticated = useUserStore(selectIsAuthenticated);
  const handleSetActiveUser = useUserStore(
    (state) => state.handleSetActiveUser,
  );
  const [formData, setFormData] = useState<LoginForm>({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.currentTarget;
    setFormData((prevState) => ({
      ...prevState,
      [name]: name === "email" ? value.toLowerCase() : value,
    }));
  }

  function fillDemoCredentials() {
    setFormData({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    });
    setError("");
  }

  async function loginUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!formData.email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!formData.password.trim()) {
      setError("Please enter your password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(getAuthUrl("/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.email.trim(),
          password: formData.password,
        }),
      });

      if (response.status === 401) {
        setError("Email or password is incorrect.");
        return;
      }

      if (!response.ok) {
        setError(
          "An error occurred while logging in. Server might be down. Call Helvos!",
        );
        return;
      }

      const data = (await response.json()) as LoginResponse;
      if (!data.token) {
        setError("Login failed. Please try again.");
        return;
      }

      setTokenCookie(data.token);
      // Keep auth guard in sync even if backend omits user payload.
      const resolvedUser = data.studioUser ??
        data.user ?? { token: data.token };
      handleSetActiveUser(resolvedUser);

      navigate("/", { replace: true });
      return;
    } catch (err) {
      setError(
        "An error occurred while logging in. Server might be down. Call Helvos!",
      );
      console.error(err);
    } finally {
      if (!isAuthenticated) {
        setIsSubmitting(false);
      }
    }
  }

  return (
    <section className="login-page page-fade-in">
      <div className="login-page__glow login-page__glow--right" />
      <div className="login-page__glow login-page__glow--left" />

      <Paper
        className="login-page__card"
        withBorder
        radius="sm"
        shadow="md"
        p="xl"
      >
        <Stack gap="lg">
          <div className="login-page__hero">
            <Title order={1} className="login-page__title">
              Welcome Back!
            </Title>
            <Text className="login-page__subtitle">
              Sign in to manage collections, schematics, and uploads.
            </Text>
          </div>

          <form className="login-page__form" onSubmit={loginUser}>
            <Stack gap="md">
              <TextInput
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={onChange}
                autoComplete="email"
                classNames={{
                  input: "login-page__input",
                  label: "login-page__label",
                }}
              />

              <PasswordInput
                label="Password"
                name="password"
                value={formData.password}
                onChange={onChange}
                autoComplete="current-password"
                classNames={{
                  input: "login-page__input",
                  label: "login-page__label",
                }}
              />

              {error && <Text className="login-page__error">{error}</Text>}

              <div className="login-page__actions">
                <Button
                  type="submit"
                  loading={isSubmitting}
                  className="login-page__submit"
                >
                  Login
                </Button>
                <Button
                  type="button"
                  radius="xs"
                  variant="subtle"
                  className="login-page__demo-button"
                  onClick={fillDemoCredentials}
                >
                  Try Demo Account
                </Button>
              </div>

              <div className="login-page__links">
                <Text className="login-page__links-text">
                  Don&apos;t have an account?{" "}
                  <Anchor
                    component={Link}
                    to="/register"
                    className="login-page__link"
                  >
                    Register here
                  </Anchor>
                </Text>
                <Text className="login-page__links-text">
                  Forgot password?{" "}
                  <Anchor
                    component={Link}
                    to="/reset-password"
                    className="login-page__link"
                  >
                    Reset password
                  </Anchor>
                </Text>
              </div>
            </Stack>
          </form>
        </Stack>
      </Paper>
    </section>
  );
}

export default Login;
