import axios from "./axios";

export const fetchUsers = async () => {
  const res = await axios.get("/users");
  return res.data;
};

export const createUser = async (data) => {
  const res = await axios.post("/users", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const updateUser = async (id, data) => {
  const res = await axios.patch(`/users/${id}`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const deactivateUser = async (id) => {
  const res = await axios.delete(`/users/${id}`);
  return res.data;
};

export const activateUser = async (id) => {
  const form = new FormData();
  form.append("isActive", "true");
  const res = await axios.patch(`/users/${id}`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const deleteUser = async (id) => {
  const res = await axios.delete(`/users/${id}`);
  return res.data;
};

// ─── Self Upload ──────────────────────────────────────────────────────────────

export const uploadOwnProfilePhoto = async (asset) => {
  const formData = new FormData();
  formData.append("profilePhoto", {
    uri: asset.uri,
    name: "profile.jpg",
    type: "image/jpeg",
  });

  try {
    const res = await axios.patch("/users/me/profile-photo", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    console.log("✅ uploadOwnProfilePhoto SUCCESS:", JSON.stringify(res.data));
    return res.data;
  } catch (e) {
    console.log("❌ uploadOwnProfilePhoto FAILED");
    console.log("status:", e.response?.status);
    console.log("data:", JSON.stringify(e.response?.data));
    console.log("message:", e.message);
    console.log("stack:", e.stack);
    throw e;
  }
};
export const uploadOwnIdProof = async (asset) => {
  const formData = new FormData();
  formData.append("idProof", {
    uri: asset.uri,
    name: asset.name || "document.pdf",
    type: asset.mimeType || "application/pdf",
  });

  try {
    const res = await axios.patch("/users/me/id-proof", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (e) {
    console.log("=== ID PROOF UPLOAD ERROR ===");
    console.log("Status:", e.response?.status);
    console.log("Message:", e.response?.data?.message);
    console.log("Full response:", JSON.stringify(e.response?.data));
    console.log("Full error:", e.message);
    throw e;
  }
};
