import cron, { ScheduledTask } from 'node-cron';
import { db } from '../db/database';
import { LeadIngestionService } from './lead-ingestion.service';
import { ExcelLeadIngestionService } from './lead-ingestion-excel.service';

export class LeadImportScheduler {
  private cronJob: ScheduledTask | null = null;
  private isRunning = false;

  start() {
    if (this.cronJob) {
      console.log('[Scheduler] Already running');
      return;
    }

    console.log('[Scheduler] Starting lead import scheduler (every 10 minutes)...');
    
    this.cronJob = cron.schedule('*/10 * * * *', async () => {
      await this.runImport();
    });

    console.log('[Scheduler] Scheduler registered. First run will occur in 10 minutes.');
  }

  stop() {
    if (this.cronJob) {
      console.log('[Scheduler] Stopping lead import scheduler...');
      this.cronJob.stop();
      this.cronJob = null;
    }
  }

  async runImport() {
    if (this.isRunning) {
      console.log('[Scheduler] Import already running, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('[Scheduler] === STARTING SCHEDULED IMPORT ===');
    const startTime = Date.now();

    try {
      const excelFilePath = process.env.EXCEL_FILE_PATH;
      let result;
      let configId = 'excel-import-config';

      if (excelFilePath) {
        console.log(`[Scheduler] Using Excel file import from: ${excelFilePath}`);
        const excelService = new ExcelLeadIngestionService(excelFilePath);
        result = await excelService.ingestLeads(configId);
      } else {
        const config = await db.getImportConfiguration();

        if (!config || !config.isActive) {
          console.log('[Scheduler] No active configuration found');
          this.isRunning = false;
          return;
        }

        console.log(`[Scheduler] Running import for configuration: ${config.id}`);
        console.log(`[Scheduler] Sheet URL: ${config.googleSheetUrl}`);
        configId = config.id;

        const serviceAccountCreds = this.getServiceAccountCredentials();
        const ingestionService = new LeadIngestionService(serviceAccountCreds);

        result = await ingestionService.ingestLeads(
          config.id,
          config.spreadsheetId,
          config.sheetName
        );
      }

      const logStatus = result.success 
        ? 'success' 
        : (result.leadsInserted > 0 ? 'partial' : 'error');

      await db.createImportLog({
        configurationId: configId,
        runAt: new Date(),
        status: logStatus,
        rowsScanned: result.rowsScanned,
        newRowsDetected: result.newRowsDetected,
        leadsInserted: result.leadsInserted,
        duplicatesSkipped: result.duplicatesSkipped,
        errors: result.errors,
      });

      if (result.leadsInserted > 0) {
        console.log(`[Scheduler] Sending notifications for ${result.leadsInserted} new leads`);
        await this.sendNotifications(result.insertedLeads);
      }

      const duration = Date.now() - startTime;
      console.log(`[Scheduler] === IMPORT COMPLETED in ${duration}ms ===`);
      console.log(`[Scheduler] Results:`, {
        success: result.success,
        leadsInserted: result.leadsInserted,
        duplicatesSkipped: result.duplicatesSkipped,
        errors: result.errors.length,
      });
    } catch (error: any) {
      console.error('[Scheduler] Fatal error during import:', error);
      
      try {
        const excelFilePath = process.env.EXCEL_FILE_PATH;
        const configId = excelFilePath ? 'excel-import-config' : (await db.getImportConfiguration())?.id;
        
        if (configId) {
          await db.createImportLog({
            configurationId: configId,
            runAt: new Date(),
            status: 'error',
            rowsScanned: 0,
            newRowsDetected: 0,
            leadsInserted: 0,
            duplicatesSkipped: 0,
            errors: [error.message],
          });
        }
      } catch (logError) {
        console.error('[Scheduler] Failed to log error:', logError);
      }
    } finally {
      this.isRunning = false;
    }
  }

  private async sendNotifications(leads: any[]) {
    try {
      const users = await db.getAllUsers();
      const salesUsers = users.filter(u => u.role === 'agent' || u.role === 'manager' || u.role === 'admin');

      for (const user of salesUsers) {
        for (const lead of leads) {
          await db.createNotification({
            userId: user.id,
            type: 'new_lead',
            title: 'New Lead Received',
            message: `📥 New lead from ${lead.platform || 'Google Sheet'} – ${lead.clientName}`,
            leadId: lead.id,
            isRead: false,
          });
        }
      }

      console.log(`[Scheduler] Sent notifications to ${salesUsers.length} users`);
    } catch (error: any) {
      console.error('[Scheduler] Error sending notifications:', error);
    }
  }

  private getServiceAccountCredentials(): any {
    try {
      const credsJson = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS;
      if (credsJson) {
        return JSON.parse(credsJson);
      }
      return undefined;
    } catch {
      console.error('[Scheduler] Failed to parse service account credentials');
      return undefined;
    }
  }
}

export const leadImportScheduler = new LeadImportScheduler();
