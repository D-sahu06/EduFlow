// EduFlow ERP - Single Source of Truth Role-Based Access Control (RBAC) Matrix
// Synchronized with Frontend (src/lib/permissions.ts)

const permission = (actions, scope = "institution") => ({
  actions,
  scope,
});

const view = permission(["view"]);
const ownView = permission(["view"], "own");
const assignedView = permission(["view"], "assigned");
const departmentView = permission(["view"], "department");

const manage = permission([
  "view",
  "create",
  "edit",
  "delete",
  "approve",
  "export",
]);

export const DEFAULT_PERMISSIONS = {
  SUPER_ADMIN: {
    dashboard: { overview: manage },
    profile: { viewProfile: manage, editProfile: manage },
    students: {
      studentDashboard: view,
      allStudents: manage,
      createStudent: manage,
      editStudent: manage,
      studentPromotion: manage,
      studentDocuments: manage,
      classes: manage,
    },
    teachers: {
      teacherDashboard: view,
      allTeachers: manage,
      createTeacher: manage,
      editTeacher: manage,
      assignSubjects: manage,
      leaveManagement: manage,
      teacherReports: manage,
    },
    admission: {
      admissionDashboard: view,
      applications: manage,
      newAdmission: manage,
      meritList: manage,
    },
    attendance: {
      attendanceDashboard: view,
      viewAttendance: manage,
      markAttendance: manage,
      attendanceReports: manage,
      leaveManagement: manage,
    },
    finance: {
      financeDashboard: manage,
      feesStructure: manage,
      pendingDues: manage,
      receipts: manage,
      financeReports: manage,
    },
    communication: {
      announcements: manage,
      messages: manage,
      notifications: manage,
      eventsCalendar: manage,
    },
    examinations: {
      examinationDashboard: view,
      examManagement: manage,
      resultProcessing: manage,
      resultDashboard: view,
      reportCard: manage,
      examReports: manage,
    },
    roleManagement: {
      roles: manage,
      permissions: manage,
      userRoleAssignment: manage,
      resetPassword: manage,
      accessLogs: manage,
    },
    reports: {
      overview: manage,
      academic: manage,
      admissions: manage,
      attendance: manage,
      fees: manage,
    },
  },

  ADMIN: {
    dashboard: { overview: view },
    profile: {
      viewProfile: ownView,
      editProfile: permission(["view", "edit"], "own"),
    },
    students: {
      studentDashboard: view,
      allStudents: manage,
      createStudent: manage,
      editStudent: manage,
      studentPromotion: permission(["view", "approve", "edit"]),
      studentDocuments: manage,
      classes: view,
    },
    teachers: {
      teacherDashboard: view,
      allTeachers: manage,
      createTeacher: manage,
      editTeacher: manage,
      assignSubjects: manage,
      leaveManagement: manage,
      teacherReports: permission(["view", "export"]),
    },
    admission: {
      admissionDashboard: view,
      applications: manage,
      newAdmission: manage,
      meritList: manage,
    },
    attendance: {
      attendanceDashboard: view,
      viewAttendance: manage,
      markAttendance: permission(["view", "create", "edit"]),
      attendanceReports: permission(["view", "export"]),
      leaveManagement: manage,
    },
    finance: {
      financeDashboard: permission(["view", "export"]),
      feesStructure: manage,
      pendingDues: manage,
      receipts: manage,
      financeReports: permission(["view", "export"]),
    },
    communication: {
      announcements: manage,
      messages: manage,
      notifications: manage,
      eventsCalendar: manage,
    },
    examinations: {
      examinationDashboard: view,
      examManagement: manage,
      resultProcessing: manage,
      resultDashboard: view,
      reportCard: permission(["view", "export"]),
      examReports: permission(["view", "export"]),
    },
    roleManagement: {
      roles: permission(["view"]),
      permissions: permission(["view"]),
      userRoleAssignment: permission(["view", "create", "edit", "delete"]),
      resetPassword: permission(["view", "edit"], "institution"),
      accessLogs: permission(["view", "export"]),
    },
    reports: {
      overview: view,
      academic: permission(["view", "export"]),
      admissions: permission(["view", "export"]),
      attendance: permission(["view", "export"]),
      fees: permission(["view", "export"]),
    },
  },

  PRINCIPAL: {
    dashboard: { overview: view },
    profile: {
      viewProfile: ownView,
      editProfile: permission(["view", "edit"], "own"),
    },
    students: {
      studentDashboard: view,
      allStudents: manage,
      createStudent: permission(["view", "create"]),
      editStudent: permission(["view", "edit"]),
      studentPromotion: permission(["view", "approve", "edit"], "institution"),
      studentDocuments: manage,
      classes: view,
    },
    teachers: {
      teacherDashboard: view,
      allTeachers: manage,
      createTeacher: permission(["view", "create"]),
      editTeacher: permission(["view", "edit"]),
      assignSubjects: permission(["view", "create", "edit"]),
      leaveManagement: permission(["view", "approve"]),
      teacherReports: permission(["view", "export"]),
    },
    admission: {
      admissionDashboard: view,
      applications: permission(["view", "approve", "edit"]),
      newAdmission: view,
      meritList: permission(["view", "approve"]),
    },
    attendance: {
      attendanceDashboard: view,
      viewAttendance: manage,
      markAttendance: permission(["view", "create", "edit"]),
      attendanceReports: permission(["view", "export"]),
      leaveManagement: permission(["view", "approve"]),
    },
    finance: {
      financeDashboard: view,
      feesStructure: view,
      pendingDues: view,
      receipts: view,
      financeReports: permission(["view", "export"]),
    },
    communication: {
      announcements: permission(["view", "create", "edit", "delete"]),
      messages: permission(["view", "create", "delete"], "institution"),
      notifications: view,
      eventsCalendar: permission(["view", "create", "edit"]),
    },
    examinations: {
      examinationDashboard: view,
      examManagement: manage,
      resultProcessing: permission(["view", "approve", "edit"]),
      resultDashboard: view,
      reportCard: permission(["view", "export"]),
      examReports: permission(["view", "export"]),
    },
    roleManagement: {
      roles: permission(["view"]),
      permissions: permission(["view"]),
      userRoleAssignment: permission(["view", "create", "delete"]),
      resetPassword: permission(["view", "edit"], "institution"),
      accessLogs: permission(["view", "export"]),
    },
    reports: {
      overview: view,
      academic: permission(["view", "export"]),
      admissions: permission(["view", "export"]),
      attendance: permission(["view", "export"]),
      fees: permission(["view", "export"]),
    },
  },

  HOD: {
    dashboard: { overview: view },
    profile: {
      viewProfile: ownView,
      editProfile: permission(["view", "edit"], "own"),
    },
    students: {
      studentDashboard: departmentView,
      allStudents: departmentView,
      studentDocuments: departmentView,
      classes: departmentView,
    },
    teachers: {
      teacherDashboard: departmentView,
      allTeachers: departmentView,
      assignSubjects: permission(["view", "edit"], "department"),
      leaveManagement: permission(["view", "approve"], "department"),
      teacherReports: permission(["view", "export"], "department"),
    },
    attendance: {
      attendanceDashboard: departmentView,
      viewAttendance: departmentView,
      attendanceReports: permission(["view", "export"], "department"),
      leaveManagement: permission(["view", "approve"], "department"),
    },
    communication: {
      announcements: permission(["view", "create"], "department"),
      messages: departmentView,
      notifications: departmentView,
      eventsCalendar: permission(["view", "create"], "department"),
    },
    examinations: {
      examinationDashboard: departmentView,
      examManagement: departmentView,
      resultProcessing: permission(["view", "edit"], "department"),
      resultDashboard: departmentView,
      reportCard: departmentView,
      examReports: permission(["view", "export"], "department"),
    },
  },

  TEACHER: {
    dashboard: { overview: view },
    profile: {
      viewProfile: ownView,
      editProfile: permission(["view", "edit"], "own"),
    },
    students: {
      studentDashboard: assignedView,
      allStudents: assignedView,
      studentDocuments: permission(["view", "create", "edit", "approve"], "assigned"),
      classes: assignedView,
    },
    teachers: {
      teacherDashboard: ownView,
      allTeachers: permission(["view"], "institution"),
      leaveManagement: ownView,
    },
    attendance: {
      attendanceDashboard: view,
      viewAttendance: view,
      markAttendance: permission(["view", "create", "edit"], "institution"),
      attendanceReports: view,
      leaveManagement: permission(["view", "create"], "own"),
    },
    communication: {
      announcements: view,
      messages: permission(["view", "create", "delete"], "own"),
      notifications: ownView,
      eventsCalendar: view,
    },
    examinations: {
      examinationDashboard: assignedView,
      examManagement: permission(["view", "create", "edit"], "assigned"),
      resultProcessing: permission(["view", "create", "edit"], "assigned"),
      resultDashboard: assignedView,
      reportCard: assignedView,
      examReports: assignedView,
    },
  },

  ACCOUNTANT: {
    dashboard: { overview: view },
    profile: {
      viewProfile: ownView,
      editProfile: permission(["view", "edit"], "own"),
    },
    finance: {
      financeDashboard: permission(["view", "export"]),
      feesStructure: manage,
      pendingDues: permission(["view", "edit", "export"]),
      receipts: permission(["view", "create", "export"]),
      financeReports: permission(["view", "export"]),
    },
    attendance: {
      viewAttendance: ownView,
      leaveManagement: permission(["view", "create"], "own"),
    },
    communication: {
      announcements: view,
      messages: ownView,
      notifications: ownView,
      eventsCalendar: view,
    },
    reports: {
      overview: view,
      fees: permission(["view", "export"]),
    },
  },

  STUDENT: {
    dashboard: { overview: ownView },
    profile: {
      viewProfile: ownView,
      editProfile: permission(["view", "edit"], "own"),
    },
    students: {
      studentDashboard: ownView,
      allStudents: ownView,
      studentDocuments: permission(["view", "create"], "own"),
      classes: ownView,
    },
    attendance: {
      attendanceDashboard: ownView,
      viewAttendance: ownView,
      leaveManagement: permission(["view", "create"], "own"),
    },
    finance: {
      pendingDues: ownView,
      receipts: ownView,
      feesStructure: ownView,
    },
    communication: {
      announcements: view,
      messages: ownView,
      notifications: ownView,
      eventsCalendar: view,
    },
    examinations: {
      examinationDashboard: ownView,
      examManagement: ownView,
      resultDashboard: ownView,
      reportCard: ownView,
    },
  },

  USER: {
    dashboard: { overview: ownView },
    profile: {
      viewProfile: ownView,
      editProfile: permission(["view", "edit"], "own"),
    },
    communication: {
      announcements: view,
      messages: ownView,
      notifications: ownView,
      eventsCalendar: view,
    },
    examinations: {
      examinationDashboard: ownView,
      examManagement: ownView,
      resultDashboard: ownView,
      reportCard: ownView,
    },
  },
};

export function hasModuleAccess(role, module) {
  const rolePermissions = DEFAULT_PERMISSIONS[role];
  if (!rolePermissions) return false;
  const moduleObj = rolePermissions[module];
  if (!moduleObj) return false;
  return Object.values(moduleObj).some((feature) =>
    feature.actions && feature.actions.includes("view")
  );
}

export function hasFeatureAccess(role, module, feature, action = "view") {
  const rolePermissions = DEFAULT_PERMISSIONS[role];
  if (!rolePermissions) return false;
  const featurePerm = rolePermissions[module]?.[feature];
  if (!featurePerm || !featurePerm.actions) return false;
  return featurePerm.actions.includes(action);
}

export function getFeatureScope(role, module, feature) {
  const rolePermissions = DEFAULT_PERMISSIONS[role];
  return rolePermissions?.[module]?.[feature]?.scope || null;
}
