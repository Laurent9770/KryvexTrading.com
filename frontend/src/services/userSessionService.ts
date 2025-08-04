export interface UserSession {
  id: string;
  userId: string;
  username: string;
  email: string;
  sessionToken: string;
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
  loginAt: string;
  lastActivity?: string;
  logoutAt?: string;
}

export class UserSessionService {
  private sessions: Map<string, UserSession> = new Map();

  constructor() {
    this.loadPersistedData();
  }

  private loadPersistedData() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedSessions = localStorage.getItem('user_sessions');
        if (savedSessions) {
          const sessions = JSON.parse(savedSessions);
          this.sessions = new Map(Object.entries(sessions));
        }
      }
    } catch (error) {
      console.warn('Error loading persisted session data:', error);
    }
  }

  private persistData() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const sessionsObj = Object.fromEntries(this.sessions);
        localStorage.setItem('user_sessions', JSON.stringify(sessionsObj));
      }
    } catch (error) {
      console.warn('Error persisting session data:', error);
    }
  }

  // Create new user session
  createSession(userId: string, username: string, email: string, sessionToken: string, ipAddress?: string, userAgent?: string): UserSession {
    const session: UserSession = {
      id: `session-${Date.now()}`,
      userId,
      username,
      email,
      sessionToken,
      ipAddress,
      userAgent,
      isActive: true,
      loginAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };

    this.sessions.set(session.id, session);
    this.persistData();
    return session;
  }

  // Update session activity
  updateSessionActivity(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date().toISOString();
      this.sessions.set(sessionId, session);
      this.persistData();
    }
  }

  // Logout user session
  logoutSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
      session.logoutAt = new Date().toISOString();
      this.sessions.set(sessionId, session);
      this.persistData();
    }
  }

  // Get all sessions
  getAllSessions(): UserSession[] {
    return Array.from(this.sessions.values()).sort((a, b) => 
      new Date(b.loginAt).getTime() - new Date(a.loginAt).getTime()
    );
  }

  // Get active sessions
  getActiveSessions(): UserSession[] {
    return this.getAllSessions().filter(session => session.isActive);
  }

  // Get sessions by user
  getSessionsByUser(userId: string): UserSession[] {
    return this.getAllSessions().filter(session => session.userId === userId);
  }

  // Clear old sessions (older than 30 days)
  clearOldSessions(): void {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sessionsToDelete: string[] = [];
    this.sessions.forEach((session, id) => {
      if (new Date(session.loginAt) < thirtyDaysAgo) {
        sessionsToDelete.push(id);
      }
    });

    sessionsToDelete.forEach(id => {
      this.sessions.delete(id);
    });

    this.persistData();
  }

  // Clear all mock data
  clearMockData(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedSessions = localStorage.getItem('user_sessions');
        if (savedSessions) {
          const sessions = JSON.parse(savedSessions);
          const mockEmails = ['john@example.com', 'jane@example.com', 'mike@example.com', 'sarah@example.com'];
          
          // Remove sessions with mock data
          Object.keys(sessions).forEach(key => {
            const session = sessions[key];
            if (mockEmails.includes(session.email)) {
              delete sessions[key];
            }
          });
          
          // Update localStorage with cleaned data
          localStorage.setItem('user_sessions', JSON.stringify(sessions));
          this.sessions = new Map(Object.entries(sessions));
        }
        
        console.log('Mock session data cleared from localStorage');
      }
    } catch (error) {
      console.warn('Error clearing mock session data:', error);
    }
  }
}

const userSessionService = new UserSessionService();
export default userSessionService; 