# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the React-based BPMN collaborative editor.

## Project Overview

This is a **React-based BPMN Collaborative Editor** - a modern rewrite of the legacy jQuery-based application. Built with React + TypeScript + Vite + Ant Design for better maintainability and developer experience.

**Current Status**: In active development. Basic structure completed, implementing core features.

## Architecture & Technology Stack

### Technology Stack
- **Frontend**: React 19 + TypeScript + Vite
- **UI Framework**: Ant Design 5 + Tailwind CSS
- **BPMN Editor**: bpmn-js library
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Real-time Collaboration**: Y-Supabase (Yjs + Supabase integration)
- **Routing**: React Router DOM
- **Build Tool**: Vite
- **Package Manager**: npm

### Project Structure
```
bpmn-editor/
├── src/
│   ├── components/          # React components
│   │   ├── LoginPage.tsx    # Authentication page
│   │   ├── Dashboard.tsx    # Project management dashboard
│   │   ├── BpmnEditorPage.tsx  # BPMN editor page
│   │   └── BpmnEditor.tsx   # BPMN editor component
│   ├── contexts/           # React Context providers
│   │   ├── AuthContext.tsx  # Authentication state management
│   │   └── ProjectContext.tsx # Project/diagram state management
│   ├── App.tsx             # Main application component
│   ├── App.css             # Global styles
│   └── main.tsx            # Application entry point
├── public/                 # Static assets
├── package.json            # Dependencies and scripts
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── TODO.md                 # Development roadmap
└── CLAUDE.md               # This file
```

## Development Commands

### Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Preview production build
npm run preview
```

### Dependencies
```bash
# Install dependencies
npm install

# Add new dependency
npm install <package-name>

# Add dev dependency
npm install -D <package-name>
```

## Current Development Status

### ✅ Completed Features
- [x] **Project Setup**: React + Vite + TypeScript + Ant Design
- [x] **Authentication**: Supabase Auth with Google OAuth
- [x] **Routing**: React Router with protected routes
- [x] **Login Page**: User-friendly authentication UI
- [x] **Dashboard**: Project and diagram management
- [x] **BPMN Editor**: Basic bpmn-js integration
- [x] **Context Management**: AuthContext and ProjectContext
- [x] **Basic Styling**: Ant Design + Custom CSS

### 🔄 In Progress
- [ ] **Environment Setup**: .env configuration
- [ ] **TypeScript Improvements**: Fix type errors
- [ ] **Y-Supabase Integration**: Real-time collaboration

### 📋 Next Priority Tasks
1. **Environment Configuration**
   - Create `.env` file with Supabase credentials
   - Test Supabase connection
   - Verify authentication flow

2. **TypeScript Improvements**
   - Fix existing TypeScript errors
   - Add proper type definitions
   - Improve type safety

3. **Y-Supabase Integration**
   - Install y-supabase package
   - Implement SupabaseProvider
   - Add real-time collaboration

## Key Components

### AuthContext
- Manages authentication state
- Provides login/logout functionality
- Handles Google OAuth integration
- Supabase client configuration

### ProjectContext
- Manages projects and diagrams
- CRUD operations for projects/diagrams
- Database integration with Supabase
- Auto-save functionality

### BpmnEditor
- Integrates bpmn-js modeler
- Handles BPMN XML import/export
- Manages diagram state
- Supports real-time collaboration (planned)

## Environment Variables

Create a `.env` file in the root directory:
```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Database Schema

The application uses Supabase with the following main tables:
- `profiles` - User profiles
- `projects` - Project containers
- `diagrams` - BPMN diagrams with XML content
- `project_members` - Project sharing and permissions
- `folders` - Folder structure (planned)

## Development Guidelines

### Code Style
- Use TypeScript for all new files
- Follow React hooks patterns
- Use Ant Design components consistently
- Implement proper error handling
- Add loading states for async operations

### Component Structure
- Keep components small and focused
- Use React hooks for state management
- Implement proper prop types
- Add proper error boundaries
- Use Context for global state

### Real-time Collaboration
- Use Y-Supabase for Yjs integration
- Implement awareness for user presence
- Handle connection states properly
- Add conflict resolution
- Implement auto-save with debouncing

## Testing Strategy

### Unit Testing (Planned)
- Component testing with React Testing Library
- Context testing
- Utility function testing

### Integration Testing (Planned)
- API integration tests
- Authentication flow tests
- Real-time collaboration tests

### E2E Testing (Planned)
- User workflow testing
- Cross-browser compatibility
- Performance testing

## Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

### Deployment Targets
- **Primary**: Vercel (recommended)
- **Alternative**: Netlify, Railway
- **Docker**: Containerized deployment

## Performance Considerations

### Optimization Strategies
- Code splitting with React.lazy
- Memoization for expensive operations
- Virtual scrolling for large lists
- Debouncing for real-time updates
- Image optimization

### Bundle Analysis
```bash
npm run build
# Analyze bundle size and optimize
```

## Security Best Practices

### Authentication
- Use Supabase Auth for secure authentication
- Implement proper JWT token handling
- Add rate limiting for API calls
- Validate all user inputs

### Data Protection
- Use Row Level Security (RLS) in Supabase
- Implement proper CORS configuration
- Sanitize user inputs
- Encrypt sensitive data

## Troubleshooting

### Common Issues
1. **TypeScript Errors**: Check type definitions and imports
2. **Supabase Connection**: Verify environment variables
3. **Build Errors**: Check dependency versions
4. **Styling Issues**: Verify Ant Design imports

### Debug Commands
```bash
# Check TypeScript errors
npx tsc --noEmit

# Check linting issues
npm run lint

# Clear cache
rm -rf node_modules package-lock.json
npm install
```

## Related Files

- `TODO.md` - Detailed development roadmap
- `package.json` - Dependencies and scripts
- `vite.config.ts` - Build configuration
- `tsconfig.json` - TypeScript configuration

## Migration from Legacy

This React application replaces the legacy jQuery-based editor in the parent directory. Key improvements:
- **Modern Stack**: React + TypeScript vs jQuery + JavaScript
- **Better Architecture**: Component-based vs DOM manipulation
- **Type Safety**: Full TypeScript support
- **Developer Experience**: Vite dev server, hot reload
- **UI Consistency**: Ant Design component library
- **Real-time**: Y-Supabase integration

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

3. **Start development**:
   ```bash
   npm run dev
   ```

4. **Access application**:
   - Development: http://localhost:5173
   - Login with Google OAuth or email/password

## Development Rules

- **Always use TypeScript**: No plain JavaScript files
- **Follow React patterns**: Hooks, functional components
- **Use Ant Design**: Consistent UI components
- **Implement proper error handling**: Try-catch blocks, error boundaries
- **Add loading states**: Better UX for async operations
- **Test thoroughly**: Each feature should be tested
- **Document changes**: Update TODO.md for significant changes
- **Commit frequently**: Small, focused commits

## Important Notes

- This is a complete rewrite, not a migration
- Legacy code in parent directory is for reference only
- Focus on modern React patterns and best practices
- Y-Supabase integration is key for real-time collaboration
- Prioritize user experience and performance
- Follow the roadmap in TODO.md for development sequence

---

**Last Updated**: 2025-07-09  
**Version**: 1.0.0  
**Author**: Claude Code Assistant