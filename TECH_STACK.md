# Tech Stack Documentation

## 🏗️ Architecture Overview

StudyHelplanner is a modern, full-stack web application built with a **JAMstack architecture** - JavaScript, APIs, and Markup. The application follows a **client-server model** with real-time capabilities and AI-powered features.

## 🎯 Core Technologies

### Frontend Stack
```
React 19 + TypeScript + Vite + Tailwind CSS
```

**React 19** (UI Framework)
- Latest version with concurrent features
- Server Components ready
- Optimistic UI updates
- Built-in state management

**TypeScript** (Type Safety)
- Full type coverage across the application
- Interface definitions for all data structures
- Compile-time error checking
- Enhanced developer experience

**Vite** (Build Tool & Dev Server)
- Lightning-fast HMR (Hot Module Replacement)
- Optimized production builds
- Modern ES modules support
- Plugin ecosystem

**Tailwind CSS** (Styling)
- Utility-first CSS framework
- Responsive design utilities
- Dark mode support
- Custom brand colors integration

### Backend & Database
```
Supabase (PostgreSQL + Auth + Real-time)
```

**Supabase Platform**
- **PostgreSQL Database** - Primary data storage
- **Authentication** - User management and security
- **Real-time Subscriptions** - Live updates
- **Row Level Security (RLS)** - Data protection
- **Storage** - File uploads (images, documents)
- **Edge Functions** - Serverless functions (future use)

### AI Integration
```
Google Gemini AI + JSON Mode
```

**Google Gemini 2.5 Flash**
- Content generation (flashcards, quizzes, hints)
- Mathematical equation support (LaTeX)
- Structured JSON responses with schema validation
- Rate limiting and error handling

## 📱 Client-Side Architecture

### Component Structure
```
src/
├── components/          # Reusable UI components
│   ├── Auth.tsx       # Authentication forms
│   ├── Sidebar.tsx    # Main navigation
│   ├── SubjectView.tsx # Subject interactions
│   ├── NotesView.tsx  # Notes management
│   └── FocusMode.tsx  # Study sessions
├── hooks/              # Custom React hooks
├── services/           # API integrations
├── types.ts           # TypeScript definitions
└── constants/         # App constants
```

### State Management
- **React Hooks** - Local component state
- **Context API** - Global user state
- **Supabase Real-time** - Live data synchronization
- **URL State** - Navigation and routing

### UI/UX Features
- **Responsive Design** - Mobile-first approach
- **Dark Mode** - System preference detection
- **Touch Gestures** - Mobile interactions
- **Progressive Web App** - PWA capabilities
- **Accessibility** - ARIA labels and semantic HTML

## 🗄️ Database Architecture

### Core Tables
```sql
users              # User profiles and preferences
notes              # User-generated study notes
subjects           # Academic subjects and topics
community_resources # Shared study materials
focus_sessions     # Study tracking data
ai_usage_logs      # AI generation tracking
```

### Database Features
- **Row Level Security (RLS)** - User data isolation
- **Foreign Key Constraints** - Data integrity
- **Indexes** - Query optimization
- **Triggers** - Automated data validation
- **Real-time Subscriptions** - Live updates

## 🔐 Security Architecture

### Authentication Flow
```
Email/Password → Supabase Auth → JWT Token → Secure API Calls
```

### Security Measures
- **JWT Tokens** - Secure session management
- **Row Level Security** - Database-level access control
- **Environment Variables** - Sensitive data protection
- **HTTPS Only** - Encrypted communication
- **Input Validation** - XSS prevention
- **CORS Configuration** - Cross-origin security

## 🚀 Deployment Architecture

### Production Environment
```
Vercel/Netlify → CDN → Supabase → Google AI
```

### Deployment Pipeline
1. **Code Push** → GitHub Repository
2. **Automatic Build** → Vercel/Netlify
3. **Asset Optimization** → CDN Distribution
4. **Database** → Supabase Cloud
5. **AI Services** → Google Gemini API

