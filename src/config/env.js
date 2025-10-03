// Environment configuration for Chrome extension
// This file will be populated during build time with values from .env

const config = {
  PROMPTHIRE_API_BASE: process.env.PROMPTHIRE_API_BASE || 'https://prompthire.org/api',
  PROMPTHIRE_TOKEN: process.env.PROMPTHIRE_TOKEN || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || ''
};

// Validate required environment variables
if (!config.PROMPTHIRE_TOKEN) {
  console.warn('PROMPTHIRE_TOKEN is not set. Please check your .env file.');
}

if (!config.GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY is not set. Please check your .env file.');
}

export default config;
