// Load environment variables
import "dotenv/config";

const env = {
  PORT: process.env.PORT || "3000",
  CLIENT_BASE_URL: process.env.CLIENT_BASE_URL || "http://localhost:5173",
};

export default env;
