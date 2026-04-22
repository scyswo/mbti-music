// ─── v2 共用常數 + 邏輯函數 ──────────────────────────────
import { normalizeTempo } from './musicMath';

export const STYLE_CONFIG = {
  'Chill / Soft':     { emoji: '🍃', zh: '放鬆柔和', color: 'rgba(126,200,227,0.18)', accent: '#7ec8e3' },
  'Sad / Emotional':  { emoji: '🌧️', zh: '感傷情緒', color: 'rgba(147,130,200,0.18)', accent: '#9382c8' },
  'Romantic / Sweet': { emoji: '🌸', zh: '浪漫甜蜜', color: 'rgba(255,158,196,0.18)', accent: '#ff9ec4' },
  'Dark / Moody':     { emoji: '🖤', zh: '黑暗憂鬱', color: 'rgba(80,80,110,0.18)',   accent: '#6b6b8f' },
  'Happy / Bright':   { emoji: '☀️', zh: '歡快明亮', color: 'rgba(255,210,80,0.18)', accent: '#f0b429' },
};

export const PREFERENCE_MAP = {
  INTJ: { likes: '深夜獨自沉浸、能讓大腦放空的複雜編曲', dislikes: '過於商業、重複的主流流行歌', time: '深夜 23:00 之後', genres: ['Ambient', 'Post-Rock', 'Dark Pop', 'Instrumental'] },
  INTP: { likes: '有獨特概念、耐聽的實驗性音樂', dislikes: '太過情緒化或煽情的歌曲', time: '深夜或專注工作時', genres: ['Indie Rock', 'Math Rock', 'Alternative', 'Chill'] },
  ENTJ: { likes: '節奏強勁、有力量感的音樂', dislikes: '太慢或太無聊的背景音樂', time: '早晨出門前、運動時', genres: ['Hip-Hop', 'Power Pop', 'Electronic', 'R&B'] },
  ENTP: { likes: '有點怪、有點挑釁的前衛音樂', dislikes: '過於單調或缺乏創意的歌', time: '不固定，完全看靈感', genres: ['Alternative', 'Funk', 'Indie Pop', 'Experimental'] },
  INFJ: { likes: '能說中情緒、充滿意境的歌詞', dislikes: '太吵或沒有故事感的音樂', time: '深夜或晚上 19:00 之後', genres: ['Indie Folk', 'Dream Pop', 'Acoustic', 'Soul'] },
  INFP: { likes: '夜晚、一個人時陪你發呆或整理情緒', dislikes: '太吵或沒有故事感的歌', time: '深夜或晚上 19:00 之後', genres: ['Indie Pop', 'Soft Pop', 'Dream Pop', 'Chill'] },
  ENFJ: { likes: '溫暖、讓人想分享給朋友的歌曲', dislikes: '太過壓抑或負面的音樂', time: '早晨或和朋友在一起時', genres: ['Pop', 'Soul', 'K-Pop', 'Acoustic'] },
  ENFP: { likes: '讓你跟著哼、充滿能量的快樂歌曲', dislikes: '節奏太緩慢或太沉重的音樂', time: '通勤或任何有靈感的時候', genres: ['Pop', 'Indie Pop', 'Dance', 'K-Pop'] },
  ISTJ: { likes: '固定的歌單、熟悉的老歌和經典', dislikes: '太實驗性或難以預測的音樂', time: '傍晚通勤或睡前固定時段', genres: ['Classic Pop', 'Soft Rock', 'Folk', 'Jazz'] },
  ISFJ: { likes: '溫柔旋律、能喚起美好回憶的歌', dislikes: '太刺激或太吵鬧的音樂', time: '睡前或下午安靜的時候', genres: ['Soft Pop', 'Acoustic', 'City Pop', 'Lo-Fi'] },
  ESTJ: { likes: '節奏穩定、能提升效率的音樂', dislikes: '讓人分心或太過隨性的音樂', time: '工作時或早晨', genres: ['Pop', 'Electronic', 'Dance', 'Hip-Hop'] },
  ESFJ: { likes: '大家都在聽的流行金曲、能一起唱的歌', dislikes: '太冷門或聽不懂的音樂', time: '聚會時或任何有人陪的時候', genres: ['Pop', 'K-Pop', 'Dance Pop', 'R&B'] },
  ISTP: { likes: '有質感、不做作的獨立音樂', dislikes: '太主流或太商業化的歌曲', time: '一個人時或深夜', genres: ['Indie', 'Rock', 'Electronic', 'Lo-Fi'] },
  ISFP: { likes: '聲音質地好、充滿畫面感的音樂', dislikes: '太過喧鬧或聽起來假的音樂', time: '任何想沉浸的時刻', genres: ['Indie Pop', 'Dream Pop', 'Acoustic', 'Chillhop'] },
  ESTP: { likes: '節奏強、Bass 重、讓人動起來的音樂', dislikes: '太慢或太悲傷的歌曲', time: '運動、派對或任何需要能量時', genres: ['Hip-Hop', 'EDM', 'Dance', 'Urban Pop'] },
  ESFP: { likes: '讓你忍不住跳舞的快樂音樂', dislikes: '太安靜或讓氣氛變悶的歌', time: '任何時候都能聽！', genres: ['Pop', 'Dance', 'K-Pop', 'EDM'] },
};

