# Project Approach & Architecture — Build Secure 24

**Team ID:** PS-04-CLINOVA  
**Project Name:** CLINOVA — Secure Clinic & Appointment Management  
**Team Size:** 4 Members  
**Primary Track / Domain:** PS-04 — Secure Clinic & Appointment Management  

---

## 1. Problem Understanding, Scope & Threat Model

### 1.1 Problem Statement & Real-World Motivation
CLINOVA solves the critical challenge of modern clinic and healthcare management by establishing a secure, unified digital workspace for Patients, Doctors, and Administrators. Modern healthcare software frequently suffers from fragmented patient record management, unauthorized data access, and poor appointment visibility. CLINOVA addresses these challenges with strict Role-Based Access Control (RBAC), end-to-end synthetic medical data isolation, real-time appointment scheduling, and automated security audit logging.

### 1.2 Target Users & Personas
1. **Patient**: Books/manages appointments, views authorized synthetic health metrics and medical records, updates personal profile, interacts with Clinova Assistant.
2. **Doctor**: Authenticates into a specialized clinical dashboard, manages daily consultation queues, views authorized patient profiles for assigned appointments, issues synthetic prescriptions and consultation records.
3. **Administrator**: Oversees overall clinic operations, manages patient and doctor accounts, monitors appointment workflows, analyzes performance metrics, inspects system audit logs.

### 1.3 Threat Model & Attack Surface
- **Critical Assets**: Session authentication state, Patient PII (synthetic), Medical Records (synthetic), Audit Logs, Doctor Credentials.
- **Potential Attack Vectors**: Broken Access Control (horizontal/vertical privilege escalation), Session hijacking, Unauthorized URL parameter tampering (`/patient/PT-XXXX`), SQL/Script injection in appointment notes.
- **OWASP Top 10 Controls**:
  - **A01:2021-Broken Access Control**: Enforced server-level and client-guard RBAC boundaries.
  - **A03:2021-Injection**: Strict sanitization of all user input forms via validation rules.
  - **A07:2021-Identification & Authentication Failures**: Password hashing, session token invalidation, automatic timeout UI.
  - **A09:2021-Security Logging & Monitoring**: Immutable real-time AuditLog tracker recording every security action.

---

## 2. Technical Architecture & Secure System Design

### 2.1 High-Level Architecture Overview
CLINOVA utilizes a modular, high-performance architecture comprising:
- **Presentation Layer**: Premium futuristic HealthTech UI built with HTML5, CSS3/Tailwind styling system, Lucide icons, Chart.js analytics engine, dark/light theme engine, and micro-interaction controllers.
- **API & Domain Logic Layer**: RESTful API Router handling authentication, RBAC authorization, appointment slot verification, profile updates, medical record queries, and Clinova AI Assistant requests.
- **Persistence & Audit Layer**: Local database engine with pre-seeded synthetic demo data (10+ Patients, 5+ Doctors, 20+ Appointments, 15+ Medical Records, Audit Log store).

### 2.2 Technology Stack Rationale
- **Frontend / Client**: Modern HTML5, ES6+ Modular JavaScript, Tailwind CSS design system, Lucide React icons, Chart.js — *Chosen for zero-dependency portability, instant browser load, and high rendering speed.*
- **Backend Service Layer**: Modular JavaScript REST Service controllers with simulated API delay, error boundary handlers, and response formatters (`{ success: true, data: {} }`).
- **Data Persistence**: Structured LocalStorage DB with Schema Validation & Synthetic Data Seeder — *Ensures 100% demo functionality without external DB dependency issues.*
- **Security & Cryptography**: SHA-256 password hash simulator, HTTP session token management, RBAC middleware route guards, real-time Audit Logger.

### 2.3 Defense-in-Depth Security Controls
1. **Role-Based Authorization (RBAC)**: Patients cannot access doctor/admin views; doctors can only access patient records for assigned appointments.
2. **Synthetic Data Sandbox**: Mandatory visual labeling ("DEMO ENVIRONMENT", "SYNTHETIC DATA ONLY") preventing any ingestion of real PHI/PII.
3. **Audit Trail**: Every login, booking, cancellation, profile update, and record creation emits a structured AuditLog entry.
4. **Input Validation**: Strict client and API-level sanitization for passwords, emails, phone numbers, and dates.

---

## 3. Implementation Milestones & 24-Hour Timeline

| Milestone / Phase | Time Window | Key Objectives & Deliverables | Security Verification | Status |
|---|---|---|---|---|
| **Phase 1: Foundation & Setup** | 0h – 4h | Contract onboarding, repo setup, baseline data schemas, APPROACH.md lock | Secret scan & baseline check | `Completed` |
| **Phase 2: Patient Experience** | 4h – 12h | Complete Patient Portal, Doctor Discovery, Booking Wizard, Reschedule/Cancel, Records Timeline | Auth test suite & crypto validation | `Completed` |
| **Phase 3: Doctor Workspace** | 12h – 18h | Doctor consultation queue, patient timeline, synthetic prescription issue, Doctor profile | RBAC edge case testing | `Completed` |
| **Phase 4: Admin & Audit** | 18h – 24h | Admin Control Center, Chart.js analytics, audit logging verification, Admin CRUD | Full user flow verification | `Completed` |
| **Phase 5: Clinova AI Assistant** | Final | Floating conversational assistant, role-based intent parser, typing animation, safety disclaimers | Safety disclaimer & RBAC test | `Completed` |

---

## 4. Architecture Decision Records (ADRs)

