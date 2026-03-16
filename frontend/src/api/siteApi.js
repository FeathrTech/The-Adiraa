import axios from "./axios";

/**
 * ============================
 * 📥 GET ALL SITES
 * ============================
 */
export const fetchSites = async () => {
  try {
    const res = await axios.get("/sites");
    return res.data ?? [];
  } catch (error) {
    console.error(
      "Failed to fetch sites:",
      error?.response?.data || error.message
    );
    throw error;
  }
};

/**
 * ============================
 * 📥 GET SINGLE SITE
 * ============================
 */
export const fetchSiteById = async (id) => {
  try {
    const res = await axios.get(`/sites/${id}`);
    return res.data;
  } catch (error) {
    console.error(
      "Failed to fetch site:",
      error?.response?.data || error.message
    );
    throw error;
  }
};

/**
 * ============================
 * ➕ CREATE SITE
 * ============================
 */
export const createSite = async (data) => {
  try {
    const res = await axios.post("/sites", {
      name: data.name,
      address: data.address || "",
      latitude: data.latitude ? Number(data.latitude) : null,
      longitude: data.longitude ? Number(data.longitude) : null,
      allowedRadius: data.allowedRadius || 100,
    });

    return res.data;
  } catch (error) {
    console.error(
      "Failed to create site:",
      error?.response?.data || error.message
    );
    throw error;
  }
};

/**
 * ============================
 * ✏️ UPDATE SITE
 * ============================
 */
export const updateSite = async (id, data) => {
  try {
    const res = await axios.patch(`/sites/${id}`, {
      name: data.name,
      address: data.address,
      latitude:
        data.latitude !== undefined
          ? Number(data.latitude)
          : undefined,
      longitude:
        data.longitude !== undefined
          ? Number(data.longitude)
          : undefined,
      allowedRadius: data.allowedRadius,
    });

    return res.data;
  } catch (error) {
    console.error(
      "Failed to update site:",
      error?.response?.data || error.message
    );
    throw error;
  }
};

/**
 * ============================
 * 🗑 DELETE SITE
 * ============================
 */
export const deleteSite = async (id) => {
  try {
    const res = await axios.delete(`/sites/${id}`);
    return res.data;
  } catch (error) {
    console.error(
      "Failed to delete site:",
      error?.response?.data || error.message
    );
    throw error;
  }
};