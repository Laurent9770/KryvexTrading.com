import websocketService from './websocketService';

export interface KYCLevel {
  level: 0 | 1 | 2 | 3;
  status: 'pending' | 'verified' | 'rejected' | 'not_started';
  completed: boolean;
  submittedAt?: string;
  verifiedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
}

export interface KYCSubmission {
  id: string;
  userId: string;
  level: 1 | 2 | 3;
  status: 'pending' | 'approved' | 'rejected';
  documents: {
    idDocument?: File;
    addressProof?: File;
    selfie?: File;
  };
  personalInfo?: {
    fullName: string;
    dateOfBirth: string;
    nationalId: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

export interface KYCUser {
  id: string;
  email: string;
  kycLevel: KYCLevel;
  submissions: KYCSubmission[];
  restrictions: {
    canTrade: boolean;
    canDeposit: boolean;
    canWithdraw: boolean;
    canAccessFullPlatform: boolean;
    tradeLimit: number;
  };
}

class KYCService {
  private static instance: KYCService;
  private users: Map<string, KYCUser> = new Map();
  private submissions: Map<string, KYCSubmission> = new Map();
  private listeners: Map<string, Function[]> = new Map();

  private constructor() {
    this.initializeService();
  }

  static getInstance(): KYCService {
    if (!KYCService.instance) {
      KYCService.instance = new KYCService();
    }
    return KYCService.instance;
  }

  private initializeService() {
    // Load persisted data
    this.loadPersistedData();
    
    // Set up WebSocket listeners
    this.setupWebSocketListeners();
  }

  private loadPersistedData() {
    try {
      const persistedUsers = localStorage.getItem('kycUsers');
      if (persistedUsers) {
        const usersData = JSON.parse(persistedUsers);
        this.users = new Map(Object.entries(usersData));
      }

      const persistedSubmissions = localStorage.getItem('kycSubmissions');
      if (persistedSubmissions) {
        const submissionsData = JSON.parse(persistedSubmissions);
        this.submissions = new Map(Object.entries(submissionsData));
      }
    } catch (error) {
      console.error('Error loading KYC data:', error);
    }
  }

  private savePersistedData() {
    try {
      const usersData = Object.fromEntries(this.users);
      localStorage.setItem('kycUsers', JSON.stringify(usersData));

      const submissionsData = Object.fromEntries(this.submissions);
      localStorage.setItem('kycSubmissions', JSON.stringify(submissionsData));
    } catch (error) {
      console.error('Error saving KYC data:', error);
    }
  }

  private setupWebSocketListeners() {
    websocketService.on('kyc_level_updated', (data: any) => {
      this.updateUserKYCLevel(data.userId, data.level, data.status);
    });

    websocketService.on('kyc_submission_reviewed', (data: any) => {
      this.handleSubmissionReview(data.submissionId, data.status, data.reason);
    });
  }

  // User KYC Management
  createUser(userId: string, email: string): KYCUser {
    const user: KYCUser = {
      id: userId,
      email,
      kycLevel: {
        level: 0,
        status: 'not_started',
        completed: false
      },
      submissions: [],
      restrictions: {
        canTrade: false,
        canDeposit: false,
        canWithdraw: false,
        canAccessFullPlatform: false,
        tradeLimit: 0
      }
    };

    this.users.set(userId, user);
    this.savePersistedData();
    this.emit('user_created', user);
    return user;
  }

  getUser(userId: string): KYCUser | null {
    return this.users.get(userId) || null;
  }

  getAllUsers(): KYCUser[] {
    return Array.from(this.users.values());
  }

  getSubmissionsByStatus(status: 'pending' | 'approved' | 'rejected'): KYCSubmission[] {
    return Array.from(this.submissions.values()).filter(sub => sub.status === status);
  }

  // Level 1: Email Verification
  async verifyEmail(userId: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;

    try {
      // Simulate email verification process
      await new Promise(resolve => setTimeout(resolve, 2000));

      user.kycLevel = {
        level: 1,
        status: 'verified',
        completed: true,
        verifiedAt: new Date().toISOString()
      };

      this.updateUserRestrictions(user);
      this.users.set(userId, user);
      this.savePersistedData();

      // Notify admin
      websocketService.updateKYCStatus(userId, {
        level: 1,
        status: 'verified',
        timestamp: new Date().toISOString()
      });

      this.emit('level_verified', { userId, level: 1 });
      return true;
    } catch (error) {
      console.error('Email verification failed:', error);
      return false;
    }
  }

  // Level 2: Identity Verification
  async submitIdentityVerification(userId: string, data: {
    fullName: string;
    dateOfBirth: string;
    nationalId: string;
    idDocument: File;
    selfie?: File;
  }): Promise<string> {
    const user = this.users.get(userId);
    if (!user || user.kycLevel.level < 1) {
      throw new Error('User must complete Level 1 first');
    }

    const submissionId = `sub-${Date.now()}`;
    const submission: KYCSubmission = {
      id: submissionId,
      userId,
      level: 2,
      status: 'pending',
      documents: {
        idDocument: data.idDocument,
        selfie: data.selfie
      },
      personalInfo: {
        fullName: data.fullName,
        dateOfBirth: data.dateOfBirth,
        nationalId: data.nationalId,
        address: '',
        city: '',
        postalCode: '',
        country: ''
      },
      submittedAt: new Date().toISOString()
    };

    this.submissions.set(submissionId, submission);
    user.submissions.push(submission);
    this.savePersistedData();

    // Notify admin
    websocketService.updateKYCStatus(userId, {
      level: 2,
      status: 'pending',
      submissionId,
      timestamp: new Date().toISOString()
    });

    this.emit('submission_created', submission);
    return submissionId;
  }

  // Level 3: Address Verification
  async submitAddressVerification(userId: string, data: {
    address: string;
    city: string;
    postalCode: string;
    country: string;
    addressProof: File;
  }): Promise<string> {
    const user = this.users.get(userId);
    if (!user || user.kycLevel.level < 2) {
      throw new Error('User must complete Level 2 first');
    }

    const submissionId = `sub-${Date.now()}`;
    const submission: KYCSubmission = {
      id: submissionId,
      userId,
      level: 3,
      status: 'pending',
      documents: {
        addressProof: data.addressProof
      },
      personalInfo: {
        fullName: user.submissions.find(s => s.level === 2)?.personalInfo?.fullName || '',
        dateOfBirth: user.submissions.find(s => s.level === 2)?.personalInfo?.dateOfBirth || '',
        nationalId: user.submissions.find(s => s.level === 2)?.personalInfo?.nationalId || '',
        address: data.address,
        city: data.city,
        postalCode: data.postalCode,
        country: data.country
      },
      submittedAt: new Date().toISOString()
    };

    this.submissions.set(submissionId, submission);
    user.submissions.push(submission);
    this.savePersistedData();

    // Notify admin
    websocketService.updateKYCStatus(userId, {
      level: 3,
      status: 'pending',
      submissionId,
      timestamp: new Date().toISOString()
    });

    this.emit('submission_created', submission);
    return submissionId;
  }

  // Admin Functions
  async reviewSubmission(submissionId: string, status: 'approved' | 'rejected', reason?: string): Promise<boolean> {
    const submission = this.submissions.get(submissionId);
    if (!submission) return false;

    const user = this.users.get(submission.userId);
    if (!user) return false;

    submission.status = status;
    submission.reviewedAt = new Date().toISOString();
    submission.reviewedBy = 'admin';
    if (status === 'rejected' && reason) {
      submission.rejectionReason = reason;
    }

    if (status === 'approved') {
      // Update user KYC level
      const newLevel = submission.level as 1 | 2 | 3;
      user.kycLevel = {
        level: newLevel,
        status: 'verified',
        completed: true,
        verifiedAt: new Date().toISOString()
      };

      this.updateUserRestrictions(user);
    }

    this.submissions.set(submissionId, submission);
    this.users.set(submission.userId, user);
    this.savePersistedData();

    // Notify user
    websocketService.updateKYCStatus(submission.userId, {
      level: submission.level,
      status: status === 'approved' ? 'verified' : 'rejected',
      reason,
      timestamp: new Date().toISOString()
    });

    this.emit('submission_reviewed', { submission, user });
    return true;
  }

  private updateUserRestrictions(user: KYCUser) {
    const level = user.kycLevel.level;
    
    user.restrictions = {
      canTrade: level >= 1,
      canDeposit: level >= 2,
      canWithdraw: level >= 2,
      canAccessFullPlatform: level >= 3,
      tradeLimit: level >= 2 ? 10000 : level >= 1 ? 1000 : 0
    };
  }

  private updateUserKYCLevel(userId: string, level: number, status: string) {
    const user = this.users.get(userId);
    if (!user) return;

    user.kycLevel = {
      level: level as 0 | 1 | 2 | 3,
      status: status as 'pending' | 'verified' | 'rejected' | 'not_started',
      completed: status === 'verified',
      verifiedAt: status === 'verified' ? new Date().toISOString() : undefined
    };

    this.updateUserRestrictions(user);
    this.users.set(userId, user);
    this.savePersistedData();
    this.emit('user_updated', user);
  }

  private handleSubmissionReview(submissionId: string, status: string, reason?: string) {
    this.reviewSubmission(submissionId, status as 'approved' | 'rejected', reason);
  }

  // Event listeners
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  // Utility functions
  canUserTrade(userId: string): boolean {
    const user = this.users.get(userId);
    return user?.restrictions.canTrade || false;
  }

  canUserDeposit(userId: string): boolean {
    const user = this.users.get(userId);
    return user?.restrictions.canDeposit || false;
  }

  canUserWithdraw(userId: string): boolean {
    const user = this.users.get(userId);
    return user?.restrictions.canWithdraw || false;
  }

  getUserTradeLimit(userId: string): number {
    const user = this.users.get(userId);
    return user?.restrictions.tradeLimit || 0;
  }

  getKYCProgress(userId: string): { level: number; status: string; progress: number } {
    const user = this.users.get(userId);
    if (!user) {
      return { level: 0, status: 'not_started', progress: 0 };
    }

    const level = user.kycLevel.level;
    const status = user.kycLevel.status;
    const progress = (level / 3) * 100;

    return { level, status, progress };
  }
}

const kycService = KYCService.getInstance();
export default kycService; 