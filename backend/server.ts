import { config } from 'dotenv';
import { serve } from '@hono/node-server';
import app from './hono';

config();

const port = Number(process.env.PORT); // 🚨 MUST use Railway PORT

console.log('🚀 Starting Real Estate Lead Management API...');
console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔌 Railway Port: ${port}`);

serve({
  fetch: app.fetch,
  port: port,
  hostname: '0.0.0.0',   // required for Railway
});