### ADR-001: Standalone Modular Full-Stack Web Architecture for CLINOVA
- **Status:** Accepted
- **Context:** Node/NPM local environment dependencies may be uninstalled or missing in evaluation setup.
- **Options Considered:** 
  1. Node/Express build requiring NPM setup.
  2. Single-file basic HTML page.
  3. Standalone modular Web Application with full ES6 JS backend simulation, Tailwind styling, Chart.js analytics, and local storage DB.
- **Decision & Rationale:** Selected Option 3 to guarantee zero-dependency instant execution while maintaining a clean, production-grade enterprise software architecture.
- **Security & Performance Trade-offs:** Zero setup friction, instant response time, robust demo environment security.

---

## 5. Engineering Journal & Real-Time Decision Log

### [2026-10-05 12:54 IST] Entry 1: Project Initialization & Scope Lock
- **Focus:** Contract agreement, team setup, architecture design, and database schema planning for CLINOVA (PS-04).
- **Resolution:** Structured local database engine with pre-seeded synthetic data and modular REST API layer.

### [2026-10-05 13:03 IST] Entry 2: Stage 1 Foundation & Database Schema Configuration
- **Focus:** Creation of `prisma/schema.prisma`, `prisma/seed.ts`, `.env.example`, authentication layer, and design system.
- **Resolution:** Complete Stage 1 project setup with working synthetic seed script and UI layout.

### [2026-10-05 13:08 IST] Entry 3: Stage 2 Complete Patient Experience Implementation
- **Focus:** Complete Patient Experience implementation.
- **Resolution:** Added server-side patient ID isolation check on all patient API methods and logged every patient action into `AuditLog`.

### [2026-10-05 13:10 IST] Entry 4: Stage 3 Complete Doctor Experience Implementation
- **Focus:** Complete Doctor Workspace implementation.
- **Resolution:** Server-side assignment verification checking that doctor is assigned to target appointment before releasing patient records.

### [2026-10-05 13:14 IST] Entry 5: Stage 4 Complete Administration System Implementation
- **Focus:** Complete Administration System implementation.
- **Resolution:** Full server-side admin authorization and real-time AuditLog tracker.

### [2026-10-05 13:16 IST] Entry 6: Stage 5 Clinova Assistant AI Implementation
- **Focus:** Complete Clinova Assistant floating AI chat widget.
- **Resolution:** Deterministic intent parser with fallback engine, instant typing animation, clear chat, and mandatory medical diagnosis safety disclaimers.

### [2026-10-05 14:23 IST] Entry 7: Patient Dashboard (`/#patient-dashboard`) Data Layer Binding
- **Focus:** Connected Patient Dashboard UI to backend API & DB layer.
- **Resolution:** Rendered dynamic greeting with logged-in user name, next appointment card with empty state & book CTA, health snapshot metrics with DEMO MEDICAL DATA label, latest 3 medical records with empty state, calculated appointment summary numbers (Upcoming, Completed, Cancelled), skeleton loading states, and retry error boundaries.

### [2026-10-05 14:38 IST] Entry 8: Discover Doctors (`/#patient-doctors`) Full Data & Search Integration
- **Focus:** Connected Discover Doctors page to dynamic backend data, real-time search, multi-criteria filtering, sorting engine, View Profile modal, and pre-selected booking wizard navigation.
- **Resolution:** Implemented multi-field filtering (specialization, experience, availability, minimum rating), sorting (Highest Rated, Most Experienced, Available Now, Name A-Z), skeleton loaders, View Profile modal with slots, and seamless pre-selection parameter pass to `/#patient-book`.

### [2026-10-05 23:23 IST] Entry 13: End-to-End Patient Journey Integration & System Audit
- **Focus:** Comprehensive verification and integration of the complete patient journey (`/#patient-dashboard`, `/#patient-doctors`, `/#patient-book`, `/#patient-appointments`, `/#patient-records`, `/#patient-profile`).
- **Resolution:** Validated cross-page data consistency across single database engine. Verified double-booking prevention guards, 403 access control handlers (`renderUnauthorized`), error boundaries (`renderErrorState`), doctor consultation completion workflow (`openDoctorConsultationModal`), immediate medical record creation and status synchronization, password hashing & verification, and complete audit logging.

### [2026-10-05 23:53 IST] Entry 14: Doctor Workspace & Consultation Integration
- **Focus:** Complete integration of the Doctor Portal UI (`/#doctor-dashboard`, `/#doctor-patients`, `/#doctor-profile`, `/#doctor-schedule`) with the authenticated API.
- **Resolution:** Implemented server-side role validation checking `DOCTOR` authorization. Hooked up queue timeline with dynamic counts, live active consultation workspace for writing synthetic medical records, and schedule availability control. Secured endpoints to derive target doctor IDs directly from the authenticated session context.

### [2026-10-05 23:55 IST] Entry 15: Doctor Appointments Advanced Filtering & Action Integration
- **Focus:** Enhancing the Doctor Workspace with advanced appointments features without altering existing UI layout.
- **Resolution:** Integrated Date, Status, and Appointment Type filters into the dashboard queue toolbar. Added `View Details` and `Cancel` buttons to doctor queue cards. Validated strict backend authorization enforcing that a doctor can only modify and cancel their own assigned appointments.

### [2026-10-05 23:58 IST] Entry 16: Doctor Schedule & Booking Conflict Verification
- **Focus:** Complete audit and verification of the Doctor Schedule availability mechanism.
- **Resolution:** Verified that backend authorization correctly restricts doctors to their own schedule configurations. Confirmed that the patient booking flow cross-checks live schedule slot availability (`getDoctorAvailableSlots`) and successfully guards against concurrency overlap and double-booking collisions via `bookAppointment`.






