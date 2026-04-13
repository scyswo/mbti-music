/* =========================================================
   Tool 4：音樂推薦代理（Supabase 版本）
   輸入：mbtiType（例如 "INFP"）
   輸出：3 首對應 MBTI 的歌曲陣列
========================================================= */

import { supabase } from '../lib/supabase';

export async function musicTool(mbtiType) {
  console.log('[Agent] Tool 4 啟動：從 Supabase 查詢推薦歌曲...', mbtiType);

  try {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .contains('mbti_types', [mbtiType])
      .neq('spotify_id', '');

    if (error) throw error;

    let pool = data;
    if (!pool || pool.length < 3) {
      console.warn('[Agent] Tool 4 警告：符合歌曲不足，使用備援歌曲');
      const { data: fallback } = await supabase
        .from('songs')
        .select('*')
        .neq('spotify_id', '');
      pool = fallback || [];
    }

    const shuffled = pool.sort(() => Math.random() - 0.5);
    const result = shuffled.slice(0, 3);

    console.log(`[Agent] Tool 4 完成：找到 ${result.length} 首歌`);
    return result;

  } catch (err) {
    console.error('[Agent] Tool 4 錯誤，改從本地讀取：', err);
    try {
      const res = await fetch('/songs.json');
      const allSongs = await res.json();
      const matched = allSongs.filter(
        s => s.mbti_types.includes(mbtiType) && s.spotify_id && s.spotify_id.trim() !== ''
      );
      const pool = matched.length >= 3 ? matched : allSongs.filter(s => s.spotify_id);
      return pool.sort(() => Math.random() - 0.5).slice(0, 3);
    } catch {
      return [];
    }
  }
}