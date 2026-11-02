
// "use client";

// import { useEffect, useState } from "react";
// import type {
//   Role,
//   PermissionAction,
// } from "@/types/permission";
// import { hasFeatureAccess } from "@/lib/permissions";

// type PermissionGateProps = {
//   module: string;
//   feature: string;
//   action?: PermissionAction;
//   children: React.ReactNode;
//   fallback?: React.ReactNode;
// };

// const VALID_ROLES: Role[] = [
//   "SUPER_ADMIN",
//   "ADMIN",
//   "PRINCIPAL",
//   "HOD",
//   "TEACHER",
//   "ACCOUNTANT",
//   "STUDENT",
// ];

// export default function PermissionGate({
//   module,
//   feature,
//   action = "view",
//   children,
//   fallback = null,
// }: PermissionGateProps) {
//   const [allowed, setAllowed] = useState(false);
//   const [checked, setChecked] = useState(false);

//   useEffect(() => {
//     const savedRole = localStorage.getItem("eduflow-demo-role");

//     const role: Role =
//       savedRole && VALID_ROLES.includes(savedRole as Role)
//         ? (savedRole as Role)
//         : "ADMIN";

//     setAllowed(
//       hasFeatureAccess(role, module, feature, action)
//     );

//     setChecked(true);
//   }, [module, feature, action]);

//   if (!checked) return null;

//   return allowed ? <>{children}</> : <>{fallback}</>;
// }

"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import type {
  Role,
  PermissionAction,
} from "@/types/permission";

import { hasFeatureAccess } from "@/lib/permissions";

type PermissionGateProps = {
  module: string;
  feature: string;
  action?: PermissionAction;
  children: ReactNode;
  fallback?: ReactNode;
};

const VALID_ROLES: Role[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "PRINCIPAL",
  "HOD",
  "TEACHER",
  "ACCOUNTANT",
  "STUDENT",
];

export default function PermissionGate({
  module,
  feature,
  action = "view",
  children,
  fallback = null,
}: PermissionGateProps) {
  const [allowed, setAllowed] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const savedRole = localStorage.getItem("eduflow-demo-role");

    const role: Role =
      savedRole && VALID_ROLES.includes(savedRole as Role)
        ? (savedRole as Role)
        : "ADMIN";

    const hasAccess = hasFeatureAccess(
      role,
      module,
      feature,
      action
    );

    setAllowed(hasAccess);
    setChecked(true);
  }, [module, feature, action]);

  if (!checked) {
    return null;
  }

  if (!allowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}