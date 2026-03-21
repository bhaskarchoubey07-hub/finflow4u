const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export async function apiRequest(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
  };

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store"
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const validationErrors =
      data?.errors?.bodyErrors?.join?.(", ") ||
      Object.values(data?.errors?.fieldErrors || {})
        .flat()
        .filter(Boolean)
        .join(", ");

    throw new Error(data.message || validationErrors || "Request failed");
  }

  return data;
}

export { API_URL };
