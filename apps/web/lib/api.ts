const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message ?? "Something went wrong");
  }

  return data as T;
}

export function saveAuthTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem("carpool_access_token", accessToken);
  localStorage.setItem("carpool_refresh_token", refreshToken);
}
