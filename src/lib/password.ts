export type PasswordRequirement = {
  label: string;
  met: boolean;
};

/**
 * Returns live password strength checklist items matching backend validation rules.
 */
export function getPasswordRequirements(password: string): PasswordRequirement[] {
  return [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "One uppercase letter (A-Z)", met: /[A-Z]/.test(password) },
    { label: "One lowercase letter (a-z)", met: /[a-z]/.test(password) },
    { label: "One number (0-9)", met: /[0-9]/.test(password) },
    { label: "One special character (!@#$...)", met: /[^A-Za-z0-9]/.test(password) },
  ];
}

/**
 * Validates password complexity and optional confirmation match.
 * Returns an error message string, or null when valid.
 */
export function validatePasswordStrength(
  password: string,
  confirmPassword?: string
): string | null {
  if (!password) {
    return "New password is required.";
  }
  if (password.length < 8) {
    return "Password must be at least 8 characters long.";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must include at least one uppercase letter.";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must include at least one lowercase letter.";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must include at least one number.";
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Password must include at least one special character.";
  }
  if (confirmPassword !== undefined && password !== confirmPassword) {
    return "New password and confirmation password do not match.";
  }
  return null;
}
