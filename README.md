# ReFarm Loop

Production-oriented full-stack foundation for a circular agricultural surplus marketplace and recovery network.

## Stack
- Next.js 15 + TypeScript + Tailwind CSS
- Supabase Auth, PostgreSQL, Storage, RLS
- Gemini API + Gemini Vision for advisory AI
- Mapbox-ready route/map layer
- Midtrans-ready payment API
- Vercel-ready deployment

## Role-separated applications
- Supplier Farmer / Market: Home, My Surplus, Discover, Transactions, Activity, Profile, ReFarm AI
- Recovery Partner: Dashboard, Material Demand, Incoming Supply, Recovery, Profile, ReFarm AI
- Collector: Dashboard, Pickup Tasks, Route, History, Profile, ReFarm AI
- Admin: Control Tower with Overview, Network, Material Flow, Operations, Transactions, AI Monitor, Users, Partners, Impact

## Core loop
SURPLUS -> AI -> MATCH -> MOVE -> RECOVER

## Setup
1. Copy `.env.example` to `.env.local` and add credentials.
2. Run the SQL migrations in `supabase/migrations/001_initial.sql`, `002_refarm_features.sql`, and `003_roles_admin.sql` in Supabase SQL Editor.
3. `npm install`
4. `npm run dev`
5. Open `http://localhost:3000`

## Admin account
Do not expose the `admin` role in public registration. Register a normal account first, then promote that user's profile to admin from Supabase SQL using your own user UUID:

```sql
update public.profiles set role='admin' where id='YOUR_USER_UUID';
```

## Gemini
Set `GEMINI_API_KEY`. ReFarm AI is advisory and must not be treated as a safety certification. The database/business state remains authoritative.

## Midtrans
The `/api/midtrans/create` and webhook foundation are included. Use Sandbox credentials during development. Successful production payments incur provider transaction fees; this project does not claim a permanently zero-cost payment operation.

## No dummy data
The application does not seed demo records. Empty states are intentional until real users create records.
