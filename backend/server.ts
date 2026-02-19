import { config } from 'dotenv';
import { serve } from '@hono/node-server';
import app from './hono';

config({ path: 'env' });

const port = parseInt(process.env.PORT || '3000', 10);

console.log('🚀 Starting Real Estate Lead Management API...');
console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔌 Port: ${port}`);

serve(
  {
    fetch: app.fetch,
    port,
    hostname: '0.0.0.0',   // ⭐ VERY IMPORTANT ⭐
  },
  (info) => {
    console.log(`✅ Server running on port ${info.port}`);
    console.log(`📍 Health: /health`);
    console.log(`📍 tRPC: /trpc`);
  }
);
