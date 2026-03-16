import { DataSource } from 'typeorm';
import { Permission } from './permission.entity';

export async function seedPermissions(dataSource: DataSource) {
  const permissionRepo = dataSource.getRepository(Permission);

  const permissions = [

    // =============================
    // ROLE MANAGEMENT
    // =============================
    { key: 'role.create', module: 'role', action: 'create' },
    { key: 'role.edit', module: 'role', action: 'edit' },
    { key: 'role.delete', module: 'role', action: 'delete' },
    { key: 'role.view', module: 'role', action: 'view' },
    { key: 'role.assign_permissions', module: 'role', action: 'assign_permissions' },
    { key: 'role.assign_to_user', module: 'role', action: 'assign_to_user' },

    // =============================
    // STAFF MANAGEMENT
    // =============================
    { key: 'staff.create', module: 'staff', action: 'create' },
    { key: 'staff.edit', module: 'staff', action: 'edit' },
    { key: 'staff.delete', module: 'staff', action: 'delete' },
    { key: 'staff.view', module: 'staff', action: 'view' },
    { key: 'staff.assign_shift', module: 'staff', action: 'assign_shift' },
    { key: 'staff.change_shift', module: 'staff', action: 'change_shift' },
    { key: 'staff.view_documents', module: 'staff', action: 'view_documents' },
    { key: 'staff.upload_documents', module: 'staff', action: 'upload_documents' },

    // =============================
    // PROFILE
    // =============================
    { key: 'profile.view_own', module: 'profile', action: 'view_own' },
    { key: 'profile.edit_own', module: 'profile', action: 'edit_own' },
    { key: 'profile.change_password', module: 'profile', action: 'change_password' },
    { key: 'profile.upload_photo', module: 'profile', action: 'upload_photo' },
    { key: 'profile.view_any', module: 'profile', action: 'view_any' },
    { key: 'profile.reset_password', module: 'profile', action: 'reset_password' },
    { key: 'profile.force_logout', module: 'profile', action: 'force_logout' },

    // =============================
    // ATTENDANCE - SELF
    // =============================
    { key: 'attendance.checkin', module: 'attendance', action: 'checkin' },
    { key: 'attendance.checkout', module: 'attendance', action: 'checkout' },
    { key: 'attendance.view.own', module: 'attendance', action: 'view_own' },
    { key: 'attendance.view.own_photos', module: 'attendance', action: 'view_own_photos' },

    // =============================
    // ATTENDANCE - MONITORING
    // =============================
    { key: 'attendance.view.dashboard_summary', module: 'attendance', action: 'view_dashboard_summary' },
    { key: 'attendance.view.live_status', module: 'attendance', action: 'view_live_status' },
    { key: 'attendance.view.photos_and_location', module: 'attendance', action: 'view_photos_and_location' },
    { key: 'attendance.view.staff_history', module: 'attendance', action: 'view_staff_history' },
    { key: 'attendance.view.staff_calendar', module: 'attendance', action: 'view_staff_calendar' },

    // =============================
    // ATTENDANCE - CONTROL
    // =============================
    { key: 'attendance.edit_record', module: 'attendance', action: 'edit_record' },
    { key: 'attendance.delete_record', module: 'attendance', action: 'delete_record' },
    { key: 'attendance.manual_mark', module: 'attendance', action: 'manual_mark' },
    { key: 'attendance.mark_absent', module: 'attendance', action: 'mark_absent' },
    { key: 'attendance.mark_present', module: 'attendance', action: 'mark_present' },
    { key: 'attendance.override_late', module: 'attendance', action: 'override_late' },
    { key: 'attendance.override_location', module: 'attendance', action: 'override_location' },
    { key: 'attendance.override_halfday', module: 'attendance', action: 'override_halfday' },

    // =============================
    // ATTENDANCE REPORTS
    // =============================
    { key: 'attendance.report.view', module: 'attendance', action: 'report_view' },
    { key: 'attendance.report.export_pdf', module: 'attendance', action: 'report_export_pdf' },
    { key: 'attendance.report.export_excel', module: 'attendance', action: 'report_export_excel' },
    { key: 'attendance.report.view_late_only', module: 'attendance', action: 'report_view_late_only' },
    { key: 'attendance.report.view_absent_only', module: 'attendance', action: 'report_view_absent_only' },

    // =============================
    // EVENTS
    // =============================
    { key: 'event.create', module: 'event', action: 'create' },
    { key: 'event.edit', module: 'event', action: 'edit' },
    { key: 'event.delete', module: 'event', action: 'delete' },
    { key: 'event.cancel', module: 'event', action: 'cancel' },
    { key: 'event.view_all', module: 'event', action: 'view_all' },
    { key: 'event.view_basic', module: 'event', action: 'view_basic' },
    { key: 'event.view_client_details', module: 'event', action: 'view_client_details' },

    // =============================
    // DASHBOARD
    // =============================
    { key: 'dashboard.view', module: 'dashboard', action: 'view' },
    { key: 'dashboard.view_analytics', module: 'dashboard', action: 'view_analytics' },
    { key: 'dashboard.view_attendance_tiles', module: 'dashboard', action: 'view_attendance_tiles' },

    // =============================
    // NOTIFICATIONS
    // =============================
    { key: 'notification.manage', module: 'notification', action: 'manage' },
    { key: 'notification.send_manual', module: 'notification', action: 'send_manual' },
    { key: 'notification.configure_reminder', module: 'notification', action: 'configure_reminder' },

    // =============================
    // SETTINGS
    // =============================
    { key: 'settings.attendance.view', module: 'settings', action: 'attendance_view' },
    { key: 'settings.attendance.edit', module: 'settings', action: 'attendance_edit' },
    { key: 'settings.attendance.geo_radius_edit', module: 'settings', action: 'attendance_geo_radius_edit' },
    { key: 'settings.attendance.photo_required_edit', module: 'settings', action: 'attendance_photo_required_edit' },
    { key: 'settings.attendance.late_policy_edit', module: 'settings', action: 'attendance_late_policy_edit' },
    { key: 'settings.attendance.halfday_policy_edit', module: 'settings', action: 'attendance_halfday_policy_edit' },
    { key: 'settings.notifications.view', module: 'settings', action: 'notifications_view' },
    { key: 'settings.notifications.edit', module: 'settings', action: 'notifications_edit' },
    { key: 'settings.security.view', module: 'settings', action: 'security_view' },
    { key: 'settings.security.edit', module: 'settings', action: 'security_edit' },

    // =============================
    // ADMIN MANAGEMENT
    // =============================
    { key: 'admin.create', module: 'admin', action: 'create' },
    { key: 'admin.edit', module: 'admin', action: 'edit' },
    { key: 'admin.delete', module: 'admin', action: 'delete' },
    { key: 'admin.view', module: 'admin', action: 'view' },

    // =============================
    // SITE (LOCATION) MANAGEMENT - NEW
    // =============================
    { key: 'site.create', module: 'site', action: 'create' },
    { key: 'site.edit', module: 'site', action: 'edit' },
    { key: 'site.delete', module: 'site', action: 'delete' },
    { key: 'site.view', module: 'site', action: 'view' },
    { key: 'site.assign_admin', module: 'site', action: 'assign_admin' },
    { key: 'site.activate', module: 'site', action: 'activate' },
    { key: 'site.deactivate', module: 'site', action: 'deactivate' },

    // =============================
    // SESSION CONTROL
    // =============================
    { key: 'session.view_active', module: 'session', action: 'view_active' },
    { key: 'session.force_logout_user', module: 'session', action: 'force_logout_user' },

    { key: 'permission.view', module: 'permission', action: 'view' },

  ];

  for (const perm of permissions) {
    const exists = await permissionRepo.findOne({
      where: { key: perm.key },
    });

    if (!exists) {
      await permissionRepo.save(permissionRepo.create(perm));
    }
  }

  console.log('Permissions seeded successfully');
}
