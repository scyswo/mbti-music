/* =========================================================
   Tool 4：音樂推薦代理（Supabase 版本）
   輸入：mbtiType（例如 "INFP"）
   輸出：3 首對應 MBTI 的歌曲陣列
========================================================= */

import { supabase } from '../lib/supabase';

// 計算歌曲與目標 MBTI 的最高相符字母數（0~4）
function compatScore(mbtiType, songMbtiTypes) {
  return Math.max(...(songMbtiTypes || []).map(t =>
    t.split('').filter((c, i) => c === mbtiType[i]).length
  ));
}

// 從候補池補足至 3 首，按相符程度排序
function fillByCompat(matched, pool, mbtiType) {
  const existingIds = new Set(matched.map(s => s.spotify_id));
  const candidates = pool
    .filter(s => s.spotify_id && s.spotify_id.trim() !== '' && !existingIds.has(s.spotify_id))
    .sort((a, b) => compatScore(mbtiType, b.mbti_types) - compatScore(mbtiType, a.mbti_types));
  return [...matched, ...candidates].slice(0, 3);
}

export async function musicTool(mbtiType) {
  console.log('[Agent] Tool 4 啟動：從 Supabase 查詢推薦歌曲...', mbtiType);

  try {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .contains('mbti_types', [mbtiType])
      .neq('spotify_id', '');

    if (error) throw error;

    let matched = (data || []).sort(() => Math.random() - 0.5);

    if (matched.length < 3) {
      console.warn('[Agent] Tool 4 警告：符合歌曲不足，依相符度補充');
      const { data: all } = await supabase.from('songs').select('*');
      matched = fillByCompat(matched, all || [], mbtiType);
    }

    const result = matched.slice(0, 3);
    console.log(`[Agent] Tool 4 完成：找到 ${result.length} 首歌`);
    return result;

  } catch (err) {
    console.error('[Agent] Tool 4 錯誤，改從本地讀取：', err);
    try {
      const res = await fetch('/songs.json');
      const allSongs = await res.json();
      const matched = allSongs
        .filter(s => s.mbti_types.includes(mbtiType) && s.spotify_id && s.spotify_id.trim() !== '')
        .sort(() => Math.random() - 0.5);
      return matched.length >= 3 ? matched.slice(0, 3) : fillByCompat(matched, allSongs, mbtiType);
    } catch {
      return [];
    }
  }
}