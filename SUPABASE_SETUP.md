# Supabase Setup

## 1. Create the project
- Open [Supabase dashboard](https://supabase.com/dashboard)
- Create a new project on the free plan

## 2. Create the table
- Open the SQL editor
- Run the SQL from:
  - `supabase/app_state.sql`

## 3. Copy the project keys
- Open `Project Settings -> API`
- Copy:
  - `Project URL`
  - `anon public key`

## 4. Add the env file
- In `client`, create a file named `.env`
- Copy from `client/.env.example`
- Fill in:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 5. Install and run

```powershell
cd C:\Users\Admin\OneDrive\Desktop\fullstack-order\client
npm.cmd install
npm.cmd run dev
```

## Tablet / hosted web page
- If you use the app from a tablet through a hosted web link, add the same `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` values in the hosting provider's environment variables and redeploy the frontend.
- The tablet only needs the web link after deployment. It does not need Node.js or the local server.

## Notes
- If the env values are missing, the app still works locally.
- With Supabase configured, orders and customer memory sync through the `app_state` table.
- On first connection to an empty Supabase table, the app keeps your existing local data and uploads it as the first cloud copy.
- The app keeps a rolling 7 days of order/archive/customer-memory data. Older data is removed locally and from Supabase the next time the app opens or syncs.
- This uses a tiny number of rows and is designed to stay comfortable on the Supabase free plan for daily shop use.
- This setup is simple and good for your current free-plan use case.
