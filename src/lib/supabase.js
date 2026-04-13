/* =========================================================
   Supabase 連線設定
   請先在專案根目錄建立 .env 檔案並填入你的金鑰
========================================================= */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ 請在 .env 檔案填入 Supabase 金鑰！');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