export const LANG_LABEL = { zh: '中文', ko: '韓文', en: 'EN' };

export const DIM_CONFIG = [
  { key: 'valence',      label: '內在心情色', highIcon: '☀️', lowIcon: '🌙', highLabel: '快樂',     lowLabel: '憂鬱'      },
  { key: 'energy',       label: '生活步調',   highIcon: '⚡', lowIcon: '🍃', highLabel: '熱血衝刺', lowLabel: '慢節奏生活' },
  { key: 'danceability', label: '喜好節奏',   highIcon: '💃', lowIcon: '🧘', highLabel: '隨性搖擺', lowLabel: '穩定平靜'   },
  { key: 'tempo',        label: '思考節奏',   highIcon: '🚀', lowIcon: '🐢', highLabel: '快速運轉', lowLabel: '慢慢消化'   },
  { key: 'acousticness', label: '音色偏好',   highIcon: '🎸', lowIcon: '💻', highLabel: '原聲感',   lowLabel: '電子感'     },
];

// ⚠️ 用戶自定義區：根據每個維度的高/低值生成「人話」解讀句
export function getDynamicInsight(key, pct) {
  const high = pct >= 50;
  const map = {
    valence:      { high: '你偏向用音樂維持好心情，是個自帶陽光的靈魂。',     low: '你喜歡能觸碰情緒深處的音樂，感知力豐富而細膩。'   },
    energy:       { high: '你的音樂充滿動力，生活節奏快，隨時準備出發。',     low: '你偏愛沉靜的旋律，享受生活慢下來的瞬間。'         },
    danceability: { high: '你跟著節拍自然律動，音樂讓你的身體自由表達。',     low: '你享受音樂帶來的平靜感，不需要節奏驅動你。'       },
    tempo:        { high: '你的思維運轉飛快，快節奏的音樂才跟得上你。',       low: '你喜歡慢慢品味每個音符，細細消化每段旋律。'       },
    acousticness: { high: '你偏愛真實的原聲質感，木吉他與鋼琴是你的摯友。',   low: '你被電子音效吸引，現代感的音色讓你精神一振。'     },
  };
  return map[key]?.[high ? 'high' : 'low'] || '';
}

// 根據最極端的兩個特質自動合成音樂人格稱號
export function buildDimTitle(avg) {
  const ranked = DIM_CONFIG
    .map(d => ({
      label:   (avg[d.key] || 0.5) >= 0.5 ? d.highLabel : d.lowLabel,
      extreme: Math.abs((avg[d.key] || 0.5) - 0.5),
    }))
    .sort((a, b) => b.extreme - a.extreme);
  const nouns = ['旅人', '靈魂', '探索者', '漫遊者', '冒險家'];
  const noun  = nouns[Math.min(Math.floor((avg.energy || 0.5) * nouns.length), nouns.length - 1)];
  return `${ranked[0].label}的${ranked[1].label}${noun}`;
}

