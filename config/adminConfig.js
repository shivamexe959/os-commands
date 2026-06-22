// ============================================================
// ADA Algorithm Lab — Admin Configuration
// Add admin emails/UIDs here. Never commit secrets.
// ============================================================
export const ADMIN_CONFIG = {
  // List of admin email addresses
  adminEmails: [
    'joshi.shivam12507@gmail.com'   // <-- replace with your email
  ],

  // Firestore UIDs of admins (more secure than email check)
  adminUIDs: [
    '1nZ51WCRvzRA9dXgBHZUDcadRy63'                    // <-- replace with your Firebase UID after first login
  ],

  // Teacher emails — add your teacher's Google account email here once they sign in
  // Then go to Admin Panel → Users → find them → click Promote → type "teacher"
  teacherEmails: [],

  // Maintenance mode — set true to show maintenance screen to all non-admins
  maintenanceMode: false,
  maintenanceMessage: 'ADA Lab is under maintenance. Back shortly!',

  // App metadata
  appVersion: '2.0.0',
  releaseDate: '2026-06-21',
  changelog: 'v2.0.0 — Business upgrade with dashboards, XP, badges, admin panel.',

  // Global announcement (empty string = no announcement)
  announcement: '',
  announcementType: 'info'  // 'info' | 'warning' | 'success' | 'danger'
};
