export type UserRole = 'admin' | 'manager' | 'agent';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt: Date;
}

export interface Lead {
  id: string;
  clientName: string;
  contactNumber: string;
  email?: string;
  source: string;
  interestedAreas: string[];
  interestedProjects: string[];
  ownership: 'self' | 'investment';
  furnishing: 'unfurnished' | 'semi' | 'fully';
  interestLevel?: InterestLevel;
  callStatus?: CallStatus;
  createdAt: Date;
  updatedAt: Date;
  assignedUserId: string;
  isDeleted: boolean;
  externalLeadId?: string;
  platform?: string;
  campaignName?: string;
  adName?: string;
  adsetName?: string;
  formName?: string;
  configurationRequested?: string;
  isOrganic?: boolean;
  leadCreatedTime?: Date;
  leadStatus?: string;
}

export type InterestLevel = 'cold' | 'warm' | 'hot';
export type CallStatus = 'not_received' | 'connected' | 'follow_up_needed' | 'not_interested';

export interface Interaction {
  id: string;
  leadId: string;
  interestLevel: InterestLevel;
  budget: number;
  callStatus: CallStatus;
  followUpDateTime?: Date;
  notes: string;
  createdAt: Date;
  createdBy: string;
}

export interface RefreshToken {
  token: string;
  userId: string;
  expiresAt: Date;
}

export interface ImportConfiguration {
  id: string;
  googleSheetUrl: string;
  spreadsheetId: string;
  sheetName: string;
  serviceAccountEmail?: string;
  isActive: boolean;
  pollIntervalMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ImportState {
  id: string;
  configurationId: string;
  lastProcessedRow: number;
  lastProcessedId?: string;
  lastProcessedTime?: Date;
  lastRunAt: Date;
  nextRunAt: Date;
}

export interface ImportLog {
  id: string;
  configurationId: string;
  runAt: Date;
  status: 'success' | 'error' | 'partial';
  rowsScanned: number;
  newRowsDetected: number;
  leadsInserted: number;
  duplicatesSkipped: number;
  errors: string[];
}

export interface Notification {
  id: string;
  userId: string;
  type: 'new_lead' | 'follow_up' | 'overdue_follow_up';
  title: string;
  message: string;
  leadId?: string;
  isRead: boolean;
  createdAt: Date;
}
