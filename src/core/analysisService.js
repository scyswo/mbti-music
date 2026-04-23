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
    analysis = buildLocalAnalysis(avg);
  }

  onStatus?.('loading_songs');
  let topSongs = [];
  try {
    topSongs = await getRecommendedSongs(avg, 3);
  } catch {}

  return { analysis, topSongs };
}
