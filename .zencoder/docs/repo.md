# Nevexa - Social Media Platform

## Repository Summary
Nevexa is a full-stack social media platform with a React/Next.js frontend and Node.js/Express backend. The application features user authentication, posts, comments, messaging, and admin functionality.

## Repository Structure
- **client**: Next.js frontend application with TypeScript
- **server**: Express.js backend API with MongoDB integration
- **.vscode**: VS Code configuration
- **.zencoder**: Documentation and configuration

## Projects

### Client (Next.js Frontend)
**Configuration File**: package.json, next.config.mjs

#### Language & Runtime
**Language**: TypeScript
**Version**: TypeScript 5.x
**Framework**: Next.js 15.2.4
**Package Manager**: npm/pnpm

#### Dependencies
**Main Dependencies**:
- React 18.2.0
- Next.js 15.2.4
- Radix UI components
- Socket.io-client 4.8.1
- React Hook Form 7.54.1
- Zod 3.24.1
- Tailwind CSS 3.4.17

#### Build & Installation
```bash
cd client
npm install
npm run dev    # Development
npm run build  # Production build
npm start      # Start production server
```

#### Testing
No specific testing framework identified in the client project.

### Server (Express.js Backend)
**Configuration File**: package.json

#### Language & Runtime
**Language**: JavaScript (Node.js)
**Framework**: Express 5.1.0
**Package Manager**: npm

#### Dependencies
**Main Dependencies**:
- Express 5.1.0
- Mongoose 8.16.1
- Passport 0.7.0
- Socket.io 4.8.1
- Cloudinary 1.41.3
- Express-session 1.18.1
- Connect-mongo 5.1.0
- Joi 17.0.0

**Development Dependencies**:
- Nodemon 3.1.10

#### Build & Installation
```bash
cd server
npm install
npm run dev    # Development with nodemon
npm start      # Production start
```

#### Environment Configuration
Required environment variables:
- MONGODB_URI: MongoDB connection string
- SESSION_SECRET: Secret for session encryption
- NODE_ENV: Set to 'production' for deployment

## Main Features

### Authentication
- Passport.js with local strategy
- Session-based authentication with MongoDB store
- User registration and login

### Data Models
- User: Profile information and authentication
- Post: Social media posts
- Comment: Post comments
- Chat/Message: Real-time messaging
- Relationship: User connections
- Report: Content reporting

### API Endpoints
- `/api/auth`: Authentication routes
- `/api/posts`: Post management
- `/api/chat`: Messaging functionality
- `/api/admin`: Admin operations
- `/api/users`: User management
- `/api/comments`: Comment operations
- `/api/reports`: Content reporting

### Real-time Communication
- Socket.io for real-time messaging
- Chat functionality between users

### Frontend Architecture
- Next.js App Router
- React components with TypeScript
- Tailwind CSS for styling
- Responsive design with mobile support

### Deployment
- Client: Vercel deployment
- Server: Requires Node.js hosting with MongoDB connection