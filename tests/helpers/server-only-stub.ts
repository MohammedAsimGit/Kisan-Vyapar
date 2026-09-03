// No-op stand-in for the `server-only` package when running unit tests in
// plain Node. Real builds still resolve the actual package, which enforces the
// server-only boundary during bundling.
export {};
