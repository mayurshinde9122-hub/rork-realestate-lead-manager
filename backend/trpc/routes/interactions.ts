import { TRPCError } from '@trpc/server';
import * as z from 'zod';
import { db } from '../../db/database';
import { createTRPCRouter, protectedProcedure } from '../create-context';

export const interactionsRouter = createTRPCRouter({
  getByLeadId: protectedProcedure
    .input(z.object({ leadId: z.string() }))
    .query(async ({ ctx, input }) => {
      const lead = await db.getLeadById(input.leadId);
      
      if (!lead || lead.isDeleted) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Lead not found',
        });
      }

      if (ctx.user.role === 'agent' && lead.assignedUserId !== ctx.user.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied',
        });
      }

      const interactions = await db.getInteractionsByLeadId(input.leadId);
      return interactions;
    }),

  create: protectedProcedure
    .input(
      z.object({
        leadId: z.string(),
        interestLevel: z.enum(['cold', 'warm', 'hot']),
        budget: z.number(),
        callStatus: z.enum(['not_received', 'connected', 'follow_up_needed', 'not_interested']),
        followUpDateTime: z.date().optional(),
        notes: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      console.log('Creating interaction for lead:', input.leadId);
      
      const lead = await db.getLeadById(input.leadId);
      
      if (!lead || lead.isDeleted) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Lead not found',
        });
      }

      if (ctx.user.role === 'agent' && lead.assignedUserId !== ctx.user.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied',
        });
      }

      const interaction = await db.createInteraction({
        ...input,
        createdBy: ctx.user.userId,
      });

      await db.updateLead(input.leadId, {
        interestLevel: input.interestLevel,
        callStatus: input.callStatus,
      });

      console.log('Interaction created:', interaction.id);
      return interaction;
    }),
});
