import api from "./axios";

/*
========================================
GET CALENDAR SUMMARY
Used for colored calendar dates
========================================
*/

export const getCalendarSummary = async ({ siteId, year, month, hallName }) => {
  const res = await api.get("/events/calendar", {
    params: {
      siteId,
      year,
      month,
      ...(hallName ? { hallName } : {}),
    },
  });

  return res.data;
};

/*
========================================
GET EVENTS BY DATE
Used when clicking a day
========================================
*/

export const getEventsByDate = async (date, { locationId, hallName }) => {
  const res = await api.get("/events/by-date", {
    params: {
      date,
      locationId,
      ...(hallName ? { hallName } : {}),
    },
  });

  return res.data;
};

/*
========================================
GET ALL EVENTS
(Admin view / reporting)
========================================
*/

export const getAllEvents = async () => {
  const res = await api.get("/events");
  return res.data;
};

/*
========================================
GET SINGLE EVENT
(Edit screen)
========================================
*/

export const getEvent = async (id) => {
  const res = await api.get(`/events/${id}`);
  return res.data;
};

/*
========================================
CREATE EVENT
========================================
*/

export const createEvent = async (data) => {
  const res = await api.post("/events", data);
  return res.data;
};

/*
========================================
UPDATE EVENT
========================================
*/

export const updateEvent = async (id, data) => {
  const res = await api.patch(`/events/${id}`, data);
  return res.data;
};

/*
========================================
DELETE EVENT
========================================
*/

export const deleteEvent = async (id) => {
  const res = await api.delete(`/events/${id}`);
  return res.data;
};