import { TRPCError } from '@trpc/server';
import * as z from 'zod';
import { db } from '../../db/database';
import { createTRPCRouter, protectedProcedure } from '../create-context';

export const leadsRouter = createTRPCRouter({
  getFilterValues: protectedProcedure
    .query(async () => {
      const values = await db.getDistinctFilterValues();
      return values;
    }),

  getAll: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        source: z.string().optional(),
        ownership: z.string().optional(),
        furnishing: z.string().optional(),
        interestLevel: z.enum(['cold', 'warm', 'hot']).optional(),
        callStatus: z.enum(['not_received', 'connected', 'follow_up_needed', 'not_interested']).optional(),
        createdFrom: z.date().optional(),
        createdTo: z.date().optional(),
        modifiedFrom: z.date().optional(),
        modifiedTo: z.date().optional(),
        project: z.string().optional(),
        interestedArea: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      console.log('Getting leads for user:', ctx.user.userId, 'role:', ctx.user.role);
      
      const filters: any = { ...input };
      
      if (ctx.user.role === 'agent') {
        filters.assignedUserId = ctx.user.userId;
      }

      const leads = await db.getLeads(filters);
      console.log('Found leads:', leads.length);
      
      return leads;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const lead = await db.getLeadById(input.id);
      
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

      return lead;
    }),

  create: protectedProcedure
    .input(
      z.object({
        clientName: z.string().min(1),
        contactNumber: z.string().min(1),
        source: z.string(),
        interestedAreas: z.array(z.string()),
        interestedProjects: z.array(z.string()),
        ownership: z.enum(['self', 'investment']),
        furnishing: z.enum(['unfurnished', 'semi', 'fully']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      console.log('Creating lead:', input.clientName);
      
      const lead = await db.createLead({
        ...input,
        assignedUserId: ctx.user.userId,
      });

      console.log('Lead created:', lead.id);
      return lead;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        clientName: z.string().min(1).optional(),
        contactNumber: z.string().min(1).optional(),
        source: z.string().optional(),
        interestedAreas: z.array(z.string()).optional(),
        interestedProjects: z.array(z.string()).optional(),
        ownership: z.enum(['self', 'investment']).optional(),
        furnishing: z.enum(['unfurnished', 'semi', 'fully']).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      
      const existingLead = await db.getLeadById(id);
      if (!existingLead || existingLead.isDeleted) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Lead not found',
        });
      }

      if (ctx.user.role === 'agent' && existingLead.assignedUserId !== ctx.user.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied',
        });
      }

      const lead = await db.updateLead(id, updates);
      return lead;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const lead = await db.getLeadById(input.id);
      
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

      await db.deleteLead(input.id);
      return { success: true };
    }),
});
