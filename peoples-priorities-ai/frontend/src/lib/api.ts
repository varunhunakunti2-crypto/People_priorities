const API_BASE_URL = import.meta.env.PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';

// Trigger build rebuild monorepo
export interface RankingItem {
  villageId: string;
  villageName: string;
  themeId: number;
  themeLabel: string;
  demandScore: number;
  needScore: number;
  neglectScore: number;
  feasibilityScore: number;
  priorityScore: number;
  submissionCount: number;
  sampleComplaints: string[];
}


export interface VillageDetail {
  village_id: string;
  village_name: string;
  subdistrict: string;
  population: number;
  literacy_rate_pct: number;
  sc_st_pct: number;
  distance_to_town_km: number;
  has_primary_school: string;
  has_secondary_school: string;
  has_health_subcentre: string;
  has_tap_water: string;
  has_paved_road: string;
  submissions: Submission[];
  existing_works: ExistingWork[];
  schools: School[];
}

export interface RankingsFilters {
  villageId?: string;
  themeId?: string;
  weightDemand?: number;
  weightNeed?: number;
  weightNeglect?: number;
  weightFeasibility?: number;
}

export interface ComplaintPayload {
  rawText: string;
  villageName: string;
  channel: string;
  languageDetected: string;
  mediaUrl?: string;
}

export interface AuthUser {
  userId: string;
  name: string;
  email: string;
  role: 'mp_office' | 'citizen';
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

/**
 * Reads token from localStorage and returns Authorization header.
 */
function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('auth_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

/**
 * Clears authentication localStorage and redirects to /auth/login.
 */
function handle401() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('user_profile');
    window.location.href = '/auth/login';
  }
}

/**
 * Custom fetch wrapper that automatically appends the Authorization header
 * and redirects on 401 Unauthorized status.
 */
async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = {
    ...options.headers,
    ...getAuthHeader()
  };
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    handle401();
    throw new Error('Unauthorized');
  }
  return res;
}

/**
 * POSTs to /auth/login, returns token + user
 */
export async function login(email: string, password: string): Promise<AuthResponse> {
  const url = `${API_BASE_URL}/auth/login`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  if (!res.ok) {
    throw new Error('Invalid email or password. Please try again.');
  }

  const data = await res.json();
  return {
    token: data.token,
    user: {
      userId: data.user.user_id,
      name: data.user.name,
      email: data.user.email,
      role: data.user.role
    }
  };
}

/**
 * POSTs to /auth/register, returns token + user by performing auto-login.
 */
export async function register(
  name: string,
  email: string,
  password: string,
  role: string
): Promise<AuthResponse> {
  const url = `${API_BASE_URL}/auth/register`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, email, password, role })
  });

  if (res.status === 400) {
    const errorData = await res.json().catch(() => ({}));
    if (errorData.detail === 'Email already exists') {
      throw new Error('Email already exists');
    }
    throw new Error(errorData.detail || 'Registration failed');
  }

  if (!res.ok) {
    throw new Error('Registration failed');
  }

  // Auto-login to retrieve JWT and user payload
  return login(email, password);
}

/**
 * GETs /auth/me with Authorization header, returns user
 */
export async function getCurrentUser(): Promise<AuthUser> {
  const url = `${API_BASE_URL}/auth/me`;
  const res = await apiFetch(url);
  if (!res.ok) {
    throw new Error('Failed to retrieve current user');
  }
  const data = await res.json();
  return {
    userId: data.user_id,
    name: data.name,
    email: data.email,
    role: data.role
  };
}

/**
 * POSTs empty body to /submissions/process to trigger NLP thematic clustering

/**
 * Calls GET /rankings with the specified weights and filters, returning the ranking array.
 */