### Performance Optimizations
- **Code Splitting** - Lazy loading components
- **Image Optimization** - WebP format, lazy loading
- **Caching Strategy** - Browser and CDN caching
- **Bundle Analysis** - Size optimization
- **Service Worker** - Offline capabilities

## 🔧 Development Workflow

### Local Development
```bash
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Build preview
npm run lint         # Code quality
```

### Development Tools
- **ESLint** - Code quality and consistency
- **TypeScript** - Type checking
- **Prettier** - Code formatting
- **Git Hooks** - Pre-commit validation
- **VS Code** - Integrated development

### Code Quality
- **TypeScript Strict Mode** - Maximum type safety
- **ESLint Rules** - Code standards
- **Component Documentation** - JSDoc comments
- **Error Boundaries** - Graceful error handling

## 📊 Monitoring & Analytics

### Application Metrics
- **User Analytics** - Feature usage tracking
- **Performance Monitoring** - Load times, errors
- **AI Usage Tracking** - Generation limits and costs
- **Database Performance** - Query optimization

### Logging Strategy
- **Client-side Errors** - Console logging + error boundaries
- **API Errors** - Structured error responses
- **Performance Metrics** - Core Web Vitals
- **User Actions** - Feature interaction tracking

## 🔮 Future Technology Roadmap

### Version 1.1 Enhancements
- **Service Workers** - Advanced offline support
- **WebSockets** - Real-time collaboration
- **WebAssembly** - Performance-critical computations
- **Progressive Web App** - App store distribution

### Version 2.0 Technologies
- **Mobile Apps** - React Native or Flutter
- **Microservices** - Scalable backend architecture
- **Machine Learning** - Custom AI models
- **Blockchain** - Achievement verification

## 📚 Third-Party Dependencies

### Core Dependencies
```json
{
  "react": "^19.0.0",
  "typescript": "^5.0.0",
  "vite": "^5.0.0",
  "tailwindcss": "^3.4.0",
  "@supabase/supabase-js": "^2.39.0",
  "@google/genai": "^0.2.0"
}
```

### UI Libraries
```json
{
  "lucide-react": "^0.303.0",    # Icons
  "react-markdown": "^9.0.0",     # Markdown rendering
  "remark-math": "^6.0.0",        # Math support
  "rehype-katex": "^7.0.0"        # LaTeX rendering
}
```

### Development Tools
```json
{
  "@types/react": "^18.2.0",
  "eslint": "^8.55.0",
  "prettier": "^3.1.0"
}
```

## 🎯 Performance Benchmarks

### Core Web Vitals Targets
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1
- **FCP (First Contentful Paint)**: < 1.8s

### Bundle Size Optimization
- **Initial Load**: < 500KB gzipped
- **Route Chunks**: < 100KB each
- **Image Optimization**: WebP format, lazy loading
- **Font Loading**: Subset fonts, display-swap

## 🔗 API Architecture

### Internal APIs
- **Supabase Client** - Database operations
- **Gemini Service** - AI content generation
- **Community Library** - Resource sharing

### External Integrations
- **Google Gemini AI** - Content generation
- **Supabase Auth** - User authentication
- **Supabase Storage** - File management

### Data Flow
```
User Input → React Component → Service Layer → External API → Response → UI Update
```

## 🛡️ Reliability & Scalability

### Error Handling
- **Try-Catch Blocks** - Graceful error recovery
- **Error Boundaries** - Component-level error isolation
- **Fallback Content** - AI generation failures
- **Retry Logic** - Network resilience

### Scalability Features
- **Horizontal Scaling** - Serverless architecture
- **Database Pooling** - Connection management
- **CDN Distribution** - Global content delivery
- **Load Balancing** - Traffic distribution

---

**Last Updated**: March 2025  
**Version**: 1.0.0  
**Maintainer**: StudyHelplanner Development Team
