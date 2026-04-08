// src/components/attendance/AttendanceReports.jsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../store/authStore";
import { can } from "../../config/permissionMap";
import { fetchAttendanceReport, fetchStaffListForReport } from "../../api/attendanceApi";

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  gold: "#C9A227",
  goldLight: "#E8C45A",
  bg: "#0A0A0A",
  surface: "#131313",
  card: "#1A1A1A",
  cardAlt: "#1F1F1F",
  border: "#2A2A2A",
  borderGold: "rgba(201,162,39,0.35)",
  white: "#FFFFFF",
  muted: "#777",
  faint: "#333",
  presentText: "#5DBE8A",
  presentBg: "rgba(93,190,138,0.12)",
  presentBorder: "rgba(93,190,138,0.30)",
  absentText: "#E57373",
  absentBg: "rgba(229,115,115,0.12)",
  absentBorder: "rgba(229,115,115,0.30)",
  lateText: "#E8C34A",
  lateBg: "rgba(232,195,74,0.12)",
  lateBorder: "rgba(232,195,74,0.30)",
  halfText: "#FF9F0A",
  halfBg: "rgba(255,159,10,0.12)",
  halfBorder: "rgba(255,159,10,0.30)",
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function ArrowLeftIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function CalendarIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function FilterIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

function ChevronLeftIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRightIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function SearchIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function DownloadIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function UserIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function JoinIcon({ size = 11 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function FileTextIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function TableIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="3" x2="9" y2="21" />
    </svg>
  );
}

function Spinner({ size = 22, color = C.gold }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24"
      style={{ animation: "ar-spin .8s linear infinite" }}>
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="4" style={{ opacity: 0.25 }} />
      <path fill={color} style={{ opacity: 0.75 }}
        d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
    </svg>
  );
}

// ─── Mini Calendar Picker ─────────────────────────────────────────────────────
function MiniCalendarPicker({ selectedDate, onSelect, onClose, label }) {
  const initDate = selectedDate ? new Date(selectedDate + "T00:00:00") : new Date();
  const [year, setYear] = useState(initDate.getFullYear());
  const [month, setMonth] = useState(initDate.getMonth());

  const monthName = new Date(year, month).toLocaleString("default", { month: "long" });
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 10000,
        backgroundColor: "rgba(0,0,0,0.75)",
        display: "flex", alignItems: "center",
        justifyContent: "center", padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: C.card, borderRadius: 20,
          border: `1px solid ${C.borderGold}`,
          padding: 24, width: 320,
          boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
        }}
        onClick={e => e.stopPropagation()}
      >
        <p style={{
          color: C.gold, fontSize: 11, fontWeight: 700,
          letterSpacing: 2, textTransform: "uppercase",
          margin: "0 0 14px", textAlign: "center",
        }}>
          {label}
        </p>

        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between", marginBottom: 16,
        }}>
          <button onClick={prevMonth} style={{
            background: "none", border: "none", color: C.gold,
            cursor: "pointer", display: "flex", padding: 4, borderRadius: 8,
          }}>
            <ChevronLeftIcon size={18} />
          </button>
          <span style={{ color: C.white, fontWeight: 700, fontSize: 15 }}>
            {monthName} {year}
          </span>
          <button onClick={nextMonth} style={{
            background: "none", border: "none", color: C.gold,
            cursor: "pointer", display: "flex", padding: 4, borderRadius: 8,
          }}>
            <ChevronRightIcon size={18} />
          </button>
        </div>

        <div style={{
          display: "grid", gridTemplateColumns: "repeat(7, 1fr)",
          gap: 2, marginBottom: 6,
        }}>
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
            <div key={d} style={{
              textAlign: "center", color: C.gold,
              fontSize: 11, fontWeight: 600, padding: "4px 0",
            }}>{d}</div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
          {cells.map((day, idx) => {
            if (!day) return <div key={`e-${idx}`} />;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const isSelected = dateStr === selectedDate;
            const isToday = dateStr === todayStr;
            return (
              <button
                key={dateStr}
                onClick={() => { onSelect(dateStr); onClose(); }}
                style={{
                  width: "100%", aspectRatio: "1",
                  borderRadius: "50%", border: "none",
                  backgroundColor: isSelected ? C.gold
                    : isToday ? "rgba(201,162,39,0.15)" : "transparent",
                  color: isSelected ? "#000" : isToday ? C.gold : C.white,
                  fontWeight: isSelected || isToday ? 700 : 400,
                  fontSize: 13, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background .15s",
                }}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Summary Stat Card ────────────────────────────────────────────────────────
function SummaryCard({ label, value, bg, text, border }) {
  return (
    <div style={{
      backgroundColor: bg,
      border: `1px solid ${border}`,
      borderRadius: 16,
      padding: "18px 20px",
      display: "flex",
      flexDirection: "column",
      gap: 6,
    }}>
      <span style={{ color: text, fontSize: 28, fontWeight: 800, lineHeight: 1 }}>
        {value ?? "—"}
      </span>
      <span style={{ color: C.muted, fontSize: 12, fontWeight: 500 }}>
        {label}
      </span>
    </div>
  );
}

// ─── Colored Count Badge ──────────────────────────────────────────────────────
function CountBadge({ value, bg, text, border, zeroMuted = true }) {
  const isEmpty = value === 0 && zeroMuted;
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minWidth: 36,
      padding: "4px 10px",
      borderRadius: 20,
      backgroundColor: isEmpty ? "transparent" : bg,
      border: `1px solid ${isEmpty ? "transparent" : border}`,
      color: isEmpty ? C.muted : text,
      fontWeight: isEmpty ? 400 : 700,
      fontSize: 13,
    }}>
      {value}
    </span>
  );
}

// ─── Attendance Rate Bar ──────────────────────────────────────────────────────
function RateBar({ rate }) {
  const color = rate >= 80 ? C.presentText : rate >= 50 ? C.lateText : C.absentText;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        flex: 1, height: 6, borderRadius: 3,
        backgroundColor: C.faint, overflow: "hidden",
      }}>
        <div style={{
          width: `${rate}%`, height: "100%",
          backgroundColor: color,
          borderRadius: 3,
          transition: "width .5s ease",
        }} />
      </div>
      <span style={{
        color, fontSize: 12, fontWeight: 700,
        minWidth: 36, textAlign: "right",
      }}>
        {rate}%
      </span>
    </div>
  );
}

