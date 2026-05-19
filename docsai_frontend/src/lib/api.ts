const BASE_URL = "http://localhost:8000/api";


// ─── Auth ────────────────────────────────────────────────────────────────────

export async function register(
  username: string,
  email: string,
  password: string
) {
  const res = await fetch(`${BASE_URL}/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function login(email: string, password: string) {
  const res = await fetch(`${BASE_URL}/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include", // 👈 this is the fix

  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function logout() {
  const res = await fetch(`${BASE_URL}/v1/auth/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // 👈 this is the fix

  });
  if (!res.ok) throw await res.json();
  return res.json();
}

// ─── Ingest ───────────────────────────────────────────────────────────────────

export async function ingestDocument(
  threadId: string,
  file: File
): Promise<Response> {
  const formData = new FormData();
  formData.append("thread_id", threadId);
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/v1/ingest-docs`, {
    method: "POST",
    headers: { },
    body: formData,
    credentials : "include"
  });

  if (!res.ok) throw await res.json();
  return res;
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export async function chatCompletion(
  threadId: string,
  query: string
): Promise<Response> {
  const res = await fetch(`${BASE_URL}/v1/chat-completion`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ thread_id: threadId, query }),
    credentials : 'include',
  });

  if (!res.ok) throw await res.json();
  return res;
}

// ─── SSE Helper ───────────────────────────────────────────────────────────────

export async function readSSEStream(
  res: Response,
  onEvent: (event: Record<string, unknown>) => void
) {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const lines = decoder.decode(value).split("\n\n");
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.replace("data: ", "").trim();
      if (data === "[DONE]") return;
      try {
        onEvent(JSON.parse(data));
      } catch {
        // ignore malformed chunks
      }
    }
  }
}
