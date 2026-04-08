import api from "./axios";

/* =========================
   USERS
========================= */

export const fetchUsers = async () => {
  const res = await api.get("/users");
  return res.data;
};

export const createUser = async (formData) => {
  const res = await api.post("/users", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const updateUser = async (id, formData) => {
  const res = await api.patch(`/users/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

// ✅ FIXED — was calling DELETE, now correctly calls PATCH with isActive: false
export const deactivateUser = async (id) => {
  const form = new FormData();
  form.append("isActive", "false");

  const res = await api.patch(`/users/${id}`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const activateUser = async (id) => {
  const form = new FormData();
  form.append("isActive", "true");

  const res = await api.patch(`/users/${id}`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

// ✅ CORRECT — permanent delete stays as DELETE
export const deleteUser = async (id) => {
  const res = await api.delete(`/users/${id}`);
  return res.data;
};

/* =========================
   SELF UPLOADS (WEB FIXED)
========================= */

/**
 * ✅ file should be a File object from input:
 * const file = e.target.files[0]
 */
export const uploadOwnProfilePhoto = async (file) => {
  const formData = new FormData();
  formData.append("profilePhoto", file);

  try {
    const res = await api.patch("/users/me/profile-photo", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    console.log("✅ uploadOwnProfilePhoto SUCCESS");
    return res.data;
  } catch (e) {
    console.error("❌ uploadOwnProfilePhoto FAILED");
    console.error(e?.response?.data || e.message);
    throw e;
  }
};

/**
 * ✅ file should be a File object
 */
export const uploadOwnIdProof = async (file) => {
  const formData = new FormData();
  formData.append("idProof", file);

  try {
    const res = await api.patch("/users/me/id-proof", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (e) {
    console.error("❌ uploadOwnIdProof FAILED");
    console.error(e?.response?.data || e.message);
    throw e;
  }
};