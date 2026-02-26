// Get API URL from environment or use default
const getApiBaseUrl = (): string => {
  // Check for environment variable first
  let apiUrl = process.env.NEXT_PUBLIC_API_URL;
  
  if (!apiUrl) {
    // Check if we're in browser (client-side)
    if (typeof window !== 'undefined') {
      // If on localhost, use local backend
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        apiUrl = "http://localhost:5000/api";
      } else {
        // For production without env var, log warning
        console.warn("NEXT_PUBLIC_API_URL is not set. Using default localhost. Please configure it in your environment variables.");
        apiUrl = "http://localhost:5000/api";
      }
    } else {
      // Default fallback (for server-side or when env var not set)
      apiUrl = "http://localhost:5000/api";
    }
  }
  
  // Clean up the URL - fix common typos
  apiUrl = apiUrl.trim().replace(/\/+$/, '');
  // Fix http// or https// to http:// or https://
  apiUrl = apiUrl.replace(/^http\/\//, 'http://').replace(/^https\/\//, 'https://');
  // Ensure it starts with http:// or https://
  if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
    apiUrl = `http://${apiUrl}`;
  }
  
  return apiUrl;
};

const API_BASE_URL = getApiBaseUrl();

async function fetchAPI(endpoint: string, options?: RequestInit) {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem("authToken") : null;
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options?.headers,
    };
    
    if (token) {
      (headers as any)["Authorization"] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = response.statusText || "Unknown error";

      try {
        const errorData = JSON.parse(errorText);
        // Prefer details over error message if available, as it's usually more specific
        if (errorData.details) {
          errorMessage = errorData.details;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else {
          errorMessage = errorText || errorMessage;
        }
      } catch {
        // If JSON parse fails, try to extract useful info from text
        if (errorText && errorText.length > 0) {
          errorMessage = errorText.length > 200 ? errorText.substring(0, 200) + "..." : errorText;
        }
      }

      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error: any) {
    // Handle connection errors
    if (error.message?.includes('Failed to fetch') || error.message?.includes('ERR_CONNECTION_REFUSED')) {
      const isLocalhost = typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

      if (isLocalhost) {
        throw new Error(
          `Cannot connect to backend API at ${API_BASE_URL}. ` +
          `Please ensure:\n` +
          `1. Backend server is running (cd kas_backend && npm run dev)\n` +
          `2. Backend is running on port 5000\n` +
          `3. Or set NEXT_PUBLIC_API_URL environment variable to your backend URL`
        );
      } else {
        throw new Error(
          `Cannot connect to backend API. ` +
          `Please check:\n` +
          `1. NEXT_PUBLIC_API_URL is set correctly\n` +
          `2. Backend server is running and accessible\n` +
          `3. CORS is configured properly on the backend`
        );
      }
    }
    throw error;
  }
}

// Type definitions
export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  source: string;
  stage: "New Lead" | "Lead Contacted" | "Meeting Scheduled" | "Meeting Completed" | "Quotation Sent" | "Manager Deliberation" | "Order Closed" | "Order Lost";
  value: number;
  assignedTo: string;
  createdAt: string;
  lastContact: string;

  notes: string;
  contactReport?: {
    contactConfirmation: {
      successful: boolean;
    };
    contactDetails: {
      mode: string;
      dateTime: string;
      spokenTo: string;
    };
    propertyDetails: {
      type: string;
      floors: string;
      usage: string;
    };
    siteReadiness: {
      pitAvailable: string;
      pitDepth: string;
      shaftAvailable: string;
      shaftType: string;
      shaftSize: string;
      machineRoom: string;
    };
    elevatorPreference: {
      type: string;
      brand: string;
    };
    clientIntent: {
      interestLevel: string;
      budget: string;
      timeline: string;
    };
    nextAction: {
      type: string;
      meetingTime?: string;
      followUpDate?: string;
    };
    salesOwner: {
      name: string;
      remarks: string;
    };
  };
}

