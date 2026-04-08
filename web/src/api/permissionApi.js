import axios from "./axios";

export const fetchPermissions = async () => {
  const res = await axios.get("/permissions");
  return res.data;
};
