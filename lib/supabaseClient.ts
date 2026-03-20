import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uebrwcxbnnpzgaefucvk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlYnJ3Y3hibm5wemdhZWZ1Y3ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MDY2MDMsImV4cCI6MjA4NjQ4MjYwM30.pR1MKq5tcbTDxARfE1i1f4LNc4AFK7jGCHo3kMAYhXY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
