type EnvKey = "VITE_API_BASE" | "VITE_API_WS";

function requireEnv(name: EnvKey): string {
  const value = import.meta.env[name];
  if (!value) {
    throw new Error(
      `Missing environment variable: ${name}. Refer to .env.example for an example configuration.`,
    );
  }
  return value;
}

const config = {
  baseUrl: import.meta.env.BASE_URL,
  apiBase: requireEnv("VITE_API_BASE"),
  apiWs: requireEnv("VITE_API_WS"),
};

export default config;
