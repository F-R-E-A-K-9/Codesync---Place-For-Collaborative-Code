# CodeSync

A real-time collaborative code editor built for pairing sessions and technical interviews. Write, run, and talk through code with someone else — all in one shared room, no tab-switching required.

## Features

- **Secure authentication** — JWT-based sessions with bcrypt password hashing
- **Instant rooms** — create a session and get a short, shareable Room ID
- **Real-time sync** — every keystroke reaches everyone else in the room over a live WebSocket connection
- **Run code inline** — execute code via the JDoodle API and see output without leaving the editor
- **Autosave** — code is periodically saved to MongoDB, so reloading or rejoining restores the latest version
- **In-room notes** — a lightweight chat panel for quick messages alongside the code
- **Live presence** — see who else is currently in the room

## Tech Stack

**Backend**

- Node.js + Express
- TypeScript
- MongoDB + Mongoose
- WebSocket (`ws`)
- JSON Web Tokens (auth) + bcrypt (password hashing)
- Zod (input validation)
- JDoodle API (code execution)

**Frontend**

- React + TypeScript
- Vite
- Tailwind CSS v4
- Monaco Editor (`@monaco-editor/react`)
- React Router
- Axios

## Project Structure

```
codesync/
├── Backend/
│   ├── src/
│   │   ├── Models/         # Mongoose schemas — User, Room
│   │   ├── Middleware/      # Auth middleware (JWT verification)
│   │   └── Server.ts        # Express routes + WebSocket server
│   └── .env
└── Frontend/
    ├── src/
    │   ├── Pages/            # Landingpage, Dashboard, Codeeditor, Errorpage
    │   └── ProtectedRoute/   # Route guard for authenticated pages
    └── .env
```

## Getting Started

### Prerequisites

- Node.js v18 or later
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account (free tier is enough)
- A [JDoodle](https://www.jdoodle.com/compiler-api) account (free tier — 200 API calls/day)

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/codesync.git
cd codesync
```

### 2. Backend setup

```bash
cd Backend
npm install
```

Create a `.env` file inside `Backend/`:

```env
PORT=3000
MONGODB_URI="your-mongodb-atlas-connection-string"
JWT_SECRET_KEY="your-random-secret-string"
Client_ID="your-jdoodle-client-id"
Client_Secret="your-jdoodle-client-secret"
```

Run the backend:

```bash
npm run dev
```

### 3. Frontend setup

In a new terminal:

```bash
cd Frontend
npm install
```

Create a `.env` file inside `Frontend/`:

```env
VITE_BACKEND_URL="http://localhost:3000/"
VITE_WEBSOCKET_URL="ws://localhost:3000"
```

Run the frontend:

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

## How It Works

1. **Sign up / sign in** — the server issues a JWT, stored in `localStorage`.
2. **Create or join a room** — creating one generates a short unique Room ID; joining requires an existing one.
3. **Real-time editing** — once inside a room, a WebSocket connection keeps every connected editor in sync as people type.
4. **Autosave** — changes are also periodically saved to MongoDB, so the room's code persists across sessions.
5. **Run code** — the current editor content is sent to the JDoodle API and the output is shown inline.
6. **Notes panel** — a small chat widget lets collaborators leave quick messages without breaking focus.

## Deployment

- **Frontend** — [Vercel](https://vercel.com)
- **Backend** — [Railway](https://railway.app)

## Roadmap

- [ ] Multi-language code execution support
- [ ] Password reset via OTP
- [ ] Automatic reconnect handling for dropped WebSocket connections
- [ ] Live cursor positions for collaborators

## License

MIT
