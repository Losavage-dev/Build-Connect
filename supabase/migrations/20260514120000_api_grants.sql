-- PostgREST (Data API) uses roles `anon` and `authenticated`.
-- If the project was created with "Automatically expose new tables" disabled,
-- these roles may lack privileges even when RLS policies allow access — requests fail from the app.

GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Anonymous: read tables (RLS decides which rows are visible).
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Logged-in users: full DML on existing tables (RLS still applies per operation).
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Sequences (if any columns use serial/bigserial).
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
