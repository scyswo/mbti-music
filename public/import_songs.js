const { createClient } = require('@supabase/supabase-js');
const songs = require('./songs.json');

const supabase = createClient(
  'https://bdamchxggftejfpgxbrm.supabase.co',  // 直接貼，不用 .env
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkYW1jaHhnZ2Z0ZWpmcGd4YnJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwMDExMDIsImV4cCI6MjA5MTU3NzEwMn0.8AyR6RTPfemk6XwGupoG7Sgr4-q2NsCksRUfIebAFl4'
);

async function importSongs() {
  const { data, error } = await supabase.from('songs').insert(songs);
  if (error) console.error('錯誤：', error);
  else console.log('✅ 匯入完成！');
}

importSongs();