// ⚠️ 用戶自定義區：根據五維數值生成開場總結句
export function buildProfileSummary(avg) {
  const dims = DIM_CONFIG.map(d => ({
    label:   (avg[d.key] || 0) >= 0.50 ? `${d.highIcon}${d.highLabel}` : `${d.lowIcon}${d.lowLabel}`,
    extreme: Math.abs((avg[d.key] || 0.5) - 0.5),
  })).sort((a, b) => b.extreme - a.extreme);
  return `你是位「${dims[0].label} × ${dims[1].label}」的音樂旅人。`;
}

// ⚠️ 用戶自定義區：建立數據與 MBTI 性格的關聯解釋
export function buildWhyConnection(mbti, avg) {
  const top2 = DIM_CONFIG.map(d => {
    const isHigh = (avg[d.key] || 0) >= 0.50;
    return {
      icon:    isHigh ? d.highIcon : d.lowIcon,
      label:   isHigh ? d.highLabel : d.lowLabel,
      extreme: Math.abs((avg[d.key] || 0.5) - 0.5),
    };
  }).sort((a, b) => b.extreme - a.extreme).slice(0, 2);

  const pref = PREFERENCE_MAP[mbti];
  const likeHint = pref ? `${mbti} 本來就偏愛${pref.likes}` : `這是 ${mbti} 的典型音樂傾向`;

  return `你最突出的兩個特質是「${top2[0].icon} ${top2[0].label}」和「${top2[1].icon} ${top2[1].label}」，${likeHint}，兩者一拍即合。`;
}

// ⚠️ 用戶自定義區：標註該歌曲與用戶特徵的重疊點
export function buildSongReason(song, avg) {
  const normSong = {
    valence:      song.valence      || 0,
    energy:       song.energy       || 0,
    danceability: song.danceability || 0,
    tempo:        normalizeTempo(song.tempo || 120),
    acousticness: song.acousticness || 0,
  };
  const THRESHOLD = 0.22;
  const dimNames = { valence: '靈魂色調', energy: '生活步調', danceability: '節奏感', acousticness: '音色偏好' };
  const overlaps = Object.entries(dimNames)
    .filter(([k]) => Math.abs(normSong[k] - (avg[k] || 0.5)) < THRESHOLD)
    .map(([, label]) => label);
  if (overlaps.length === 0) return '這首歌的綜合特徵與你的音樂品味高度相符。';
  return `這首歌我想你會喜歡，因為它擁有相近的${overlaps.slice(0, 2).join('與')}。`;
}

export function calcWeightsFromFeatures(avg) {
  const e  = avg.energy       || 0.5;
  const v  = avg.valence      || 0.5;
  const d  = avg.danceability || 0.5;
  const t  = avg.tempo        || 0.5;
  const ac = avg.acousticness || 0.5;
  const normalize = x => Math.min(100, Math.round(x * 100));
  return [
    { label: 'Chill / Soft',      value: normalize((1 - e + ac) / 2) },
    { label: 'Rhythm / Beat',     value: normalize((e + d) / 2) },
    { label: 'Mood / Atmosphere', value: normalize((v + (1 - e)) / 2) },
    { label: 'Energy',            value: normalize(e) },
    { label: 'K-Pop / Urban',     value: normalize((d + t) / 2) },
  ];
}

