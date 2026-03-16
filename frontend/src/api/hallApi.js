import axios from "./axios";

/*
===================================
GET HALLS BY SITE
===================================
*/
export const fetchHalls = async (siteId) => {
  try {
    const res = await axios.get(`/sites/${siteId}/halls`);
    return res.data ?? [];
  } catch (error) {
    console.error(
      "Failed to fetch halls:",
      error?.response?.data || error.message
    );
    throw error;
  }
};

/*
===================================
CREATE HALL
===================================
*/
export const createHall = async (siteId, data) => {
  try {
    const res = await axios.post(`/sites/${siteId}/halls`, {
      name: data.name,
      description: data.description || "",
      capacity: data.capacity || null,
    });

    return res.data;
  } catch (error) {
    console.error(
      "Failed to create hall:",
      error?.response?.data || error.message
    );
    throw error;
  }
};

/*
===================================
UPDATE HALL
===================================
*/
export const updateHall = async (siteId, hallId, data) => {
  try {
    const res = await axios.patch(
      `/sites/${siteId}/halls/${hallId}`,
      {
        name: data.name,
        description: data.description,
        capacity: data.capacity,
      }
    );

    return res.data;
  } catch (error) {
    console.error(
      "Failed to update hall:",
      error?.response?.data || error.message
    );
    throw error;
  }
};

/*
===================================
DELETE HALL
===================================
*/
export const deleteHall = async (siteId, hallId) => {
  try {
    const res = await axios.delete(
      `/sites/${siteId}/halls/${hallId}`
    );

    return res.data;
  } catch (error) {
    console.error(
      "Failed to delete hall:",
      error?.response?.data || error.message
    );
    throw error;
  }
};