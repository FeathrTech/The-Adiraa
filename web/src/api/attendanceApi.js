import api from "./axios";

/* =========================
   DASHBOARD
========================= */

export const fetchAttendanceDashboard = (params) => {
  return api.get("/attendance/dashboard", { params });
};

/* =========================
   TODAY STATUS
========================= */

export const fetchTodayStatus = () => {
  return api.get("/attendance/today");
};

/* =========================
   CHECK IN
========================= */

export const checkIn = (formData) => {
  return api.post("/attendance/checkin", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

/* =========================
   CHECK OUT
========================= */

export const checkOut = (formData) => {
  return api.post("/attendance/checkout", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

/* =========================
   ACTION DROPDOWN
========================= */

export const attendanceAction = (attendanceId, action) => {
  return api.patch(`/attendance/${attendanceId}/action`, {
    action,
  });
};

/* =========================
   MANUAL MARK
========================= */

export const manualAttendance = (data) => {
  return api.post("/attendance/manual-mark", data);
};

/* =========================
   MARK ABSENT
========================= */

export const markAbsent = (data) => {
  return api.post("/attendance/mark-absent", data);
};

/* =========================
   REPORT SUMMARY
========================= */

export const fetchAttendanceReport = (params) => {
  return api.get("/attendance/report/summary", { params });
};

/* =========================
   STAFF LIST FOR FILTERS
========================= */

export const fetchStaffListForReport = () => {
  return api.get("/attendance/report/staff-list");
};