/**
 * Super Admin panel – manage users and roles (Phase 2 RBAC).
 * Visible only to users with permission xpensepanel:admin:admin. BE admin APIs require xpense:admin:list.
 */
export default function AdminPage() {
  return (
    <div className="w-full">
      <h2 className="mb-4 text-lg font-semibold">Admin</h2>
      <p className="text-sm text-gray-600">
        User and role management will be wired here (list users, assign roles, edit role permissions).
      </p>
    </div>
  );
}
