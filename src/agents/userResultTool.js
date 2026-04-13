/* =========================================================
   Tool 5：用戶結果儲存代理
   輸入：{ nickname, answers, mbtiResult }
   輸出：儲存成功或失敗的狀態
========================================================= */

import { supabase } from '../lib/supabase';

export async function userResultTool({ nickname, answers, mbtiResult }) {
  console.log('[Agent] Tool 5 啟動：儲存用戶結果到 Supabase...');

  try {
    const { data, error } = await supabase
      .from('user_results')
      .insert([
        {
          nickname: nickname,
          answers: answers,
          mbti_result: mbtiResult,
        },
      ])
      .select();

    if (error) throw error;

    const shareId = data?.[0]?.id ?? null;
    console.log('[Agent] Tool 5 完成：用戶資料已儲存，shareId:', shareId);
    return { success: true, data, shareId };

  } catch (err) {
    console.error('[Agent] Tool 5 錯誤：', err);
    return { success: false, error: err.message };
  }
}
