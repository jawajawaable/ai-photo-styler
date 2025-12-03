import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xbcvrqsbjybkwdyvrirz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhiY3ZycXNianlia3dkeXZyaXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1OTc3MzIsImV4cCI6MjA4MDE3MzczMn0.LtnuuzPhcug-VY0Am2HinRmIltWoPI6LW8Gu-Pz2gb4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
