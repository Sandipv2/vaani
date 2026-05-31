<h1 align="center">Vaani - A Social Media App.</h1>

<p align="center">
  A full-stack social media mobile app built with Expo, React Native, Express, MongoDB, Clerk, Cloudinary, Arcjet, and Stream Chat.
</p>

<p align="center">
  <a href="https://vaaniapp.vercel.app/"><strong>Download APK</strong></a>
  |
  <a href="#features">Features</a>
  |
  <a href="#tech-stack">Tech Stack</a>
  |
  <a href="#getting-started">Getting Started</a>
</p>

---

## Overview

Vaani is a mobile-first social platform where users can authenticate securely, create rich media posts, discover people, manage their profiles, receive social notifications, and chat privately in real time.

The project is organized as a production-minded monorepo with a React Native mobile client and a Node.js API backend. It demonstrates end-to-end product development across authentication, media upload, database modeling, protected APIs, real-time messaging, and mobile UX.

## APK Download

You can download the latest Android APK from:

**https://vaaniapp.vercel.app/**

## Features

- **Social authentication** with Clerk OAuth support for Google and Apple sign-in.
- **Home feed** with post creation, pull-to-refresh, likes, comments, and delete support.
- **Rich media posts** with image/video selection, camera capture, preview modals, and Cloudinary uploads.
- **User profiles** with editable profile information, avatar, banner image, bio, location, follower counts, and user-specific posts.
- **People search** by name, username, or full name.
- **Follow system** with follower/following relationships and follow notifications.
- **Notifications** for likes, comments, and follows.
- **Direct messaging** powered by Stream Chat, including unread counts, file attachments, image messages, message deletion, and hidden conversations.
- **Privacy protection** using Expo screen-capture and app-switcher protection.
- **API protection** with Clerk authentication middleware and Arcjet security middleware.

## Tech Stack

### Mobile

- **Expo 54** and **React Native 0.81**
- **Expo Router** for file-based navigation
- **TypeScript**
- **NativeWind** and Tailwind CSS utilities
- **TanStack Query** for server-state management
- **Clerk Expo** for authentication
- **Stream Chat** for real-time messaging
- **Axios** for API communication
- **Expo Image Picker, Document Picker, Video, Secure Store, Screen Capture**

### Backend

- **Node.js** and **Express 5**
- **MongoDB** with **Mongoose**
- **Clerk Express** for protected routes
- **Cloudinary** for image and video storage
- **Multer** for multipart upload handling
- **Arcjet** for API protection
- **Stream Chat server SDK**
- **Vercel** deployment configuration

## Project Structure

```text
vaani/
|-- backend/
|   |-- src/
|   |   |-- config/          # Environment, database, Cloudinary, Arcjet helpers
|   |   |-- controllers/     # Request handlers for users, posts, comments, notifications, chat
|   |   |-- middlewares/     # Auth, upload, and security middleware
|   |   |-- models/          # Mongoose schemas
|   |   |-- routes/          # Express route modules
|   |   `-- server.js        # API entry point
|   |-- package.json
|   `-- vercel.json
|
|-- mobile/
|   |-- app/                 # Expo Router screens and layouts
|   |-- assets/              # App icons, logos, and images
|   |-- components/          # Reusable UI and feature components
|   |-- hooks/               # Data fetching and feature hooks
|   |-- types/               # Shared TypeScript types
|   |-- utils/               # API client and formatters
|   |-- app.json
|   `-- package.json
|
`-- README.md
```

## Architecture

The mobile app communicates with the backend through a versioned REST API at `/api/v1`. Clerk handles user identity on both the client and server, while the backend syncs authenticated Clerk users into MongoDB for social features such as followers, posts, comments, and notifications.

Media files are uploaded through multipart requests and stored on Cloudinary. Chat features use Stream Chat: the backend issues authenticated Stream tokens, and the mobile client connects users to direct message channels.

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm
- Expo development environment
- MongoDB database
- Clerk application
- Cloudinary account
- Arcjet key
- Stream Chat application

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd vaani
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
ARCJET_KEY=your_arcjet_key
STREAM_API_KEY=your_stream_api_key
STREAM_API_SECRET=your_stream_api_secret
```

Start the backend:

```bash
npm run dev
```

The API should respond at:

```text
http://localhost:5000
```

### 3. Install mobile dependencies

```bash
cd ../mobile
npm install
```

Create `mobile/.env`:

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
EXPO_PUBLIC_API_BASE_URL=http://localhost:5000
```

Start the mobile app:

```bash
npm start
```

Then open the app using an Android emulator, iOS simulator, or Expo development build.

## API Overview

| Area | Endpoints |
| --- | --- |
| Users | `GET /api/v1/users/me`, `POST /api/v1/users/sync`, `PUT /api/v1/users/profile`, `GET /api/v1/users/search`, `POST /api/v1/users/follow/:targetUserId` |
| Posts | `GET /api/v1/posts`, `GET /api/v1/posts/:postId`, `POST /api/v1/posts`, `POST /api/v1/posts/:postId/like`, `DELETE /api/v1/posts/:postId` |
| Comments | `GET /api/v1/comments/post/:postId`, `POST /api/v1/comments/post/:postId`, `DELETE /api/v1/comments/:commentId` |
| Notifications | `GET /api/v1/notifications`, `DELETE /api/v1/notifications/:notificationId` |
| Chat | `GET /api/v1/chat/token`, `POST /api/v1/chat/channels`, `DELETE /api/v1/chat/channels/:channelId` |

### Backend

```bash
npm run dev      # Start API in watch mode
npm start        # Start API normally
```

### Mobile

```bash
npm start        # Start Expo
npm run android  # Run Android build
npm run ios      # Run iOS build
npm run web      # Start Expo web
npm run lint     # Run Expo lint
```

## Deployment

- The backend includes `backend/vercel.json` for Vercel deployment.
- The mobile APK is distributed through the Vaani download page: **https://vaaniapp.vercel.app/**
- Configure production environment variables in the hosting dashboard before deploying.

## Author

Built by **Sandip** as a full-stack mobile social networking project.