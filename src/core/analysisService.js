import { analyzeMbtiPersonality } from './geminiService';
import { buildLocalAnalysis } from '../helpers/quizConfig';
import { getRecommendedSongs } from './musicService';

// onStatus(msg): 'analyzing' | 'loading_songs'
export async function runV2Analysis(avg, { onStatus } = {}) {
  onStatus?.('analyzing');

  let analysis;
  try {
    analysis = await analyzeMbtiPersonality(avg);
  } catch (err) {
    console.warn('[analysisService] Agent 2 失敗，降級至本地 DIM_CONFIG 分析:', err?.message);
    // Graceful Fallback：依 avgFeatures 動態組合，確保一定有完整報告
    analysis = buildLocalAnalysis(avg);
  }

  onStatus?.('loading_songs');
  const topSongs = await getRecommendedSongs(avg, 3);

  return { analysis, topSongs };
}
