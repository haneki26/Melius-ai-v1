import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qrwiuzzvadtldsvngvbr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyd2l1enp2YWR0bGRzdm5ndmJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NDgxMTgsImV4cCI6MjA5MjUyNDExOH0.OQgUf9JxxHBhE_gu7_6uuU6pHcAxjpVfuf-6bVb6DeU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);