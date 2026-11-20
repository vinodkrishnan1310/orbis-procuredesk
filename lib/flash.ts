export function flashRedirect(path: string, message: string): string {
  const url = new URL(path, "http://local");
  url.searchParams.set("flash", message);
  return url.pathname + url.search;
}