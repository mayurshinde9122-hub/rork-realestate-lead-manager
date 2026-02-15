import { db } from '../../db/database';
import { createTRPCRouter, protectedProcedure } from '../create-context';
import * as z from 'zod';

export const notificationsRouter = createTRPCRouter({
  getUpcoming: protectedProcedure.query(async ({ ctx }) => {
    console.log('Getting upcoming follow-ups for user:', ctx.user.userId);
    
    const followUps = await db.getUpcomingFollowUps(ctx.user.userId);
    
    return followUps.map(({ interaction, lead }) => ({
      id: interaction.id,
      leadId: lead.id,
      clientName: lead.clientName,
      contactNumber: lead.contactNumber,
      followUpDateTime: interaction.followUpDateTime,
      notes: interaction.notes,
      interestLevel: interaction.interestLevel,
    }));
  }),

  getOverdue: protectedProcedure.query(async ({ ctx }) => {
    console.log('Getting overdue follow-ups for user:', ctx.user.userId);
    
    const followUps = await db.getOverdueFollowUps(ctx.user.userId);
    
    return followUps.map(({ interaction, lead }) => ({
      id: interaction.id,
      leadId: lead.id,
      clientName: lead.clientName,
      contactNumber: lead.contactNumber,
      followUpDateTime: interaction.followUpDateTime,
      notes: interaction.notes,
      interestLevel: interaction.interestLevel,
    }));
  }),

  getAll: protectedProcedure
    .input(
      z.object({
        unreadOnly: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      console.log('Getting notifications for user:', ctx.user.userId);
      const notifications = await db.getNotifications(ctx.user.userId, input.unreadOnly);
      return notifications;
    }),

  markAsRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const notification = await db.markNotificationAsRead(input.id);
      return notification;
    }),

  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    await db.markAllNotificationsAsRead(ctx.user.userId);
    return { success: true };
  }),
});
