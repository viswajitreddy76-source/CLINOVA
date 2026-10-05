# CLINOVA — Secure Clinic & Appointment Management Platform
### Track: PS-04 — Build Secure 24 Hackathon (Abhedya — VBIT Cybersecurity Forum)

> **Tagline**: *Connected Care. Smarter Clinics.*

CLINOVA is an enterprise-grade HealthTech SaaS platform designed for modern clinic operations, real-time appointment scheduling, role-based patient/doctor/admin management, and synthetic medical record isolation.

---

## 🌟 Key Features & Core Concept

1. **Patient Portal**:
   - Patient registration & secure login (`patient@clinova.demo` / `Patient@123`).
   - Interactive 6-step appointment booking wizard with slot collision prevention.
   - Doctor discovery search & filters by specialization (*General Medicine*, *Cardiology*, *Dermatology*, *Orthopedics*, *Neurology*).
   - Reschedule and cancellation workflows with instant confirmation receipts.
   - Health Snapshot metrics (*BP*, *Heart Rate*, *BMI*, *Temp*) labeled **DEMO MEDICAL DATA**.
   - Chronological synthetic medical records timeline.
   - Profile editing with form validation and emergency contact tracking.
   - Notification bell tray with unread indicators.

2. **Doctor Workspace**:
   - Clinical login portal (`doctor@clinova.demo` / `Doctor@123`).
   - Today's appointment queue timeline (*09:00 AM — Alex Johnson — General Consultation — Confirmed*).
   - Queue status management (*Confirm*, *Mark Waiting*, *Complete*, *Cancel*).
   - **Authorized Patient View**: Strictly checks assignment before releasing patient details (*Alex Johnson*, *Age: 24*, *PT-10245*) labeled **`SYNTHETIC DEMO PATIENT`**.
   - **Consultation Workspace**: Issue synthetic diagnoses, consultation notes, prescriptions (*"Cetirizine 10mg — Demo Prescription"*), and follow-up recommendations.
   - Doctor profile management.

3. **Admin Control Center**:
   - Administrative login portal (`admin@clinova.demo` / `Admin@123`).
   - Analytics overview cards (*Total Patients*, *Active Doctors*, *Today's Visits*, *Pending Requests*, *Completed*, *Cancelled*).
   - **Patient Management Table**: Search, filter, view details, activate/deactivate accounts.
   - **Doctor Management Table**: Search, filter, view details, activate/deactivate accounts, and **"Add Doctor"** modal.
   - **Appointment Control Table**: Comprehensive filterable appointment table with status transition dropdowns.
   - **Analytics Visualizations**: Interactive **Chart.js** charts (Weekly trends, Specialization distribution).
   - **Security Audit Logs Table**: Real-time log tracker recording user actions, resources, timestamps, and status.

4. **Clinova Assistant (Floating AI Assistant)**:
   - Bottom-right floating widget with glowing pulse indicator.
   - FAQ helper, appointment query parser, and navigation assistant.
   - Context-aware suggested prompt chips.
   - **Mandatory Medical Safety Disclaimer**: Refuses real disease diagnosis requests with standard safety disclaimer.
   - Role-based privacy guards.

---

## 🔐 Security & Privacy Architecture

- **Role-Based Access Control (RBAC)**: Strict client and server-side route guards preventing unauthorized cross-role view attempts.
- **Synthetic Data Sandbox**: Mandatory visual labeling ("DEMO ENVIRONMENT", "SYNTHETIC DATA ONLY") ensuring 0% real PHI/PII ingestion.
- **Patient Privacy Isolation**: Server-side patient ID validation ensuring patients can strictly only access their own records.
- **Audit Logging**: Structured `AuditLog` generation for `LOGIN`, `LOGOUT`, `UPDATE_PROFILE`, `BOOK_APPOINTMENT`, `CANCEL_APPOINTMENT`, `RESCHEDULE_APPOINTMENT`, and `CREATE_MEDICAL_RECORD`.

---

## 🔑 Quick Launch Demo Accounts

You can test all three roles using the one-click **"Launch Demo"** buttons on the landing page:

| Role | Email | Password | Access Boundary |
|---|---|---|---|
| **Patient** | `patient@clinova.demo` | `Patient@123` | Patient Dashboard, Booking, Records, Profile |
| **Doctor** | `doctor@clinova.demo` | `Doctor@123` | Doctor Workspace, Consultation, Patient Info |
| **Admin** | `admin@clinova.demo` | `Admin@123` | Admin Control Center, Analytics, Audit Logs |

---

## 🛠️ Technology Stack & Execution

- **Frontend**: Modern HTML5, ES6+ Modular JavaScript, Tailwind CSS design system, Lucide React icons, Chart.js.
- **Database Layer**: LocalStorage persistent ORM pre-seeded with synthetic demo data ([`src/js/db.js`](file:///c:/Users/ankit/Downloads/BuildSecure-main/BuildSecure-main/src/js/db.js)).
- **Prisma Integration**: [`prisma/schema.prisma`](file:///c:/Users/ankit/Downloads/BuildSecure-main/BuildSecure-main/prisma/schema.prisma) & [`prisma/seed.ts`](file:///c:/Users/ankit/Downloads/BuildSecure-main/BuildSecure-main/prisma/seed.ts) schemas for production migration.

### How to Run:
Simply open [`src/index.html`](file:///c:/Users/ankit/Downloads/BuildSecure-main/BuildSecure-main/src/index.html) in any modern web browser (Chrome, Edge, Firefox, Safari). Zero installation or build configuration required.
