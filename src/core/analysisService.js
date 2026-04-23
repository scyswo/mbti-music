import { analyzeMbtiPersonality } from './geminiService';
import { buildLocalAnalysis } from '../helpers/quizConfig';
import { getRecommendedSongs } from './musicService';
import { userResultTool } from '../agents/userResultTool';

// onStatus(msg): 'analyzing' | 'loading_songs'
export async function runV2Analysis(avg, { onStatus, nickname } = {}) {
  onStatus?.('analyzing');

  let analysis;
  try {
    analysis = await analyzeMbtiPersonality(avg);
  } catch (err) {
    analysis = buildLocalAnalysis(avg);
  }

  onStatus?.('loading_songs');
  let topSongs = [];
  try {
    topSongs = await getRecommendedSongs(avg, 3);
  } catch {}

  userResultTool({
    nickname: nickname || '匿名',
    answers: avg,
    mbtiResult: analysis.mbtiType,
  });

  return { analysis, topSongs };
}
