// permissionMap.js

/**
 * 🔐 SCREEN LEVEL PERMISSIONS
 * Controls navigation access
 */
export const SCREEN_PERMISSIONS = {
  // AUTH
  Login: [],

  // ROLE MANAGEMENT
  RoleList: ["role.view"],
  CreateRole: ["role.create"],
  EditRole: ["role.edit"],

  // STAFF
  StaffList: ["staff.view"],
  AddStaff: ["staff.create"],
  EditStaff: ["staff.edit"],

  // ATTENDANCE (MOBILE)
  StaffDashboard: ["attendance.checkin"],
  CheckIn: ["attendance.checkin"],
  CheckOut: ["attendance.checkout"],

  // ADMIN ATTENDANCE
  AttendanceDashboard: ["attendance.view.dashboard_summary"],
  LiveAttendance: ["attendance.view.live_status"],
  StaffDetail: ["attendance.view.staff_history"],

  // REPORTS
  ReportsDashboard: ["attendance.report.view"],
  ReportFilter: ["attendance.report.view"],

  // EVENTS
  EventCalendar: ["event.view_all"],
  AddEvent: ["event.create"],

  // SETTINGS
  Settings: ["settings.attendance.view"],
};


/**
 * 🎯 ACTION LEVEL PERMISSIONS
 * Controls buttons / UI actions inside screens
 */
export const ACTION_PERMISSIONS = {
  role: {
    create: "role.create",
    edit: "role.edit",
    delete: "role.delete",
    assignPermissions: "role.assign_permissions",
    assignToUser: "role.assign_to_user",
  },

  staff: {
    create: "staff.create",
    edit: "staff.edit",
    delete: "staff.delete",
    assignShift: "staff.assign_shift",
    uploadDocs: "staff.upload_documents",
  },

  attendance: {
    checkin: "attendance.checkin",
    checkout: "attendance.checkout",
    edit: "attendance.edit_record",
    delete: "attendance.delete_record",
    manualMark: "attendance.manual_mark",
    markPresent: "attendance.mark_present",
    markAbsent: "attendance.mark_absent",
  },

  reports: {
    view: "attendance.report.view",
    exportPDF: "attendance.report.export_pdf",
    exportExcel: "attendance.report.export_excel",
  },

  event: {
    create: "event.create",
    edit: "event.edit",
    delete: "event.delete",
    cancel: "event.cancel",
  },

  settings: {
    editAttendance: "settings.attendance.edit",
    editSecurity: "settings.security.edit",
  },
};

// permissionMap.js

/**
 * 🔐 ENTERPRISE SCREEN ACCESS RULES
 * Supports:
 * - allOf (must have ALL)
 * - anyOf (must have at least ONE)
 */

export const SCREEN_ACCESS = {
  // ---------------------------
  // AUTH
  // ---------------------------
  Login: {},

  // ---------------------------
  // ROLE MANAGEMENT
  // ---------------------------
  RoleList: {
    allOf: ["role.view"],
  },

  CreateRole: {
    allOf: ["role.create"],
  },

  EditRole: {
    allOf: ["role.edit"],
  },

  // ---------------------------
  // STAFF MANAGEMENT
  // ---------------------------
  StaffList: {
    allOf: ["staff.view"],
  },

  AddStaff: {
    allOf: ["staff.create"],
  },

  EditStaff: {
    allOf: ["staff.edit"],
  },

  // ---------------------------
  // ATTENDANCE (MOBILE - STAFF)
  // ---------------------------
  StaffDashboard: {
    anyOf: [
      "attendance.checkin",
      "attendance.checkout",
      "attendance.view.own",
    ],
  },

  CheckIn: {
    allOf: ["attendance.checkin"],
  },

  CheckOut: {
    allOf: ["attendance.checkout"],
  },

  // ---------------------------
  // ADMIN ATTENDANCE
  // ---------------------------
  AttendanceDashboard: {
    allOf: ["attendance.view.dashboard_summary"],
  },

  LiveAttendance: {
    allOf: ["attendance.view.live_status"],
  },

  StaffDetail: {
    allOf: ["attendance.view.staff_history"],
  },

  // ---------------------------
  // REPORTS
  // ---------------------------
  ReportsDashboard: {
    allOf: ["attendance.report.view"],
  },

  ReportFilter: {
    allOf: ["attendance.report.view"],
  },

  // ---------------------------
  // EVENTS
  // ---------------------------
  EventCalendar: {
    anyOf: ["event.view_all", "event.view_basic"],
  },

  AddEvent: {
    allOf: ["event.create"],
  },

  // ---------------------------
  // SETTINGS
  // ---------------------------
  Settings: {
    allOf: ["settings.attendance.view"],
  },

  // permissionMap.js — inside SCREEN_ACCESS object

  SiteList: {
    allOf: ["site.view"],
  },

  CreateSite: {
    allOf: ["site.create"],
  },

  SiteDetail: {
    anyOf: ["site.view", "site.edit"],
  },

  EditSite: {
    allOf: ["site.edit"],
  },
};
/**
 * 🧩 PERMISSION GROUPS (FOR ROLE UI)
 * Matches your ERP document structure
 */
