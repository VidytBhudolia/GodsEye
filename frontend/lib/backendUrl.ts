const DEFAULT_BACKEND_URL = "http://localhost:4000";

function stripTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, "");
}

export function getBackendBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_BACKEND_URL?.trim();
  if (!configured) {
    return DEFAULT_BACKEND_URL;
  }

  return stripTrailingSlashes(configured);
}

export function buildBackendUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getBackendBaseUrl()}${normalizedPath}`;
}
