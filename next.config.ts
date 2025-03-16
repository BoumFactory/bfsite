import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configurations existantes...
  serverRuntimeConfig: {
    openaiApiKey: process.env.OPENAI_API_KEY,
  },
  publicRuntimeConfig: {
    // Variables publiques uniquement ici
  },
};

// next.config.js
module.exports = {
  serverRuntimeConfig: {
    openaiApiKey: process.env.OPENAI_API_KEY,
  },
};

export default nextConfig;
