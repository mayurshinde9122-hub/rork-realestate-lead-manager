import { config } from 'dotenv';
import { serve } from '@hono/node-server';
import app from './hono';

config({ path: 'env' });

const port = parseInt(process.env.PORT || '3000', 10);

console.log('🚀 Starting Real Estate Lead Management API...');
console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔌 Port: ${port}`);

serve({
  fetch: app.fetch,
  port: Number(process.env.PORT) || 8080,
  hostname: '0.0.0.0',   // ⭐ REQUIRED for Railway
});