export interface Quotation {
  id: string;
  leadId: string;
  leadName: string;
  projectAddress?: string;
  contactNumber?: string;
  elevatorType: string;
  modelNumber?: string;
  floors: number;
  capacity: number;
  speed: number;
  shaftType?: string;
  application?: string;
  cabinType?: string;
  doorType?: string;
  features: string[];
  standardRates?: {
    basicCost: number;
    shaftMasonry: number;
    shaftFilling: number;
    installation: number;
    extraTravelHeight: number;
    premiumCabin: number;
    multiColorLED: number;
    glassDoor: number;
    premiumRALColor: number;
    customizedCabinSize: number;
    transportation: number;
    advancedFeatures: number;
  };
  signatureRates?: {
    basicCost: number;
    shaftMasonry: number;
    shaftFilling: number;
    installation: number;
    extraTravelHeight: number;
    premiumCabin: number;
    multiColorLED: number;
    glassDoor: number;
    premiumRALColor: number;
    customizedCabinSize: number;
    transportation: number;
    advancedFeatures: number;
  };
  standardTotal?: number;
  standardGST?: number;
  standardNet?: number;
  signatureTotal?: number;
  signatureGST?: number;
  signatureNet?: number;
  timeOfDelivery?: string;
  paymentTerms?: {
    percentage1: number;
    amount1: number;
    percentage2: number;
    amount2: number;
  };
  basePrice: number;
  installationCost: number;
  tax: number;
  totalAmount: number;
  status: "Pending" | "Approved" | "Rejected";
  createdAt: string;
  validUntil: string;
  version: number;
}

export type ProjectStage =
  | "First Technical Visit"
  | "Drawings Prepared"
  | "Client Confirmation of Drawings"
  | "Interior Selection"
  | "Moved to Factory"
  | "Ready for Dispatch"
  | "Installation Team Scheduled"
  | "Installation in Progress"
  | "Testing & Final Handover";

export interface Project {
  id: string;
  // 1. Project Basic Details
  projectId?: string;
  projectName: string;
  customerName: string;
  projectType?: "New Installation" | "Modernization";
  siteAddress?: string;
  city?: string;
  salesPersonName?: string;
  orderDate?: string;
  expectedCompletionDate?: string;
  projectStatus?: "Planning" | "In Progress" | "On Hold" | "Completed";

  // 2. Lift / Technical Details
  liftType?: "MRL" | "Hydraulic" | "Gearless";
  numberOfLifts?: number;
  capacity?: string; // kg / persons
  numberOfStops?: number;
  speed?: string;
  doorType?: string;
  powerRequirement?: string;
  shaftStatus?: "Ready" | "Under Construction";

  // 3. Commercial & Order Details
  quotationId: string;
  orderValue?: number;
  advanceAmountReceived?: number;
  balanceAmount?: number;
  paymentMilestones?: string[]; // ["Advance", "Mid Payment", "Final Payment"]
  invoiceNumbers?: string[];
  gstDetails?: string;
  paymentStatus?: "Paid" | "Partial" | "Pending";

  // 4. Installation Progress Tracking
  materialDispatchDate?: string;
  materialReceivedDate?: string;
  machineInstallationStatus?: "Pending" | "In Progress" | "Completed";
  guideRailInstallation?: "Pending" | "In Progress" | "Completed";
  wiringElectricalWork?: "Pending" | "In Progress" | "Completed";
  cabinInstallation?: "Pending" | "In Progress" | "Completed";
  doorInstallation?: "Pending" | "In Progress" | "Completed";
  testingCommissioning?: "Pending" | "In Progress" | "Completed";
  safetyInspectionStatus?: "Pending" | "In Progress" | "Completed";
  governmentApproval?: string;

  // 5. Team & Responsibility
  siteEngineerName?: string;
  installationTechnician?: string;
  supervisor?: string;
  contactNumbers?: string;
  assignedDate?: string;

  // 6. Issues & Delays
  issues?: Array<{
    description: string;
    issueType: "Material Delay" | "Civil Work Pending" | "Payment Delay" | "Other";
    raisedDate: string;
    expectedResolutionDate?: string;
    currentStatus: "Open" | "In Progress" | "Resolved";
  }>;

