import type { UserRole, InterestLevel, CallStatus } from '../backend/db/models';

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

export interface ApiLead {
  id: string;
  clientName: string;
  contactNumber: string;
  source: string;
  interestedAreas: string[];
  interestedProjects: string[];
  ownership: 'self' | 'investment';
  furnishing: 'unfurnished' | 'semi' | 'fully';
  createdAt: Date;
  updatedAt: Date;
  assignedUserId: string;
  isDeleted: boolean;
}

export interface ApiInteraction {
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

export interface ApiLeadWithInteractions extends ApiLead {
  interactions: ApiInteraction[];
}
