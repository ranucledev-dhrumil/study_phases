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

    accessExpiresIn: process.env.ACCESS_EXPIRES_IN || "15m",
  },
};