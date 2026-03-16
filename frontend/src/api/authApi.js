import axios from "./axios";

/*
================================================
LOGIN (USERNAME + PASSWORD)
================================================
*/

export const loginRequest = async (username, password) => {
  const response = await axios.post("/auth/login", {
    username,
    password,
  });

  return response.data;
};

/*
================================================
REGISTER TENANT (OWNER CREATION)
================================================
*/

export const registerTenantRequest = async (data) => {
  /*
  Backend should:
  - create tenant
  - generate slug
  - create owner user
  - generate username = name@slug
  - return { user, token }
  */

  const response = await axios.post("/auth/register-tenant", data);

  return response.data;
};