  // 7. Handover & Closure
  installationCompletionDate?: string;
  handoverDate?: string;
  clientSignOff?: boolean;
  warrantyStartDate?: string;
  warrantyEndDate?: string;
  amcOffered?: boolean;
  amcLinked?: string; // AMC Contract ID

  // 8. Documents
  documents?: Array<{
    type: "Purchase Order" | "Drawings" | "Test Certificates" | "Handover Documents" | "Photos" | "Videos";
    fileName: string;
    fileUrl: string;
    uploadedDate: string;
  }>;

  // Legacy fields (keep for backward compatibility)
  location: string;
  elevatorType: string;
  currentStage: ProjectStage;
  startDate: string;
  expectedCompletion: string;
  progress: number;
  assignedEngineer: string;
  status: "On Track" | "Delayed" | "On Hold";
}

export interface AMCContract {
  id: string;
  contractId?: string; // AMC Contract ID / Number
  customerName: string;
  elevatorName?: string; // Elevator / Product Name
  amcType?: "Comprehensive" | "Non-Comprehensive"; // AMC Type
  projectName: string;
  elevatorId: string;
  contractStartDate: string;
  contractEndDate: string;
  duration: number;
  amcAmount?: number; // AMC Amount
  amountType?: "Yearly" | "Monthly"; // Yearly / Monthly
  paymentStatus?: "Paid" | "Pending" | "Overdue"; // Payment Status
  paymentMode?: "Cash" | "UPI" | "Bank Transfer" | "Cheque"; // Payment Mode
  invoiceNumber?: string; // Invoice Number
  invoiceDate?: string; // Invoice Date
  gstAmount?: number; // GST Amount
  netRevenue?: number; // Net Revenue (after tax)
  nextPaymentDueDate?: string; // Next Payment Due Date
  remarks?: string; // Remarks / Notes
  nextServiceDate: string;
  serviceFrequency: string;
  assignedTechnician: string;
  status: "Active" | "Expired" | "Pending Renewal";
  totalValue: number;
  servicesCompleted: number;
  servicesPending: number;
  // Advanced fields
  monthWiseRevenue?: { [key: string]: number }; // Month-wise revenue
  yearWiseRevenue?: { [key: string]: number }; // Year-wise revenue
  totalAMCIncome?: number; // Total AMC income
  pendingAmount?: number; // Pending amount summary
}

