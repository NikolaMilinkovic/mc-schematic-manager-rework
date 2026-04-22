const apiUrl = import.meta.env.VITE_BACKEND_URL;

type CustomFetchHeaders = Record<string, string>;

type CustomFetchResponse<TData> = {
  data: TData;
  status: number;
};

const LEGACY_ACTIVE_USER_KEY = "activeUser";
const USER_STORE_KEY = "user-store";

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

function clearTokenCookie() {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = "token=; Max-Age=0; path=/";
}

function clearPersistedAuthState() {
  clearTokenCookie();

  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(LEGACY_ACTIVE_USER_KEY);
  window.localStorage.removeItem(USER_STORE_KEY);
}

async function customFetch<TData = unknown>(
  url: string,
  method: string,
  body?: BodyInit | null,
  headers: CustomFetchHeaders = {},
): Promise<CustomFetchResponse<TData>> {
  const token = getCookieValue("token");
  const defaultHeaders: CustomFetchHeaders = {
    ...(token ? { authorization: token } : {}),
  };
  const mergedHeaders = { ...defaultHeaders, ...headers };

  const response = await fetch(`${apiUrl}${url}`, {
    method,
    headers: mergedHeaders,
    body,
  });

  if (response.status === 401) {
    clearPersistedAuthState();

    if (
      typeof window !== "undefined" &&
      window.location.pathname !== "/login"
    ) {
      window.location.replace("/login");
    }
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    const data = (await response.json()) as TData;
    return { data, status: response.status };
  }

  return { data: response as TData, status: response.status };
}

export default customFetch;
