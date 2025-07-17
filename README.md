# Nevexa - Social Media Platform

A modern, full-stack social media platform built with Next.js and Express.js, featuring real-time messaging, post sharing, and comprehensive admin controls.

## 🚀 Features

- **User Authentication** - Secure JWT-based authentication with Passport.js
- **Real-time Messaging** - Socket.io powered chat system with unread message tracking
- **Post Management** - Create, share, and interact with posts including image uploads
- **Admin Dashboard** - Comprehensive admin panel for managing users, posts, reports, and comments
- **Responsive Design** - Mobile-first design with dedicated mobile navigation
- **Dark/Light Theme** - Theme switching with system preference detection
- **File Uploads** - Cloudinary integration for image storage
- **Report System** - Content moderation and reporting functionality

## 🛠 Tech Stack

### Frontend (Client)
- **Framework**: Next.js 15.2.4 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React hooks and context
- **Real-time**: Socket.io-client
- **Forms**: React Hook Form with Zod validation
- **UI Components**: Radix UI primitives

### Backend (Server)
- **Runtime**: Node.js
- **Framework**: Express.js 5.1.0
- **Database**: MongoDB with Mongoose
- **Authentication**: Passport.js with JWT strategy
- **File Upload**: Multer with Cloudinary storage
- **Real-time**: Socket.io
- **Validation**: Joi

## 📁 Project Structure

```
nevexa/
├── client/                 # Next.js frontend application
│   ├── app/               # App router pages
│   ├── components/        # Reusable UI components
│   ├── lib/              # Utility functions and API clients
│   └── styles/           # Global styles
├── server/               # Express.js backend application
│   ├── routes/          # API route handlers
│   ├── models/          # MongoDB schemas
│   ├── middleware/      # Custom middleware
│   └── utils/           # Server utilities
└── README.md
```

## 🚦 Getting Started

### Prerequisites

- Node.js (v18.18.0 or higher)
- MongoDB database
- Cloudinary account (for image uploads)

### Environment Variables

Create `.env` files in both client and server directories:

#### Client (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

#### Server (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Installation & Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd nevexa
```

2. **Install server dependencies**
```bash
cd server
npm install
```

3. **Install client dependencies**
```bash
cd ../client
npm install
```

4. **Start the development servers**

Terminal 1 (Server):
```bash
cd server
npm run dev
```

Terminal 2 (Client):
```bash
cd client
npm run dev
```

5. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📱 Key Features

### Authentication System
- User registration and login
- JWT token-based authentication
- Protected routes and middleware

### Social Features
- Create and share posts with images
- Real-time messaging system
- User discovery and connections
- Comment system with moderation

### Admin Panel
- User management and moderation
- Post and comment oversight
- Report handling system
- Content moderation tools

### Real-time Features
- Live chat messaging
- Unread message notifications
- Real-time post updates
- Socket.io integration

## 🔧 Available Scripts

### Client
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Server
- `npm run dev` - Start development server with nodemon
- `npm run start` - Start production server
- `npm run dev:node` - Start with node (no auto-reload)

## 🌐 Deployment

The application is configured for deployment on platforms like Vercel (frontend) and Render (backend).

### Production Configuration
- Frontend builds are optimized with Next.js
- Backend uses production-ready Express configuration
- Environment variables are properly configured
- CORS is set up for cross-origin requests

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🔗 Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Express.js Documentation](https://expressjs.com/)
- [Socket.io Documentation](https://socket.io/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 📞 Support

For support and questions, please open an issue in the repository.