// Leads API
export const leadsAPI = {
  getAll: () => fetchAPI("/leads"),
  getById: (id: string) => fetchAPI(`/leads/${id}`),
  create: (data: any) => fetchAPI("/leads", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchAPI(`/leads/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/leads/${id}`, { method: "DELETE" }),
};

// Blogs API
export const blogsAPI = {
  getAll: (admin: boolean = false) => fetchAPI(`/blogs${admin ? "?admin=true" : ""}`),
  getById: (id: string) => fetchAPI(`/blogs/${id}`),
  create: (data: any) => fetchAPI("/blogs", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchAPI(`/blogs/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/blogs/${id}`, { method: "DELETE" }),
};

export interface Blog {
  _id?: string;
  id?: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  category: string;
  image: string;
  googleReviewUrl?: string;
  views: number;
  published: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Quotations API
export const quotationsAPI = {
  getAll: () => fetchAPI("/quotations"),
  getById: (id: string) => fetchAPI(`/quotations/${id}`),
  create: (data: any) => fetchAPI("/quotations", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchAPI(`/quotations/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/quotations/${id}`, { method: "DELETE" }),
  downloadPDF: async (id: string): Promise<void> => {
    const token = localStorage.getItem("authToken");
    const headers: HeadersInit = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/quotations/${id}/pdf`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(errorData.error || `API Error: ${response.statusText}`);
    }

    const blob = await response.blob();

    // Verify it's a PDF
    if (blob.type !== "application/pdf") {
      throw new Error("Invalid PDF file received");
    }

    // Create download link and trigger download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Quotation-${id}.pdf`;
    document.body.appendChild(a);
    a.click();

    // Clean up after a short delay to ensure download starts
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  },
};

// Projects API
export const projectsAPI = {
  getAll: () => fetchAPI("/projects"),
  getById: (id: string) => fetchAPI(`/projects/${id}`),
  create: (data: any) => fetchAPI("/projects", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchAPI(`/projects/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/projects/${id}`, { method: "DELETE" }),
  getExpenses: (projectId: string) => fetchAPI(`/projects/${projectId}/expenses`) as Promise<{ id: string; projectId?: string; amount: number; description: string }[]>,
  addExpense: (projectId: string, data: { amount: number; description?: string }) =>
    fetchAPI(`/projects/${projectId}/expenses`, { method: "POST", body: JSON.stringify(data) }),
  updateExpense: (projectId: string, expenseId: string, data: { amount: number; description?: string }) =>
    fetchAPI(`/projects/${projectId}/expenses/${expenseId}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteExpense: (projectId: string, expenseId: string) =>
    fetchAPI(`/projects/${projectId}/expenses/${expenseId}`, { method: "DELETE" }),
};

// AMC API
export const amcAPI = {
  getAll: () => fetchAPI("/amc"),
  getById: (id: string) => fetchAPI(`/amc/${id}`),
  create: (data: any) => fetchAPI("/amc", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchAPI(`/amc/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/amc/${id}`, { method: "DELETE" }),
};

// Users API
export const usersAPI = {
  getAll: () => fetchAPI("/users"),
  getById: (id: string) => fetchAPI(`/users/${id}`),
  create: (data: any) => fetchAPI("/users", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchAPI(`/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/users/${id}`, { method: "DELETE" }),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => fetchAPI("/dashboard/stats"),
};

// Health check API
export const healthAPI = {
  check: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  },
};

// Notifications API
export interface Notification {
  id: string;
  userId?: string;
  message: string;
  type: "demo" | "contact" | "quotation" | "project" | "amc" | "lead" | "signup" | "system";
  relatedId?: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export const notificationsAPI = {
  getAll: (userId?: string) => fetchAPI(`/notifications${userId ? `?userId=${userId}` : ""}`),
  getUnreadCount: (userId?: string) => fetchAPI(`/notifications/unread${userId ? `?userId=${userId}` : ""}`),
  markAsRead: (id: string) => fetchAPI(`/notifications/${id}/read`, { method: "PATCH" }),
  markAllAsRead: (userId?: string) => fetchAPI("/notifications/read-all", {
    method: "PATCH",
    body: JSON.stringify({ userId })
  }),
  delete: (id: string) => fetchAPI(`/notifications/${id}`, { method: "DELETE" }),
  create: (data: { userId?: string; message: string; type?: string; relatedId?: string }) =>
    fetchAPI("/notifications", { method: "POST", body: JSON.stringify(data) }),
};

// Activity API
export interface ActivityLog {
  id: string;
  userName: string;
  userRole?: string;
  actionType: "Login" | "Logout" | "Create" | "Update" | "Delete" | string;
  moduleName?: string;
  description?: string;
  ipAddress?: string;
  deviceInfo?: string;
  status?: "Success" | "Failed" | string;
  createdAt: string;
  updatedAt?: string;
}

export const activityAPI = {
  // list with query params: search, actionType, module, dateFrom, dateTo, page, limit
  list: (params: Record<string, any> = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params || {}).reduce((acc: any, [k, v]) => {
        if (v !== undefined && v !== null && v !== "") acc[k] = String(v);
        return acc;
      }, {})
    ).toString();
    return fetchAPI(`/activities${qs ? `?${qs}` : ""}`);
  },
  // export CSV - backend may implement; fallback to client-side export
  exportCSV: (params: Record<string, any> = {}) => {
    const qs = new URLSearchParams(params as any).toString();
    return fetchAPI(`/activities/export${qs ? `?${qs}` : ""}`);
  },
};

// Testimonials API
export const testimonialsAPI = {
  getAll: (admin: boolean = false) => fetchAPI(`/testimonials${admin ? "?admin=true" : ""}`),
  getById: (id: string) => fetchAPI(`/testimonials/${id}`),
  create: (data: any) => fetchAPI("/testimonials", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchAPI(`/testimonials/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/testimonials/${id}`, { method: "DELETE" }),
};
