const apiUrl = import.meta.env.VITE_BACKEND_URL;

function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookies = document.cookie.split(";").map((cookie) => cookie.trim());
  const target = cookies.find((cookie) => cookie.startsWith(`${name}=`));
  if (!target) {
    return null;
  }

  return decodeURIComponent(target.slice(name.length + 1));
}

export function getAuthUrl(path: string): string {
  return `${apiUrl}/auth${path}`;
}

export async function requestLogout(): Promise<void> {
  const token = getCookieValue("token");

  try {
    await fetch(getAuthUrl("/logout"), {
      method: "POST",
      headers: token ? { authorization: token } : {},
    });
  } catch {
    // Local logout still proceeds if backend logout request fails.
  }
}
