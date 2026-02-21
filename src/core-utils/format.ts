/**
 * Converts a role key (e.g. super_admin, finance_admin) to a display label in capital case.
 * "super_admin" -> "Super Admin", "employee" -> "Employee"
 */
export function roleToDisplayLabel(role: string): string {
  if (!role || typeof role !== 'string') return role || '';
  return role
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Converts a policy flag code (e.g. food_per_day_exceeded) to a short display label when backend does not provide flagMessages.
 */
export function flagCodeToDisplayLabel(code: string): string {
  if (!code || typeof code !== 'string') return code || '';
  return code
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
