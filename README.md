# EduFlow ERP

EduFlow ERP is a modern, unified Enterprise Resource Planning (ERP) platform designed for schools, colleges, and higher education institutions with a Next.js frontend and an Express.js + MongoDB backend with full JWT authentication and fine-grained Role-Based Access Control (RBAC).

---

## System Architecture

```text
eduflow-erp/
├── backend/
│   ├── .env                       # Backend port, MongoDB URI & JWT secret
│   ├── server.js                  # Express server entry point (port 5000)
│   └── src/
│       ├── app/app.js             # Express middleware, CORS, routes & error handling
│       ├── config/
│       │   ├── db.js              # MongoDB Mongoose connection
│       │   └── permissions.js     # RBAC matrix matching frontend rules
│       ├── middleware/
│       │   ├── auth.middleware.js # JWT Bearer token authentication
│       │   ├── rbac.middleware.js # Role & permission enforcement
│       │   └── error.middleware.js# Global error and 404 handler
│       ├── models/                # User, Student, Teacher, Attendance, Fee, Exam, Admission, Communication
│       ├── controllers/           # Modular request controllers
│       ├── routes/                # REST API route definitions
│       └── seeder/seed.js         # Complete database seeder script
├── src/                           # Next.js App Router frontend
└── README.md
```

---

## Role-Based Access Control (RBAC)

The backend natively supports 7 roles with hierarchical data scopes:

| Role | Access & Scope Summary |
| :--- | :--- |
| **`SUPER_ADMIN`** | Complete institution-wide system control, user deletions, role management. |
| **`ADMIN`** | Full daily operations, user provisioning, student promotions, finances. |
| **`PRINCIPAL`** | Institutional oversight, merit list and leave approvals, examination reports. |
| **`HOD`** | Department-level access for students, teachers, subjects, and approvals. |
| **`TEACHER`** | Assigned classes, marks attendance, submits exam results, requests leave. |
| **`ACCOUNTANT`** | Full fee collection, payment receipts, fee structures, and pending dues. |
| **`STUDENT`** | Personal academic dashboard, fee receipts, dues, report card, notices. |

---

## API Endpoints

### 1. Authentication (`/api/auth`)
- `POST /api/auth/login` - Sign in with username/email & password (returns JWT token).
- `POST /api/auth/register` - Register a new user account.
- `GET /api/auth/me` - Retrieve current user profile (requires Bearer token).
- `PUT /api/auth/profile` - Update profile bio, phone, avatar.
- `PUT /api/auth/change-password` - Change password with verification.

### 2. User & Role Management (`/api/users`)
- `GET /api/users` - List users with filters (role, department, status).
- `POST /api/users` - Create user accounts (Admin/Principal only).
- `GET /api/users/:id` - Get user details.
- `PUT /api/users/:id` - Update user role, status or department.
- `DELETE /api/users/:id` - Remove user (Super Admin only).

### 3. Student Management (`/api/students`)
- `GET /api/students` - List students (scoped by role / class / status).
- `POST /api/students` - Register a new student profile.
- `PUT /api/students/:id` - Update student profile.
- `POST /api/students/promote` - Batch promote students to next class.
- `DELETE /api/students/:id` - Remove student record.

### 4. Teacher Management (`/api/teachers`)
- `GET /api/teachers` - List faculty members.
- `POST /api/teachers` - Create teacher profile.
- `PUT /api/teachers/:id` - Update teacher information.
- `POST /api/teachers/:id/assign-subjects` - Allocate subjects and classes.

### 5. Attendance & Leaves (`/api/attendance`)
- `POST /api/attendance/mark` - Bulk mark student attendance.
- `GET /api/attendance` - Query daily attendance records.
- `GET /api/attendance/stats` - Attendance summary percentages.
- `POST /api/attendance/leaves` - Submit leave request.
- `GET /api/attendance/leaves` - List pending and approved leaves.
- `PUT /api/attendance/leaves/:id/status` - Approve or reject leave.

### 6. Fees & Finance (`/api/fees`)
- `GET /api/fees/stats` - Total collections, pending dues overview.
- `GET /api/fees/structures` - Class-wise fee structures.
- `POST /api/fees/structures` - Create or update fee structure.
- `GET /api/fees/dues` - Outstanding student fee balances.
- `GET /api/fees/receipts` - Collection receipts history.
- `POST /api/fees/pay` - Record fee payment and issue receipt.

### 7. Examinations & Results (`/api/exams`)
- `GET /api/exams` - List scheduled examinations.
- `POST /api/exams` - Schedule an examination.
- `GET /api/exams/results` - Retrieve exam results.
- `POST /api/exams/:id/results` - Submit student marks and grades.
- `GET /api/exams/report-card/:studentId` - Fetch student report card.

### 8. Admissions (`/api/admissions`)
- `POST /api/admissions/apply` - Public new admission application.
- `GET /api/admissions/applications` - List applications by class & status.
- `PUT /api/admissions/applications/:id/status` - Review and approve application.
- `GET /api/admissions/merit-list` - Generate ranked merit list.

### 9. Communication Center (`/api/communication`)
- `GET /api/communication/announcements` - List notices with audience filter.
- `POST /api/communication/announcements` - Publish announcement.
- `DELETE /api/communication/announcements/:id` - Delete announcement.
- `GET /api/communication/messages` - User inbox and sent messages.
- `POST /api/communication/messages` - Send direct message.

### 10. Reports & Analytics (`/api/reports`)
- `GET /api/reports/overview` - High-level ERP dashboard KPIs.
- `GET /api/reports/academic` - Pass percentages, top performers.
- `GET /api/reports/fees` - Financial collection analytics.

---

## How to Run

### 1. Start MongoDB
Ensure MongoDB is running locally on port `27017` (default `mongodb://127.0.0.1:27017/eduflow_erp`).

### 2. Seed the Database
Populate all default roles, credentials, and ERP sample data:
```bash
cd backend
npm run seed
```

Default credentials:
- **Super Admin**: `superadmin` / `Super@123`
- **Admin**: `admin` / `Admin@123`
- **Principal**: `principal` / `Principal@123`
- **HOD**: `hod` / `Hod@123`
- **Teacher**: `teacher` / `Teacher@123`
- **Accountant**: `accountant` / `Accountant@123`
- **Student**: `student` / `Student@123`

### 3. Run Backend API Server
```bash
cd backend
npm run dev
```
Server runs on: **`http://localhost:5000`**

### 4. Run Frontend Application
```bash
# from root directory
npm run dev
```
Web app runs on: **`http://localhost:3000`**
