import type {
  DataScope,
  FeaturePermission,
  PermissionAction,
  Role,
  RolePermissions,
} from "@/types/permission";

type PermissionConfig = Partial<Record<Role, RolePermissions>>;

const permission = (
  actions: PermissionAction[],
  scope: DataScope = "institution"
): FeaturePermission => ({
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

const DEFAULT_PERMISSIONS: PermissionConfig = {
  SUPER_ADMIN: {
    dashboard: {
      overview: manage,
    },
    // profile: {
    //   viewProfile: view,
    //   editProfile: permission(["view", "edit"], "own"),
    // },
     profile: {
      viewProfile: manage,
      editProfile: manage,
    },
    students: {
      studentDashboard: view,
      allStudents: manage,
      createStudent: manage,
      editStudent: manage,
      studentPromotion: manage,
      studentDocuments: manage,
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
      financeDashboard: permission(["view", "export"]),
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
      accessLogs: manage,
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
      viewAttendance: view,
      markAttendance: permission(["view", "edit"]),
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
      userRoleAssignment: permission(["view", "create", "edit"]),
      accessLogs: permission(["view", "export"]),
    },
  },

  PRINCIPAL: {
    dashboard: { overview: view },
    profile: {
      viewProfile: manage,
      editProfile: manage,
    },
    students: {
      studentDashboard: view,
      allStudents: view,
      studentPromotion: permission(["view", "approve"], "institution"),
      studentDocuments: view,
    },
    teachers: {
      teacherDashboard: view,
      allTeachers: view,
      leaveManagement: permission(["view", "approve"]),
      teacherReports: permission(["view", "export"]),
    },
    admission: {
      admissionDashboard: view,
      applications: view,
      meritList: permission(["view", "approve"]),
    },
    attendance: {
      attendanceDashboard: view,
      viewAttendance: view,
      attendanceReports: permission(["view", "export"]),
      leaveManagement: permission(["view", "approve"]),
    },
    finance: {
      financeDashboard: view,
      feesStructure: view,
      financeReports: permission(["view", "export"]),
    },
    communication: {
      announcements: permission(["view", "create", "edit"]),
      messages: view,
      notifications: view,
      eventsCalendar: permission(["view", "create", "edit"]),
    },
    examinations: {
      examinationDashboard: view,
      examManagement: view,
      resultProcessing: permission(["view", "approve"]),
      resultDashboard: view,
      reportCard: permission(["view", "export"]),
      examReports: permission(["view", "export"]),
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
      studentDocuments: assignedView,
    },
    teachers: {
      teacherDashboard: ownView,
      leaveManagement: ownView,
    },
    attendance: {
      attendanceDashboard: assignedView,
      viewAttendance: assignedView,
      markAttendance: permission(["view", "create", "edit"], "assigned"),
      attendanceReports: assignedView,
      leaveManagement: ownView,
    },
    communication: {
      announcements: view,
      messages: ownView,
      notifications: ownView,
      eventsCalendar: view,
    },
    examinations: {
      examinationDashboard: assignedView,
      examManagement: assignedView,
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
      feesStructure: permission(["view", "create", "edit"]),
      pendingDues: permission(["view", "edit", "export"]),
      receipts: permission(["view", "create", "export"]),
      financeReports: permission(["view", "export"]),
    },
    communication: {
      announcements: view,
      messages: ownView,
      notifications: ownView,
      eventsCalendar: view,
    },
  },

  STUDENT: {
    dashboard: { overview: ownView },
    profile: {
      viewProfile: ownView,
    },
    students: {
      studentDashboard: ownView,
      studentDocuments: ownView,
    },
    attendance: {
      attendanceDashboard: ownView,
      viewAttendance: ownView,
    },
    finance: {
      financeDashboard: ownView,
      pendingDues: ownView,
      receipts: ownView,
      feesStructure: ownView
    },
    communication: {
      announcements: view,
      messages: ownView,
      notifications: ownView,
      eventsCalendar: view,
    },
    examinations: {
      resultDashboard: ownView,
      reportCard: ownView,
    },
  },
};

export function getRolePermissions(role: Role): RolePermissions {
  return DEFAULT_PERMISSIONS[role] ?? {};
}

export function hasModuleAccess(
  role: Role,
  moduleId: string
): boolean {
  const modulePermissions = getRolePermissions(role)[moduleId];

  return (
    !!modulePermissions &&
    Object.values(modulePermissions).some((feature) =>
      feature.actions.includes("view")
    )
  );
}
export function hasFeatureAccess(
  role: Role,
  moduleId: string,
  featureId: string,
  action: PermissionAction = "view"
): boolean {
  const feature =
    getRolePermissions(role)[moduleId]?.[featureId];

  return feature?.actions.includes(action) ?? false;
}

export function getFeatureScope(
  role: Role,
  moduleId: string,
  featureId: string
): DataScope | null {
  return (
    getRolePermissions(role)[moduleId]?.[featureId]?.scope ?? null )}