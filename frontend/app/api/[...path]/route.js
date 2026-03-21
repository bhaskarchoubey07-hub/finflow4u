const RAW_UPSTREAM_API_URL =
  process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const UPSTREAM_API_URL = RAW_UPSTREAM_API_URL.startsWith("http")
  ? RAW_UPSTREAM_API_URL.replace(/\/$/, "")
  : `http://${RAW_UPSTREAM_API_URL.replace(/\/$/, "")}`;

async function forwardRequest(request, context) {
  const segments = context.params.path || [];
  const targetUrl = `${UPSTREAM_API_URL}/${segments.join("/")}${new URL(request.url).search}`;
  const headers = new Headers(request.headers);

  headers.delete("host");

  const response = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.text(),
    cache: "no-store"
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
}

export async function GET(request, context) {
  return forwardRequest(request, context);
}

export async function POST(request, context) {
  return forwardRequest(request, context);
}

export async function PUT(request, context) {
  return forwardRequest(request, context);
}

export async function PATCH(request, context) {
  return forwardRequest(request, context);
}

export async function DELETE(request, context) {
  return forwardRequest(request, context);
}
