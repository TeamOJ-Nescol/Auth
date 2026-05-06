# Dartz Auth & Games API

NestJS backend that powers user authentication and game-state management for the Dartz platform. It issues JWTs as HTTP-only cookies, stores users and game sessions in SQLite via Prisma, and exposes a REST API consumed by the [`website`](../website) frontend.

## Stack

- **Framework:** NestJS 11 (TypeScript, ES2023)
- **Database:** SQLite via Prisma 6
- **Auth:** JWT (HTTP-only cookies) + bcryptjs password hashing
- **Validation:** class-validator / class-transformer
- **Realtime (wired, not yet used):** Socket.IO, KafkaJS
- **Testing:** Jest + supertest

## Project layout

```
src/
├── main.ts                 # Bootstrap, CORS, cookie-parser, global ValidationPipe
├── app.module.ts           # Root module
├── auth/                   # JWT guard + /auth/check
├── users/                  # Registration, login, logout
├── games/                  # Game CRUD, progress, finish, stats
└── prisma/                 # Global PrismaService
prisma/
└── schema.prisma           # User / Game / GamePlayer models
```

## Getting started

### Prerequisites
- Node.js 18+
- pnpm (preferred) or npm

### Install & run locally

```bash
pnpm install
cp .env.example .env        # then fill in JWT_SECRET
npx prisma db push          # create SQLite schema
pnpm run start:dev          # http://localhost:4000
```

### Run with Docker

```bash
docker build -t dartz-auth .
docker run -p 4000:4000 dartz-auth
```

The Dockerfile installs deps, runs `prisma db push` + `prisma generate`, and starts the server on port 4000.

## Environment variables

| Variable        | Default          | Notes                                         |
| --------------- | ---------------- | --------------------------------------------- |
| `DATABASE_URL`  | `file:./dev.db`  | SQLite file path                              |
| `PORT`          | `4000`           | HTTP port                                     |
| `JWT_SECRET`    | _(required)_     | Signing secret for JWTs (24h expiry)          |
| `NODE_ENV`      | `development`    | Toggles `secure` cookie flag in production    |

CORS is locked to `http://localhost:3000` with credentials enabled — adjust in `src/main.ts` for other origins.

## API reference

All requests/responses are JSON. Authenticated routes read the JWT from the `auth` cookie set by `/users/login`.

### Public

| Method | Path             | Body                                        | Description                       |
| ------ | ---------------- | ------------------------------------------- | --------------------------------- |
| GET    | `/`              | —                                           | Health check                      |
| POST   | `/users/create`  | `{ email, name, password }`                 | Register a new user               |
| POST   | `/users/login`   | `{ email, password }`                       | Login; sets `auth` cookie         |
| POST   | `/users/logout`  | —                                           | Clears `auth` cookie              |

### Authenticated (JWT cookie required)

| Method | Path                  | Body                                              | Description                              |
| ------ | --------------------- | ------------------------------------------------- | ---------------------------------------- |
| GET    | `/auth/check`         | —                                                 | Returns `{ isAuthenticated, user }`      |
| POST   | `/games`              | `{ mode, players[] }`                             | Create a game (`501`, `301`, `cricket`)  |
| GET    | `/games`              | —                                                 | List games owned by the user             |
| GET    | `/games/stats`        | —                                                 | Aggregate stats: totals, wins, by mode   |
| GET    | `/games/:id`          | —                                                 | Game detail (ownership enforced)         |
| PATCH  | `/games/:id`          | `{ state?, players?[] }`                          | Update in-progress state / scores        |
| POST   | `/games/:id/finish`   | `{ winner?, state?, players[] }`                  | Finalize a game                          |
| DELETE | `/games/:id`          | —                                                 | Delete a game                            |

## Data model

```prisma
User        id  email(unique)  name  pfp  password_hash  salt  games[]
Game        id  ownerId  mode  status  winner?  state(json-string)
            createdAt  updatedAt  finishedAt?  players[]
GamePlayer  id  gameId  name  position  currentScore?  finalScore?  dartsThrown
```

`Game.state` is stored as a JSON string for flexibility across game modes. `GamePlayer` rows cascade-delete with their parent game.

## Scripts

| Command              | Purpose                              |
| -------------------- | ------------------------------------ |
| `start:dev`          | Watch-mode dev server                |
| `start:prod`         | Run compiled `dist/main.js`          |
| `build`              | Compile TypeScript                   |
| `lint`               | ESLint --fix                         |
| `format`             | Prettier write                       |
| `test` / `test:e2e`  | Jest unit / e2e suites               |
| `test:cov`           | Coverage report                      |

## Notes

- Cookies are set with `httpOnly`, `sameSite=lax`, and `secure` in production. The frontend must use `withCredentials: true`.
- The `JwtAuthGuard` reads the token from `req.cookies.auth` rather than the `Authorization` header.
- Game ownership is enforced at the service layer — every `:id` route validates that the JWT subject matches `Game.ownerId`.