export function buildFallbackAnalysis(avg) {
  const type = `${(avg.energy||0)>=0.55?'E':'I'}${(avg.acousticness||0)>=0.50?'S':'N'}${(avg.valence||0)>=0.50?'F':'T'}${(avg.tempo||0)>=0.50?'J':'P'}`;
  const templates = {
    INFP: { musicPersona: '深夜靈魂旅人', summary: '你聽音樂像是在尋找另一個自己。安靜的旋律承載著你說不出口的話，你用音樂理解這個世界。', likes: '喜歡帶感情的抒情歌和空靈的獨立音樂', dislikes: '不太偏好節奏過快或商業感太強的音樂', listenTime: '深夜獨處，任思緒漂流' },
    INFJ: { musicPersona: '月光詩人', summary: '你對音樂有獨特而深刻的品味，能從旋律中感受到普通人聽不見的情感層次。', likes: '喜歡有意境的音樂和說故事的歌詞', dislikes: '不太喜歡流於表面或重複感強的音樂', listenTime: '傍晚思考人生時' },
    INTJ: { musicPersona: '黑暗建築師', summary: '你的音樂品味自成一格，不跟隨潮流，欣賞結構精密的音樂，在複雜的旋律中找到秩序感。', likes: '喜歡複雜的器樂和概念性強的專輯', dislikes: '不喜歡膚淺或過於依賴情緒煽動的歌曲', listenTime: '深夜專注工作時' },
    INTP: { musicPersona: '聲音解構者', summary: '你會把一首歌拆開來聽，研究每個聲部細節。音樂對你來說是一個值得探索的謎題。', likes: '喜歡實驗性音樂和結構新穎的曲子', dislikes: '不太喜歡公式化的流行製作', listenTime: '沉浸思考時作為背景聲' },
    ISFP: { musicPersona: '耳朵畫家', summary: '音樂對你是一種感官體驗，你用整個身體去感受旋律，每首歌都是一幅畫面。', likes: '喜歡有溫度的原聲音樂和即興感', dislikes: '不太喜歡過度製作的電子音樂', listenTime: '創作或一個人發呆時' },
    ISFJ: { musicPersona: '溫柔守護者', summary: '你喜歡熟悉的旋律帶來的安全感。老歌、懷舊金曲和溫暖的人聲是你最好的陪伴。', likes: '喜歡溫柔舒適、有家的感覺的音樂', dislikes: '不喜歡過於尖銳或充滿衝突感的音樂', listenTime: '料理或整理家裡時' },
    ISTP: { musicPersona: '冷靜感受者', summary: '你聽音樂不多話，但每次選歌都精準到位。你喜歡酷而有質感的音樂，不需要太多裝飾。', likes: '喜歡乾淨俐落、帶點冷感的音樂', dislikes: '不喜歡過分甜膩或太煽情的歌', listenTime: '做自己的事不想被打擾時' },
    ISTJ: { musicPersona: '節奏維持者', summary: '你喜歡有規律節奏的音樂，穩定的拍子讓你感到踏實，播放清單從不讓你失望。', likes: '喜歡結構清晰、節奏規律的音樂', dislikes: '不太喜歡無法預測走向的實驗音樂', listenTime: '運動或執行日常任務時' },
    ENFP: { musicPersona: '彩虹追逐者', summary: '你的播放清單包羅萬象，音樂是你和世界連結的橋樑，你用歌曲記錄每個瞬間。', likes: '喜歡充滿活力和真情實感的音樂', dislikes: '不太喜歡冷漠疏離感的音樂', listenTime: '和朋友出遊或做任何事時' },
    ENFJ: { musicPersona: '情感指揮家', summary: '你有辦法選出最適合當下氣氛的歌，你的音樂能讓所有人感同身受。', likes: '喜歡有感染力、能引起共鳴的音樂', dislikes: '不喜歡只顧自我表達、缺乏溫度的音樂', listenTime: '與重要的人共處時' },
    ENTP: { musicPersona: '聲音挑釁者', summary: '你永遠在尋找下一首顛覆認知的歌，討厭無聊，播放清單總是充滿驚喜。', likes: '喜歡打破常規、充滿創意的音樂', dislikes: '不喜歡太中規中矩的主流流行', listenTime: '腦袋高速運轉時' },
    ENTJ: { musicPersona: '高頻征服者', summary: '你的音樂是你的燃料，高能量的旋律讓你更有效率，每首歌都是為了成為更好的自己。', likes: '喜歡高能量、有驅動力的音樂', dislikes: '不喜歡拖沓緩慢、缺乏目的感的音樂', listenTime: '出發前為自己充能時' },
    ESFP: { musicPersona: '當下舞者', summary: '對你來說音樂就是要動起來，你活在每一個節拍裡，享受音樂帶來的純粹快樂。', likes: '喜歡讓人想跳舞的節奏和歡樂氛圍', dislikes: '不太喜歡太過沉重或壓抑的音樂', listenTime: '任何時候，只要能動起來' },
    ESFJ: { musicPersona: '派對靈魂', summary: '你的音樂讓所有人都開心，你知道什麼時候換一首讓大家感動落淚。', likes: '喜歡大家都能一起唱的流行金曲', dislikes: '不太喜歡只有小眾才懂的冷僻音樂', listenTime: '和一群人在一起時' },
    ESTP: { musicPersona: '腎上腺素獵人', summary: '你需要讓心跳加速的音樂，活在當下，播放清單反映你對刺激和速度的渴望。', likes: '喜歡節奏快、衝擊力強的音樂', dislikes: '不喜歡過於緩慢或缺乏能量的歌', listenTime: '衝刺或做決定之前' },
    ESTJ: { musicPersona: '節拍管理者', summary: '你用音樂管理心情和效率，喜歡節奏感強、有組織感的音樂幫助你把每件事做好。', likes: '喜歡清晰有力、充滿自信的音樂', dislikes: '不太喜歡過於模糊或沒有結構的音樂', listenTime: '早晨啟動一天時' },
  };
  return { mbtiType: type, ...(templates[type] || templates['INFP']) };
}

