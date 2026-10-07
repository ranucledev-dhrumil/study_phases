const requiredEnv = (name) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

export default {
  jwt: {
    accessSecret: requiredEnv("ACCESS_SECRET"),
    refreshSecret: requiredEnv("REFRESH_SECRET"),

    accessExpiresIn: process.env.ACCESS_EXPIRES_IN || "15m",
    refreshExpiresIn: process.env.REFRESH_EXPIRES_IN || "7d",
  },
};