// ─── Export CSV ───────────────────────────────────────────────────────────────
function exportCSV(staff, meta) {
  const headers = [
    "Name", "Roles", "Joined",
    "Present Days", "Absent Days", "Late Days", "Half Days",
    "Eligible Days", "Attendance Rate %",
  ];
  const rows = staff.map(s => [
    s.name,
    s.roles.join(" / "),
    s.joinDate || "—",
    s.presentDays,
    s.absentDays,
    s.lateDays,
    s.halfDays,
    s.eligibleDays,
    `${s.attendanceRate}%`,
  ]);

  const csvContent = [
    `Attendance Report — ${meta.startDate} to ${meta.endDate}`,
    `Total Staff: ${meta.totalStaff} | Total Days: ${meta.totalDays}`,
    "",
    headers.join(","),
    ...rows.map(r => r.map(v => `"${v}"`).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `attendance-report-${meta.startDate}-to-${meta.endDate}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Export PDF (print-based, no external lib needed) ────────────────────────
function exportPDF(staff, meta, totals) {
  const fmtDate = (str) => str
    ? new Date(str + "T00:00:00").toLocaleDateString("en-US", {
        day: "numeric", month: "short", year: "numeric",
      })
    : "—";

  const rows = staff.map(s => `
    <tr>
      <td>${s.name}<br/><small style="color:#888">${s.roles.join(", ") || "—"}</small></td>
      <td style="text-align:center;color:#888">${s.eligibleDays ?? meta.totalDays}</td>
      <td style="text-align:center">
        <span style="color:#5DBE8A;font-weight:700">${s.presentDays}</span>
      </td>
      <td style="text-align:center">
        <span style="color:${s.absentDays > 0 ? "#E57373" : "#888"};font-weight:${s.absentDays > 0 ? 700 : 400}">
          ${s.absentDays}
        </span>
      </td>
      <td style="text-align:center">
        <span style="color:${s.lateDays > 0 ? "#E8C34A" : "#888"};font-weight:${s.lateDays > 0 ? 700 : 400}">
          ${s.lateDays}
        </span>
      </td>
      <td style="text-align:center">
        <span style="color:${s.halfDays > 0 ? "#FF9F0A" : "#888"};font-weight:${s.halfDays > 0 ? 700 : 400}">
          ${s.halfDays}
        </span>
      </td>
      <td style="text-align:center;color:${s.attendanceRate >= 80 ? "#5DBE8A" : s.attendanceRate >= 50 ? "#E8C34A" : "#E57373"};font-weight:700">
        ${s.attendanceRate}%
      </td>
    </tr>
  `).join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <title>Attendance Report</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          background: #fff;
          color: #111;
          padding: 32px;
          font-size: 13px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 2px solid #C9A227;
        }
        .brand { font-size: 22px; font-weight: 800; color: #C9A227; }
        .report-title { font-size: 16px; font-weight: 700; color: #111; margin-top: 4px; }
        .date-range { font-size: 12px; color: #666; margin-top: 2px; }
        .meta-right { text-align: right; font-size: 12px; color: #666; }
        .summary {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        .summary-box {
          flex: 1;
          min-width: 100px;
          border-radius: 10px;
          padding: 12px 16px;
          border: 1px solid #ddd;
        }
        .summary-box .num { font-size: 24px; font-weight: 800; }
        .summary-box .lbl { font-size: 11px; color: #666; margin-top: 2px; }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }
        th {
          background: #f5f5f5;
          color: #333;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          padding: 10px 12px;
          text-align: left;
          border-bottom: 2px solid #e0e0e0;
        }
        td {
          padding: 10px 12px;
          border-bottom: 1px solid #f0f0f0;
          vertical-align: middle;
        }
        tr:last-child td { border-bottom: none; }
        tr:nth-child(even) td { background: #fafafa; }
        small { font-size: 10px; }
        .footer {
          margin-top: 24px;
          font-size: 11px;
          color: #aaa;
          text-align: center;
        }
        @media print {
          body { padding: 16px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="brand">Attendance Report</div>
          <div class="report-title">Staff Attendance Summary</div>
          <div class="date-range">${fmtDate(meta.startDate)} — ${fmtDate(meta.endDate)}</div>
        </div>
        <div class="meta-right">
          <div>Total Staff: <strong>${meta.totalStaff}</strong></div>
          <div>Total Days: <strong>${meta.totalDays}</strong></div>
          <div style="margin-top:4px;color:#999">Generated: ${new Date().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</div>
        </div>
      </div>

      <div class="summary">
        <div class="summary-box" style="background:#edfbf3;border-color:#b7e4c7">
          <div class="num" style="color:#2d6a4f">${totals.present}</div>
          <div class="lbl">Total Present</div>
        </div>
        <div class="summary-box" style="background:#fff5f5;border-color:#ffc9c9">
          <div class="num" style="color:#c0392b">${totals.absent}</div>
          <div class="lbl">Total Absent</div>
        </div>
        <div class="summary-box" style="background:#fffbea;border-color:#ffe066">
          <div class="num" style="color:#e67e00">${totals.late}</div>
          <div class="lbl">Total Late</div>
        </div>
        <div class="summary-box" style="background:#fff4e6;border-color:#ffd8a8">
          <div class="num" style="color:#d9480f">${totals.halfDay}</div>
          <div class="lbl">Half Days</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Staff</th>
            <th style="text-align:center">Eligible Days</th>
            <th style="text-align:center">Present</th>
            <th style="text-align:center">Absent</th>
            <th style="text-align:center">Late</th>
            <th style="text-align:center">Half Day</th>
            <th style="text-align:center">Rate</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <div class="footer">
        This report was automatically generated • ${new Date().toLocaleString()}
      </div>
    </body>
    </html>
  `;

  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
  }, 500);
}

