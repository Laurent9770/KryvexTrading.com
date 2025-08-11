# Kryvex Trading Platform - Frontend

## Environment Setup

To run this application, you need to set up your environment variables. Create a `.env` file in the `frontend` directory with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# WebSocket URL for real-time features
VITE_WS_URL=wss://your-project.supabase.co/realtime/v1
```

### How to get your Supabase credentials:

1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the "Project URL" and paste it as `VITE_SUPABASE_URL`
4. Copy the "anon public" key and paste it as `VITE_SUPABASE_ANON_KEY`
5. For the WebSocket URL, replace `https://` with `wss://` in your project URL and add `/realtime/v1`

### Example:
```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzNjU0NzI5MCwiZXhwIjoxOTUyMTIzMjkwfQ.example
VITE_WS_URL=wss://abcdefghijklmnop.supabase.co/realtime/v1
```

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Troubleshooting

If you see "Supabase client initialization failed" errors:

1. Check that your `.env` file exists in the `frontend` directory
2. Verify that your Supabase URL and anon key are correct
3. Make sure your Supabase project is active and accessible
4. Check the browser console for detailed error messages
