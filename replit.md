# VolleyTracker Pro

## Overview

VolleyTracker Pro is a comprehensive volleyball game tracking application that enables real-time scoring, player statistics management, and game analysis. The system allows users to create games, manage team rosters, track live scores across multiple sets, and monitor individual player performance metrics including kills, assists, digs, blocks, aces, and errors.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing with support for game-specific URLs
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Components**: Radix UI primitives with shadcn/ui component library for consistent design
- **Styling**: Tailwind CSS with custom CSS variables for theming and responsive design
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API structure with dedicated routes for games and players
- **Request Logging**: Custom middleware for API request tracking and performance monitoring
- **Error Handling**: Centralized error handling middleware with proper HTTP status codes
- **Development**: Hot module replacement via Vite integration for seamless development experience

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Connection**: Neon serverless database for scalable PostgreSQL hosting
- **Schema Management**: Drizzle Kit for database migrations and schema synchronization
- **Development Storage**: In-memory storage implementation for rapid prototyping and testing
- **Data Validation**: Zod schemas for runtime type checking and API validation

### Component Architecture
- **Game Setup**: Initial game creation with team name configuration
- **Live Scoreboard**: Real-time score tracking with automatic set completion logic, volleyball scoring rules, and undo functionality
- **Player Roster**: Dynamic player management with position tracking and jersey numbers
- **Statistics Tracking**: Individual player performance metrics with increment/decrement controls
- **Game Summary**: End-game statistics export and game state management
- **Modal System**: Reusable modal components for player creation and game interactions
- **Set Management**: Automatic set completion when team reaches 25 points with 2-point lead requirement

### External Dependencies

- **Database Services**: Neon serverless PostgreSQL for production database hosting
- **UI Framework**: Radix UI for accessible, unstyled UI primitives
- **Development Tools**: Replit integration with cartographer plugin for enhanced development experience
- **Build Tools**: Vite for fast development server and optimized production builds
- **Validation**: Zod for schema validation across client and server boundaries
- **Date Handling**: date-fns for consistent date formatting and manipulation
- **Styling**: Tailwind CSS for utility-first styling approach
- **Icons**: Lucide React for consistent iconography throughout the application