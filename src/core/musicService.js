import { fetchLocalCSV, getTopSimilarSongs } from '../helpers/musicMath';
import { supabase } from '../lib/supabase';

const LOCAL_CSV_PATHS = {
  '/songs/CH_1.csv':   'zh',
  '/songs/EN_1.csv':   'en',
  '/songs/KPOP_1.csv': 'ko',
};

export async function fetchSpotifyTracks() {
  try {
    const results = await Promise.allSettled(
      Object.entries(LOCAL_CSV_PATHS).map(async ([path, lang]) => {
        const songs = await fetchLocalCSV(path);
        return songs.map(s => ({ ...s, lang }));
      })
    );
    const songs = results
      .filter(r => r.status === 'fulfilled' && r.value.length > 0)
      .flatMap(r => r.value);
    if (songs.length > 0) return songs;
  } catch (err) {
    console.info('[musicService] 本地 CSV 失敗，改用 Supabase:', err.message);
  }
  try {
    const { data, error } = await supabase
      .from('spotify_tracks')
      .select('spotify_id, name, artist, valence, energy, danceability, tempo, acousticness');
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('[musicService] Supabase 查詢失敗:', err.message);
    return [];
  }
}

export async function getRecommendedSongs(avg, n = 3) {
  const songs = await fetchSpotifyTracks();
  return getTopSimilarSongs(avg, songs, n);
}