export const PERMISSION_GROUPS = {
  "Role Management": [
    "role.create",
    "role.edit",
    "role.delete",
    "role.view",
    "role.assign_permissions",
    "role.assign_to_user",
  ],

  "Staff Management": [
    "staff.create",
    "staff.edit",
    "staff.delete",
    "staff.view",
    "staff.assign_shift",
    "staff.change_shift",
    "staff.view_documents",
    "staff.upload_documents",
  ],

  "Profile": [
    "profile.view_own",
    "profile.edit_own",
    "profile.change_password",
    "profile.upload_photo",
    "profile.view_any",
    "profile.reset_password",
    "profile.force_logout",
  ],

  "Attendance - Self": [
    "attendance.checkin",
    "attendance.checkout",
    "attendance.view.own",
    "attendance.view.own_photos",
  ],

  "Attendance Monitoring": [
    "attendance.view.dashboard_summary",
    "attendance.view.live_status",
    "attendance.view.photos_and_location",
    "attendance.view.staff_history",
    "attendance.view.staff_calendar",
  ],

  "Attendance Control": [
    "attendance.edit_record",
    "attendance.delete_record",
    "attendance.manual_mark",
    "attendance.mark_present",
    "attendance.mark_absent",
    "attendance.override_late",
    "attendance.override_location",
    "attendance.override_halfday",
  ],

  "Reports": [
    "attendance.report.view",
    "attendance.report.export_pdf",
    "attendance.report.export_excel",
    "attendance.report.view_late_only",
    "attendance.report.view_absent_only",
  ],

  "Event Management": [
    "event.create",
    "event.edit",
    "event.delete",
    "event.cancel",
    "event.view_all",
    "event.view_basic",
    "event.view_client_details",
  ],

  "Dashboard": [
    "dashboard.view",
    "dashboard.view_analytics",
    "dashboard.view_attendance_tiles",
  ],

  "Notifications": [
    "notification.manage",
    "notification.send_manual",
    "notification.configure_reminder",
  ],

  "Settings": [
    "settings.attendance.view",
    "settings.attendance.edit",
    "settings.attendance.geo_radius_edit",
    "settings.attendance.photo_required_edit",
    "settings.attendance.late_policy_edit",
    "settings.attendance.halfday_policy_edit",
    "settings.notifications.view",
    "settings.notifications.edit",
    "settings.security.view",
    "settings.security.edit",
  ],

  "Admin Management": [
    "admin.create",
    "admin.edit",
    "admin.delete",
    "admin.view",
  ],

  "Site Management": [
    "site.create",
    "site.edit",
    "site.delete",
    "site.view",
    "site.assign_admin",
    "site.activate",
    "site.deactivate",
  ],

  "Session Control": [
    "session.view_active",
    "session.force_logout_user",
  ],
};


/**
 * ⚡ HELPER FUNCTIONS (VERY IMPORTANT)
 */

/**
 * 🔎 Evaluate rule-based screen access
 */
export const canAccessScreen = (userPermissions, rule) => {
  if (!rule || Object.keys(rule).length === 0) return true;

  if (rule.allOf) {
    return rule.allOf.every((perm) =>
      userPermissions.includes(perm)
    );
  }

  if (rule.anyOf) {
    return rule.anyOf.some((perm) =>
      userPermissions.includes(perm)
    );
  }

  return false;
};

export const can = (userPermissions, permission) => {
  return userPermissions.includes(permission);
};
