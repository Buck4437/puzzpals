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

const env = {
  PORT: process.env.PORT,
  CLIENT_BASE_URL: process.env.CLIENT_BASE_URL,
};

export default env;
