# Butcher Order System

A production-minded full-stack order management system built for a real butcher shop workflow.

This project was created to replace paper/manual order tracking in a family butcher shop that handles high-volume phone orders, holiday rushes, future pickup orders, daily preparation totals, customer lookup, and order history.

The application is designed for practical daily use on a tablet in the shop, with a simple interface for fast order entry and low-friction operations.

## Highlights

- Real business use case, not a demo-only CRUD app
- Tablet-first React interface for fast order taking
- Supabase authentication and cloud sync
- Customer memory by name and phone number
- Future order management with automatic rollover into today's orders
- Daily preparation summaries for grill, kebab, and shawarma
- History, daily archive, unpaid order tracking, and price calculation
- AI-assisted voice order draft helper for Arabic speech input

## AI-Assisted Workflow

The app includes an experimental voice order draft assistant.

The assistant helps the shop worker capture a phone order while speaking Arabic near the tablet. It listens in short chunks, combines the transcript, and tries to extract draft order details such as:

- customer name
- phone digits
- item name
- quantity in kilograms
- pickup time
- order notes

The assistant is intentionally draft-only. It never saves an order automatically. The worker reviews and confirms the order manually before saving.

This design keeps the workflow safe for real business use while demonstrating an agent-style AI feature: listening, extracting structured data, and preparing an action for human approval.

## Tech Stack

### Frontend

- React
- Vite
- React Router
- Context API
- CSS responsive/tablet UI
- Browser Speech Recognition API for the free voice draft helper

### Backend

- Node.js
- Express.js

### Data & Auth

- Supabase
- Supabase Auth
- Row Level Security policies
- Local storage fallback
- Rolling retention for recent operational data

## Main Features

### Order Management

- Create, edit, delete, and complete shop orders
- Add multiple items to one order before selecting pickup time
- Track item-level done status
- Add order notes and item notes
- Automatic total price calculation

### Customer Memory

- Save customer name and phone number
- Search customers using the last 3 phone digits
- Auto-fill known customer details when there is a unique match
- Protect against accidental refill while deleting phone digits

### Future Orders

- Schedule orders for future dates
- Group future orders by day
- Automatically move due future orders into today's order page
- Edit an order between today and future without recreating it

### Preparation Summaries

- Daily prep totals for:
  - grill
  - kebab
  - shawarma
- Future prep totals by day
- Small high-visibility panels for shop preparation planning

### History & Archives

- Completed order history
- Daily revenue total
- Unpaid customer tracking
- Automatic daily archive rollover
- Keeps the latest archived days for quick review

### Cloud Sync & Security

- Supabase login protects order/customer data
- App state syncs to Supabase per authenticated user
- Row Level Security limits users to their own data
- Local fallback keeps the app usable when Supabase is not configured

## Project Structure

```text
client/
  React + Vite frontend

server/
  Node.js + Express backend

supabase/
  SQL setup for Supabase app_state table and RLS policies
```

## Run Locally

### Frontend

```bash
cd client
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

### Backend

```bash
cd server
npm install
node src/index.js
```

Backend health endpoint:

```text
http://localhost:5000/api/health
```

## Supabase Setup

1. Create a Supabase project.
2. Run the SQL in `supabase/app_state.sql`.
3. Create an authenticated user in Supabase Auth.
4. Add these environment variables to the frontend:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

For more detail, see `SUPABASE_SETUP.md`.

## What This Project Demonstrates

- Building software from a real operational pain point
- Designing UI for non-technical users under time pressure
- React state management for a multi-page workflow
- Supabase authentication, RLS, and cloud persistence
- Practical data modeling for orders, history, future scheduling, and customers
- Safe AI-assisted UX where the user remains in control
- Iterative product development based on real shop feedback

## Future Improvements

- Better Arabic speech parsing with a dedicated speech-to-text API
- WhatsApp/SMS integration for customer notifications
- Dashboard analytics for busiest days and most ordered items
- Role-based access for multiple workers
- Offline-first sync queue
- Automated tests for core order and archive logic

## Author

Rayan Ibrahem  
Computer Science Graduate - Full Stack Developer

GitHub: https://github.com/rayanib
