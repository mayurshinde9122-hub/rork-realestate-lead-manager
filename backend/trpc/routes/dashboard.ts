import { db } from '../../db/database';
import { createTRPCRouter, protectedProcedure } from '../create-context';

export const dashboardRouter = createTRPCRouter({
  getStats: protectedProcedure.query(async ({ ctx }) => {
    console.log('Getting dashboard stats for user:', ctx.user.userId);
    
    const leads = await db.getLeads(
      ctx.user.role === 'agent' ? { assignedUserId: ctx.user.userId } : {}
    );

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setHours(23, 59, 59, 999);

    console.log('Date range for today:', {
      todayStart: todayStart.toISOString(),
      todayEnd: todayEnd.toISOString(),
      now: now.toISOString()
    });

    const allInteractions = await Promise.all(
      leads.map(lead => db.getInteractionsByLeadId(lead.id))
    );
    const interactions = allInteractions.flat();

    const callsMadeToday = interactions.filter(i => {
      const createdAt = new Date(i.createdAt);
      const isToday = createdAt >= todayStart && createdAt <= todayEnd;
      if (isToday) {
        console.log('Call made today:', {
          createdAt: createdAt.toISOString(),
          notes: i.notes.substring(0, 30)
        });
      }
      return isToday;
    }).length;

    const followUpsToday = interactions.filter(
      i =>
        i.followUpDateTime &&
        i.followUpDateTime >= todayStart &&
        i.followUpDateTime < todayEnd
    ).length;

    const overdueFollowUps = interactions.filter(
      i => i.followUpDateTime && i.followUpDateTime < now
    ).length;

    const totalActiveLeads = leads.length;

    const leadsBySource: Record<string, number> = {};
    leads.forEach(lead => {
      leadsBySource[lead.source] = (leadsBySource[lead.source] || 0) + 1;
    });

    const leadInterestLevels: Record<string, number> = {
      cold: 0,
      warm: 0,
      hot: 0,
    };

    for (const lead of leads) {
      const leadInteractions = await db.getInteractionsByLeadId(lead.id);
      if (leadInteractions.length > 0) {
        const latestInteraction = leadInteractions[0];
        leadInterestLevels[latestInteraction.interestLevel]++;
      }
    }

    console.log('Dashboard stats:', {
      callsMadeToday,
      followUpsToday,
      overdueFollowUps,
      totalActiveLeads,
    });

    return {
      callsMadeToday,
      followUpsToday,
      overdueFollowUps,
      totalActiveLeads,
      leadsBySource,
      leadsByInterestLevel: leadInterestLevels,
    };
  }),
});
