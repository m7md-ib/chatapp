# 💬 ChatApp — Real-Time 1-to-1 Messaging

A full-stack WhatsApp-inspired real-time chat application built with React, Node.js, MongoDB, and Socket.IO.

---

## ✨ Features

- 🔐 JWT-based authentication (register / login)
- 💬 Real-time 1-to-1 private messaging via Socket.IO
- 🟢 Online / Offline user status
- ✍️ Typing indicators ("user is typing...")
- ✅ Message status: Sent / Delivered / Seen
- 🖼️ Image upload and sharing in chat
- 🔔 Unread message badges
- 📱 Responsive design (mobile-friendly)
- 🌙 Dark mode UI inspired by WhatsApp

---

## 🗂️ Project Structure

```
chatapp/
├── backend/                  # Node.js + Express + Socket.IO
│   ├── config/
│   │   ├── db.js             # MongoDB connection
│   │   └── socket.js         # Socket.IO event handlers
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── messageController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── authMiddleware.js  # JWT protection
│   │   └── uploadMiddleware.js# Multer image upload
│   ├── models/
│   │   ├── User.js
│   │   └── Message.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── messageRoutes.js
│   │   └── userRoutes.js
│   ├── uploads/              # Stored image files
│   ├── server.js             # Entry point
│   ├── .env.example
│   └── package.json
│
└── frontend/                 # React.js app
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── Auth/
    │   │   │   ├── Login.js
    │   │   │   └── Register.js
    │   │   ├── Chat/
    │   │   │   ├── ChatInput.js
    │   │   │   ├── ChatWindow.js
    │   │   │   └── MessageBubble.js
    │   │   └── Layout/
    │   │       └── Sidebar.js
    │   ├── context/
    │   │   ├── AuthContext.js  # Global auth state
    │   │   └── ChatContext.js  # Messages, typing, online users
    │   ├── hooks/
    │   │   └── useTyping.js    # Typing indicator logic
    │   ├── utils/
    │   │   ├── api.js          # Axios instance + interceptors
    │   │   └── socket.js       # Socket.IO singleton
    │   ├── App.js
    │   ├── App.css
    │   └── index.js
    ├── .env.example
    └── package.json
```

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (free tier works) OR local MongoDB
- npm or yarn

---

### 1. Clone and set up backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/chatapp
JWT_SECRET=your_super_secret_key_at_least_32_chars
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

Start the backend:
```bash
npm run dev   # development with nodemon
# or
npm start     # production
```

---

### 2. Set up frontend

```bash
cd frontend
npm install
cp .env.example .env
```

Edit `.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

Start the frontend:
```bash
npm start
```

App runs at: **http://localhost:3000**

---

## 🌐 Deployment

### Backend → Render

1. Create a new **Web Service** on [render.com](https://render.com)
2. Connect your GitHub repo, set root to `backend/`
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variables in Render dashboard:
   ```
   PORT=10000
   MONGO_URI=<your MongoDB Atlas URI>
   JWT_SECRET=<strong random secret>
   CLIENT_URL=https://your-frontend.vercel.app
   NODE_ENV=production
   ```
6. Note your Render URL: `https://chatapp-backend.onrender.com`

---

### Frontend → Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. From the `frontend/` directory:
   ```bash
   vercel
   ```
3. Or connect via [vercel.com](https://vercel.com) dashboard → Import GitHub repo → Set root to `frontend/`
4. Add environment variables in Vercel dashboard:
   ```
   REACT_APP_API_URL=https://chatapp-backend.onrender.com/api
   REACT_APP_SOCKET_URL=https://chatapp-backend.onrender.com
   ```
5. Deploy!

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | ❌ |
| POST | `/api/auth/login` | Login | ❌ |
| GET | `/api/auth/me` | Get current user | ✅ |

### Users
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/users` | Get all users | ✅ |
| PUT | `/api/users/avatar` | Upload avatar | ✅ |

### Messages
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/messages/:userId` | Get conversation | ✅ |
| POST | `/api/messages/upload-image` | Upload image | ✅ |
| PUT | `/api/messages/seen/:senderId` | Mark as seen | ✅ |

---

## ⚡ Socket.IO Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `user:online` | `userId` | Register user as online |
| `message:send` | `{senderId, receiverId, content, type, imageUrl}` | Send a message |
| `typing:start` | `{senderId, receiverId}` | Started typing |
| `typing:stop` | `{senderId, receiverId}` | Stopped typing |
| `messages:seen` | `{senderId, receiverId}` | Mark messages as seen |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `message:receive` | Message object | Incoming message |
| `message:sent` | Message object | Sent confirmation |
| `users:online` | `userId[]` | Updated online list |
| `typing:start` | `{senderId}` | Someone is typing |
| `typing:stop` | `{senderId}` | Stopped typing |
| `messages:seen` | `{receiverId}` | Messages were read |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Context API, CSS3 |
| Real-time | Socket.IO 4 |
| HTTP Client | Axios |
| Backend | Node.js, Express 4 |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| File Upload | Multer |
| Date Utils | date-fns |

---

## 🔒 Security Notes

- Passwords hashed with bcrypt (12 rounds)
- JWT tokens expire in 30 days
- File uploads validated by MIME type and extension
- 5MB max image size limit
- CORS configured for specific origins only

---

## 📝 License

MIT
