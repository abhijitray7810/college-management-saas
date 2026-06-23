# College Management SaaS Backend 

Production-ready Node.js backend for a College Management SaaS application.  
 
## Tech Stack

- **Node.js** (ES Modules)
- **Express.js** - Web framework
- **PostgreSQL (Neon)** - Database
- **Drizzle ORM** - Database ORM  
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Zod** - Input validation
 
## Architecture

Feature-based architecture following SOLID principles:

```
src/
├── config/         # Configuration files
├── features/       # Feature modules (auth, etc.)
├── shared/         # Shared utilities and middleware
├── db/             # Database schema and configuration
├── app.js          # Express app setup
└── server.js       # Server entry point
```

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
JWT_SECRET=your-super-secure-jwt-secret-key-min-32-chars
JWT_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=12
```

### 3. Setup Database (Neon)

1. Create a project at [Neon](https://neon.tech)
2. Get your connection string
3. Add it to `.env`

### 4. Run Database Migrations

```bash
# Generate migrations
npm run db:generate

# Push schema to database
npm run db:push
```

### 5. Start the Server

```bash
# Development (with hot reload)
npm run dev

# Production
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "STUDENT",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "STUDENT",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "STUDENT",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### Health Check

```http
GET /health
```

**Response (200):**
```json
{
  "success": true,
  "message": "Server is healthy",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start development server with watch mode |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Run database migrations |
| `npm run db:push` | Push schema directly to database |
| `npm run db:studio` | Open Drizzle Studio (GUI) |

## Database Schema

### Users Table

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, auto-generated |
| name | varchar(255) | User's full name |
| email | varchar(255) | Unique email address |
| password_hash | varchar(255) | bcrypt hashed password |
| role | enum | ADMIN, TEACHER, or STUDENT |
| created_at | timestamp | Account creation time |
| updated_at | timestamp | Last update time |

## RBAC (Role-Based Access Control)

Roles hierarchy (higher number = more permissions):

1. **STUDENT** - Basic user
2. **TEACHER** - Can manage courses and students
3. **ADMIN** - Full system access

### Middleware Usage

```javascript
import { authenticateJWT } from './shared/middleware/auth.middleware.js';
import { authorizeRoles } from './shared/middleware/rbac.middleware.js';
import { ROLES } from './shared/constants/roles.js';

// Protect route with authentication
router.get('/protected', authenticateJWT, handler);

// Restrict to specific roles
router.get('/admin-only', 
  authenticateJWT, 
  authorizeRoles(ROLES.ADMIN), 
  handler
);

// Multiple roles
router.get('/teacher-or-admin',
  authenticateJWT,
  authorizeRoles(ROLES.TEACHER, ROLES.ADMIN),
  handler
);
```

## Project Structure Details

### Feature-Based Organization

Each feature is self-contained:

```
features/auth/
├── auth.controller.js    # HTTP request/response handling
├── auth.service.js       # Business logic
├── auth.repository.js    # Database operations
├── auth.routes.js        # Route definitions
├── auth.validation.js    # Input validation (Zod)
└── auth.middleware.js    # Feature-specific middleware
```

### Service Layer Pattern

```
Controller → Service → Repository → Database
   ↓           ↓          ↓
HTTP/JSON   Business   Queries
           Logic
```

## Error Handling

The API uses consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [...] // Validation errors (if applicable)
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict (e.g., email exists) |
| 500 | Internal Server Error |

## Security Features

- **Password Hashing**: bcrypt with configurable salt rounds
- **JWT Authentication**: Signed tokens with expiration
- **Input Validation**: Zod schema validation
- **Role-Based Authorization**: Hierarchical permission system
- **SQL Injection Protection**: Parameterized queries via Drizzle ORM

## Development

### Adding a New Feature

1. Create feature folder: `src/features/featurename/`
2. Create files: controller, service, repository, routes, validation
3. Export routes and add to `app.js`
4. Create database schema if needed

### Environment Validation

Environment variables are validated on startup using Zod. The server will exit if required variables are missing or invalid.

## License

ISC
