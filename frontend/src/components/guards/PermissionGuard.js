import { useAuthStore } from "../../store/authStore";

export default function PermissionGuard({ permission, children }) {
  const permissions = useAuthStore((s) => s.permissions);

  if (!permission) return children;

  if (!Array.isArray(permissions)) return null;

  return permissions.includes(permission) ? children : null;
}