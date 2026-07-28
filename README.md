# TherapyConnect — Therapist Directory Platform

A full-stack therapist directory built with React + TypeScript, Node.js + Express, and MongoDB.

## Features

- **Public pages**: Landing, About, Contact, FAQs, Privacy, Terms
- **Therapist directory**: Search, filter by location/specialty/rating, geolocation radius search
- **Therapist profiles**: Detailed profiles with reviews and booking CTA
- **Authentication**: JWT-based login for clients, therapists, and admins
- **Booking system**: Simple request form with therapist confirm/decline workflow
- **Review system**: Verified reviews after confirmed bookings
- **Dashboards**: Client, therapist, and admin panels

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, TanStack Query |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB + Mongoose |
| Auth | JWT access tokens + httpOnly refresh cookies |

## Prerequisites

- Node.js 18+
- MongoDB (local or Docker)

## Quick Start

### 1. Start MongoDB

```bash
docker compose up -d
```

Or use a local MongoDB instance on `mongodb://localhost:27017`.

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Copy `server/.env.example` to `server/.env` and adjust if needed. Defaults work for local development.

### 4. Seed the database

```bash
npm run seed
```

This creates:
- **Admin**: `admin@therapistdirectory.com` / `Admin123!`
- **Client**: `client@example.com` / `Client123!`
- **Therapists**: `*@example.com` / `Therapist123!`
- Sample FAQs and 6 approved therapists

### 5. Run development servers

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## Project Structure

```
therapist-project/
├── client/          # React frontend
├── server/          # Express API
├── shared/          # Shared types and Zod schemas
├── docker-compose.yml
└── package.json     # npm workspaces root
```

## API Endpoints

All API routes are prefixed with `/api/v1`.

- `POST /auth/register` — Client registration
- `POST /auth/register/therapist` — Therapist registration
- `POST /auth/login` — Login
- `GET /therapists` — List therapists (with filters)
- `GET /therapists/:slug` — Therapist detail
- `POST /bookings` — Create booking request
- `POST /reviews` — Submit review
- `GET /faqs` — Public FAQs
- `POST /contact` — Contact form

See the plan document for the complete API reference.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both client and server |
| `npm run dev:client` | Start frontend only |
| `npm run dev:server` | Start backend only |
| `npm run build` | Build all packages |
| `npm run seed` | Seed database with sample data |
"# therapist-project" 
