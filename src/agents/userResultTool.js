/* =========================================================
   Tool 5：用戶結果儲存代理
   輸入：{ nickname, answers, mbtiResult }
   輸出：儲存成功或失敗的狀態
========================================================= */

import { supabase } from '../lib/supabase';

export async function userResultTool({ nickname, answers, mbtiResult }) {
  try {
    const created_at = new Date(Date.now() + 8 * 3600 * 1000).toISOString();
    const { data, error } = await supabase
      .from('user_results')
      .insert([{ nickname, answers, mbti_result: mbtiResult, created_at }])
      .select();

    if (error) throw error;

    const shareId = data?.[0]?.id ?? null;
    return { success: true, data, shareId };

  } catch (err) {
    return { success: false, error: err.message };
  }
}
