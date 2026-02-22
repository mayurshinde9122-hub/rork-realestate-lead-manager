import { TRPCError } from '@trpc/server';
import * as z from 'zod';
import { db } from '../../db/database';
import { createTRPCRouter, protectedProcedure } from '../create-context';
import { GoogleSheetsService } from '../../services/google-sheets.service';
import { leadImportScheduler } from '../../services/lead-import-scheduler.service';
import * as XLSX from 'xlsx';

export const importRouter = createTRPCRouter({
  getConfiguration: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== 'admin') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Only admins can view import configuration',
      });
    }

    const config = await db.getImportConfiguration();
    return config;
  }),

  createConfiguration: protectedProcedure
    .input(
      z.object({
        googleSheetUrl: z.string().url(),
        sheetName: z.string().min(1),
        pollIntervalMinutes: z.number().min(1).default(10),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can configure imports',
        });
      }

      console.log('[Import] Creating configuration:', input.googleSheetUrl);

      const spreadsheetId = GoogleSheetsService.extractSpreadsheetId(input.googleSheetUrl);
      if (!spreadsheetId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid Google Sheet URL',
        });
      }

      const config = await db.createImportConfiguration({
        googleSheetUrl: input.googleSheetUrl,
        spreadsheetId,
        sheetName: input.sheetName,
        isActive: true,
        pollIntervalMinutes: input.pollIntervalMinutes,
      });

      console.log('[Import] Configuration created:', config.id);
      return config;
    }),

  updateConfiguration: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        isActive: z.boolean().optional(),
        pollIntervalMinutes: z.number().min(1).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can update import configuration',
        });
      }

      const { id, ...updates } = input;
      const config = await db.updateImportConfiguration(id, updates);

      if (!config) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Configuration not found',
        });
      }

      return config;
    }),

  getImportLogs: protectedProcedure
    .input(
      z.object({
        configurationId: z.string(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can view import logs',
        });
      }

      const logs = await db.getImportLogs(input.configurationId, input.limit);
      return logs;
    }),

  getImportState: protectedProcedure
    .input(z.object({ configurationId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can view import state',
        });
      }

      const state = await db.getImportState(input.configurationId);
      return state;
    }),

  triggerManualImport: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== 'admin') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Only admins can trigger manual imports',
      });
    }

    console.log('[Import] Manual import triggered by:', ctx.user.userId);
    
    leadImportScheduler.runImport();

    return { success: true, message: 'Import triggered successfully' };
  }),

  uploadExcelFile: protectedProcedure
    .input(
      z.object({
        fileData: z.string(),
        fileName: z.string(),
        source: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      console.log('[Upload] Processing Excel file:', input.fileName);
      console.log('[Upload] Source:', input.source);

      const result = {
        success: true,
        rowsScanned: 0,
        newRowsDetected: 0,
        leadsInserted: 0,
        duplicatesSkipped: 0,
        errors: [] as string[],
      };

      try {
        const buffer = Buffer.from(input.fileData, 'base64');
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];

        if (!sheetName) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'No sheets found in Excel file',
          });
        }

        console.log('[Upload] Reading sheet:', sheetName);
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        result.rowsScanned = rows.length;
        result.newRowsDetected = rows.length;
        console.log('[Upload] Found', rows.length, 'rows');

        const normalizePhone = (phone: string): string => {
          if (!phone) return '';
          return phone.replace(/^p:/i, '').replace(/[^0-9+]/g, '').toLowerCase();
        };

        const existingLeads = await db.getLeads({});
        const existingLeadsMap = new Map();
        console.log(`[Upload] Loading ${existingLeads.length} existing leads for duplicate check`);
        for (const lead of existingLeads) {
          if (lead.externalLeadId) existingLeadsMap.set(`id:${lead.externalLeadId}`, lead);
          if (lead.email) existingLeadsMap.set(`email:${lead.email.toLowerCase()}`, lead);
          if (lead.contactNumber) {
            const normalized = normalizePhone(lead.contactNumber);
            if (normalized) existingLeadsMap.set(`phone:${normalized}`, lead);
          }
        }

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i] as any;

          try {
            const rawName = row.name || row.client_name || row.full_name;
            const externalId = row.id || row.external_id || row.lead_id;
            const rawEmail = row.email;
            const rawPhone = row.phone || row.phone_number || row.contact_number;

            console.log(`[Upload] Row ${i + 1} - Raw data:`, JSON.stringify({
              name: rawName,
              phone: rawPhone,
              email: rawEmail,
              externalId
            }));

            if (!rawName || rawName.toString().trim() === '' || rawName.toString().startsWith('<test lead')) {
              console.log(`[Upload] Row ${i + 1} - Skipping: Invalid or test name`);
              result.errors.push(`Row ${i + 1}: Invalid or test name`);
              continue;
            }

            if (!rawPhone || rawPhone.toString().trim() === '' || rawPhone.toString().startsWith('p:<test lead')) {
              console.log(`[Upload] Row ${i + 1} - Skipping: Invalid or test phone`);
              result.errors.push(`Row ${i + 1}: Invalid or test phone number`);
              continue;
            }

            const cleanPhone = rawPhone.toString().replace(/^p:/i, '').trim();
            const normalizedPhone = normalizePhone(rawPhone.toString());

            console.log(`[Upload] Row ${i + 1} - Normalized: Phone=${normalizedPhone}, Email=${rawEmail?.toString().toLowerCase()}`);

            const isDuplicate =
              (externalId && externalId !== '' && !externalId.toString().startsWith('<test') && existingLeadsMap.has(`id:${externalId}`)) ||
              (rawEmail && rawEmail !== '' && !rawEmail.toString().startsWith('test@') && existingLeadsMap.has(`email:${rawEmail.toString().toLowerCase()}`)) ||
              (normalizedPhone && normalizedPhone !== '' && existingLeadsMap.has(`phone:${normalizedPhone}`));

            if (isDuplicate) {
              console.log(`[Upload] Row ${i + 1} is duplicate, skipping...`);
              result.duplicatesSkipped++;
              continue;
            }
            
            console.log(`[Upload] Row ${i + 1} is new, inserting...`);

            const leadData = {
              externalLeadId: (externalId && !externalId.toString().startsWith('<test')) ? externalId : undefined,
              clientName: rawName.toString().trim(),
              email: (rawEmail && !rawEmail.toString().startsWith('test@')) ? rawEmail.toString().trim() : undefined,
              contactNumber: cleanPhone,
              source: input.source === 'cold_calls' ? 'Cold Calls' : 
                      input.source === 'marketing_campaign' ? 'Marketing Campaign' : 
                      input.source === 'website' ? 'Website' : 'Manual Import',
              interestedAreas: row.interested_areas
                ? row.interested_areas.split(',').map((a: string) => a.trim())
                : [],
              interestedProjects: row.interested_projects
                ? row.interested_projects.split(',').map((p: string) => p.trim())
                : [],
              ownership:
                row.ownership && row.ownership.toString().toLowerCase().trim() === 'investment' ? ('investment' as const) : ('self' as const),
              furnishing: (() => {
                const f = row.furnishing ? row.furnishing.toString().toLowerCase().trim() : '';
                if (f === 'fully' || f === 'full') return 'fully' as const;
                if (f === 'semi') return 'semi' as const;
                return 'unfurnished' as const;
              })(),
              assignedUserId: row.assigned_user_id || ctx.user.userId,
              platform: row.platform || 'Excel File',
              campaignName: row.campaign_name || undefined,
              adName: row.ad_name || undefined,
              adsetName: row.adset_name || undefined,
              formName: row.form_name || undefined,
              configurationRequested: row.configuration_requested || undefined,
              isOrganic: row.is_organic === 'true' || row.is_organic === true || undefined,
              leadCreatedTime: row.lead_created_time
                ? new Date(row.lead_created_time)
                : undefined,
              leadStatus: row.lead_status || undefined,
            };

            const lead = await db.createLead(leadData);
            result.leadsInserted++;

            if (lead.externalLeadId) existingLeadsMap.set(`id:${lead.externalLeadId}`, lead);
            if (lead.email) existingLeadsMap.set(`email:${lead.email.toLowerCase()}`, lead);
            if (lead.contactNumber) {
              const normalized = normalizePhone(lead.contactNumber);
              if (normalized) existingLeadsMap.set(`phone:${normalized}`, lead);
            }

            console.log(`[Upload] Row ${i + 1} inserted successfully as lead ID: ${lead.id}`);
          } catch (error: any) {
            console.error(`[Upload] Error processing row ${i + 1}:`, error.message);
            result.errors.push(`Row ${i + 1}: ${error.message}`);
            result.success = false;
          }
        }

        console.log(
          `[Upload] Completed: ${result.leadsInserted} leads inserted, ${result.duplicatesSkipped} duplicates skipped`
        );
      } catch (error: any) {
        console.error('[Upload] Fatal error:', error.message);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to process Excel file',
        });
      }

      return result;
    }),
});
