import { createTRPCRouter } from './create-context';
import { authRouter } from './routes/auth';
import { leadsRouter } from './routes/leads';
import { interactionsRouter } from './routes/interactions';
import { dashboardRouter } from './routes/dashboard';
import { notificationsRouter } from './routes/notifications';
import { importRouter } from './routes/import';
import { reportsRouter } from './routes/reports';

export const appRouter = createTRPCRouter({
  auth: authRouter,
  leads: leadsRouter,
  interactions: interactionsRouter,
  dashboard: dashboardRouter,
  notifications: notificationsRouter,
  import: importRouter,
  reports: reportsRouter,
});

export type AppRouter = typeof appRouter;
