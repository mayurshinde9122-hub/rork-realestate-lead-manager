import { trpcServer } from '@hono/trpc-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { appRouter } from './trpc/app-router';
import { createContext } from './trpc/create-context';
import { leadImportScheduler } from './services/lead-import-scheduler.service';

const app = new Hono();

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
  credentials: true,
}));

app.use(
  '/trpc/*',
  trpcServer({
    router: appRouter,
    createContext,
  })
);

app.get('/', (c) => {
  return c.json({ 
    status: 'ok', 
    message: 'Real Estate Lead Management API is running',
    version: '1.0.0',
  });
});

app.get('/health', (c) => {
  return c.json({ status: 'ok' }, 200);
});

app.get('/api', (c) => {
  return c.json({ status: 'ok' }, 200);
});

app.get('/api/', (c) => {
  return c.json({ status: 'ok' }, 200);
});

app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json({
    error: err.message || 'Internal server error',
  }, 500);
});

if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
  setTimeout(() => {
    try {
      leadImportScheduler.start();
      console.log('✅ Lead import scheduler started');
    } catch (error) {
      console.error('⚠️ Failed to start scheduler:', error);
    }
  }, 5000);
}

export default app;
