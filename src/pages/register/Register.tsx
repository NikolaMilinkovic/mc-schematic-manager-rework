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
import "./register.scss";

const apiUrl = import.meta.env.VITE_BACKEND_URL;

type RegisterForm = {
  username: string;
  email: string;
  password: string;
  passwordRepeat: string;
};

type RegisterErrorResponse = {
  message?: string;
};

function getCookie(name: string): string | null {
  const cookies = document.cookie.split(";").map((cookie) => cookie.trim());
  const target = cookies.find((cookie) => cookie.startsWith(`${name}=`));
  if (!target) {
    return null;
  }

  return decodeURIComponent(target.slice(name.length + 1));
}

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RegisterForm>({
    username: "",
    email: "",
    password: "",
    passwordRepeat: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const token = getCookie("token");
    if (token) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (!success) {
      return;
    }

    const redirectTimer = window.setTimeout(() => {
      navigate("/login", { replace: true });
    }, 1500);

    return () => {
      window.clearTimeout(redirectTimer);
    };
  }, [navigate, success]);

  function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.currentTarget;
    setFormData((prevState) => ({
      ...prevState,
      [name]: name === "email" ? value.toLowerCase() : value,
    }));
  }

  async function registerUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!formData.username.trim()) {
      setError("Please enter your username.");
      return;
    }
    if (!formData.email.trim()) {
      setError("Please enter your email.");
      return;
    }
    if (!formData.password.trim()) {
      setError("Please enter your password.");
      return;
    }
    if (!formData.passwordRepeat.trim()) {
      setError("Please repeat your password.");
      return;
    }

    if (formData.password !== formData.passwordRepeat) {
      setError("Passwords do not match!");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${apiUrl}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        let message = "Unknown error occurred.";
        try {
          const data = (await response.json()) as RegisterErrorResponse;
          message = data.message ?? message;
        } catch {
          message = "Unknown error occurred.";
        }

        setError(message);
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="register-page page-fade-in">
      <div className="register-page__glow register-page__glow--right" />
      <div className="register-page__glow register-page__glow--left" />

      <Paper
        className="register-page__card"
        withBorder
        radius="sm"
        shadow="md"
        p="xl"
      >
        <Stack gap="lg">
          <div className="register-page__hero">
            <Title order={1} className="register-page__title">
              Create Account
            </Title>
            <Text className="register-page__subtitle">
              Register to manage collections, schematics, and uploads.
            </Text>
          </div>

          <form className="register-page__form" onSubmit={registerUser}>
            <Stack gap="md">
              <TextInput
                label="Username"
                name="username"
                value={formData.username}
                onChange={onChange}
                autoComplete="username"
                classNames={{
                  input: "register-page__input",
                  label: "register-page__label",
                }}
              />

              <TextInput
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={onChange}
                autoComplete="email"
                classNames={{
                  input: "register-page__input",
                  label: "register-page__label",
                }}
              />

              <PasswordInput
                label="Password"
                name="password"
                value={formData.password}
                onChange={onChange}
                autoComplete="new-password"
                classNames={{
                  input: "register-page__input",
                  label: "register-page__label",
                }}
              />

              <PasswordInput
                label="Repeat Password"
                name="passwordRepeat"
                value={formData.passwordRepeat}
                onChange={onChange}
                autoComplete="new-password"
                classNames={{
                  input: "register-page__input",
                  label: "register-page__label",
                }}
              />

              {error && <Text className="register-page__error">{error}</Text>}

              {success && (
                <Text className="register-page__success">
                  Registration successful. Redirecting...
                </Text>
              )}

              <Button
                type="submit"
                loading={isSubmitting}
                className="register-page__submit"
                disabled={success}
              >
                Register
              </Button>

              <div className="register-page__links">
                <Text className="register-page__links-text">
                  Already have an account?{" "}
                  <Anchor
                    component={Link}
                    to="/login"
                    className="register-page__link"
                  >
                    Login here
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

export default Register;
