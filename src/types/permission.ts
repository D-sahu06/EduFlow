
export type Role =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "PRINCIPAL"
  | "HOD"
  | "TEACHER"
  | "ACCOUNTANT"
  | "STUDENT";

export type PermissionAction =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "approve"
  | "export";

export type DataScope =
  | "institution"
  | "department"
  | "assigned"
  | "own";

export type FeaturePermission = {
  actions: PermissionAction[];
  scope: DataScope;
};

export type ModulePermission = {
  [feature: string]: FeaturePermission;
};

export type RolePermissions = {
  [module: string]: ModulePermission;
};
