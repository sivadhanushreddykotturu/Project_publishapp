import { TestApp, BugReport, TesterAssignment, WithdrawalRequest, Transaction } from '../types';

/**
 * LaunchOps Centralized API Client Module
 * -------------------------------------------------------------
 * Configured for the LaunchOps backend API.
 * To point to your live backend server, set NEXT_PUBLIC_API_BASE_URL in .env.local
 * e.g. NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export class ApiRequestError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  token?: string;
  body?: unknown;
};

export async function apiRequest<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
  const { token, body, ...requestOptions } = options;
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...requestOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...requestOptions.headers,
    },
    body: body == null ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiRequestError(payload?.error?.message || payload?.message || `API request failed (${response.status})`, response.status);
  }
  return payload as T;
}

/**
 * Helper to handle fetch requests with Bearer JWT headers
 */
async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('launchops_auth_token') : null;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || `API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn(`[LaunchOps API] Endpoint ${endpoint} unreachable or offline. Falling back to local state mock:`, error);
    throw error;
  }
}

export const api = {
  // ================= AUTHENTICATION ENDPOINTS =================
  auth: {
    login: async (email: string, role: 'tester' | 'client' | 'admin') => {
      try {
        return await fetchAPI<{ token: string; user: any }>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, role }),
        });
      } catch {
        // Fallback for offline/mock frontend preview
        const mockToken = `mock_token_${Date.now()}`;
        if (typeof window !== 'undefined') {
          localStorage.setItem('launchops_auth_token', mockToken);
        }
        return { token: mockToken, user: { email, role } };
      }
    },
    register: async (userData: any) => {
      return fetchAPI<{ message: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    },
    logout: async () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('launchops_auth_token');
      }
    }
  },

  // ================= APPLICATIONS / PROJECTS =================
  apps: {
    getAll: async (): Promise<TestApp[]> => {
      try {
        return await fetchAPI<TestApp[]>('/apps');
      } catch {
        const local = typeof window !== 'undefined' ? localStorage.getItem('launchops_apps') : null;
        return local ? JSON.parse(local) : [];
      }
    },
    getById: async (id: string): Promise<TestApp> => {
      return fetchAPI<TestApp>(`/apps/${id}`);
    },
    create: async (appData: Partial<TestApp>): Promise<TestApp> => {
      try {
        return await fetchAPI<TestApp>('/apps', {
          method: 'POST',
          body: JSON.stringify(appData),
        });
      } catch {
        // Fallback mock creation
        const newApp: TestApp = {
          id: `app_${Date.now()}`,
          name: appData.name || 'New Application',
          version: appData.version || '1.0.0',
          status: 'Testing',
          testersCount: 0,
          bugsFound: 0,
          launchDate: new Date().toISOString().split('T')[0],
          category: appData.category || 'Tools',
          progress: 0,
          devices: ['Pixel 7', 'Galaxy S23'],
          packageTier: appData.packageTier || 'managed_testing',
          verificationRequired: true,
          verificationStatus: 'none',
          invoiceStatus: 'paid',
          testersRequired: appData.testersRequired || 14,
          ...appData
        };
        return newApp;
      }
    },
    submitVettingProof: async (appId: string, proofUrl: string) => {
      return fetchAPI<{ success: boolean; app: TestApp }>(`/apps/${appId}/vetting`, {
        method: 'POST',
        body: JSON.stringify({ proofUrl }),
      });
    }
  },

  // ================= TESTER ASSIGNMENTS & PIPELINE =================
  assignments: {
    getMyAssignments: async (testerId: string): Promise<TesterAssignment[]> => {
      try {
        return await fetchAPI<TesterAssignment[]>(`/assignments?testerId=${testerId}`);
      } catch {
        const local = typeof window !== 'undefined' ? localStorage.getItem('launchops_assignments') : null;
        return local ? JSON.parse(local) : [];
      }
    },
    joinProject: async (projectId: string, testerEmail: string, screenshotProof: string) => {
      return fetchAPI<{ assignment: TesterAssignment }>('/assignments/join', {
        method: 'POST',
        body: JSON.stringify({ projectId, testerEmail, screenshotProof }),
      });
    },
    submitInstallationProof: async (assignmentId: string, screenshotProof: string) => {
      return fetchAPI<{ success: boolean }>(`/assignments/${assignmentId}/step3-proof`, {
        method: 'POST',
        body: JSON.stringify({ screenshotProof }),
      });
    },
    performCheckIn: async (assignmentId: string) => {
      return fetchAPI<{ success: boolean; checkInsCompleted: number }>(`/assignments/${assignmentId}/check-in`, {
        method: 'POST',
      });
    }
  },

  // ================= BUGS & FLAW REPORTING =================
  bugs: {
    getAll: async (): Promise<BugReport[]> => {
      try {
        return await fetchAPI<BugReport[]>('/bugs');
      } catch {
        const local = typeof window !== 'undefined' ? localStorage.getItem('launchops_bugs') : null;
        return local ? JSON.parse(local) : [];
      }
    },
    submitReport: async (bugData: Partial<BugReport>): Promise<BugReport> => {
      return fetchAPI<BugReport>('/bugs', {
        method: 'POST',
        body: JSON.stringify(bugData),
      });
    },
    updateStatus: async (bugId: string, status: string, isPublished?: boolean, adminNotes?: string) => {
      return fetchAPI<BugReport>(`/bugs/${bugId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, isPublished, adminNotes }),
      });
    }
  },

  // ================= WALLETS & PAYOUTS =================
  wallet: {
    requestWithdrawal: async (testerId: string, amount: number, upiId: string): Promise<WithdrawalRequest> => {
      return fetchAPI<WithdrawalRequest>('/wallet/withdraw', {
        method: 'POST',
        body: JSON.stringify({ testerId, amount, upiId }),
      });
    },
    getTransactions: async (testerId: string): Promise<Transaction[]> => {
      return fetchAPI<Transaction[]>(`/wallet/transactions?testerId=${testerId}`);
    }
  }
};
