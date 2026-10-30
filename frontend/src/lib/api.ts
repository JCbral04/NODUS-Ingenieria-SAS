const API_URL = process.env.NEXT_PUBLIC_API_URL;

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("nodus_token") : null;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    // Sesión expirada o inválida: limpiar y mandar a login con mensaje.
    if (typeof window !== "undefined") {
      localStorage.removeItem("nodus_token");
      localStorage.removeItem("nodus_user");
      window.location.href = "/login?message=Tu sesión expiró, inicia sesión de nuevo";
    }
    throw new ApiError(401, "Sesión expirada");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.message ?? "Error en la solicitud");
  }

  return res.json();
}

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("nodus_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function failFromResponse(res: Response): Promise<never> {
  if (res.status === 401 && typeof window !== "undefined") {
    localStorage.removeItem("nodus_token");
    localStorage.removeItem("nodus_user");
    window.location.href = "/login?message=Tu sesión expiró, inicia sesión de nuevo";
    throw new ApiError(401, "Sesión expirada");
  }
  const body = await res.json().catch(() => ({}));
  const message = Array.isArray(body.message) ? body.message.join(", ") : body.message;
  throw new ApiError(res.status, message ?? "Error en la solicitud");
}

/** Sube un formulario con archivo (multipart). No fija Content-Type: el navegador agrega el boundary. */
export async function apiUpload<T>(path: string, form: FormData): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { method: "POST", headers: authHeaders(), body: form });
  if (!res.ok) return failFromResponse(res);
  return res.json();
}

/** Descarga un archivo protegido con el token de la sesión y lo guarda con el nombre dado. */
export async function apiDownload(path: string, filename: string): Promise<void> {
  const res = await fetch(`${API_URL}${path}`, { headers: authHeaders() });
  if (!res.ok) return failFromResponse(res);
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
