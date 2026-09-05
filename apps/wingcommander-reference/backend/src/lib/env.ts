// This repo is public, so a hardcoded fallback secret is a known value to
// anyone. requiredSecret() lets local dev keep a convenient default while
// refusing to boot in production without a real value for the given env var.
export function requiredSecret(envVar: string, devDefault: string): string {
  const value = process.env[envVar] ?? (process.env.NODE_ENV === "production" ? undefined : devDefault);
  if (!value) {
    throw new Error(`${envVar} must be set in production -- refusing to start with no real secret.`);
  }
  return value;
}
