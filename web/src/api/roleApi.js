import axios from "./axios";

// ============================================================
// FETCH ALL ROLES
// ============================================================
export const fetchRoles = async () => {
  const res = await axios.get("/roles");
  return res.data;
};

// ============================================================
// FETCH SINGLE ROLE
// ============================================================
export const fetchRoleById = async (roleId) => {
  const res = await axios.get(`/roles/${roleId}`);
  return res.data;
};

// ============================================================
// CREATE ROLE
// ============================================================
export const createRole = async (name) => {
  const res = await axios.post("/roles", { name });
  return res.data;
};

// ============================================================
// DELETE ROLE
// ============================================================
export const deleteRole = async (roleId) => {
  const res = await axios.delete(`/roles/${roleId}`);
  return res.data;
};

// ============================================================
// 🔥 UPDATE ROLE (NAME + PERMISSIONS) — RECOMMENDED
// ============================================================
export const updateRole = async (roleId, data) => {
  /**
   * data = {
   *   name?: string,
   *   permissionIds?: string[]
   * }
   */
  const res = await axios.patch(`/roles/${roleId}`, data);
  return res.data;
};

// ============================================================
// ⚠️ LEGACY: ASSIGN PERMISSIONS ONLY (keep for backward compatibility)
// ============================================================
export const assignPermissions = async (roleId, permissionIds) => {
  const res = await axios.post(`/roles/${roleId}/permissions`, {
    permissionIds,
  });
  return res.data;
};