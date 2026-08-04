export function fieldNoteCachePolicy(
  status: "success" | "partial" | "temporary-unavailable",
  dailySeconds: number,
  retrySeconds = 600
) {
  if (status === "success") {
    return {
      httpStatus: 200,
      maxAge: dailySeconds,
      cacheControl: `public, s-maxage=${dailySeconds}, stale-while-revalidate=3600`,
      retryAfter: undefined,
    };
  }

  return {
    httpStatus: status === "partial" ? 200 : 503,
    maxAge: retrySeconds,
    cacheControl: `public, s-maxage=${retrySeconds}, max-age=0, must-revalidate`,
    retryAfter: String(retrySeconds),
  };
}
