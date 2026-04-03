// Load environment variables
import "dotenv/config";

function assertEnvVariableExists(
  variable: string | undefined,
  name: string,
): asserts variable is string {
  if (variable === undefined) {
    throw new Error(`${name} is missing in .env`);
  }
}

assertEnvVariableExists(process.env.PORT, "PORT");
assertEnvVariableExists(process.env.CLIENT_BASE_URL, "CLIENT_BASE_URL");

const clientBaseUrl = process.env.CLIENT_BASE_URL.replace(/\/$/, "");

let clientOrigin: string;
try {
  clientOrigin = new URL(clientBaseUrl).origin;
} catch {
  throw new Error(
    "CLIENT_BASE_URL must be a valid absolute URL (for example https://example.com/puzzpals)",
  );
}

const env = {
  PORT: process.env.PORT,
  CLIENT_BASE_URL: clientBaseUrl,
  CLIENT_ORIGIN: clientOrigin,
};

export default env;
