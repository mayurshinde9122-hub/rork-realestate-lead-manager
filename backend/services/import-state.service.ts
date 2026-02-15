import { db } from '../db/database';
import { ImportState } from '../db/models';

export class ImportStateService {
  async getLastProcessedRow(configurationId: string): Promise<number> {
    const state = await db.getImportState(configurationId);
    return state?.lastProcessedRow || 1;
  }

  async updateState(
    configurationId: string,
    lastProcessedRow: number,
    lastProcessedId?: string,
    lastProcessedTime?: Date
  ): Promise<ImportState> {
    const now = new Date();
    const nextRun = new Date(now.getTime() + 10 * 60 * 1000);

    return await db.createOrUpdateImportState({
      configurationId,
      lastProcessedRow,
      lastProcessedId,
      lastProcessedTime,
      lastRunAt: now,
      nextRunAt: nextRun,
    });
  }

  async getNextRunTime(configurationId: string): Promise<Date | null> {
    const state = await db.getImportState(configurationId);
    return state?.nextRunAt || null;
  }
}

export const importStateService = new ImportStateService();