// DIM_CONFIG 動態組合分析（Graceful Fallback 核心）
// 完全依賴使用者的 avgFeatures 數據，不依賴固定模板
export function buildLocalAnalysis(avg) {
  const v  = avg.valence      ?? 0.5;
  const e  = avg.energy       ?? 0.5;
  const d  = avg.danceability ?? 0.5;
  const t  = avg.tempo        ?? 0.5;
  const ac = avg.acousticness ?? 0.5;

  // MBTI 計算
  const mbtiType = `${e >= 0.50 ? 'E' : 'I'}${ac >= 0.50 ? 'S' : 'N'}${v >= 0.50 ? 'F' : 'T'}${t >= 0.50 ? 'J' : 'P'}`;

  // 各維度得分（以極端程度排序）
  const ranked = DIM_CONFIG.map(dim => {
    const pct = Math.round((avg[dim.key] ?? 0.5) * 100);
    return { ...dim, pct, isHigh: pct >= 50, extreme: Math.abs(pct - 50) };
  }).sort((a, b) => b.extreme - a.extreme);

  // musicPersona：從最鮮明的兩個維度合成
  const musicPersona = buildDimTitle(avg);

  // summary：用前兩個最極端維度的 insight 拼成兩句話
  const [d1, d2] = ranked;
  const summary = `${getDynamicInsight(d1.key, d1.pct)} ${getDynamicInsight(d2.key, d2.pct)}`;

  // likes：根據主要特徵描述喜好
  const likeFragments = [];
  if (ac >= 0.55) likeFragments.push('有溫度的原聲器樂與木質音色');
  else if (ac <= 0.45) likeFragments.push('具現代感的電子音效與合成音色');
  if (v >= 0.55) likeFragments.push('讓心情明亮、充滿正能量的旋律');
  else if (v <= 0.45) likeFragments.push('能觸碰情感深處的憂鬱旋律');
  if (e >= 0.55) likeFragments.push('節奏感強、充滿驅動力的音樂');
  else if (e <= 0.45) likeFragments.push('舒緩沉靜、讓人放空的氛圍音樂');
  if (d >= 0.60) likeFragments.push('讓身體自然律動的節拍');
  const likes = likeFragments.slice(0, 2).join('，以及') || '有個性、耐聽的音樂';

  // dislikes：與主要特質相反的描述
  const dislikeFragments = [];
  if (e >= 0.55) dislikeFragments.push('節奏拖沓、缺乏動力感的慢歌');
  else dislikeFragments.push('過於吵鬧喧囂、令人無法靜心的音樂');
  if (ac >= 0.55) dislikeFragments.push('過度製作、失去人情味的電音風格');
  else dislikeFragments.push('單調重複、缺乏層次變化的音樂');
  const dislikes = dislikeFragments[0] || '過於商業化、缺乏個性的主流音樂';

  // listenTime：根據能量 × 情緒推斷場景
  let listenTime;
  if (e >= 0.65) listenTime = '運動、通勤或需要快速充能的早晨';
  else if (e <= 0.35 && v <= 0.40) listenTime = '深夜獨自一人，情緒需要出口時';
  else if (e <= 0.40) listenTime = '下午安靜時光，一個人放空發呆';
  else if (v >= 0.60) listenTime = '和朋友相處或心情愉快的任何時刻';
  else listenTime = '通勤途中或任何想沉浸在音樂裡的時刻';

  return { mbtiType, musicPersona, summary, likes, dislikes, listenTime };
}

