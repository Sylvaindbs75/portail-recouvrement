import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const cle = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !cle) {
  throw new Error(
    'Configuration manquante : VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY (voir .env.example).'
  )
}

/** Client navigateur : clé publique uniquement. Les droits sont appliqués par la base (RLS). */
export const supabase = createClient(url, cle, {
  auth: { persistSession: true, autoRefreshToken: true },
})
