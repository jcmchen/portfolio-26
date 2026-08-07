const MAX_CONCURRENT_REQUESTS = 3;
const DEFAULT_TIMEOUT_MS = 8_000;
const DEFAULT_MAX_ATTEMPTS = 2;
const MIN_BACKOFF_MS = 5_000;

export const WIKIMEDIA_USER_AGENT =
  "DailyPlaceReading/1.0 (https://jcmchen.com/)";

type NextFetchOptions = RequestInit & {
  next?: { revalidate?: number };
};

export type WikimediaFetchResult<T> =
  | { ok: true; data: T; status: "success"; httpStatus: number }
  | {
      ok: false;
      data: null;
      status: "http-error" | "timeout" | "parse-error";
      httpStatus?: number;
      error: string;
    };

type WikimediaFetchOptions = NextFetchOptions & {
  timeoutMs?: number;
  maxAttempts?: number;
  fetchImpl?: typeof fetch;
};

let activeRequests = 0;
let cooldownUntil = 0;
const requestQueue: Array<() => void> = [];

function delay(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

async function acquireRequestSlot() {
  if (activeRequests < MAX_CONCURRENT_REQUESTS) {
    activeRequests += 1;
    return;
  }

  await new Promise<void>((resolve) => {
    requestQueue.push(() => {
      activeRequests += 1;
      resolve();
    });
  });
}

function releaseRequestSlot() {
  activeRequests = Math.max(0, activeRequests - 1);
  requestQueue.shift()?.();
}

async function waitForCooldown() {
  const remaining = cooldownUntil - Date.now();
  if (remaining > 0) await delay(remaining);
}

export function parseRetryAfterMs(value: string | null, now = Date.now()) {
  if (!value) return undefined;

  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.ceil(seconds * 1_000);
  }

  const retryAt = Date.parse(value);
  return Number.isFinite(retryAt) ? Math.max(0, retryAt - now) : undefined;
}

function retryDelay(response: Response, attempt: number) {
  return (
    parseRetryAfterMs(response.headers.get("retry-after")) ??
    MIN_BACKOFF_MS * 2 ** attempt
  );
}

function shouldRetry(status: number) {
  return status === 429 || status >= 500;
}

function shouldRetryResult<T>(result: WikimediaFetchResult<T>) {
  if (result.ok) return false;
  if (result.httpStatus) return shouldRetry(result.httpStatus);
  return result.status === "timeout" || result.status === "http-error";
}

async function runLimited<T>(task: () => Promise<T>) {
  await waitForCooldown();
  await acquireRequestSlot();
  try {
    // A request ahead of this one may have received Retry-After while this
    // request was queued, so check the shared cooldown again inside the gate.
    await waitForCooldown();
    return await task();
  } finally {
    releaseRequestSlot();
  }
}

export async function fetchWikimediaJson<T>(
  url: string,
  options: WikimediaFetchOptions = {}
): Promise<WikimediaFetchResult<T>> {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    maxAttempts = DEFAULT_MAX_ATTEMPTS,
    fetchImpl = fetch,
    headers: suppliedHeaders,
    ...fetchOptions
  } = options;
  const headers = new Headers(suppliedHeaders);
  headers.set("Accept", "application/json");
  headers.set("User-Agent", WIKIMEDIA_USER_AGENT);
  const attempts = Math.max(1, maxAttempts);

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const result = await runLimited<WikimediaFetchResult<T>>(async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetchImpl(url, {
          ...fetchOptions,
          headers,
          signal: controller.signal,
        });

        if (!response.ok) {
          if (shouldRetry(response.status)) {
            const milliseconds = retryDelay(response, attempt);
            cooldownUntil = Math.max(cooldownUntil, Date.now() + milliseconds);
          }
          return {
            ok: false,
            data: null,
            status: "http-error",
            httpStatus: response.status,
            error: `HTTP ${response.status}`,
          };
        }

        try {
          return {
            ok: true,
            data: (await response.json()) as T,
            status: "success",
            httpStatus: response.status,
          };
        } catch (error) {
          return {
            ok: false,
            data: null,
            status: "parse-error",
            httpStatus: response.status,
            error: error instanceof Error ? error.message : "Invalid JSON response",
          };
        }
      } catch (error) {
        const timedOut = error instanceof Error && error.name === "AbortError";
        return {
          ok: false,
          data: null,
          status: timedOut ? "timeout" : "http-error",
          error: error instanceof Error ? error.message : "Wikimedia request failed",
        };
      } finally {
        clearTimeout(timeout);
      }
    });

    if (!shouldRetryResult(result)) return result;
    if (!result.ok && !result.httpStatus) {
      cooldownUntil = Math.max(cooldownUntil, Date.now() + 500 * 2 ** attempt);
    }
    if (attempt === attempts - 1) return result;
  }

  return {
    ok: false,
    data: null,
    status: "http-error",
    error: "Wikimedia request exhausted its retry budget",
  };
}
