import { getTopSimilarSongs } from '../helpers/musicMath';
import { supabase } from '../lib/supabase';

export async function fetchSpotifyTracks() {
  const { data, error } = await supabase
    .from('songs')
    .select('spotify_id, name, artist, valence, energy, danceability, tempo, acousticness, lang');
  if (error) throw new Error('[musicService] Supabase 查詢失敗: ' + error.message);
  return data || [];
}

export async function getRecommendedSongs(avg, n = 3) {
  const songs = await fetchSpotifyTracks();
  return getTopSimilarSongs(avg, songs, n);
}
