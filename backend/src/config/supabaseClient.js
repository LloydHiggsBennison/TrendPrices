const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (Boolean(url) !== Boolean(key))
  throw new Error("Configura SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY juntas.");
const supabase =
  url && key
    ? createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;
module.exports = { supabase };