export async function getRankings(filters?: RankingsFilters): Promise<RankingItem[]> {
  try {
    const queryParams = new URLSearchParams();
    if (filters) {
      if (filters.villageId) queryParams.append('village_id', filters.villageId);
      if (filters.themeId) queryParams.append('theme_id', filters.themeId);
      if (filters.weightDemand !== undefined) queryParams.append('weight_demand', filters.weightDemand.toString());
      if (filters.weightNeed !== undefined) queryParams.append('weight_need', filters.weightNeed.toString());
      if (filters.weightNeglect !== undefined) queryParams.append('weight_neglect', filters.weightNeglect.toString());
      if (filters.weightFeasibility !== undefined) queryParams.append('weight_feasibility', filters.weightFeasibility.toString());
    }

    const url = `${API_BASE_URL}/rankings${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const res = await apiFetch(url);
    if (!res.ok) {
      throw new Error(`API returned error status ${res.status}: ${res.statusText}`);
    }
    const data = await res.json();
    const rankings = data.rankings || [];
    return rankings.map((r: any) => ({
      villageId: r.village_id,
      villageName: r.village_name,
      themeId: r.theme_id,
      themeLabel: r.theme_label,
      demandScore: r.demand_score,
      needScore: r.need_score,
      neglectScore: r.neglect_score,
      feasibilityScore: r.feasibility_score,
      priorityScore: r.priority_score,
      submissionCount: r.submission_count,
      sampleComplaints: r.sample_complaints || []
    }));
  } catch (err: any) {
    throw new Error(`Failed to fetch rankings: ${err.message || err}`);
  }
}

/**
 * Calls GET /villages/{id}, returning the village detail object with nested components.
 */
export async function getVillageDetail(villageId: string): Promise<VillageDetail> {
  try {
    const url = `${API_BASE_URL}/villages/${encodeURIComponent(villageId)}`;
    const res = await apiFetch(url);
    if (!res.ok) {
      throw new Error(`API returned error status ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (err: any) {
    throw new Error(`Failed to fetch details for village ${villageId}: ${err.message || err}`);
  }
}

/**
 * Calls GET /export, handles the blob response, and triggers a browser file download.
 */
export async function downloadExport(format: 'pdf' | 'xlsx', villageId?: string): Promise<void> {
  try {
    const queryParams = new URLSearchParams({ format });
    if (villageId) {
      queryParams.append('village_id', villageId);
    }

    const url = `${API_BASE_URL}/export?${queryParams.toString()}`;
    const res = await apiFetch(url);
    if (!res.ok) {
      throw new Error(`API returned error status ${res.status}: ${res.statusText}`);
    }

    const blob = await res.blob();
    
    // Trigger download in browser
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    
    // Determine filename
    const filename = `priorities_report_${villageId || 'all'}.${format}`;
    link.setAttribute('download', filename);
    
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (err: any) {
    throw new Error(`Failed to download ${format.toUpperCase()} export: ${err.message || err}`);
  }
}

/**
 * POSTs a new complaint/submission to /submissions.
 */
export async function submitComplaint(payload: ComplaintPayload): Promise<{ submission_id: string; status: string }> {
  try {
    const url = `${API_BASE_URL}/submissions`;
    const body = {
      raw_text: payload.rawText,
      village_name: payload.villageName,
      channel: payload.channel,
      language_detected: payload.languageDetected,
      media_url: payload.mediaUrl
    };

    const res = await apiFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errorText = await res.text();
      let parsedError = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        if (Array.isArray(errorJson.detail)) {
          parsedError = errorJson.detail.map((err: any) => `${err.loc.slice(1).join('.') || 'error'}: ${err.msg}`).join(', ');
        } else {
          parsedError = errorJson.detail || errorText;
        }
      } catch {}
      throw new Error(`API returned error status ${res.status}: ${parsedError}`);
    }

    return await res.json();
  } catch (err: any) {
    throw new Error(`Failed to submit complaint: ${err.message || err}`);
  }
}

export interface SimulatedWork {
  rank: number;
  villageId: string;
  villageName: string;
  themeLabel: string;
  priorityScore: number;
  estimatedCostLakh: number;
  cumulativeCostLakh: number;
  sampleComplaints: string[];
  submissionCount: number;
  reason?: string;
}

export interface SimulationResult {
  totalBudgetLakh: number;
  totalAllocatedLakh: number;
  remainingLakh: number;
  utilizationPct: number;
  selectedWorks: SimulatedWork[];
  excludedWorks: SimulatedWork[];
}

export async function simulateBudget(
  budgetLakh: number,
  themeFilter?: string,
  villageFilter?: string
): Promise<SimulationResult> {
  const url = `${API_BASE_URL}/simulate-budget`;
  const body: any = { budget_lakh_inr: budgetLakh };
  if (themeFilter) body.theme_filter = themeFilter;
  if (villageFilter) body.village_filter = villageFilter;

  const res = await apiFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    throw new Error(`Failed to simulate budget: ${res.statusText}`);
  }
  
  const data = await res.json();
  
  const mapWork = (w: any): SimulatedWork => ({
    rank: w.rank,
    villageId: w.village_id,
    villageName: w.village_name,
    themeLabel: w.theme_label,
    priorityScore: w.priority_score,
    estimatedCostLakh: w.estimated_cost_lakh,
    cumulativeCostLakh: w.cumulative_cost_lakh,
    sampleComplaints: w.sample_complaints || [],
    submissionCount: w.submission_count,
    reason: w.reason
  });
  
  return {
    totalBudgetLakh: data.total_budget_lakh,
    totalAllocatedLakh: data.total_allocated_lakh,
    remainingLakh: data.remaining_lakh,
    utilizationPct: data.utilization_pct,
    selectedWorks: (data.selected_works || []).map(mapWork),
    excludedWorks: (data.excluded_works || []).map(mapWork)
  };
}

export async function exportSimulation(
  budgetLakh: number,
  format: 'pdf' | 'xlsx',
  themeFilter?: string
): Promise<void> {
  const url = `${API_BASE_URL}/simulate-budget/export`;
  const body: any = { 
    budget_lakh_inr: budgetLakh,
    format: format
  };
  if (themeFilter) body.theme_filter = themeFilter;

  const res = await apiFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    throw new Error(`Failed to export simulation: ${res.statusText}`);
  }

  const blob = await res.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  
  const dateStr = new Date().toISOString().split('T')[0];
  link.setAttribute('download', `mplads-sanction-list-${dateStr}.${format}`);
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}
