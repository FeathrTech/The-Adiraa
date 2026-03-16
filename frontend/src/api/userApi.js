import axios from "./axios";

export const fetchUsers = async () => {
  const res = await axios.get("/users");
  return res.data;
};

export const createUser = async (data) => {
  const res = await axios.post("/users", data);
  return res.data;
};

export const updateUser = async (id, data) => {
  const res = await axios.patch(`/users/${id}`, data);
  return res.data;
};

export const deactivateUser = async (id) => {
  const res = await axios.delete(`/users/${id}`);
  return res.data;
};