// ─── Export Excel (XLSX via CSV with BOM for Excel compat) ───────────────────
// ─── Export Excel (.xlsx via SheetJS) ────────────────────────────────────────
function exportExcel(staff, meta) {
  // Dynamically import to avoid SSR issues
  import("xlsx").then((XLSX) => {

    // ── Build worksheet data ──────────────────────────────────────────────
    const wsData = [
      // Row 1: Report title
      [`Attendance Report — ${meta.startDate} to ${meta.endDate}`],
      // Row 2: Meta info
      [`Total Staff: ${meta.totalStaff}`, "", `Total Days: ${meta.totalDays}`],
      // Row 3: Empty spacer
      [],
      // Row 4: Column headers
      [
        "Name",
        "Roles",
        "Joined",
        "Present Days",
        "Absent Days",
        "Late Days",
        "Half Days",
        "Eligible Days",
        "Attendance Rate %",
      ],
      // Rows 5+: Staff data
      ...staff.map((s) => [
        s.name,
        s.roles.join(" / "),
        s.joinDate || "—",
        s.presentDays,
        s.absentDays,
        s.lateDays,
        s.halfDays,
        s.eligibleDays ?? "—",
        s.attendanceRate,
      ]),
    ];

    // ── Create worksheet ──────────────────────────────────────────────────
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // ── Column widths ─────────────────────────────────────────────────────
    ws["!cols"] = [
      { wch: 24 }, // Name
      { wch: 18 }, // Roles
      { wch: 14 }, // Joined
      { wch: 14 }, // Present Days
      { wch: 13 }, // Absent Days
      { wch: 11 }, // Late Days
      { wch: 12 }, // Half Days
      { wch: 14 }, // Eligible Days
      { wch: 18 }, // Attendance Rate %
    ];

    // ── Merge title cell across all columns ───────────────────────────────
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }, // Title row
      { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } }, // Total staff label
      { s: { r: 1, c: 2 }, e: { r: 1, c: 8 } }, // Total days label
    ];

    // ── Create workbook and append sheet ──────────────────────────────────
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance Report");

    // ── Write and trigger download ────────────────────────────────────────
    XLSX.writeFile(
      wb,
      `attendance-report-${meta.startDate}-to-${meta.endDate}.xlsx`,
    );

  }).catch((err) => {
    console.error("Excel export failed", err);
    alert("Excel export failed. Please try again.");
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AttendanceReports() {
  const router = useRouter();
  const userPermissions = useAuthStore((s) => s.permissions) || [];

  // ── Permission flags for export buttons ───────────────────────────────────
  const canExportPDF   = can(userPermissions, "attendance.report.export_pdf");
  const canExportExcel = can(userPermissions, "attendance.report.export_excel");

  const todayIST = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const firstOfMonth = todayIST.slice(0, 7) + "-01";

  const [startDate, setStartDate]     = useState(firstOfMonth);
  const [endDate, setEndDate]         = useState(todayIST);
  const [calendarFor, setCalendarFor] = useState(null);

  const [staffList, setStaffList]         = useState([]);
  const [selectedStaff, setSelectedStaff] = useState("");
  const [selectedRole, setSelectedRole]   = useState("");
  const [lateOnly, setLateOnly]           = useState(false);
  const [searchQuery, setSearchQuery]     = useState("");

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading]       = useState(false);
  const [generated, setGenerated]   = useState(false);
  const [error, setError]           = useState(null);

  // ── Load staff list ────────────────────────────────────────────────────────
  useEffect(() => {
    fetchStaffListForReport()
      .then(res => setStaffList(res.data || []))
      .catch(() => setStaffList([]));
  }, []);

  // ── Unique roles ───────────────────────────────────────────────────────────
  const allRoles = Array.from(
    new Map(
      staffList.flatMap(s => s.roles).map(r => [r.id, r])
    ).values()
  );

  // ── Generate ───────────────────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!startDate || !endDate) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetchAttendanceReport({
        startDate,
        endDate,
        staffId: selectedStaff || undefined,
        role:    selectedRole  || undefined,
        lateOnly: lateOnly ? "true" : undefined,
      });
      setReportData(res.data);
      setGenerated(true);
    } catch (err) {
      console.error("Report error", err);
      setError("Failed to generate report. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, selectedStaff, selectedRole, lateOnly]);

  // ── Client-side search ─────────────────────────────────────────────────────
  const filteredStaff = (reportData?.staff || []).filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Helpers ────────────────────────────────────────────────────────────────
  const fmtDate = (str) => {
    if (!str) return "";
    return new Date(str + "T00:00:00").toLocaleDateString("en-US", {
      day: "numeric", month: "short", year: "numeric",
    });
  };

  const fmtJoinDate = (str) => {
    if (!str) return null;
    return new Date(str + "T00:00:00").toLocaleDateString("en-US", {
      day: "numeric", month: "short", year: "numeric",
    });
  };

  const joinedMidRange = (joinDate) => {
    if (!joinDate || !startDate) return false;
    return joinDate > startDate;
  };

  return (
    <>
      <style>{`
        @keyframes ar-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes ar-fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        *, *::before, *::after { box-sizing: border-box; }
         

        .ar-outer {
          min-height: 100vh;
          background-color: ${C.bg};
          padding: 20px 16px 60px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .ar-wrap {
          width: 100%;
          max-width: 960px;
          animation: ar-fadeIn .35s ease forwards;
        }

        /* ── Header ── */
        .ar-header {
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          min-height: 44px;
          margin-bottom: 24px;
        }

        .ar-back-btn {
          position: absolute; left: 0;
          display: flex; align-items: center; gap: 5px;
          background-color: ${C.card};
          border: 1px solid ${C.borderGold};
          border-radius: 10px;
          padding: 8px 13px;
          color: ${C.gold};
          font-weight: 600; font-size: 13px;
          cursor: pointer;
          transition: filter .15s;
          white-space: nowrap;
        }
        .ar-back-btn:hover { filter: brightness(1.2); }

        .ar-title {
          color: ${C.white};
          font-size: 18px;
          font-weight: 800;
          margin: 0;
        }

        /* ── Card ── */
        .ar-card {
          background-color: ${C.surface};
          border-radius: 20px;
          border: 1px solid ${C.borderGold};
          padding: 20px;
          margin-bottom: 16px;
        }

        .ar-section-title {
          color: ${C.gold};
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin: 0 0 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* ── Date row ── */
        .ar-date-row {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        .ar-date-btn {
          flex: 1;
          min-width: 140px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          background-color: ${C.card};
          border: 1px solid ${C.borderGold};
          border-radius: 12px;
          padding: 11px 14px;
          color: ${C.white};
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: filter .15s;
        }
        .ar-date-btn:hover { filter: brightness(1.12); }

        .ar-date-sep {
          color: ${C.muted};
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
        }

        /* ── Filter grid ── */
        .ar-filter-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 14px;
        }
        @media (max-width: 500px) {
          .ar-filter-grid { grid-template-columns: 1fr; }
        }

        .ar-select {
          width: 100%;
          background-color: ${C.card};
          border: 1px solid ${C.border};
          border-radius: 12px;
          padding: 11px 14px;
          color: ${C.white};
          font-size: 13px;
          cursor: pointer;
          outline: none;
          appearance: none;
          -webkit-appearance: none;
        }
        .ar-select:focus { border-color: ${C.borderGold}; }

        /* ── Toggle ── */
        .ar-toggle-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background-color: ${C.card};
          border-radius: 12px;
          border: 1px solid ${C.border};
          cursor: pointer;
          transition: border-color .15s;
          margin-bottom: 16px;
        }
        .ar-toggle-row:hover { border-color: ${C.borderGold}; }

        .ar-toggle-track {
          width: 42px; height: 24px;
          border-radius: 12px;
          transition: background .2s;
          position: relative;
          flex-shrink: 0;
        }
        .ar-toggle-thumb {
          position: absolute;
          top: 3px;
          width: 18px; height: 18px;
          border-radius: 50%;
          background: ${C.white};
          transition: left .2s;
          box-shadow: 0 1px 4px rgba(0,0,0,0.4);
        }

        /* ── Generate button ── */
        .ar-generate-btn {
          width: 100%;
          padding: 14px;
          border-radius: 14px;
          border: none;
          background-color: ${C.gold};
          color: #000;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: filter .15s, transform .1s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .ar-generate-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .ar-generate-btn:active { transform: translateY(0); }
        .ar-generate-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        /* ── Summary grid ── */
        .ar-summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 16px;
        }
        @media (max-width: 600px) {
          .ar-summary-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 320px) {
          .ar-summary-grid { grid-template-columns: 1fr; }
        }

        /* ── Search ── */
        .ar-search-wrap {
          position: relative;
          margin-bottom: 14px;
        }
        .ar-search-icon {
          position: absolute;
          left: 12px; top: 50%;
          transform: translateY(-50%);
          color: ${C.muted};
          display: flex;
        }
        .ar-search-input {
          width: 100%;
          background-color: ${C.card};
          border: 1px solid ${C.border};
          border-radius: 12px;
          padding: 10px 12px 10px 36px;
          color: ${C.white};
          font-size: 13px;
          outline: none;
        }
        .ar-search-input:focus { border-color: ${C.borderGold}; }
        .ar-search-input::placeholder { color: ${C.muted}; }

        /* ── Table ── */
        .ar-table-wrap {
          overflow-x: auto;
          border-radius: 14px;
          border: 1px solid ${C.border};
        }

        .ar-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 680px;
        }

        .ar-table th {
          background-color: ${C.card};
          color: ${C.gold};
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          padding: 12px 16px;
          text-align: left;
          white-space: nowrap;
          border-bottom: 1px solid ${C.border};
        }

        .ar-table td {
          padding: 12px 16px;
          border-bottom: 1px solid ${C.border};
          vertical-align: middle;
        }

        .ar-table tr:last-child td { border-bottom: none; }
        .ar-table tr:hover td { background-color: rgba(255,255,255,0.02); }

        /* ── Join date badge ── */
        .ar-join-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin-top: 4px;
          padding: 2px 7px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 600;
          white-space: nowrap;
        }

        /* ── Export bar ── */
        .ar-export-bar {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
        }

        .ar-export-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 9px 16px;
          border-radius: 10px;
          border: 1px solid ${C.borderGold};
          background-color: ${C.card};
          color: ${C.gold};
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: filter .15s, background .15s;
          white-space: nowrap;
        }
        .ar-export-btn:hover { filter: brightness(1.15); }

        .ar-export-btn-pdf {
          border-color: rgba(229,115,115,0.35);
          color: #E57373;
        }
        .ar-export-btn-pdf:hover {
          background-color: rgba(229,115,115,0.08);
        }

        .ar-export-btn-excel {
          border-color: rgba(93,190,138,0.35);
          color: #5DBE8A;
        }
        .ar-export-btn-excel:hover {
          background-color: rgba(93,190,138,0.08);
        }

        /* ── Error ── */
        .ar-error {
          background: rgba(229,115,115,0.1);
          border: 1px solid rgba(229,115,115,0.3);
          border-radius: 12px;
          padding: 12px 16px;
          color: #E57373;
          font-size: 13px;
          margin-bottom: 14px;
        }

        /* ── Empty ── */
        .ar-empty {
          text-align: center;
          padding: 40px 20px;
          color: ${C.muted};
          font-size: 14px;
        }

        /* ── Legend ── */
        .ar-legend {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: ${C.muted};
          margin-bottom: 12px;
          padding: 0 2px;
          flex-wrap: wrap;
        }

        @media (min-width: 640px) {
          .ar-outer { padding: 28px 24px 60px; }
          .ar-title { font-size: 20px; }
          .ar-card  { padding: 24px; }
        }

        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb {
          background: rgba(201,162,39,0.25); border-radius: 4px;
        }
      `}</style>

      {/* ── Calendar modals ── */}
      {calendarFor === "start" && (
        <MiniCalendarPicker
          selectedDate={startDate}
          label="Select Start Date"
          onSelect={(d) => {
            setStartDate(d);
            if (d > endDate) setEndDate(d);
          }}
          onClose={() => setCalendarFor(null)}
        />
      )}
      {calendarFor === "end" && (
        <MiniCalendarPicker
          selectedDate={endDate}
          label="Select End Date"
          onSelect={(d) => {
            setEndDate(d);
            if (d < startDate) setStartDate(d);
          }}
          onClose={() => setCalendarFor(null)}
        />
      )}

      <div className="ar-outer">
        <div className="ar-wrap">

          {/* ── Header ── */}
          <div className="ar-header">
            <button className="ar-back-btn" onClick={() => router.push("/attendance")}>
              <ArrowLeftIcon size={15} />
              <span>Back</span>
            </button>
            <h1 className="ar-title">Attendance Reports</h1>
          </div>

          {/* ── Error ── */}
          {error && <div className="ar-error">{error}</div>}

          {/* ── Filter Card ── */}
          <div className="ar-card">
            <p className="ar-section-title">
              <FilterIcon size={13} />
              Report Filters
            </p>

            {/* Date range */}
            <div style={{ marginBottom: 14 }}>
              <p style={{ color: C.muted, fontSize: 12, margin: "0 0 8px", fontWeight: 500 }}>
                Date Range
              </p>
              <div className="ar-date-row">
                <button className="ar-date-btn" onClick={() => setCalendarFor("start")}>
                  <span style={{ color: startDate ? C.white : C.muted }}>
                    {startDate ? fmtDate(startDate) : "Start Date"}
                  </span>
                  <span style={{ color: C.gold, display: "flex" }}>
                    <CalendarIcon size={14} />
                  </span>
                </button>

                <span className="ar-date-sep">to</span>

                <button className="ar-date-btn" onClick={() => setCalendarFor("end")}>
                  <span style={{ color: endDate ? C.white : C.muted }}>
                    {endDate ? fmtDate(endDate) : "End Date"}
                  </span>
                  <span style={{ color: C.gold, display: "flex" }}>
                    <CalendarIcon size={14} />
                  </span>
                </button>
              </div>
            </div>

            {/* Role + Staff */}
            <div className="ar-filter-grid">
              <div>
                <p style={{ color: C.muted, fontSize: 12, margin: "0 0 8px", fontWeight: 500 }}>
                  Filter by Role
                </p>
                <select
                  className="ar-select"
                  value={selectedRole}
                  onChange={e => { setSelectedRole(e.target.value); setSelectedStaff(""); }}
                >
                  <option value="">All Roles</option>
                  {allRoles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <p style={{ color: C.muted, fontSize: 12, margin: "0 0 8px", fontWeight: 500 }}>
                  Filter by Staff
                </p>
                <select
                  className="ar-select"
                  value={selectedStaff}
                  onChange={e => setSelectedStaff(e.target.value)}
                >
                  <option value="">All Staff</option>
                  {staffList
                    .filter(s => !selectedRole || s.roles.some(r => r.id === selectedRole))
                    .map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
              </div>
            </div>

            {/* Late only toggle */}
            <div className="ar-toggle-row" onClick={() => setLateOnly(v => !v)}>
              <div>
                <p style={{ color: C.white, fontSize: 13, fontWeight: 600, margin: 0 }}>
                  Late Arrivals Only
                </p>
                <p style={{ color: C.muted, fontSize: 12, margin: "2px 0 0" }}>
                  Show only staff with late days
                </p>
              </div>
              <div
                className="ar-toggle-track"
                style={{ backgroundColor: lateOnly ? C.gold : C.faint }}
              >
                <div
                  className="ar-toggle-thumb"
                  style={{ left: lateOnly ? "21px" : "3px" }}
                />
              </div>
            </div>

            {/* Generate */}
            <button
              className="ar-generate-btn"
              onClick={handleGenerate}
              disabled={loading || !startDate || !endDate}
            >
              {loading ? (
                <><Spinner size={16} color="#000" /> Generating…</>
              ) : (
                <><FilterIcon size={14} /> Generate Report</>
              )}
            </button>
          </div>

          {/* ── Results ── */}
          {generated && reportData && !loading && (
            <>
              {/* Meta bar + export buttons */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 10,
                marginBottom: 12,
                padding: "0 4px",
              }}>
                <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>
                  <span style={{ color: C.gold, fontWeight: 700 }}>
                    {reportData.meta.totalStaff}
                  </span>{" "}staff •{" "}
                  <span style={{ color: C.gold, fontWeight: 700 }}>
                    {reportData.meta.totalDays}
                  </span>{" "}days •{" "}
                  {fmtDate(reportData.meta.startDate)} – {fmtDate(reportData.meta.endDate)}
                </p>

                {/* ── Export buttons — permission guarded ── */}
                <div className="ar-export-bar">
                  {/* CSV — always visible if report generated */}
                  <button
                    className="ar-export-btn"
                    onClick={() => exportCSV(reportData.staff, reportData.meta)}
                    title="Export as CSV"
                  >
                    <DownloadIcon size={13} />
                    CSV
                  </button>

                  {/* PDF — needs attendance.report.export_pdf */}
                  {canExportPDF && (
                    <button
                      className="ar-export-btn ar-export-btn-pdf"
                      onClick={() => exportPDF(
                        reportData.staff,
                        reportData.meta,
                        reportData.totals,
                      )}
                      title="Export as PDF"
                    >
                      <FileTextIcon size={13} />
                      PDF
                    </button>
                  )}

                  {/* Excel — needs attendance.report.export_excel */}
                  {canExportExcel && (
                    <button
                      className="ar-export-btn ar-export-btn-excel"
                      onClick={() => exportExcel(reportData.staff, reportData.meta)}
                      title="Export as Excel"
                    >
                      <TableIcon size={13} />
                      Excel
                    </button>
                  )}
                </div>
              </div>

              {/* Summary cards */}
              <div className="ar-summary-grid">
                <SummaryCard
                  label="Total Present"
                  value={reportData.totals.present}
                  bg={C.presentBg} text={C.presentText} border={C.presentBorder}
                />
                <SummaryCard
                  label="Total Absent"
                  value={reportData.totals.absent}
                  bg={C.absentBg} text={C.absentText} border={C.absentBorder}
                />
                <SummaryCard
                  label="Total Late"
                  value={reportData.totals.late}
                  bg={C.lateBg} text={C.lateText} border={C.lateBorder}
                />
                <SummaryCard
                  label="Half Days"
                  value={reportData.totals.halfDay}
                  bg={C.halfBg} text={C.halfText} border={C.halfBorder}
                />
              </div>

              {/* Staff table card */}
              <div className="ar-card" style={{ marginBottom: 0 }}>
                <p className="ar-section-title">
                  <UserIcon size={13} />
                  Per Staff Breakdown
                </p>

                {/* Legend */}
                <div className="ar-legend">
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    padding: "2px 8px", borderRadius: 20,
                    backgroundColor: "rgba(201,162,39,0.10)",
                    border: "1px solid rgba(201,162,39,0.25)",
                    color: C.gold, fontSize: 11, fontWeight: 600,
                  }}>
                    <JoinIcon size={10} /> Joined mid-range
                  </span>
                  <span>= counted only from join date onward</span>
                </div>

                {/* Search */}
                <div className="ar-search-wrap">
                  <span className="ar-search-icon"><SearchIcon size={14} /></span>
                  <input
                    className="ar-search-input"
                    placeholder="Search staff…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>

                {filteredStaff.length === 0 ? (
                  <div className="ar-empty">No staff records found</div>
                ) : (
                  <div className="ar-table-wrap">
                    <table className="ar-table">
                      <thead>
                        <tr>
                          <th>Staff</th>
                          <th style={{ textAlign: "center" }}>Eligible</th>
                          <th style={{ textAlign: "center" }}>Present</th>
                          <th style={{ textAlign: "center" }}>Absent</th>
                          <th style={{ textAlign: "center" }}>Late</th>
                          <th style={{ textAlign: "center" }}>Half Day</th>
                          <th style={{ minWidth: 150 }}>Attendance Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStaff.map(s => {
                          const midRange = joinedMidRange(s.joinDate);
                          const joinLabel = fmtJoinDate(s.joinDate);

                          return (
                            <tr key={s.id}>

                              {/* Staff name + role + join badge */}
                              <td>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                  <div style={{
                                    width: 36, height: 36,
                                    borderRadius: "50%",
                                    backgroundColor: C.faint,
                                    border: `1px solid ${C.borderGold}`,
                                    display: "flex", alignItems: "center",
                                    justifyContent: "center",
                                    color: C.gold, fontWeight: 700,
                                    fontSize: 14, flexShrink: 0,
                                  }}>
                                    {s.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <div style={{ color: C.white, fontWeight: 600, fontSize: 13 }}>
                                      {s.name}
                                    </div>
                                    <div style={{ color: C.muted, fontSize: 11 }}>
                                      {s.roles.join(", ") || "—"}
                                    </div>
                                    {joinLabel && (
                                      <div
                                        className="ar-join-badge"
                                        style={{
                                          backgroundColor: midRange
                                            ? "rgba(201,162,39,0.10)"
                                            : "rgba(120,120,120,0.10)",
                                          border: `1px solid ${midRange
                                            ? "rgba(201,162,39,0.30)"
                                            : "rgba(120,120,120,0.20)"}`,
                                          color: midRange ? C.gold : C.muted,
                                        }}
                                      >
                                        <JoinIcon size={10} />
                                        Joined {joinLabel}
                                        {midRange && (
                                          <span style={{
                                            marginLeft: 3,
                                            backgroundColor: "rgba(201,162,39,0.20)",
                                            borderRadius: 10,
                                            padding: "1px 5px",
                                            fontSize: 9,
                                            fontWeight: 700,
                                            letterSpacing: 0.5,
                                          }}>
                                            MID-RANGE
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Eligible days */}
                              <td style={{ textAlign: "center" }}>
                                <span style={{ color: C.muted, fontSize: 13, fontWeight: 500 }}>
                                  {s.eligibleDays ?? reportData.meta.totalDays}
                                </span>
                              </td>

                              {/* Present — green badge */}
                              <td style={{ textAlign: "center" }}>
                                <CountBadge
                                  value={s.presentDays}
                                  bg={C.presentBg}
                                  text={C.presentText}
                                  border={C.presentBorder}
                                  zeroMuted={false}
                                />
                              </td>

                              {/* Absent — red badge */}
                              <td style={{ textAlign: "center" }}>
                                <CountBadge
                                  value={s.absentDays}
                                  bg={C.absentBg}
                                  text={C.absentText}
                                  border={C.absentBorder}
                                  zeroMuted={true}
                                />
                              </td>

                              {/* Late — yellow badge */}
                              <td style={{ textAlign: "center" }}>
                                <CountBadge
                                  value={s.lateDays}
                                  bg={C.lateBg}
                                  text={C.lateText}
                                  border={C.lateBorder}
                                  zeroMuted={true}
                                />
                              </td>

                              {/* Half Day — orange badge */}
                              <td style={{ textAlign: "center" }}>
                                <CountBadge
                                  value={s.halfDays}
                                  bg={C.halfBg}
                                  text={C.halfText}
                                  border={C.halfBorder}
                                  zeroMuted={true}
                                />
                              </td>

                              {/* Rate bar */}
                              <td style={{ minWidth: 150 }}>
                                <RateBar rate={s.attendanceRate} />
                              </td>

                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Prompt */}
          {!generated && !loading && (
            <div style={{
              textAlign: "center",
              padding: "40px 20px",
              color: C.muted,
              fontSize: 14,
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
              Set your filters above and tap{" "}
              <span style={{ color: C.gold, fontWeight: 700 }}>Generate Report</span>{" "}
              to view results.
            </div>
          )}

        </div>
      </div>
    </>
  );
}