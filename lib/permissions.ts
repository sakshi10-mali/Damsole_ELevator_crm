// Frontend permission utilities

export const PERMISSIONS = {
  DASHBOARD_VIEW: "dashboard:view",
  LEADS_VIEW: "leads:view",
  LEADS_CREATE: "leads:create",
  LEADS_EDIT: "leads:edit",
  LEADS_DELETE: "leads:delete",
  QUOTATIONS_VIEW: "quotations:view",
  QUOTATIONS_CREATE: "quotations:create",
  QUOTATIONS_APPROVE: "quotations:approve",
  PROJECTS_VIEW: "projects:view",
  PROJECTS_CREATE: "projects:create",
  PROJECTS_EDIT: "projects:edit",
  PROJECTS_DELETE: "projects:delete",
  PROJECTS_ASSIGN: "projects:assign",
  EXPENSE_VIEW: "expense:view",
  EXPENSE_EDIT: "expense:edit",
  EXPENSE_ADD: "expense:add",
  EXPENSE_DELETE: "expense:delete",
  AMC_VIEW: "amc:view",
  AMC_UPDATE: "amc:update",
  USERS_VIEW: "users:view",
  USERS_MANAGE: "users:manage",
  REPORTS_VIEW: "reports:view",
  SETTINGS_MANAGE: "settings:manage",
  BLOGS_VIEW: "blogs:view",
  BLOGS_CREATE: "blogs:create",
  BLOGS_EDIT: "blogs:edit",
  BLOGS_DELETE: "blogs:delete",
  FORM_SUBMISSIONS_VIEW: "form_submissions:view",
  FORM_SUBMISSIONS_DELETE: "form_submissions:delete",
  DEMO_REQUESTS_VIEW: "demo_requests:view",
  DEMO_REQUESTS_DELETE: "demo_requests:delete",
  TESTIMONIALS_VIEW: "testimonials:view",
  ACTIVITY_VIEW: "activity:view",
} as const;

// All permission values (Superadmin gets this list)
export const ALL_PERMISSIONS = Object.values(PERMISSIONS) as string[];

// Superadmin has no permission checks (full access); everyone else is checked
export const isSuperadmin = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      return user?.role?.toLowerCase?.() === "superadmin";
    }
  } catch {}
  return false;
};

// Check if user has permission (Superadmin always has access)
export const can = (permission: string, userPermissions: string[] = []): boolean => {
  if (isSuperadmin()) return true;
  if (!userPermissions || userPermissions.length === 0) return false;
  return userPermissions.includes(permission);
};

// Get user permissions from localStorage (Superadmin always gets all permissions)
export const getUserPermissions = (): string[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user?.role?.toLowerCase?.() === "superadmin") return ALL_PERMISSIONS;
      return user.permissions || [];
    }
  } catch (e) {
    console.error("Failed to parse user permissions");
  }
  
  return [];
};

// Check if user is admin (Superadmin or Admin - for admin-only actions)
export const isAdmin = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      return user?.role === "Superadmin" || user?.role === "Admin";
    }
  } catch (e) {
    console.error("Failed to parse user role");
  }
  return false;
  
};

// Permission groups for UI
export const PERMISSION_GROUPS = [
  {
    label: "Dashboard",
    permissions: [
      { key: PERMISSIONS.DASHBOARD_VIEW, label: "Dashboard View" },
    ],
  },
  {
    label: "Leads",
    permissions: [
      { key: PERMISSIONS.LEADS_VIEW, label: "Leads View" },
      { key: PERMISSIONS.LEADS_CREATE, label: "Leads Create" },
      { key: PERMISSIONS.LEADS_EDIT, label: "Leads Edit" },
      { key: PERMISSIONS.LEADS_DELETE, label: "Leads Delete" },
    ],
  },
  {
    label: "Quotations",
    permissions: [
      { key: PERMISSIONS.QUOTATIONS_VIEW, label: "Quotations View" },
      { key: PERMISSIONS.QUOTATIONS_CREATE, label: "Quotations Create" },
      { key: PERMISSIONS.QUOTATIONS_APPROVE, label: "Quotations Approve" },
    ],
  },
  {
    label: "Projects",
    permissions: [
      { key: PERMISSIONS.PROJECTS_VIEW, label: "Projects View" },
      { key: PERMISSIONS.PROJECTS_CREATE, label: "Projects Create" },
      { key: PERMISSIONS.PROJECTS_EDIT, label: "Projects Edit" },
      { key: PERMISSIONS.PROJECTS_DELETE, label: "Projects Delete" },
      { key: PERMISSIONS.PROJECTS_ASSIGN, label: "Projects Assign" },
      { key: PERMISSIONS.EXPENSE_VIEW, label: "Expense View" },
      { key: PERMISSIONS.EXPENSE_EDIT, label: "Expense Edit" },
      { key: PERMISSIONS.EXPENSE_ADD, label: "Add Expense" },
      { key: PERMISSIONS.EXPENSE_DELETE, label: "Expense Delete" },
    ],
  },
  {
    label: "AMC & Services",
    permissions: [
      { key: PERMISSIONS.AMC_VIEW, label: "AMC View" },
      { key: PERMISSIONS.AMC_UPDATE, label: "AMC Update" },
    ],
  },
  {
    label: "Users",
    permissions: [
      { key: PERMISSIONS.USERS_VIEW, label: "Users View" },
      { key: PERMISSIONS.USERS_MANAGE, label: "Users Manage" },
    ],
  },
  {
    label: "Reports",
    permissions: [
      { key: PERMISSIONS.REPORTS_VIEW, label: "Reports View" },
    ],
  },
  {
    label: "Settings",
    permissions: [
      { key: PERMISSIONS.SETTINGS_MANAGE, label: "Settings Manage" },
    ],
  },
  {
    label: "Blogs",
    permissions: [
      { key: PERMISSIONS.BLOGS_VIEW, label: "Blogs View" },
      { key: PERMISSIONS.BLOGS_CREATE, label: "Blogs Create" },
      { key: PERMISSIONS.BLOGS_EDIT, label: "Blogs Edit" },
      { key: PERMISSIONS.BLOGS_DELETE, label: "Blogs Delete" },
    ],
  },
  {
    label: "Testimonials",
    permissions: [
      { key: PERMISSIONS.TESTIMONIALS_VIEW, label: "Testimonials View" },
    ],
  },
  {
    label: "Form Submissions",
    permissions: [
      { key: PERMISSIONS.FORM_SUBMISSIONS_VIEW, label: "Form Submissions View" },
      { key: PERMISSIONS.FORM_SUBMISSIONS_DELETE, label: "Form Submissions Delete" },
    ],
  },
  {
    label: "Demo Requests",
    permissions: [
      { key: PERMISSIONS.DEMO_REQUESTS_VIEW, label: "Demo Requests View" },
      { key: PERMISSIONS.DEMO_REQUESTS_DELETE, label: "Demo Requests Delete" },
    ],
  },
];

