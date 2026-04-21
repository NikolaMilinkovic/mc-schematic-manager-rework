import { useEffect, useState } from "react";
import {
  Anchor,
  Button,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { Link, useNavigate } from "react-router-dom";
import "./reset-password.scss";

const apiUrl = import.meta.env.VITE_BACKEND_URL;

type ResetPasswordResponse = {
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

function ResetPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const token = getCookie("token");
    if (token) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    setEmail(event.currentTarget.value.toLowerCase());
    setError("");
    setSuccessMessage("");
  }

  async function handleResetPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!email.trim()) {
      setError("Please enter your recovery email.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${apiUrl}/password-reset`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = (await response.json()) as ResetPasswordResponse;
      if (response.status === 200) {
        setSuccessMessage(data.message ?? "Password reset email sent.");
        return;
      }

      setError(data.message ?? "Unable to send password reset email.");
    } catch (err) {
      setError("Unable to send password reset email right now.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="reset-password-page page-fade-in">
      <div className="reset-password-page__glow reset-password-page__glow--right" />
      <div className="reset-password-page__glow reset-password-page__glow--left" />

      <Paper
        className="reset-password-page__card"
        withBorder
        radius="sm"
        shadow="md"
        p="xl"
      >
        <Stack gap="lg">
          <div className="reset-password-page__hero">
            <Title order={1} className="reset-password-page__title">
              Reset Password
            </Title>
            <Text className="reset-password-page__subtitle">
              Enter your recovery email and we&apos;ll send reset instructions.
            </Text>
          </div>

          <form
            className="reset-password-page__form"
            onSubmit={handleResetPassword}
          >
            <Stack gap="md">
              <TextInput
                label="Email"
                name="email"
                type="email"
                value={email}
                onChange={onChange}
                autoComplete="email"
                classNames={{
                  input: "reset-password-page__input",
                  label: "reset-password-page__label",
                }}
              />

              {error && (
                <Text className="reset-password-page__error">{error}</Text>
              )}
              {successMessage && (
                <Text className="reset-password-page__success">
                  {successMessage}
                </Text>
              )}

              <Button
                type="submit"
                loading={isSubmitting}
                className="reset-password-page__submit"
              >
                Submit
              </Button>

              <div className="reset-password-page__links">
                <Text className="reset-password-page__links-text">
                  Back to login?{" "}
                  <Anchor
                    component={Link}
                    to="/login"
                    className="reset-password-page__link"
                  >
                    Login here
                  </Anchor>
                </Text>
                <Text className="reset-password-page__links-text">
                  Need an account?{" "}
                  <Anchor
                    component={Link}
                    to="/register"
                    className="reset-password-page__link"
                  >
                    Register here
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

export default ResetPassword;
