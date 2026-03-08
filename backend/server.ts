import { config } from 'dotenv';
import { serve } from '@hono/node-server';
import app from './hono';

config();

const port = Number(process.env.PORT) || 10000;

console.log('🚀 Starting API...');
console.log('PORT from Render:', port);

serve({
  fetch: app.fetch,
  port: port,
  hostname: '0.0.0.0',
});