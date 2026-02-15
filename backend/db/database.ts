import { User, Lead, Interaction, RefreshToken, ImportConfiguration, ImportState, ImportLog, Notification } from './models';
import bcrypt from 'bcryptjs';

class Database {
  users: Map<string, User> = new Map();
  leads: Map<string, Lead> = new Map();
  interactions: Map<string, Interaction> = new Map();
  refreshTokens: Map<string, RefreshToken> = new Map();
  importConfigurations: Map<string, ImportConfiguration> = new Map();
  importStates: Map<string, ImportState> = new Map();
  importLogs: Map<string, ImportLog> = new Map();
  notifications: Map<string, Notification> = new Map();

  constructor() {
    this.seedData();
  }



  private seedData() {
    console.log('Seeding database...');
    const hashedPassword = bcrypt.hashSync('password123', 10);
    console.log('Hashed password created');
    
    const users: User[] = [
      {
        id: 'user-1',
        name: 'John Admin',
        email: 'admin@realestate.com',
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date(),
      },
      {
        id: 'user-2',
        name: 'Sarah Manager',
        email: 'manager@realestate.com',
        password: hashedPassword,
        role: 'manager',
        createdAt: new Date(),
      },
      {
        id: 'user-3',
        name: 'Mike Agent',
        email: 'agent@realestate.com',
        password: hashedPassword,
        role: 'agent',
        createdAt: new Date(),
      },
    ];

    users.forEach(user => this.users.set(user.id, user));
    console.log(`Seeded ${users.length} users`);

    const leads: Lead[] = [
      {
        id: 'lead-1',
        clientName: 'Robert Johnson',
        contactNumber: '+1234567890',
        source: 'Website',
        interestedAreas: ['Downtown', 'Suburb'],
        interestedProjects: ['Skyline Towers', 'Green Valley'],
        ownership: 'self',
        furnishing: 'fully',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        assignedUserId: 'user-3',
        isDeleted: false,
      },
      {
        id: 'lead-2',
        clientName: 'Emily Davis',
        contactNumber: '+1234567891',
        source: 'Referral',
        interestedAreas: ['City Center'],
        interestedProjects: ['Plaza Residency'],
        ownership: 'investment',
        furnishing: 'semi',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        assignedUserId: 'user-3',
        isDeleted: false,
      },
      {
        id: 'lead-3',
        clientName: 'Michael Brown',
        contactNumber: '+1234567892',
        source: 'Cold Call',
        interestedAreas: ['Waterfront'],
        interestedProjects: ['Marina Bay'],
        ownership: 'self',
        furnishing: 'unfurnished',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        assignedUserId: 'user-3',
        isDeleted: false,
      },
    ];

    leads.forEach(lead => this.leads.set(lead.id, lead));

    const interactions: Interaction[] = [
      {
        id: 'int-1',
        leadId: 'lead-1',
        interestLevel: 'hot',
        budget: 500000,
        callStatus: 'connected',
        followUpDateTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        notes: 'Very interested, wants to visit site',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        createdBy: 'user-3',
      },
      {
        id: 'int-2',
        leadId: 'lead-2',
        interestLevel: 'warm',
        budget: 300000,
        callStatus: 'follow_up_needed',
        followUpDateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        notes: 'Needs more information about payment plans',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        createdBy: 'user-3',
      },
      {
        id: 'int-3',
        leadId: 'lead-3',
        interestLevel: 'cold',
        budget: 200000,
        callStatus: 'not_received',
        notes: 'Did not answer call',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        createdBy: 'user-3',
      },
      {
        id: 'int-4',
        leadId: 'lead-1',
        interestLevel: 'warm',
        budget: 450000,
        callStatus: 'connected',
        notes: 'Initial contact made',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        createdBy: 'user-3',
      },
    ];

    interactions.forEach(int => this.interactions.set(int.id, int));
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    console.log('Looking up user by email:', email);
    const user = Array.from(this.users.values()).find(u => u.email === email);
    console.log('User found:', !!user);
    return user;
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getLeadById(id: string): Promise<Lead | undefined> {
    return this.leads.get(id);
  }

  async getLeads(filters: {
    search?: string;
    assignedUserId?: string;
    source?: string;
    ownership?: string;
    furnishing?: string;
    interestLevel?: string;
    callStatus?: string;
    createdFrom?: Date;
    createdTo?: Date;
    modifiedFrom?: Date;
    modifiedTo?: Date;
    project?: string;
  }): Promise<Lead[]> {
    let leads = Array.from(this.leads.values()).filter(l => !l.isDeleted);

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      leads = leads.filter(
        l =>
          l.clientName.toLowerCase().includes(searchLower) ||
          l.contactNumber.includes(searchLower)
      );
    }

    if (filters.assignedUserId) {
      leads = leads.filter(l => l.assignedUserId === filters.assignedUserId);
    }

    if (filters.source) {
      leads = leads.filter(l => l.source === filters.source);
    }

    if (filters.ownership) {
      leads = leads.filter(l => l.ownership === filters.ownership);
    }

    if (filters.furnishing) {
      leads = leads.filter(l => l.furnishing === filters.furnishing);
    }

    if (filters.project) {
      const project = filters.project;
      leads = leads.filter(l => l.interestedProjects.includes(project));
    }

    if (filters.createdFrom) {
      const createdFrom = filters.createdFrom;
      leads = leads.filter(l => l.createdAt >= createdFrom);
    }

    if (filters.createdTo) {
      const createdTo = filters.createdTo;
      leads = leads.filter(l => l.createdAt <= createdTo);
    }

    if (filters.modifiedFrom) {
      const modifiedFrom = filters.modifiedFrom;
      leads = leads.filter(l => l.updatedAt >= modifiedFrom);
    }

    if (filters.modifiedTo) {
      const modifiedTo = filters.modifiedTo;
      leads = leads.filter(l => l.updatedAt <= modifiedTo);
    }

    if (filters.interestLevel || filters.callStatus) {
      const leadIds = new Set(
        Array.from(this.interactions.values())
          .filter(int => {
            if (filters.interestLevel && int.interestLevel !== filters.interestLevel) return false;
            if (filters.callStatus && int.callStatus !== filters.callStatus) return false;
            return true;
          })
          .map(int => int.leadId)
      );
      leads = leads.filter(l => leadIds.has(l.id));
    }

    return leads.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async createLead(lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>): Promise<Lead> {
    const newLead: Lead = {
      ...lead,
      id: `lead-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      isDeleted: false,
    };
    this.leads.set(newLead.id, newLead);
    return newLead;
  }

  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead | undefined> {
    const lead = this.leads.get(id);
    if (!lead || lead.isDeleted) return undefined;

    const updatedLead = {
      ...lead,
      ...updates,
      id: lead.id,
      updatedAt: new Date(),
      isDeleted: lead.isDeleted,
    };
    this.leads.set(id, updatedLead);
    return updatedLead;
  }

  async deleteLead(id: string): Promise<boolean> {
    const lead = this.leads.get(id);
    if (!lead) return false;

    lead.isDeleted = true;
    lead.updatedAt = new Date();
    this.leads.set(id, lead);
    return true;
  }

  async getInteractionsByLeadId(leadId: string): Promise<Interaction[]> {
    return Array.from(this.interactions.values())
      .filter(i => i.leadId === leadId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createInteraction(interaction: Omit<Interaction, 'id' | 'createdAt'>): Promise<Interaction> {
    const newInteraction: Interaction = {
      ...interaction,
      id: `int-${Date.now()}`,
      createdAt: new Date(),
    };
    this.interactions.set(newInteraction.id, newInteraction);
    return newInteraction;
  }

  async getUpcomingFollowUps(userId: string): Promise<{ interaction: Interaction; lead: Lead }[]> {
    const now = new Date();
    const leadFollowUps = new Map<string, { interaction: Interaction; lead: Lead }>();

    const allInteractions = Array.from(this.interactions.values())
      .filter(i => 
        (i.followUpDateTime && i.followUpDateTime >= now) || 
        (i.callStatus === 'follow_up_needed' && !i.followUpDateTime)
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    for (const interaction of allInteractions) {
      const lead = await this.getLeadById(interaction.leadId);
      if (lead && !lead.isDeleted && lead.assignedUserId === userId) {
        if (!leadFollowUps.has(interaction.leadId)) {
          leadFollowUps.set(interaction.leadId, { interaction, lead });
        }
      }
    }

    return Array.from(leadFollowUps.values()).sort((a, b) => {
      const aTime = a.interaction.followUpDateTime?.getTime() || Date.now();
      const bTime = b.interaction.followUpDateTime?.getTime() || Date.now();
      return aTime - bTime;
    });
  }

  async getOverdueFollowUps(userId: string): Promise<{ interaction: Interaction; lead: Lead }[]> {
    const now = new Date();
    const leadFollowUps = new Map<string, { interaction: Interaction; lead: Lead }>();

    const allInteractions = Array.from(this.interactions.values())
      .filter(i => i.followUpDateTime && i.followUpDateTime < now)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    for (const interaction of allInteractions) {
      const lead = await this.getLeadById(interaction.leadId);
      if (lead && !lead.isDeleted && lead.assignedUserId === userId) {
        if (!leadFollowUps.has(interaction.leadId)) {
          leadFollowUps.set(interaction.leadId, { interaction, lead });
        }
      }
    }

    return Array.from(leadFollowUps.values()).sort((a, b) => 
      (a.interaction.followUpDateTime?.getTime() || 0) - (b.interaction.followUpDateTime?.getTime() || 0)
    );
  }

  async saveRefreshToken(token: string, userId: string, expiresAt: Date): Promise<void> {
    this.refreshTokens.set(token, { token, userId, expiresAt });
  }

  async getRefreshToken(token: string): Promise<RefreshToken | undefined> {
    return this.refreshTokens.get(token);
  }

  async deleteRefreshToken(token: string): Promise<void> {
    this.refreshTokens.delete(token);
  }

  async getImportConfiguration(): Promise<ImportConfiguration | undefined> {
    return Array.from(this.importConfigurations.values()).find(c => c.isActive);
  }

  async createImportConfiguration(config: Omit<ImportConfiguration, 'id' | 'createdAt' | 'updatedAt'>): Promise<ImportConfiguration> {
    Array.from(this.importConfigurations.values()).forEach(c => {
      c.isActive = false;
      this.importConfigurations.set(c.id, c);
    });

    const newConfig: ImportConfiguration = {
      ...config,
      id: `config-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.importConfigurations.set(newConfig.id, newConfig);
    return newConfig;
  }

  async updateImportConfiguration(id: string, updates: Partial<ImportConfiguration>): Promise<ImportConfiguration | undefined> {
    const config = this.importConfigurations.get(id);
    if (!config) return undefined;

    const updatedConfig = {
      ...config,
      ...updates,
      id: config.id,
      updatedAt: new Date(),
    };
    this.importConfigurations.set(id, updatedConfig);
    return updatedConfig;
  }

  async getImportState(configurationId: string): Promise<ImportState | undefined> {
    return Array.from(this.importStates.values()).find(s => s.configurationId === configurationId);
  }

  async createOrUpdateImportState(state: Omit<ImportState, 'id'>): Promise<ImportState> {
    const existing = await this.getImportState(state.configurationId);
    
    if (existing) {
      const updated = { ...existing, ...state };
      this.importStates.set(existing.id, updated);
      return updated;
    }

    const newState: ImportState = {
      ...state,
      id: `state-${Date.now()}`,
    };
    this.importStates.set(newState.id, newState);
    return newState;
  }

  async createImportLog(log: Omit<ImportLog, 'id'>): Promise<ImportLog> {
    const newLog: ImportLog = {
      ...log,
      id: `log-${Date.now()}-${Math.random()}`,
    };
    this.importLogs.set(newLog.id, newLog);
    return newLog;
  }

  async getImportLogs(configurationId: string, limit: number = 50): Promise<ImportLog[]> {
    return Array.from(this.importLogs.values())
      .filter(l => l.configurationId === configurationId)
      .sort((a, b) => b.runAt.getTime() - a.runAt.getTime())
      .slice(0, limit);
  }

  async createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random()}`,
      createdAt: new Date(),
    };
    this.notifications.set(newNotification.id, newNotification);
    return newNotification;
  }

  async getNotifications(userId: string, unreadOnly: boolean = false): Promise<Notification[]> {
    let notifications = Array.from(this.notifications.values()).filter(n => n.userId === userId);
    
    if (unreadOnly) {
      notifications = notifications.filter(n => !n.isRead);
    }
    
    return notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async markNotificationAsRead(id: string): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;

    notification.isRead = true;
    this.notifications.set(id, notification);
    return notification;
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    Array.from(this.notifications.values())
      .filter(n => n.userId === userId && !n.isRead)
      .forEach(n => {
        n.isRead = true;
        this.notifications.set(n.id, n);
      });
  }

  async checkDuplicateLead(externalLeadId?: string, email?: string, phone?: string): Promise<Lead | undefined> {
    return Array.from(this.leads.values()).find(lead => {
      if (!lead.isDeleted) {
        if (externalLeadId && lead.externalLeadId === externalLeadId) return true;
        if (email && lead.email === email) return true;
        if (phone && lead.contactNumber === phone) return true;
      }
      return false;
    });
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
}

export const db = new Database();
