import { useEffect, useState } from "react";
import {
  Anchor,
  Button,
  Paper,
  PasswordInput,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { Link, useNavigate, useParams } from "react-router-dom";
import "./reset-new-password.scss";

const apiUrl = import.meta.env.VITE_BACKEND_URL;

type ResetNewPasswordResponse = {
  message?: string;
};

function ResetNewPassword() {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!passwordRepeat) {
      setError("");
      return;
    }

    if (password !== passwordRepeat) {
      setError("Passwords do not match!");
      return;
    }

    setError("");
  }, [password, passwordRepeat]);

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const redirectTimer = window.setTimeout(() => {
      navigate("/login", { replace: true });
    }, 1200);

    return () => {
      window.clearTimeout(redirectTimer);
    };
  }, [navigate, successMessage]);

  async function updatePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccessMessage("");

    if (!password.trim()) {
      setError("Please enter your new password.");
      return;
    }

    if (!passwordRepeat.trim()) {
      setError("Please repeat your new password.");
      return;
    }

    if (password !== passwordRepeat) {
      setError("Passwords must match!");
      return;
    }

    if (!token) {
      setError("Reset token is missing.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${apiUrl}/new-password/${token}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = (await response.json()) as ResetNewPasswordResponse;
      if (response.status === 200) {
        setError("");
        setSuccessMessage(data.message ?? "Password updated successfully.");
        return;
      }

      setError(data.message ?? "Unable to update password.");
    } catch (err) {
      setError("Unable to update password right now.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="reset-new-password-page page-fade-in">
      <div className="reset-new-password-page__glow reset-new-password-page__glow--right" />
      <div className="reset-new-password-page__glow reset-new-password-page__glow--left" />

      <Paper
        className="reset-new-password-page__card"
        withBorder
        radius="sm"
        shadow="md"
        p="xl"
      >
        <Stack gap="lg">
          <div className="reset-new-password-page__hero">
            <Title order={1} className="reset-new-password-page__title">
              Set New Password
            </Title>
            <Text className="reset-new-password-page__subtitle">
              Choose a new password for your account.
            </Text>
          </div>

          <form
            className="reset-new-password-page__form"
            onSubmit={updatePassword}
          >
            <Stack gap="md">
              <PasswordInput
                label="Password"
                name="password"
                value={password}
                onChange={(event) => setPassword(event.currentTarget.value)}
                autoComplete="new-password"
                classNames={{
                  input: "reset-new-password-page__input",
                  label: "reset-new-password-page__label",
                }}
              />

              <PasswordInput
                label="Repeat Password"
                name="passwordRepeat"
                value={passwordRepeat}
                onChange={(event) =>
                  setPasswordRepeat(event.currentTarget.value)
                }
                autoComplete="new-password"
                classNames={{
                  input: "reset-new-password-page__input",
                  label: "reset-new-password-page__label",
                }}
              />

              {error && (
                <Text className="reset-new-password-page__error">{error}</Text>
              )}
              {successMessage && (
                <Text className="reset-new-password-page__success">
                  {successMessage}
                </Text>
              )}

              <Button
                type="submit"
                loading={isSubmitting}
                className="reset-new-password-page__submit"
              >
                Submit
              </Button>

              <div className="reset-new-password-page__links">
                <Text className="reset-new-password-page__links-text">
                  Back to login?{" "}
                  <Anchor
                    component={Link}
                    to="/login"
                    className="reset-new-password-page__link"
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

export default ResetNewPassword;
