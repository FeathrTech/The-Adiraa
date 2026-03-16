import axios from "./axios";

export const fetchRoles = async () => {
  const res = await axios.get("/roles");
  return res.data;
};

export const createRole = async (name) => {
  const res = await axios.post("/roles", { name });
  return res.data;
};

export const deleteRole = async (roleId) => {
  const res = await axios.delete(`/roles/${roleId}`);
  return res.data;
};

export const fetchRoleById = async (roleId) => {
  const response = await axios.get(`/roles/${roleId}`);
  return response.data;
};

export const assignPermissions = async (
  roleId,
  permissionIds
) => {
  const res = await axios.post(
    `/roles/${roleId}/permissions`,
    { permissionIds }   // ← must be IDs
  );
  return res.data;
};
