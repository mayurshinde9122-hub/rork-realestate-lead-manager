import { config } from 'dotenv';
import { serve } from '@hono/node-server';
import app from './hono';

config({ path: 'env' });

const port = parseInt(process.env.PORT || '3000', 10);

console.log('🚀 Starting Real Estate Lead Management API...');
console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔌 Port: ${port}`);
console.log(`📁 Excel File Path: ${process.env.EXCEL_FILE_PATH || 'Not configured'}`);

serve({
  fetch: app.fetch,
  port,
}, (info) => {
  console.log(`✅ Server is running on http://localhost:${info.port}`);
  console.log(`📍 Health check: http://localhost:${info.port}/health`);
  console.log(`📍 tRPC endpoint: http://localhost:${info.port}/trpc`);
});
