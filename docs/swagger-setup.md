# Swagger API Documentation

## Overview

The Household Budget API includes comprehensive Swagger/OpenAPI documentation that provides an interactive interface for exploring and testing the API endpoints.

## Accessing Swagger Documentation

Once the application is running, you can access the Swagger documentation at:

**URL:** `http://localhost:3000/api/docs`

## Features

### 🔐 Authentication Support

- JWT Bearer token authentication is configured
- Use the "Authorize" button in Swagger UI to set your JWT token
- Token persists across browser sessions for convenience

### 📚 API Endpoints Documentation

#### Health Check

- `GET /api` - Welcome message
- `GET /api/health` - Health check with database connectivity

#### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (requires authentication)
- `POST /api/auth/logout` - Logout user (requires authentication)

#### Transactions (Placeholder)

- `GET /api/transactions` - Get all transactions (requires authentication)

#### Budgets (Placeholder)

- `GET /api/budgets` - Get all budgets (requires authentication)

#### Groups (Placeholder)

- `GET /api/groups` - Get all groups (requires authentication)

## How to Use

### 1. Start the Application

```bash
npm run start:dev
```

### 2. Open Swagger UI

Navigate to `http://localhost:3000/api/docs` in your browser

### 3. Test Authentication

1. Use the `POST /api/auth/register` endpoint to create a new user
2. Copy the `accessToken` from the response
3. Click the "Authorize" button in Swagger UI
4. Enter `Bearer <your-token>` in the JWT-auth field
5. Click "Authorize"

### 4. Test Protected Endpoints

Now you can test protected endpoints like:

- `GET /api/auth/profile`
- `GET /api/transactions`
- `GET /api/budgets`
- `GET /api/groups`

## Request/Response Examples

### Register User

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

### Login User

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "data": {
    // Response data here
  }
}
```

## Configuration

The Swagger configuration is set up in `src/main.ts` with:

- Title: "Household Budget API"
- Description: "API for managing household budgets, transactions, and shared expenses"
- Version: "1.0"
- JWT Bearer authentication support
- Persistent authorization

## Development Notes

- Swagger documentation is automatically generated from TypeScript decorators
- All DTOs include validation rules and examples
- Response schemas include example data
- Authentication is properly configured for protected routes
- Placeholder endpoints are included for future implementation

## Future Enhancements

As new features are implemented, the Swagger documentation will be automatically updated to include:

- Complete CRUD operations for transactions
- Budget management endpoints
- Group and shared expense functionality
- Advanced filtering and pagination
- File upload capabilities
