import { z } from 'zod';
import { publicProcedure, createTRPCRouter } from '../create-context';
import { db } from '../../db/database';
import * as XLSX from 'xlsx';

export const reportsRouter = createTRPCRouter({
  generateLeadsReport: publicProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      source: z.string().optional(),
      assignedUserId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      console.log('[Reports] Generating leads report');
      
      const filters: any = {};
      if (input.startDate) filters.createdFrom = new Date(input.startDate);
      if (input.endDate) filters.createdTo = new Date(input.endDate);
      if (input.source) filters.source = input.source;
      if (input.assignedUserId) filters.assignedUserId = input.assignedUserId;

      const leads = await db.getLeads(filters);
      const users = await db.getAllUsers();
      const userMap = new Map(users.map(u => [u.id, u.name]));

      const data = leads.map(lead => ({
        'Lead ID': lead.id,
        'Client Name': lead.clientName,
        'Contact Number': lead.contactNumber,
        'Email': lead.email || '',
        'Source': lead.source,
        'Interested Areas': lead.interestedAreas.join(', '),
        'Interested Projects': lead.interestedProjects.join(', '),
        'Ownership': lead.ownership,
        'Furnishing': lead.furnishing,
        'Assigned To': userMap.get(lead.assignedUserId) || 'Unknown',
        'Created Date': new Date(lead.createdAt).toLocaleDateString(),
        'Last Updated': new Date(lead.updatedAt).toLocaleDateString(),
        'Platform': lead.platform || '',
        'Campaign': lead.campaignName || '',
        'Ad Name': lead.adName || '',
        'Form Name': lead.formName || '',
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Leads');
      
      const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      
      console.log(`[Reports] Generated leads report with ${data.length} records`);
      return { base64, fileName: `Leads_Report_${Date.now()}.xlsx`, count: data.length };
    }),

  generateInteractionsReport: publicProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      assignedUserId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      console.log('[Reports] Generating interactions report');
      
      const filters: any = {};
      if (input.assignedUserId) filters.assignedUserId = input.assignedUserId;

      const leads = await db.getLeads(filters);
      const users = await db.getAllUsers();
      const userMap = new Map(users.map(u => [u.id, u.name]));
      
      const data: any[] = [];
      
      for (const lead of leads) {
        const interactions = await db.getInteractionsByLeadId(lead.id);
        
        let filteredInteractions = interactions;
        if (input.startDate) {
          filteredInteractions = filteredInteractions.filter(i => 
            new Date(i.createdAt) >= new Date(input.startDate!)
          );
        }
        if (input.endDate) {
          filteredInteractions = filteredInteractions.filter(i => 
            new Date(i.createdAt) <= new Date(input.endDate!)
          );
        }
        
        filteredInteractions.forEach(interaction => {
          data.push({
            'Interaction ID': interaction.id,
            'Client Name': lead.clientName,
            'Contact Number': lead.contactNumber,
            'Source': lead.source,
            'Interest Level': interaction.interestLevel,
            'Budget': interaction.budget,
            'Call Status': interaction.callStatus,
            'Follow-up Date': interaction.followUpDateTime 
              ? new Date(interaction.followUpDateTime).toLocaleString() 
              : 'N/A',
            'Notes': interaction.notes,
            'Interaction Date': new Date(interaction.createdAt).toLocaleString(),
            'Created By': userMap.get(interaction.createdBy) || 'Unknown',
          });
        });
      }

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Interactions');
      
      const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      
      console.log(`[Reports] Generated interactions report with ${data.length} records`);
      return { base64, fileName: `Interactions_Report_${Date.now()}.xlsx`, count: data.length };
    }),

  generateFollowUpsReport: publicProcedure
    .input(z.object({
      assignedUserId: z.string().optional(),
      type: z.enum(['upcoming', 'overdue', 'all']).default('all'),
    }))
    .mutation(async ({ input }) => {
      console.log('[Reports] Generating follow-ups report');
      
      const filters: any = {};
      if (input.assignedUserId) filters.assignedUserId = input.assignedUserId;

      const leads = await db.getLeads(filters);
      const users = await db.getAllUsers();
      const userMap = new Map(users.map(u => [u.id, u.name]));
      const now = new Date();
      
      const data: any[] = [];
      
      for (const lead of leads) {
        const interactions = await db.getInteractionsByLeadId(lead.id);
        const latestInteraction = interactions[0];
        
        if (latestInteraction?.followUpDateTime || latestInteraction?.callStatus === 'follow_up_needed') {
          const followUpDate = latestInteraction.followUpDateTime;
          const isOverdue = followUpDate && followUpDate < now;
          const isUpcoming = followUpDate && followUpDate >= now;
          
          if (input.type === 'overdue' && !isOverdue) continue;
          if (input.type === 'upcoming' && !isUpcoming) continue;
          
          data.push({
            'Lead ID': lead.id,
            'Client Name': lead.clientName,
            'Contact Number': lead.contactNumber,
            'Email': lead.email || '',
            'Source': lead.source,
            'Interest Level': latestInteraction.interestLevel,
            'Budget': latestInteraction.budget,
            'Follow-up Date': followUpDate 
              ? new Date(followUpDate).toLocaleString() 
              : 'Not Scheduled',
            'Status': isOverdue ? 'OVERDUE' : isUpcoming ? 'UPCOMING' : 'PENDING',
            'Last Interaction': new Date(latestInteraction.createdAt).toLocaleString(),
            'Notes': latestInteraction.notes,
            'Assigned To': userMap.get(lead.assignedUserId) || 'Unknown',
          });
        }
      }

      data.sort((a, b) => {
        const aDate = a['Follow-up Date'] === 'Not Scheduled' ? 0 : new Date(a['Follow-up Date']).getTime();
        const bDate = b['Follow-up Date'] === 'Not Scheduled' ? 0 : new Date(b['Follow-up Date']).getTime();
        return aDate - bDate;
      });

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Follow-ups');
      
      const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      
      console.log(`[Reports] Generated follow-ups report with ${data.length} records`);
      return { base64, fileName: `FollowUps_Report_${Date.now()}.xlsx`, count: data.length };
    }),

  generateSourceAnalysisReport: publicProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      console.log('[Reports] Generating source analysis report');
      
      const filters: any = {};
      if (input.startDate) filters.createdFrom = new Date(input.startDate);
      if (input.endDate) filters.createdTo = new Date(input.endDate);

      const leads = await db.getLeads(filters);
      
      const sourceMap = new Map<string, { count: number; hot: number; warm: number; cold: number }>();
      
      for (const lead of leads) {
        const interactions = await db.getInteractionsByLeadId(lead.id);
        const latestInteraction = interactions[0];
        
        if (!sourceMap.has(lead.source)) {
          sourceMap.set(lead.source, { count: 0, hot: 0, warm: 0, cold: 0 });
        }
        
        const sourceData = sourceMap.get(lead.source)!;
        sourceData.count++;
        
        if (latestInteraction) {
          if (latestInteraction.interestLevel === 'hot') sourceData.hot++;
          else if (latestInteraction.interestLevel === 'warm') sourceData.warm++;
          else if (latestInteraction.interestLevel === 'cold') sourceData.cold++;
        }
      }

      const data = Array.from(sourceMap.entries()).map(([source, stats]) => ({
        'Source': source,
        'Total Leads': stats.count,
        'Hot Leads': stats.hot,
        'Warm Leads': stats.warm,
        'Cold Leads': stats.cold,
        'Conversion Rate (Hot)': stats.count > 0 ? `${((stats.hot / stats.count) * 100).toFixed(1)}%` : '0%',
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Source Analysis');
      
      const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      
      console.log(`[Reports] Generated source analysis report with ${data.length} sources`);
      return { base64, fileName: `Source_Analysis_${Date.now()}.xlsx`, count: data.length };
    }),

  generateAgentPerformanceReport: publicProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      console.log('[Reports] Generating agent performance report');
      
      const users = await db.getAllUsers();
      const allLeads = await db.getLeads({});
      
      const data: any[] = [];
      
      for (const user of users) {
        const userLeads = allLeads.filter(l => l.assignedUserId === user.id);
        
        let totalInteractions = 0;
        let hotLeads = 0;
        let warmLeads = 0;
        let coldLeads = 0;
        let followUpsScheduled = 0;
        let overdueFollowUps = 0;
        const now = new Date();
        
        for (const lead of userLeads) {
          const interactions = await db.getInteractionsByLeadId(lead.id);
          
          let filteredInteractions = interactions;
          if (input.startDate) {
            filteredInteractions = filteredInteractions.filter(i => 
              new Date(i.createdAt) >= new Date(input.startDate!)
            );
          }
          if (input.endDate) {
            filteredInteractions = filteredInteractions.filter(i => 
              new Date(i.createdAt) <= new Date(input.endDate!)
            );
          }
          
          totalInteractions += filteredInteractions.length;
          
          const latestInteraction = interactions[0];
          if (latestInteraction) {
            if (latestInteraction.interestLevel === 'hot') hotLeads++;
            else if (latestInteraction.interestLevel === 'warm') warmLeads++;
            else if (latestInteraction.interestLevel === 'cold') coldLeads++;
            
            if (latestInteraction.followUpDateTime) {
              if (latestInteraction.followUpDateTime >= now) {
                followUpsScheduled++;
              } else {
                overdueFollowUps++;
              }
            }
          }
        }
        
        data.push({
          'Agent Name': user.name,
          'Email': user.email,
          'Role': user.role,
          'Total Leads': userLeads.length,
          'Total Interactions': totalInteractions,
          'Hot Leads': hotLeads,
          'Warm Leads': warmLeads,
          'Cold Leads': coldLeads,
          'Follow-ups Scheduled': followUpsScheduled,
          'Overdue Follow-ups': overdueFollowUps,
          'Avg Interactions per Lead': userLeads.length > 0 
            ? (totalInteractions / userLeads.length).toFixed(2) 
            : '0',
        });
      }

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Agent Performance');
      
      const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      
      console.log(`[Reports] Generated agent performance report with ${data.length} agents`);
      return { base64, fileName: `Agent_Performance_${Date.now()}.xlsx`, count: data.length };
    }),

  generateConversionFunnelReport: publicProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      console.log('[Reports] Generating conversion funnel report');
      
      const filters: any = {};
      if (input.startDate) filters.createdFrom = new Date(input.startDate);
      if (input.endDate) filters.createdTo = new Date(input.endDate);

      const leads = await db.getLeads(filters);
      
      const funnelData: any[] = [];
      
      for (const lead of leads) {
        const interactions = await db.getInteractionsByLeadId(lead.id);
        
        if (interactions.length === 0) continue;
        
        const sortedInteractions = [...interactions].sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        
        const firstInteraction = sortedInteractions[0];
        const latestInteraction = sortedInteractions[sortedInteractions.length - 1];
        
        funnelData.push({
          'Lead ID': lead.id,
          'Client Name': lead.clientName,
          'Contact Number': lead.contactNumber,
          'Source': lead.source,
          'Initial Interest Level': firstInteraction.interestLevel,
          'Current Interest Level': latestInteraction.interestLevel,
          'Initial Budget': firstInteraction.budget,
          'Current Budget': latestInteraction.budget,
          'Total Interactions': interactions.length,
          'First Contact': new Date(firstInteraction.createdAt).toLocaleDateString(),
          'Last Contact': new Date(latestInteraction.createdAt).toLocaleDateString(),
          'Journey Status': firstInteraction.interestLevel === latestInteraction.interestLevel 
            ? 'No Change' 
            : firstInteraction.interestLevel === 'cold' && latestInteraction.interestLevel === 'hot'
            ? 'Converted (Cold to Hot)'
            : firstInteraction.interestLevel === 'cold' && latestInteraction.interestLevel === 'warm'
            ? 'Progressed (Cold to Warm)'
            : firstInteraction.interestLevel === 'warm' && latestInteraction.interestLevel === 'hot'
            ? 'Converted (Warm to Hot)'
            : 'Declined',
        });
      }

      const ws = XLSX.utils.json_to_sheet(funnelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Conversion Funnel');
      
      const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      
      console.log(`[Reports] Generated conversion funnel report with ${funnelData.length} records`);
      return { base64, fileName: `Conversion_Funnel_${Date.now()}.xlsx`, count: funnelData.length };
    }),

  generateDailyActivityReport: publicProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    }))
    .mutation(async ({ input }) => {
      console.log('[Reports] Generating daily activity report');
      
      const allLeads = await db.getLeads({});
      const users = await db.getAllUsers();
      const userMap = new Map(users.map(u => [u.id, u.name]));
      
      const dateMap = new Map<string, {
        date: string;
        leadsCreated: number;
        interactionsMade: number;
        followUpsScheduled: number;
        agents: Set<string>;
      }>();
      
      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);
      
      for (const lead of allLeads) {
        const leadDate = new Date(lead.createdAt).toLocaleDateString();
        const leadDateTime = new Date(lead.createdAt);
        
        if (leadDateTime >= startDate && leadDateTime <= endDate) {
          if (!dateMap.has(leadDate)) {
            dateMap.set(leadDate, {
              date: leadDate,
              leadsCreated: 0,
              interactionsMade: 0,
              followUpsScheduled: 0,
              agents: new Set(),
            });
          }
          
          const dayData = dateMap.get(leadDate)!;
          dayData.leadsCreated++;
          dayData.agents.add(userMap.get(lead.assignedUserId) || 'Unknown');
        }
        
        const interactions = await db.getInteractionsByLeadId(lead.id);
        
        for (const interaction of interactions) {
          const intDate = new Date(interaction.createdAt).toLocaleDateString();
          const intDateTime = new Date(interaction.createdAt);
          
          if (intDateTime >= startDate && intDateTime <= endDate) {
            if (!dateMap.has(intDate)) {
              dateMap.set(intDate, {
                date: intDate,
                leadsCreated: 0,
                interactionsMade: 0,
                followUpsScheduled: 0,
                agents: new Set(),
              });
            }
            
            const dayData = dateMap.get(intDate)!;
            dayData.interactionsMade++;
            dayData.agents.add(userMap.get(interaction.createdBy) || 'Unknown');
            
            if (interaction.followUpDateTime) {
              dayData.followUpsScheduled++;
            }
          }
        }
      }

      const data = Array.from(dateMap.values())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(day => ({
          'Date': day.date,
          'Leads Created': day.leadsCreated,
          'Interactions Made': day.interactionsMade,
          'Follow-ups Scheduled': day.followUpsScheduled,
          'Active Agents': day.agents.size,
        }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Daily Activity');
      
      const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      
      console.log(`[Reports] Generated daily activity report with ${data.length} days`);
      return { base64, fileName: `Daily_Activity_${Date.now()}.xlsx`, count: data.length };
    }),

  generateCallStatusReport: publicProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      console.log('[Reports] Generating call status report');
      
      const allLeads = await db.getLeads({});
      const users = await db.getAllUsers();
      const userMap = new Map(users.map(u => [u.id, u.name]));
      
      const data: any[] = [];
      
      for (const lead of allLeads) {
        const interactions = await db.getInteractionsByLeadId(lead.id);
        
        let filteredInteractions = interactions;
        if (input.startDate) {
          filteredInteractions = filteredInteractions.filter(i => 
            new Date(i.createdAt) >= new Date(input.startDate!)
          );
        }
        if (input.endDate) {
          filteredInteractions = filteredInteractions.filter(i => 
            new Date(i.createdAt) <= new Date(input.endDate!)
          );
        }
        
        filteredInteractions.forEach(interaction => {
          data.push({
            'Client Name': lead.clientName,
            'Contact Number': lead.contactNumber,
            'Source': lead.source,
            'Call Status': interaction.callStatus,
            'Interest Level': interaction.interestLevel,
            'Budget': interaction.budget,
            'Call Date': new Date(interaction.createdAt).toLocaleString(),
            'Agent': userMap.get(interaction.createdBy) || 'Unknown',
            'Notes': interaction.notes,
          });
        });
      }

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Call Status');
      
      const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      
      console.log(`[Reports] Generated call status report with ${data.length} records`);
      return { base64, fileName: `Call_Status_${Date.now()}.xlsx`, count: data.length };
    }),
});
