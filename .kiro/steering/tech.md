---
inclusion: always
---

## Tech Stack & Architecture

This is a Next.js 14 application with TypeScript, using the App Router pattern. Key technologies:

- **Database**: PostgreSQL with Prisma ORM
- **Auth**: Supabase Auth with Row Level Security (RLS)
- **AI**: Mastra framework for AI recommendations
- **Styling**: Tailwind CSS with shadcn/ui components
- **Forms**: React Hook Form with Zod validation
- **State**: SWR for data fetching and caching

## Environment & Security

- **CRITICAL**: Never modify `.env` file - only read `.env.example`
- All sensitive data (API keys, database URLs) must be stored in environment variables
- Use Supabase RLS policies for data access control
- Validate all user inputs using Zod schemas before processing
- Use server actions for secure data mutations

## Code Organization & Patterns

### File Structure

- `app/` - Next.js App Router pages and API routes
- `app/_components/` - Reusable components organized by domain (features/, shared/, ui/)
- `lib/` - Core business logic, utilities, and configurations
- `hooks/` - Custom React hooks
- `prisma/` - Database schema and migrations

### Component Architecture

- Use feature-based component organization under `app/_components/features/`
- Shared UI components in `app/_components/ui/` following shadcn/ui patterns
- Server Components by default, use 'use client' only when necessary
- Prefer composition over inheritance for component design

### Data Layer

- Use Prisma for all database operations
- Generate Zod schemas from Prisma models using `zod-prisma-types`
- Place validation schemas in `lib/validations/`
- Use server actions in `lib/actions/` for data mutations
- API routes in `app/api/` for external integrations only

### Styling & UI

- Use Tailwind CSS with CSS variables for theming
- Follow shadcn/ui component patterns and naming conventions
- Use `cn()` utility from `lib/utils.ts` for conditional classes
- Implement responsive design mobile-first

### Type Safety

- Use TypeScript strict mode
- Generate types from Prisma schema
- Use Zod for runtime validation and type inference
- Export type definitions alongside validation schemas

### Error Handling

- Use custom error classes in `lib/errors/`
- Implement proper error boundaries for React components
- Return structured error responses from API routes
- Use toast notifications for user feedback via Sonner
