# College Management SaaS - API Documentation

Complete API documentation for the production-grade College Management System.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [Core Features](#core-features)
4. [API Endpoints](#api-endpoints)
5. [Error Handling](#error-handling)
6. [Security](#security)
7. [Export System](#export-system)

---

## Getting Started

### Base URL
```
http://localhost:3000/api
```

### API Documentation (Swagger)
```
http://localhost:3000/api-docs
```

### Health Check
```http
GET /health
```

---

## Authentication

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@college.edu",
  "password": "password123"
}
```

### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@college.edu",
  "password": "password123",
  "role": "STUDENT"
}
```

### Using JWT Token
Include the token in the Authorization header:
```http
Authorization: Bearer <your_jwt_token>
```

---

## Core Features

### 1. Routine Management

| Feature | Method | Endpoint |
|---------|--------|----------|
| Generate Routine | POST | `/api/routine/generate` |
| Get Routine | GET | `/api/routine/:semesterId` |
| Validate Routine | GET | `/api/routine/:semesterId/validate` |
| Delete Routine | DELETE | `/api/routine/:semesterId` |
| Update Routine | PATCH | `/api/routine/update/:id` |
| Swap Routines | POST | `/api/routine/swap` |
| Lock Routine | PATCH | `/api/routine/lock/:id` |
| Bulk Lock | POST | `/api/routine/lock/bulk` |

**Generate Routine:**
```http
POST /api/routine/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "semesterId": "uuid",
  "academicYear": "2024-2025",
  "preferSpreadAcrossDays": true,
  "prioritizeLabs": true
}
```

### 2. Approval Workflow

| Feature | Method | Endpoint |
|---------|--------|----------|
| Submit for Approval | POST | `/api/routine/submit/:semesterId` |
| Approve | POST | `/api/routine/approve/:semesterId` |
| Reject | POST | `/api/routine/reject/:semesterId` |
| Activate | POST | `/api/routine/activate/:semesterId` |
| View Pending | GET | `/api/routine/pending` |

**Lifecycle:** `DRAFT` → `PENDING` → `APPROVED` → `ACTIVE`

### 3. Availability System

| Feature | Method | Endpoint |
|---------|--------|----------|
| Create Teacher Availability | POST | `/api/availability/teacher` |
| Create Room Availability | POST | `/api/availability/room` |
| Get Available Teachers | GET | `/api/availability/teachers/free/:timeSlotId` |
| Get Available Rooms | GET | `/api/availability/rooms/free/:timeSlotId` |
| Check Conflicts | POST | `/api/availability/check/conflicts` |

**Check Conflicts:**
```http
POST /api/availability/check/conflicts
Authorization: Bearer <token>
Content-Type: application/json

{
  "teacherId": "uuid",
  "roomId": "uuid",
  "timeSlotId": "uuid"
}
```

### 4. Attendance System

| Feature | Method | Endpoint |
|---------|--------|----------|
| Create Session | POST | `/api/attendance/session` |
| Mark Attendance | POST | `/api/attendance/mark` |
| Mark All Present | POST | `/api/attendance/mark-all-present/:sessionId` |
| Get Student Attendance | GET | `/api/attendance/student/:studentId` |
| Get Subject Attendance | GET | `/api/attendance/subject/:subjectId` |
| Get My Attendance | GET | `/api/attendance/my-attendance` |

**Mark Attendance:**
```http
POST /api/attendance/mark
Authorization: Bearer <token>
Content-Type: application/json

{
  "sessionId": "uuid",
  "records": [
    { "studentId": "uuid", "status": "PRESENT" },
    { "studentId": "uuid", "status": "ABSENT", "remarks": "Sick leave" },
    { "studentId": "uuid", "status": "LATE" }
  ]
}
```

### 5. Dashboard & Analytics

| Feature | Method | Endpoint |
|---------|--------|----------|
| Student Dashboard | GET | `/api/dashboard/student` |
| Teacher Dashboard | GET | `/api/dashboard/teacher` |
| Admin Dashboard | GET | `/api/dashboard/admin` |
| Quick Stats | GET | `/api/dashboard/stats` |

### 6. Export System

| Feature | Method | Endpoint |
|---------|--------|----------|
| Export Routine PDF | GET | `/api/export/routine/:semesterId` |
| Export Student Attendance | GET | `/api/export/attendance/student/:studentId` |
| Export Subject Attendance | GET | `/api/export/attendance/subject/:subjectId` |

**Export generates downloadable PDF files.**

---

## Error Handling

All errors follow this standardized format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {} // Optional additional info
  }
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `BAD_REQUEST` | 400 | Invalid input data |
| `VALIDATION_ERROR` | 400 | Zod validation failed |
| `UNAUTHORIZED` | 401 | Authentication required |
| `INVALID_TOKEN` | 401 | JWT token invalid |
| `TOKEN_EXPIRED` | 401 | JWT token expired |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_SERVER_ERROR` | 500 | Server error |

---

## Security

### Implemented Security Features

1. **Helmet** - Security headers (CSP, HSTS, etc.)
2. **CORS** - Cross-Origin Resource Sharing configured
3. **Rate Limiting** - 100 requests per 15 minutes
4. **Input Sanitization** - Removes script tags and dangerous content
5. **JWT Authentication** - Secure token-based auth
6. **RBAC** - Role-based access control

### Security Headers
- Content-Security-Policy
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Strict-Transport-Security

---

## Logging

Logs are written using Pino with the following levels:
- `error` - Errors and exceptions
- `warn` - Warnings (rate limits, etc.)
- `info` - Request completion info
- `debug` - Debug information (development)

Log format:
```json
{
  "level": "info",
  "time": "2024-01-15T10:30:00Z",
  "method": "POST",
  "url": "/api/routine/generate",
  "statusCode": 201,
  "duration": "1234ms",
  "userId": "uuid"
}
```

---

## Export System

PDF generation uses Playwright for high-quality, consistent PDF output.

### Routine PDF
- Grid layout (days × time slots)
- Subject details, teacher, room
- Professional formatting

### Attendance PDF
- Student/Subject reports
- Attendance percentages
- Status indicators (Good/Average/Poor)
- Summary statistics

---

## Database Schema

Key tables:
- `users` - Authentication
- `students`, `teachers` - User profiles
- `departments`, `courses`, `semesters`, `subjects` - Academic structure
- `rooms`, `time_slots` - Infrastructure
- `routines` - Timetable entries (with status, is_locked, is_manual)
- `attendance_sessions`, `attendance_records` - Attendance tracking

---

## Development Setup

```bash
# Install dependencies
npm install

# Environment setup
cp .env.example .env
# Edit .env with your database URL and JWT secret

# Database setup
npm run db:push

# Start development server
npm run dev

# Production start
npm start
```

---

## Production Checklist

- [x] Environment variables configured
- [x] Database migrated
- [x] Security middleware enabled
- [x] Rate limiting configured
- [x] Logging configured
- [x] Error handling standardized
- [x] API documentation available
- [x] RBAC implemented
- [x] Approval workflow active
- [x] Export system ready

---

## Support

For issues or questions, refer to:
- API Documentation: `/api-docs`
- Error logs: Check server console
- Database: Check PostgreSQL logs
