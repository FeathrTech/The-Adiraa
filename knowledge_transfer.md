# 🏨 Banquet ERP — Full Developer Knowledge Transfer

> **Before anything else: The One Layman Analogy**
>
> Imagine you are the **IT architect of a luxury hotel chain** called *The Adiraa*. This hotel has multiple branches (sites/locations), each with its own staff (workers), banquet halls that host weddings & parties (events), and a back-office (admin dashboard). The whole system in this repo is that hotel chain's internal management software — a mobile app in every staff member's pocket and a powerful server brain running it all.
>
> Every concept in this codebase will be explained using this hotel chain metaphor. Keep it in mind as you read.

---

## Table of Contents

1. [The Big Picture](#1-the-big-picture)
2. [Tech Stack](#2-tech-stack)
3. [Environment Variables](#3-environment-variables)
4. [Project Structure Overview](#4-project-structure-overview)
5. [Backend — Deep Dive](#5-backend--deep-dive)
   - [Entry Point](#51-entry-point--maintsts)
   - [App Module (The Orchestrator)](#52-app-module--appmodulets)
   - [Modules](#53-backend-modules)
   - [Common Layer](#54-common-layer)
   - [Cron Jobs](#55-cron-jobs)
6. [Frontend — Deep Dive](#6-frontend--deep-dive)
   - [Entry Point](#61-entry-point--appjs)
   - [Navigation](#62-navigation)
   - [Screens](#63-screens)
   - [API Layer](#64-api-layer)
   - [State Management (Store)](#65-state-management--store)
   - [Config & Utils](#66-config--utils)
7. [Data Flow: A Login to a Check-In](#7-end-to-end-data-flow-example)
8. [Security Architecture](#8-security-architecture)
9. [Permission System](#9-permission-system)
10. [Realtime (WebSockets)](#10-realtime-websockets)
11. [File Storage (Cloudflare R2)](#11-file-storage-cloudflare-r2)
12. [Running the Project](#12-running-the-project)

---

## 1. The Big Picture

```
┌────────────────────────────────────────────────────────┐
│                   HOTEL CHAIN HQ (Cloud)               │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │   BACKEND  (NestJS API — Port 5000)              │  │
│  │   • REST API endpoints for all business logic    │  │
│  │   • Session-based auth (no JWT!)                 │  │
│  │   • Role-Based Access Control (RBAC)             │  │
│  │   • WebSocket gateway for real-time events       │  │
│  │   • Cron jobs (automated reminders)              │  │
│  │   • PostgreSQL via Neon (cloud DB)               │  │
│  │   • Cloudflare R2 (file storage)                 │  │
│  └──────────────────────────────────────────────────┘  │
│                          ▲                             │
│                    HTTP / WebSocket                     │
│                          ▼                             │
│  ┌──────────────────────────────────────────────────┐  │
│  │   FRONTEND (Expo React Native — Mobile App)       │  │
│  │   • Staff logs in, checks in/out                  │  │
│  │   • Admin sees live attendance dashboard          │  │
│  │   • Manages events, staff, roles, venues          │  │
│  │   • Zustand for state, Axios for HTTP             │  │
│  │   • Socket.IO for real-time updates               │  │
│  │   • Push notifications via Expo                   │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

> **Hotel analogy**: The backend is the hotel's main office server room ("HQ"). The frontend app is the walkie-talkie/phone that every hotel employee carries.

---

## 2. Tech Stack

### Backend
| Technology | Version | Role |
|---|---|---|
| **Node.js** | ≥18 | Runtime |
| **NestJS** | v11 | Framework (decorators, DI, modular) |
| **TypeScript** | v5.7 | Type safety |
| **TypeORM** | v0.3 | ORM for database entities |
| **PostgreSQL** | (via Neon cloud) | Primary database |
| **Socket.IO** | v4.8 | WebSocket server for real-time |
| **@nestjs/schedule** | v6 | Cron job runner |
| **bcrypt** | v6 | Password hashing |
| **AWS SDK (S3)** | v3 | Cloudflare R2 file uploads (S3-compatible) |
| **expo-server-sdk** | v6 | Sending push notifications to Expo apps |
| **class-validator** | v0.14 | DTO validation |
| **multer** | v2 | File upload handling |

### Frontend
| Technology | Version | Role |
|---|---|---|
| **React Native** | 0.81.5 | Mobile UI framework |
| **Expo** | ~54 | Build & device API toolchain |
| **React** | 19.1 | UI component model |
| **React Navigation** | v7 | Screen routing |
| **Zustand** | v5 | Global state management |
| **Axios** | v1.13 | HTTP client |
| **Socket.IO Client** | v4.8 | Real-time WebSocket client |
| **NativeWind** | v4 | TailwindCSS styling for React Native |
| **Expo Notifications** | ~0.32 | Push notification receiving |
| **Expo Camera** | v55 | Camera for check-in photos |
| **Expo Location** | v55 | GPS for geofenced check-in |
| **AsyncStorage** | v2.2 | Persistent local storage (like localStorage) |
| **React Native Calendars** | v1.1314 | Calendar UI for events |

> **Hotel analogy**: NestJS is the hotel's PBX phone system (routes calls to the right department). React Native is the brand of walkie-talkies all staff use. Zustand is the short-term memory of each walkie-talkie (remembers who is logged in).

---

## 3. Environment Variables

### [backend/.env](file:///d:/banquet-erp/backend/.env)

```env
DATABASE_URL=postgresql://...@neon.tech/neondb   # Cloud Postgres connection string (Neon)
SESSION_DURATION_DAYS=90                          # How long a login session stays valid
PORT=5000                                         # The port the backend HTTP server listens on
R2_ENDPOINT=https://...r2.cloudflarestorage.com  # Cloudflare R2 storage endpoint
R2_ACCESS_KEY=...                                 # R2 access key (like AWS_ACCESS_KEY_ID)
R2_SECRET_KEY=...                                 # R2 secret key (like AWS_SECRET_ACCESS_KEY)
R2_BUCKET=staff-storage                           # The "folder" (bucket) where files are stored
R2_PUBLIC_URL=https://pub-....r2.dev             # Public CDN URL for reading files
```

> **Hotel analogy**: `DATABASE_URL` is the address of the hotel's central filing cabinet (database). `R2_*` variables are the address and keys to the hotel's photo archive room (for staff ID photos, documents).

### Frontend Base URL

The frontend has **no [.env](file:///d:/banquet-erp/backend/.env) file**. The API address is hardcoded in two files:

- [frontend/src/api/axios.js](file:///d:/banquet-erp/frontend/src/api/axios.js) → `baseURL: "http://192.168.29.223:5000"`
- [frontend/src/utils/socket.js](file:///d:/banquet-erp/frontend/src/utils/socket.js) → `io("http://192.168.29.223:5000")`

> ⚠️ **IMPORTANT FOR DEVELOPERS**: When changing machines or networks, you **must update both these files** with the new local IP address of the machine running the backend.

---

## 4. Project Structure Overview

```
banquet-erp/
├── backend/                    ← NestJS API server
│   ├── src/
│   │   ├── main.ts             ← Server bootstrap
│   │   ├── app.module.ts       ← Root module, wires everything together
│   │   ├── modules/            ← Business logic modules (12 total)
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── roles/
│   │   │   ├── permissions/
│   │   │   ├── sessions/
│   │   │   ├── tenant/
│   │   │   ├── location/
│   │   │   ├── attendance/
│   │   │   ├── events/
│   │   │   ├── hall/
│   │   │   ├── settings/
│   │   │   └── audit/
│   │   ├── common/             ← Shared cross-cutting code
│   │   │   ├── guards/         ← Auth & permission checkers
│   │   │   ├── interceptors/   ← Audit logger
│   │   │   ├── decorators/     ← Custom annotations
│   │   │   ├── realtime/       ← WebSocket gateway
│   │   │   ├── base/           ← Base entity classes
│   │   │   ├── types/          ← Shared TypeScript types
│   │   │   └── utils/          ← Utility functions
│   │   └── cron/               ← Scheduled background jobs
│   ├── .env                    ← Environment config
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/                   ← Expo React Native mobile app
    ├── App.js                  ← App entry point (push notification setup)
    ├── index.js                ← Expo entry (registers App component)
    ├── app.json                ← Expo project config (projectId, app name, etc.)
    ├── global.css              ← NativeWind (TailwindCSS) base import
    ├── src/
    │   ├── api/                ← All HTTP calls to backend
    │   ├── components/         ← Reusable UI components
    │   ├── config/             ← Permission map (RBAC rules)
    │   ├── hooks/              ← Custom React hooks
    │   ├── navigation/         ← React Navigation stack definitions
    │   ├── screens/            ← Feature screens (UI pages)
    │   ├── store/              ← Zustand global state
    │   └── utils/              ← Helper utilities
    ├── package.json
    └── tailwind.config.js
```

---

## 5. Backend — Deep Dive

### 5.1 Entry Point — [main.ts](file:///d:/banquet-erp/backend/src/main.ts)

**What it does**: Boots the NestJS application, sets the port from the [.env](file:///d:/banquet-erp/backend/.env) file.

```typescript
// Simplified view
const app = await NestFactory.create(AppModule);
await app.listen(process.env.PORT ?? 3000);
```

> **Hotel analogy**: This is the hotel's front-door key turning moment — when the hotel opens for business each morning.

---

### 5.2 App Module — [app.module.ts](file:///d:/banquet-erp/backend/src/app.module.ts)

This is the **most important file** in the backend. It wires the entire system together. Think of it as the hotel's org chart and startup checklist combined.

**What it does** (in order):

1. **Loads environment variables** (`ConfigModule.forRoot`)
2. **Enables cron jobs** (`ScheduleModule.forRoot`)
3. **Connects to PostgreSQL** (`TypeOrmModule.forRoot`) — registers all 13 entities as database tables
4. **Registers all 11 feature modules**
5. **Applies global guards**:
   - [SessionGuard](file:///d:/banquet-erp/backend/src/common/guards/session.guard.ts#15-88) → every request must have a valid session token
   - `PermissionGuard` → every request must have the required permission
6. **Applies global interceptor**: [AuditInterceptor](file:///d:/banquet-erp/backend/src/common/interceptors/audit.interceptor.ts#15-64) → logs every action to the `audit_logs` table
7. **Provides RealtimeGateway** for WebSocket connections
8. **On startup ([onModuleInit](file:///d:/banquet-erp/backend/src/app.module.ts#105-186))**: seeds the database if empty:
   - Creates all permissions
   - Creates a "Default Tenant"
   - Creates an "Owner" role with all permissions
   - Creates a test owner user (`9999999999` / `123456`)

> **Hotel analogy**: The App Module is the hotel's opening checklist. On Day 1 (first run), it creates the hotel, hires the general manager (Owner role), registers all available duties (permissions), and gives the manager all keys.

---

### 5.3 Backend Modules

Each module follows the **same pattern**: `entity.ts → service.ts → controller.ts → module.ts`

- **Entity** = the database table definition (columns, relationships)
- **Service** = the business logic (what the app actually *does*)
- **Controller** = the HTTP endpoints (URLs the frontend calls)
- **Module** = tells NestJS which pieces belong together

---

#### `modules/tenant/`
**Only file**: [tenant.entity.ts](file:///d:/banquet-erp/backend/src/modules/tenant/tenant.entity.ts)

A **Tenant** represents one hotel company/franchise using the system. All data (users, events, locations) belongs to a specific tenant. This is the **top-level isolation unit**.

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | string | e.g. "The Adiraa Hotels" |
| `slug` | string (unique) | URL-friendly ID (e.g. `adiraa`) |

> **Hotel analogy**: A Tenant is one franchise owner. If "The Adiraa" and "Royal Palace Banquets" both use this app, they are two separate tenants — they never see each other's data.

---

#### `modules/location/`
Files: [location.entity.ts](file:///d:/banquet-erp/backend/src/modules/location/location.entity.ts), [location.service.ts](file:///d:/banquet-erp/backend/src/modules/location/location.service.ts), [location.controller.ts](file:///d:/banquet-erp/backend/src/modules/location/location.controller.ts), [location.module.ts](file:///d:/banquet-erp/backend/src/modules/location/location.module.ts)

A **Location** (also called Site/Venue in the frontend) is a physical branch of the hotel.

Key entity fields:
- `name` — branch name (e.g. "MG Road Branch")
- `address`, `latitude`, `longitude` — geo coordinates for geofenced check-in
- `tenant` → belongs to a Tenant
- `users` → staff assigned to this location
- `halls` → the banquet halls physically inside this location

> **Hotel analogy**: A Location is one hotel property/branch. The MG Road branch is a Location. The Koramangala branch is another Location. One company (Tenant) can own many Locations.

**Controller endpoints** (`/locations`):
- `GET /locations` → list all locations for the current tenant
- `POST /locations` → create a new location
- `PATCH /locations/:id` → update a location
- `DELETE /locations/:id` → delete a location

---

#### `modules/hall/`
Files: [hall.entity.ts](file:///d:/banquet-erp/backend/src/modules/hall/hall.entity.ts), [hall.service.ts](file:///d:/banquet-erp/backend/src/modules/hall/hall.service.ts), [hall.controller.ts](file:///d:/banquet-erp/backend/src/modules/hall/hall.controller.ts), [hall.module.ts](file:///d:/banquet-erp/backend/src/modules/hall/hall.module.ts)

A **Hall** is a physical banquet hall inside a Location.

Key entity fields:
- `name` → the hall's name (e.g. "Crystal Hall")
- `capacity` → number of guests it can hold
- `location` → the Location it belongs to
- `tenant` → the Tenant

> **Hotel analogy**: If the MG Road Branch (Location) has three halls — Crystal Hall, Royal Suite, and Garden Terrace — those are three Hall records.

**Controller endpoints** (`/halls`):
- `GET /halls` → list all halls for the tenant
- `POST /halls` → create a hall
- `PATCH /halls/:id` → update a hall
- `DELETE /halls/:id` → delete a hall

---

#### `modules/permissions/`
Files: `permission.entity.ts`, `permission.seed.ts`, + module

A **Permission** is a single atomic right in the system (e.g. `attendance.checkin`, `role.create`).

Key entity fields:
- `key` → the unique string identifier (e.g. `"event.delete"`)
- `label` → human-readable name

Permissions are **seeded** from `permission.seed.ts` on first startup. They are never CRUD'd by users — only by the system.

> **Hotel analogy**: Permissions are like hotel access keys. `attendance.checkin` is the key that opens the staff entrance gate. `event.create` is the key to the event booking office. These keys are pre-cut by the system — no one creates new types of keys, they just assign existing ones.

---

#### `modules/roles/`
Files: `role.entity.ts`, `roles.service.ts`, `roles.controller.ts`, `roles.module.ts`

A **Role** is a named collection of permissions assigned to users. Think "job title".

Key entity fields:
- `name` → e.g. "Waiter", "Event Manager", "Owner"
- `tenant` → belongs to a Tenant
- `permissions` → ManyToMany with Permission
- `users` → ManyToMany with User

> **Hotel analogy**: A Role is a job description. "Waiter" role has keys for: check-in, check-out, view own attendance. "Manager" role has all the waiter keys PLUS: view all staff, edit records, view reports.

**Controller endpoints** (`/roles`):
- `GET /roles` → list all roles for the tenant
- `POST /roles` → create a role with selected permissions
- `PATCH /roles/:id` → update role or its permissions
- `DELETE /roles/:id` → delete a role

---

#### `modules/users/`
Files: [user.entity.ts](file:///d:/banquet-erp/backend/src/modules/users/user.entity.ts), [department.entity.ts](file:///d:/banquet-erp/backend/src/modules/users/department.entity.ts), [shift.entity.ts](file:///d:/banquet-erp/backend/src/modules/users/shift.entity.ts), [users.service.ts](file:///d:/banquet-erp/backend/src/modules/users/users.service.ts), [users.controller.ts](file:///d:/banquet-erp/backend/src/modules/users/users.controller.ts), [users.module.ts](file:///d:/banquet-erp/backend/src/modules/users/users.module.ts)

The **User** is a staff member or admin of the hotel.

Key entity fields (from [user.entity.ts](file:///d:/banquet-erp/backend/src/modules/users/user.entity.ts)):
| Column | Description |
|---|---|
| `username` | Globally unique login ID (format: `john@tenantslug`) |
| `mobile` | Unique per tenant |
| `password` | bcrypt hashed |
| `isActive` | Whether user can log in |
| `profilePhotoUrl` | URL to Cloudflare R2 photo |
| `idProofUrl` | URL to ID document in R2 |
| `shiftStartTime` / `shiftEndTime` | Work shift (e.g. `"09:00"`, `"17:00"`) |
| `pushToken` | Expo push notification token (for checkout reminders) |
| `tenant` | → belongs to Tenant |
| `location` | → assigned to a Location |
| `roles` | → ManyToMany with Role |
| `deletedAt` | Soft-delete (user is never truly removed from DB) |

The **Department** and **Shift** entities are supplementary — used to group users and track their work schedule.

> **Hotel analogy**: A User is an individual hotel staff member (e.g. "Ravi Kumar, waiter at MG Road branch, works 9am–5pm, has the Waiter role").

**Key service methods** in [users.service.ts](file:///d:/banquet-erp/backend/src/modules/users/users.service.ts) (11KB):
- `create()` → validates, hashes password, auto-generates username, saves to DB
- `findAll()` → paginated list with filters for tenant/location
- `update()` → edit details, reassign roles, upload photos/docs
- `softDelete()` → marks `deletedAt`, hides from lists but keeps DB record
- `updatePushToken()` → saves the Expo push token after login

**Controller endpoints** (`/users`):
- `POST /users` → create staff
- `GET /users` → list staff (paginated)
- `GET /users/:id` → get one staff member
- `PATCH /users/:id` → update staff
- `DELETE /users/:id` → soft-delete staff
- `PATCH /users/me/push-token` → update logged-in user's push token

---

#### `modules/sessions/`
Files: `session.entity.ts` + module

A **Session** is a login record. When a user logs in, a session is created and a raw token is given to the app.

Key entity fields:
- `tokenHash` → SHA-256 hash of the raw token (the plain token is never stored in DB!)
- `user` → who this session belongs to
- `expiresAt` → when it expires (default 90 days, sliding)
- `lastActiveAt` → last time this session was used
- `revoked` → if `true`, the session is invalidated (force logout)
- `deviceInfo` → device name/platform

> **Hotel analogy**: A Session is a hotel guest key card. When a staff member logs in, they get a key card (token). The hotel keeps a record of which key cards are active. If a manager wants to kick someone out, they mark the key card as revoked (`revoked: true`).

---

#### `modules/auth/`
Files: [auth.service.ts](file:///d:/banquet-erp/backend/src/modules/auth/auth.service.ts), [auth.controller.ts](file:///d:/banquet-erp/backend/src/modules/auth/auth.controller.ts), `dto/` + module

This module handles **login** and **logout**.

**[auth.service.ts](file:///d:/banquet-erp/backend/src/modules/auth/auth.service.ts)** key logic:
1. Finds user by `username` in the database
2. Verifies password with `bcrypt.compare()`
3. Generates a random token (e.g. UUID or random bytes)
4. Hashes the token with SHA-256 using `hashToken()` util
5. Saves the token hash to the `sessions` table
6. Returns the **raw token** to the frontend (frontend stores it in AsyncStorage)

**[auth.controller.ts](file:///d:/banquet-erp/backend/src/modules/auth/auth.controller.ts)** endpoints:
- `POST /auth/login` → `{ username, password }` → returns `{ user, token }`
- `POST /auth/logout` → invalidates current session

> **Hotel analogy**: auth.service is the hotel's front desk receptionist. Staff member comes, shows ID (username + password), receptionist verifies, hands over a key card (the raw token). The front desk keeps only a record number (hash), not a copy of the key card itself.

---

#### `modules/attendance/`
Files: [attendance.entity.ts](file:///d:/banquet-erp/backend/src/modules/attendance/attendance.entity.ts), [attendance-config.entity.ts](file:///d:/banquet-erp/backend/src/modules/attendance/attendance-config.entity.ts), [attendance.service.ts](file:///d:/banquet-erp/backend/src/modules/attendance/attendance.service.ts) (18KB!), [attendance-config.service.ts](file:///d:/banquet-erp/backend/src/modules/attendance/attendance-config.service.ts), [attendance.controller.ts](file:///d:/banquet-erp/backend/src/modules/attendance/attendance.controller.ts), [attendance-config.controller.ts](file:///d:/banquet-erp/backend/src/modules/attendance/attendance-config.controller.ts), [attendance.module.ts](file:///d:/banquet-erp/backend/src/modules/attendance/attendance.module.ts)

This is the **largest and most complex module**. It manages staff check-in/check-out.

**[attendance.entity.ts](file:///d:/banquet-erp/backend/src/modules/attendance/attendance.entity.ts)** key fields:
| Column | Description |
|---|---|
| `attendanceDate` | The working date (YYYY-MM-DD) |
| `checkInTime` | Timestamp of check-in |
| `checkOutTime` | Timestamp of check-out |
| `checkInPhotoUrl` | Selfie photo taken at check-in (stored in R2) |
| `checkOutPhotoUrl` | Selfie photo taken at check-out (stored in R2) |
| `checkInLatitude/Longitude` | GPS location at check-in |
| `checkOutLatitude/Longitude` | GPS location at check-out |
| `status` | `present`, `absent`, `half-day`, `late` |
| `isLate` | Was the check-in after the allowed grace time? |
| `isHalfDay` | Checked in or out too early/late |
| `manuallyMarked` | Was this marked by an admin (override)? |
| `user` | → Who checked in |
| `tenant` | → Which company |

**[attendance-config.entity.ts](file:///d:/banquet-erp/backend/src/modules/attendance/attendance-config.entity.ts)** — per-role attendance rules:
- `checkInStart`, `checkInEnd` — the allowed check-in window
- `gracePeriodMinutes` — how many minutes late before `isLate` is flagged
- `geoRadius` — maximum allowed distance from venue (in meters)
- `photoRequired` — whether a selfie is mandatory
- `checkoutReminder1`, `checkoutReminder2` — times (HH:MM) to send "don't forget to check out" push notifications

> **Hotel analogy**: Attendance is the hotel's punch-card machine. When a waiter arrives, they scan in (check-in with selfie + GPS). When they leave, they scan out. The config tells the machine: "Waiters should arrive between 8:45am–9:15am. If they come after 9:15, flag as late. They must be within 200 meters of the hotel. Remind them to check out at 5:30pm."

**Key service methods** in [attendance.service.ts](file:///d:/banquet-erp/backend/src/modules/attendance/attendance.service.ts):
- `checkIn()` → validates geofence, time window, takes selfie URL, creates Attendance record
- `checkOut()` → updates existing record with check-out data, calculates half-day
- `getAdminDashboardSummary()` → present, absent, late counts for today
- `getLiveAttendance()` → who is currently checked in right now
- `getStaffHistory()` → calendar view of a staff member's past attendance
- `editRecord()` → admin overrides an existing attendance record
- `manualMark()` → admin manually marks someone present/absent

---

#### `modules/events/`
Files: [event.entity.ts](file:///d:/banquet-erp/backend/src/modules/events/event.entity.ts), [event.service.ts](file:///d:/banquet-erp/backend/src/modules/events/event.service.ts), [event.controller.ts](file:///d:/banquet-erp/backend/src/modules/events/event.controller.ts), [events.module.ts](file:///d:/banquet-erp/backend/src/modules/events/events.module.ts)

An **Event** is a booked banquet function (wedding, party, corporate event).

**[event.entity.ts](file:///d:/banquet-erp/backend/src/modules/events/event.entity.ts)** key fields:
| Column | Description |
|---|---|
| `title` | Event name (e.g. "Sharma Wedding") |
| `clientName` | The client who booked |
| `clientPhone` | Contact |
| `eventDate` | The date of the event |
| `startTime` / `endTime` | Time slot |
| `hall` | → Which Hall is booked |
| `location` | → Which branch |
| `tenant` | → Which company |
| `status` | `upcoming`, `ongoing`, `completed`, `cancelled` |
| `totalAmount` / `advanceAmount` | Billing details |
| `guestCount` | Number of guests expected |
| `notes` | Extra notes |

**Controller endpoints** (`/events`):
- `GET /events` → list events (filterable by date, status)
- `POST /events` → create an event
- `PATCH /events/:id` → update event details
- `DELETE /events/:id` → cancel/delete event

> **Hotel analogy**: An Event is a booking in the hotel's reservation book. "Sharma Wedding on March 20 in Crystal Hall, 200 guests, ₹5L total booking."

---

#### `modules/settings/`
Files: `setting.entity.ts` + module

A **Setting** is a key-value store for tenant-level configuration options. Used for things like notification preferences, security policies.

> **Hotel analogy**: Settings are the hotel's policy manual entries. "Allow late check-in? Yes." "Require photo for attendance? Yes."

---

#### `modules/audit/`
Files: `audit-log.entity.ts`, `audit.service.ts`, `audit.controller.ts` + module

Every meaningful action in the app (creating a user, editing attendance, deleting a role) is recorded as an **AuditLog** entry.

**`audit-log.entity.ts`** fields:
- `module` → which area was affected (e.g. `"users"`, `"attendance"`)
- `action` → what happened (e.g. `"create"`, `"delete"`)
- `actor` → the User who did it
- `targetId` → the ID of the affected record

> **Hotel analogy**: The Audit log is the hotel's CCTV system combined with a logbook. Every time a manager does something (fires an employee, changes a booking), it's recorded: who, what, when.

---

### 5.4 Common Layer

Located at `backend/src/common/`, this is the shared infrastructure that every module uses.

#### `common/guards/session.guard.ts`
**Applied globally** to every endpoint by default.

What it does when a request arrives:
1. Checks if the route is marked `@Public()` — if yes, lets it through immediately
2. Reads the `Authorization: Bearer <token>` header
3. SHA-256 hashes the token
4. Looks up the hash in the `sessions` table
5. Checks the session isn't expired or revoked
6. Implements **sliding session**: if the user was active more than 1 hour ago, extends the expiry by 90 more days
7. Attaches `req.user` and `req.tenantId` to the request for downstream use

> **Hotel analogy**: The Session Guard is the security guard at every door in the hotel. You show your key card (token), the guard checks the system. If the card is valid and not expired, you get in and the guard updates your expiry. If invalid, you're turned away.

#### `common/guards/permission.guard.ts`
Checks `@RequirePermission('permission.key')` on routes. If the logged-in user doesn't have that permission key in their roles, the request is rejected with `403 Forbidden`.

> **Hotel analogy**: Even after passing the security guard, some doors need special clearance. The Permission Guard checks if your key card has the "Event Office Access" badge on it before opening the Event Management door.

#### `common/interceptors/audit.interceptor.ts`
Runs **after** every request completes. If the controller method has `@Audit({ module: 'users', action: 'create' })`, the interceptor records the action to the `audit_logs` table.

> **Hotel analogy**: The CCTV recorder that automatically saves a clip every time a door with a camera is opened.

#### `common/decorators/`
| Decorator | Purpose | Usage |
|---|---|---|
| `@Public()` | Bypasses `SessionGuard` | Login, Signup routes |
| `@CurrentUser()` | Extracts `req.user` into a param | `getProfile(@CurrentUser() user)` |
| `@RequirePermission('key')` | Requires a specific permission | `@RequirePermission('event.create')` |
| `@Audit({ module, action })` | Marks a method for audit logging | `@Audit({ module: 'events', action: 'create' })` |

#### `common/realtime/realtime.gateway.ts`
A Socket.IO server gateway. Listens for WebSocket connections from the app and can emit real-time events (e.g. when someone checks in, all admin screens listening get a live update instantly).

> **Hotel analogy**: The hotel's intercom/radio system. When a waiter clocks in at the MG Road branch, the manager's radio instantly buzzes with "Ravi Kumar just checked in."

---

### 5.5 Cron Jobs

Located at `backend/src/cron/`:

#### `checkout-reminder.cron.ts`
Marked with `@Cron('* * * * *')` → runs **every minute**.

What it does each minute:
1. Gets the current IST time in `HH:MM` format
2. Fetches all `AttendanceConfig` records
3. For each config, checks if current time matches `checkoutReminder1` or `checkoutReminder2`
4. If it matches: finds all staff of that role who are **checked in** but **not yet checked out** today
5. Gets their Expo push tokens from the `users` table
6. Sends a "Don't forget to check out" push notification to all of them

#### `notification.service.ts`
Wraps the `expo-server-sdk` to send push notifications. Called by the cron job.

> **Hotel analogy**: An automated PA announcement system. Every day at 5:30pm: *"Attention all waiters — please clock out before leaving!"*

---

## 6. Frontend — Deep Dive

### 6.1 Entry Point — `App.js`

The root component of the entire React Native app. It does two things:
1. **Sets up push notification handler** (what to show when a notification arrives while the app is open)
2. **Requests push notification permissions** from the device
3. Renders `<MainNavigator />` which is the entire app

`index.js` simply imports `App.js` and registers it with Expo's `registerRootComponent`.

> **Hotel analogy**: `App.js` is the hotel's main lobby. The moment staff open the app, they are greeted here, and the lobby connects them to everything else.

---

### 6.2 Navigation

Located at `frontend/src/navigation/`. Built with React Navigation v7 (Native Stack).

#### `MainNavigator.js` — The Master Navigator
This is the top-level router. Its logic:
1. On mount, calls `restoreSession()` from `authStore` (checks if user is still logged in)
2. Shows `SplashScreen` with a smooth fade-out (minimum 4.2 seconds)
3. After session check:
   - **No user** → shows `<AuthStack />` (login/signup screens)
   - **User logged in** → shows the main app stack

**Main App Stack screens**:
| Screen Name | Component | Purpose |
|---|---|---|
| `Dashboard` | `DashboardRouter` | Entry dashboard (routes admin vs. staff) |
| `Attendance` | `AttendanceStack` | Attendance flow |
| `Venue` | `SiteStack` | Location/venue management screens |
| `Staff` | `StaffStack` | Staff management screens |
| `Roles` | `RoleStack` | Role management screens |
| `Settings` | `SettingsScreen` | Settings page |
| `AttendanceConfig` | `AttendanceConfigScreen` | Attendance config editor |

`<GlobalLoader />` is rendered outside navigation so it appears on top of any screen.

> **Hotel analogy**: `MainNavigator` is the hotel's reception/switchboard. It first checks if you have a valid room key (session). If yes, it connects you to different wings of the hotel. If not, it directs you to the front desk (login screen).

#### `AuthStack.js`
Simple stack with `LoginScreen` and `SignUpScreen`. No auth required.

#### `AttendanceStack.js`
Navigator for all attendance-related screens: check-in, check-out, live monitor, admin dashboard, staff history.

#### `StaffStack.js`
Navigator for: Staff List → Staff Detail → Create Staff → Edit Staff

#### `SiteStack.js`
Navigator for: Venue List → Venue Details → Edit Venue

#### `RoleStack.js`
Navigator for: Role List → Create Role → Edit Role

---

### 6.3 Screens

Located at `frontend/src/screens/`, organized by feature.

#### `screens/splash/SplashScreen.js`
The animated loading screen shown while the app checks if the user is logged in.

#### `screens/auth/`
| File | Purpose |
|---|---|
| `LoginScreen.js` | Username + password form. Calls `POST /auth/login`. On success, stores token in `authStore`. |
| `SignUpScreen.js` | New tenant/user registration form |

> **Hotel analogy**: LoginScreen is the front desk where staff swipe their ID to get a key card each shift.

#### `screens/dashboard/`
| File | Purpose |
|---|---|
| `DashboardRouter.js` | Checks user permissions. If admin → shows `DashboardScreen`. If staff-only → shows `StaffDashboard`. |
| `DashboardScreen.js` | Admin dashboard. Shows KPI tiles: Present, Absent, Late. Quick access to all management areas. |
| `StaffDashboard.js` | Staff-only view. Shows today's check-in status, quick check-in/out button, upcoming events. |

> **Hotel analogy**: `DashboardRouter` is like having a key card that unlocks either the Manager's Office or the Staff Lounge, depending on your role.

#### `screens/attendance/`
This is the most feature-rich screen group (6 screens).

| File | Size | Purpose |
|---|---|---|
| `CheckInScreen.js` | 30KB | GPS verification + selfie camera + POST to backend |
| `CheckOutScreen.js` | 35KB | Same as check-in but for check-out |
| `AdminAttendanceDashboard.js` | 13KB | Admin KPI view — present/absent/late counts with filters |
| `LiveAttendanceMonitoringScreen.js` | 24KB | Real-time list of checked-in staff, updates via WebSocket |
| `StaffAttendanceHistory.js` | 34KB | Staff's personal attendance calendar and record history |
| `EditAttendanceRecordScreen.js` | 8KB | Admin form to override/edit an attendance record |

**Check-In Flow** (how `CheckInScreen.js` works):
1. User opens the screen → app fetches their shift config and today's record
2. App requests **GPS location** and **camera permission**
3. User takes a **selfie**
4. App verifies they are within the allowed geo-radius of their assigned location
5. App uploads selfie to backend, which stores it in **Cloudflare R2**
6. API call: `POST /attendance/checkin`
7. Backend validates shift time window, geo, creates attendance record
8. Success → app navigates to dashboard

> **Hotel analogy**: Checking in is like a waiter arriving at the hotel, standing at the staff entrance (within the geo-radius), taking a selfie with the intercom camera, and pressing the check-in button. The security system verifies their face, location, and logs the time.

#### `screens/events/`
| File | Purpose |
|---|---|
| `EventCalendarScreen.js` | Calendar view showing all booked events. Tap a day to see events. |
| `EventFormScreen.js` | Create or edit a banquet event (client name, date, hall, amount, etc.) |

> **Hotel analogy**: The event calendar is the hotel's booking diary. You can flip through months and see which halls are booked, and for what. The form is the booking registration desk.

#### `screens/venue/`
| File | Purpose |
|---|---|
| `VenueScreen.js` | List of all locations/sites |
| `VenueDetailsScreen.js` | Details of one location: its halls, staff, location on map |
| `EditVenueScreen.js` | Edit venue details (address, coordinates, etc.) |

#### `screens/staff/`
| File | Purpose |
|---|---|
| `StaffListScreen.js` | List of all staff with search/filter |
| `StaffDetailScreen.js` (37KB!) | Full profile view: photo, ID, attendance history, roles |
| `CreateStaffScreen.js` | Registration form for a new employee |
| `EditStaffScreen.js` | Edit existing employee details |

#### `screens/roles/`
| File | Purpose |
|---|---|
| `RoleListScreen.js` | List of all roles in the organization |
| `CreateRoleScreen.js` | Create a role and tick the permissions to assign |
| `EditRoleScreen.js` | Edit a role's name or permissions |

> **Hotel analogy**: The Roles screens are the HR department's internal system for defining job descriptions and which departments (permissions) each job title has access to.

#### `screens/settings/`
| File | Purpose |
|---|---|
| `SettingsScreen.js` | Main settings page with links to subsections |
| `AttendanceConfigScreen.js` | Edit per-role attendance rules: time windows, grace periods, geo radius, photo requirements, reminder times |

---

### 6.4 API Layer

Located at `frontend/src/api/`. All HTTP calls to the backend are organized here. Uses the shared `axios.js` instance.

#### `axios.js` — The Base HTTP Client
Creates a single `axios` instance with:
- `baseURL`: the backend IP + port
- `timeout`: 10 seconds (request fails if no response in 10s)
- `Content-Type: application/json` header

The auth token is injected into this instance by `setAuthToken.js` after login.

> **Hotel analogy**: `axios.js` is the hotel's telephone exchange. All departments use the same telephone system to call HQ. `setAuthToken` is like dialing the extension automatically when you pick up the phone.

#### API Files and Their Endpoints:

| File | Backend Routes Covered |
|---|---|
| `authApi.js` | `POST /auth/login`, `POST /auth/logout` |
| `userApi.js` | `GET /users/me`, `PATCH /users/me/push-token` |
| `attendanceApi.js` | `POST /attendance/checkin`, `POST /attendance/checkout`, `GET /attendance/...` |
| `eventsApi.js` | `GET /events`, `POST /events`, `PATCH /events/:id`, `DELETE /events/:id` |
| `hallApi.js` | `GET /halls`, `POST /halls`, `PATCH /halls/:id`, `DELETE /halls/:id` |
| `siteApi.js` | `GET /locations`, `POST /locations`, `PATCH /locations/:id`, `DELETE /locations/:id` |
| `roleApi.js` | `GET /roles`, `POST /roles`, `PATCH /roles/:id`, `DELETE /roles/:id` |
| `permissionApi.js` | `GET /permissions` |

---

### 6.5 State Management — Store

Located at `frontend/src/store/`. Uses **Zustand** v5 — a minimal, hook-based state manager.

> **What is Zustand?** Think of it as a global variable that React components can subscribe to. When the value changes, all subscribed screens automatically re-render. No prop-drilling needed.

#### `authStore.js` — The Most Critical Store

State held:
```javascript
{
  user: null | User,          // The logged-in user object (with roles, permissions, tenant)
  token: null | string,       // The raw session token
  permissions: string[],      // Flat array of all permission keys (e.g. ["attendance.checkin", "role.create"])
  loading: boolean,           // True while restoring session on app open
}
```

Actions:
| Action | What it does |
|---|---|
| `login(user, token)` | Saves to AsyncStorage, sets auth header, updates state, registers push token |
| `logout()` | Clears AsyncStorage, removes auth header, wipes state |
| `restoreSession()` | On app open: reads token from AsyncStorage, rebuilds state without hitting the server |

`extractPermissions()` is a helper that flattens `user.roles[].permissions[].key` into a simple string array.

> **Hotel analogy**: `authStore` is the staff member's personal locker combination. It remembers: who you are, your key card (token), and which rooms you have access to (permissions). Even when you close and reopen the app, it checks the locker and remembers you.

#### `siteStore.js`
Holds the currently selected `siteId` (Location). Used to filter attendance and event data to the active branch.

#### `uiStore.js`
Controls the global loading spinner state (`isLoading: boolean`). When any API call is in progress, `isLoading` is set to `true` and `GlobalLoader` renders a full-screen spinner.

---

### 6.6 Config & Utils

#### `src/config/permissionMap.js` — The Permission Bible

This is the frontend's RBAC definition file. It exports:

| Export | Purpose |
|---|---|
| `SCREEN_PERMISSIONS` | Simple map: screen name → required permission keys |
| `ACTION_PERMISSIONS` | Semantic names → permission keys (for use in JSX: `ACTION_PERMISSIONS.role.create`) |
| `SCREEN_ACCESS` | Advanced rules: `{ allOf: [] }` or `{ anyOf: [] }` for complex permission logic |
| `PERMISSION_GROUPS` | Groups permissions by category for the Role creation UI (checkboxes) |
| `canAccessScreen(permissions, rule)` | Evaluates a SCREEN_ACCESS rule against a user's permissions |
| `can(permissions, key)` | Simple single-permission check |

**Example usage**:
```javascript
import { can, ACTION_PERMISSIONS } from '../config/permissionMap';
import { useAuthStore } from '../store/authStore';

const permissions = useAuthStore(s => s.permissions);

// Should the "Delete Role" button show?
if (can(permissions, ACTION_PERMISSIONS.role.delete)) {
  // Show the delete button
}
```

> **Hotel analogy**: `permissionMap.js` is the hotel's access control matrix printed out as a poster. It shows: "To enter the Event Office, you need badge X or Y. To delete a booking, you need badge Z."

#### `src/utils/setAuthToken.js`
Sets or removes the `Authorization: Bearer <token>` header on the axios instance.

```javascript
api.defaults.headers.common['Authorization'] = token ? `Bearer ${token}` : '';
```

Called on login, logout, and session restore.

#### `src/utils/socket.js`
Creates and exports a single **Socket.IO client instance** connected to the backend. Used by screens that need real-time updates (e.g. `LiveAttendanceMonitoringScreen`).

#### `src/hooks/useRealtime.js`
A custom React hook that subscribes to specific Socket.IO events and triggers callbacks.

---

## 7. End-to-End Data Flow Example

### "Staff Member Checks In" — The Full Journey

```
[1] Staff opens CheckInScreen
     ↓
[2] App requests GPS location from device (expo-location)
    App opens camera (expo-camera), staff takes selfie
     ↓
[3] App calls siteApi to get the assigned Location's GPS coordinates
    App calculates distance between staff GPS and location GPS
    If distance > geoRadius → ERROR "You are too far from the office"
     ↓
[4] App uploads selfie image to backend:
    POST /attendance/checkin (multipart/form-data)
    Headers: { Authorization: "Bearer <token>" }
    Body: { photo: <file>, latitude, longitude }
     ↓
[5] BACKEND: SessionGuard intercepts
    → Reads token, hashes it, looks up in sessions table
    → Attaches req.user with user info + tenantId
     ↓
[6] BACKEND: PermissionGuard checks
    → Does req.user have "attendance.checkin" permission?
    → If not → 403 Forbidden
     ↓
[7] BACKEND: attendance.service.checkIn()
    → Loads AttendanceConfig for user's role
    → Validates: current time within checkInStart-checkInEnd?
    → Validates: geo distance within geoRadius?
    → Uploads selfie to Cloudflare R2 (via AWS S3 SDK)
    → Creates Attendance record in PostgreSQL
    → Returns the attendance record
     ↓
[8] BACKEND: AuditInterceptor runs
    → Logs: { module: 'attendance', action: 'checkin', actor: userId, targetId: attendanceId }
     ↓
[9] BACKEND: RealtimeGateway emits
    → 'attendance:checkedIn' event to all connected WebSocket clients
     ↓
[10] FRONTEND: LiveAttendanceMonitoringScreen (if open)
     → Receives WebSocket event
     → Adds Ravi Kumar to the "Currently Present" list instantly
     ↓
[11] CheckInScreen receives 200 OK response
     → Navigates to StaffDashboard
     → Shows "Checked In ✅" status
```

---

## 8. Security Architecture

### Session-Based Auth (NOT JWT)

This app uses **server-side sessions**, not JWT tokens. Here's the key difference:

| JWT | This App's Session |
|---|---|
| Token contains payload (self-contained) | Token is just a random string (opaque) |
| Server can't invalidate a single JWT | Server can revoke a session (`revoked: true`) |
| Verified by signature check (fast) | Verified by DB lookup on every request |
| Can't force logout mid-session | Admin can force logout instantly |

**Token Security**:
- A random token is generated (e.g. 32 random bytes)
- Only the **SHA-256 hash** of that token is stored in the DB
- Even if the DB is stolen, the raw tokens are useless
- The raw token is stored only in the client's `AsyncStorage`

### Sliding Sessions
- Sessions are valid for 90 days
- If used within those 90 days, the expiry resets to 90 days from now
- But only if last activity > 1 hour ago (performance optimization: avoids a DB write on every single request)

### RBAC (Role-Based Access Control)
- Permissions are defined in code (seeded, not user-manageable)
- Roles are user-manageable (admin can create roles and assign permissions)
- Users are assigned roles
- Guards enforce permission checks on every protected endpoint

---

## 9. Permission System

The permission system exists in **both** backend and frontend.

### Backend (`@RequirePermission`)
```typescript
@RequirePermission('event.create')
@Post()
async createEvent() { ... }
```
The `PermissionGuard` reads this decorator and checks if `req.user.roles[].permissions` contains `event.create`.

### Frontend (`can()` and `canAccessScreen()`)
The frontend also checks permissions to:
- **Hide or show navigation items** (e.g. don't show "Staff Management" tab if user can't `staff.view`)
- **Hide or show buttons** (e.g. don't show "Delete" button if user can't `event.delete`)
- **Prevent navigation** to protected screens

The complete list of all permission keys is documented in `PERMISSION_GROUPS` inside `src/config/permissionMap.js`.

---

## 10. Realtime (WebSockets)

### Backend (`realtime.gateway.ts`)
Uses `@nestjs/websockets` with Socket.IO. Provides a WebSocket endpoint at the same port as HTTP (port 5000). The gateway can emit events to all connected clients or specific rooms.

### Frontend (`utils/socket.js`)
Creates a persistent Socket.IO connection to the backend. The `useRealtime.js` hook provides a clean interface for screens to subscribe to events.

**Key real-time events** (used for live attendance monitoring):
- `attendance:checkedIn` — emitted when a staff member checks in
- `attendance:checkedOut` — emitted when a staff member checks out

> **Hotel analogy**: The WebSocket connection is like a live CCTV monitor in the security room. When any staff member badges through a door, the security monitor updates instantly without the guard needing to refresh it.

---

## 11. File Storage (Cloudflare R2)

**Cloudflare R2** is used to store all media files:
- Staff profile photos (`profilePhotoUrl`)
- Staff ID proof documents (`idProofUrl`)
- Attendance check-in selfies (`checkInPhotoUrl`)
- Attendance check-out selfies (`checkOutPhotoUrl`)

R2 is an S3-compatible storage (Cloudflare's alternative to AWS S3). The backend uses `@aws-sdk/client-s3` with the R2 endpoint configured. Files are uploaded via the backend (never directly from the app). Public files are served via the `R2_PUBLIC_URL` CDN.

> **Hotel analogy**: R2 is the hotel's photo archive room. Staff ID photos and check-in selfies are stored there. The CDN URL is the viewing window — anyone with the right URL can view the stored photo.

---

## 12. Running the Project

### Backend

```bash
cd backend
npm install
# Make sure .env is configured with correct DATABASE_URL
npm run start:dev     # Development (watch mode, auto-restart)
npm run build         # Build to dist/
npm run start:prod    # Run production build
```

Default port: **5000** (configured in `.env`)

### Frontend

```bash
cd frontend
npm install

# IMPORTANT: Update base URL first!
# Edit src/api/axios.js → baseURL: "http://<YOUR_MACHINE_IP>:5000"
# Edit src/utils/socket.js → io("http://<YOUR_MACHINE_IP>:5000")

npx expo start --clear    # Start Expo dev server
# Then scan QR code with Expo Go app on your phone
# Or press 'a' for Android emulator
```

### Default Test Credentials (seeded on fresh DB)
- **Username**: `testowner@default`
- **Password**: `123456`
- **Role**: Owner (has ALL permissions)

---

## Quick Reference Cheat Sheet

| What | Where |
|---|---|
| Backend entry point | `backend/src/main.ts` |
| Module wiring + seed | `backend/src/app.module.ts` |
| Auth (login/logout) | `backend/src/modules/auth/` |
| Session management | `backend/src/modules/sessions/` + `common/guards/session.guard.ts` |
| Permission enforcement | `common/guards/permission.guard.ts` + `@RequirePermission()` |
| Audit logging | `common/interceptors/audit.interceptor.ts` + `@Audit()` |
| Push notifications (cron) | `backend/src/cron/checkout-reminder.cron.ts` |
| Real-time WebSocket | `backend/src/common/realtime/realtime.gateway.ts` |
| File uploads (R2) | AWS SDK S3 client with R2 endpoint in users/attendance services |
| App entry | `frontend/App.js` |
| Navigation root | `frontend/src/navigation/MainNavigator.js` |
| Auth state + session restore | `frontend/src/store/authStore.js` |
| API base URL config | `frontend/src/api/axios.js` + `frontend/src/utils/socket.js` |
| Permission matrix | `frontend/src/config/permissionMap.js` |
| Check-in screen | `frontend/src/screens/attendance/CheckInScreen.js` |
| Live attendance monitor | `frontend/src/screens/attendance/LiveAttendanceMonitoringScreen.js` |
