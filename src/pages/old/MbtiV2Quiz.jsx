import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import { analyzeMbtiPersonality } from '../services/geminiService';
import {
  calculateAverageFeatures,
  calculateStyleWeights,
  getTopSimilarSongs,
  fetchMultipleCSVs,
  fetchLocalCSV,
  normalizeTempo,
  ALL_STYLES,
  STYLE_LABEL,
} from '../utils/musicMath';
import { supabase } from '../lib/supabase';

// ─── 風格視覺配置 ─────────────────────────────────────────

const STYLE_CONFIG = {
  'Chill / Soft':     { emoji: '🌙', color: 'rgba(126,200,227,0.18)', accent: '#7ec8e3' },
  'Sad / Emotional':  { emoji: '🌧️', color: 'rgba(147,130,200,0.18)', accent: '#9382c8' },
  'Romantic / Sweet': { emoji: '🌸', color: 'rgba(255,158,196,0.18)', accent: '#ff9ec4' },
  'Dark / Moody':     { emoji: '🖤', color: 'rgba(80,80,110,0.18)',   accent: '#6b6b8f' },
  'Happy / Bright':   { emoji: '☀️', color: 'rgba(255,210,80,0.18)', accent: '#f0b429' },
};

const FEATURE_META = [
  { key: 'valence',      label: '正向感',  emoji: '😊' },
  { key: 'energy',       label: '能量',    emoji: '⚡' },
  { key: 'danceability', label: '舞動感',  emoji: '💃' },
  { key: 'tempo',        label: '速度感',  emoji: '🎯' },
  { key: 'acousticness', label: '原音感',  emoji: '🎸' },
];

// ─── 動畫變體 ─────────────────────────────────────────────

const pageVariants = {
  initial: { opacity: 0, x: 48 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit:    { opacity: 0, x: -48, transition: { duration: 0.25, ease: 'easeIn' } },
};

const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: (d = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: d, ease: 'easeOut' } }),
};

// ─── 從 quiz_bank.json 隨機選 10 題 ──────────────────────
async function loadRandomQuestions(n = 10) {
  const res = await fetch('/quiz_bank.json');
  if (!res.ok) throw new Error('無法讀取 quiz_bank.json');
  const bank = await res.json();
  return [...bank].sort(() => Math.random() - 0.5).slice(0, n).map((q, i) => ({ ...q, id: i + 1 }));
}

// ─── fallback 人格模板（API 完全失敗時用）────────────────
function buildFallbackAnalysis(avg) {
  const type = `${avg.energy >= 0.55 ? 'E' : 'I'}${avg.acousticness >= 0.55 ? 'S' : 'N'}${avg.valence >= 0.55 ? 'F' : 'T'}${avg.tempo >= 0.55 ? 'J' : 'P'}`;
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

// ─── v1 偏好對照表（曲風標籤）────────────────────────────
const PREFERENCE_MAP = {
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

const LANG_LABEL = { zh: '🇹🇼 TW 中文', ko: '🇰🇷 KR 韓文', en: '🇺🇸 US 英文' };

// ─── 人格化五維度設定 ─────────────────────────────────────
const DIM_CONFIG = [
  { key: 'valence',      label: '內在心情色', highIcon: '☀️', lowIcon: '🌙', highLabel: '快樂',     lowLabel: '憂鬱'     },
  { key: 'energy',       label: '生活步調',   highIcon: '⚡', lowIcon: '🍃', highLabel: '熱血衝刺', lowLabel: '慢節奏生活' },
  { key: 'danceability', label: '喜好節奏',   highIcon: '💃', lowIcon: '🧘', highLabel: '隨性搖擺', lowLabel: '穩定平靜'  },
  { key: 'tempo',        label: '思考節奏',   highIcon: '🚀', lowIcon: '🐢', highLabel: '快速運轉', lowLabel: '慢慢消化'  },
  { key: 'acousticness', label: '音色偏好',   highIcon: '🎸', lowIcon: '💻', highLabel: '原聲感',   lowLabel: '電子感'    },
];

// ─── 動態解讀句（⬇ 可替換文字邏輯）──────────────────────
// ⚠️ 用戶自定義區：根據每個維度的高/低值生成「人話」解讀句
function getDynamicInsight(key, pct) {
  const high = pct >= 55;
  const map = {
    valence:      { high: '你偏向用音樂維持好心情，是個自帶陽光的靈魂。',       low:  '你喜歡能觸碰情緒深處的音樂，感知力豐富而細膩。'       },
    energy:       { high: '你的音樂充滿動力，生活節奏快，隨時準備出發。',       low:  '你偏愛沉靜的旋律，享受生活慢下來的瞬間。'             },
    danceability: { high: '你跟著節拍自然律動，音樂讓你的身體自由表達。',       low:  '你享受音樂帶來的平靜感，不需要節奏驅動你。'           },
    tempo:        { high: '你的思維運轉飛快，快節奏的音樂才跟得上你。',         low:  '你喜歡慢慢品味每個音符，細細消化每段旋律。'           },
    acousticness: { high: '你偏愛真實的原聲質感，木吉他與鋼琴是你的摯友。',     low:  '你被電子音效吸引，現代感的音色讓你精神一振。'         },
  };
  return map[key]?.[high ? 'high' : 'low'] || '';
}

// ─── 人格輪廓總結（MBTI 前一語道破）─────────────────────
// ⚠️ 用戶自定義區：根據五維數值生成開場總結句
function buildProfileSummary(avg) {
  const dims = DIM_CONFIG.map(d => ({
    label: avg[d.key] >= 0.55 ? `${d.highIcon}${d.highLabel}` : `${d.lowIcon}${d.lowLabel}`,
    extreme: Math.abs((avg[d.key] || 0.5) - 0.5),
  })).sort((a, b) => b.extreme - a.extreme);
  return `你是位「${dims[0].label} × ${dims[1].label}」的音樂旅人。`;
}

// ─── MBTI 理由鏈（為什麼你像...）────────────────────────
// ⚠️ 用戶自定義區：建立數據與 MBTI 性格的關聯解釋
function buildWhyConnection(mbti, avg) {
  const top2 = DIM_CONFIG.map(d => ({
    name: avg[d.key] >= 0.55 ? `高${d.label}(${d.highLabel})` : `低${d.label}(${d.lowLabel})`,
    extreme: Math.abs((avg[d.key] || 0.5) - 0.5),
  })).sort((a, b) => b.extreme - a.extreme).slice(0, 2);
  return `因為你的${top2[0].name} + ${top2[1].name}，代表你在音樂中追求特定的情感共鳴，這與 ${mbti} 的核心特質非常契合。`;
}

// ─── 歌曲推薦理由（每首歌的共鳴點）─────────────────────
// ⚠️ 用戶自定義區：標註該歌曲與用戶特徵的重疊點
function buildSongReason(song, avg) {
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

function calcWeightsFromFeatures(avg) {
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

// ─── 主元件 ───────────────────────────────────────────────

export default function MbtiV2Quiz() {
  const [phase, setPhase]                   = useState('loading');
  const [questions, setQuestions]           = useState([]);
  const [currentIdx, setCurrentIdx]         = useState(0);
  const [answers, setAnswers]               = useState([]);
  const [selectedLabel, setSelectedLabel]   = useState(null);
  const [loadingMsg, setLoadingMsg]         = useState('正在為你挑選今日題目...');
  const [analysis, setAnalysis]             = useState(null);
  const [styleWeights, setStyleWeights]     = useState(null);
  const [topSongs, setTopSongs]             = useState([]);
  const [avgFeatures, setAvgFeatures]       = useState(null);
  const [errorMsg, setErrorMsg]             = useState('');
  const [retryCountdown, setRetryCountdown] = useState(0);

  const initCalledRef = useRef(false);
  const countdownRef  = useRef(null);

  useEffect(() => () => { if (countdownRef.current) clearInterval(countdownRef.current); }, []);

  const initQuiz = useCallback(async () => {
    setPhase('loading');
    setCurrentIdx(0);
    setAnswers([]);
    setSelectedLabel(null);
    setAnalysis(null);
    setStyleWeights(null);
    setTopSongs([]);
    setAvgFeatures(null);
    setRetryCountdown(0);
    setLoadingMsg('正在為你挑選今日題目...');
    try {
      await delay(1200); // 模擬 AI 挑選的感覺
      const qs = await loadRandomQuestions(10);
      setQuestions(qs);
      setPhase('quiz');
    } catch (err) {
      setErrorMsg('題目載入失敗：' + err.message);
      setPhase('error');
    }
  }, []);

  useEffect(() => {
    if (initCalledRef.current) return;
    initCalledRef.current = true;
    initQuiz();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSelect(option) {
    if (selectedLabel !== null) return;
    setSelectedLabel(option.label);
    await delay(480);
    const newAnswers = [...answers, { features: option.features, style: option.style }];
    if (currentIdx < questions.length - 1) {
      setAnswers(newAnswers);
      setCurrentIdx(prev => prev + 1);
      setSelectedLabel(null);
    } else {
      setAnswers(newAnswers);
      await runAnalysis(newAnswers);
    }
  }

  function startCountdown(seconds) {
    return new Promise(resolve => {
      setRetryCountdown(seconds);
      if (countdownRef.current) clearInterval(countdownRef.current);
      countdownRef.current = setInterval(() => {
        setRetryCountdown(prev => {
          if (prev <= 1) { clearInterval(countdownRef.current); resolve(); return 0; }
          return prev - 1;
        });
      }, 1000);
    });
  }

  async function runAnalysis(finalAnswers) {
    setPhase('analyzing');
    const avg = calculateAverageFeatures(finalAnswers);
    setAvgFeatures(avg);
    setStyleWeights(calculateStyleWeights(finalAnswers));

    // Agent 2：最多重試 3 次，遇 429 顯示 15 秒倒數，全失敗用 fallback
    let result = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      setLoadingMsg('AI 正在分析你的音樂靈魂...');
      setRetryCountdown(0);
      try {
        result = await analyzeMbtiPersonality(avg);
        break;
      } catch (err) {
        const is429 = (err?.message || '').includes('429') || (err?.message || '').includes('quota');
        if (is429 && attempt < 3) {
          setLoadingMsg('AI 正在深思中，請稍候...');
          await startCountdown(15);
        } else {
          console.warn('[V2] Agent 2 全部失敗，使用 fallback:', err.message);
          result = buildFallbackAnalysis(avg);
          break;
        }
      }
    }

    setAnalysis(result);
    setLoadingMsg('正在從音樂庫中尋找最匹配的歌曲...');
    const songs = await fetchSpotifyTracks();
    setTopSongs(getTopSimilarSongs(avg, songs, 3));
    setPhase('result');
  }

  // ─── 渲染分支 ─────────────────────────────────────────

  if (phase === 'error') {
    return (
      <div className="page">
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ color: '#e53e3e', marginBottom: 16, lineHeight: 1.7 }}>{errorMsg}</p>
          <button className="btn" onClick={initQuiz}>重新開始</button>
        </div>
      </div>
    );
  }

  if (phase === 'loading') return <LoadingScreen message={loadingMsg} />;

  if (phase === 'analyzing') {
    return <LoadingScreen message={loadingMsg} countdown={retryCountdown} />;
  }

  if (phase === 'result' && analysis) {
    return (
      <ResultScreen
        analysis={analysis}
        styleWeights={styleWeights}
        avgFeatures={avgFeatures}
        topSongs={topSongs}
        onRetry={initQuiz}
      />
    );
  }

  if (phase === 'quiz' && questions[currentIdx]) {
    return (
      <QuizScreen
        question={questions[currentIdx]}
        currentIdx={currentIdx}
        total={questions.length}
        selectedLabel={selectedLabel}
        onSelect={handleSelect}
      />
    );
  }

  return null;
}

// ─── Loading Screen ───────────────────────────────────────

function LoadingScreen({ message, countdown = 0 }) {
  return (
    <div className="page">
      <motion.div
        className="card"
        style={{ textAlign: 'center', padding: '56px 28px' }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <motion.div
          style={{ fontSize: 44, marginBottom: 24 }}
          animate={{ rotate: [0, 15, -15, 15, 0], scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
        >
          🎵
        </motion.div>
        <AnimatePresence mode="wait">
          <motion.p
            key={message}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            style={{ color: '#5a8fa8', fontWeight: 600, fontSize: 15 }}
          >
            {message}
          </motion.p>
        </AnimatePresence>
        {countdown > 0 && (
          <motion.div
            key={countdown}
            initial={{ scale: 1.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ marginTop: 16, fontSize: 28, fontWeight: 900, color: '#ff9ec4' }}
          >
            {countdown}s
          </motion.div>
        )}
        <LoadingDots />
      </motion.div>
    </div>
  );
}

function LoadingDots() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 20 }}>
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          style={{ width: 7, height: 7, borderRadius: '50%', background: '#7ec8e3' }}
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -5, 0] }}
          transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

// ─── Quiz Screen ──────────────────────────────────────────

function QuizScreen({ question, currentIdx, total, selectedLabel, onSelect }) {
  const progress = ((currentIdx + 1) / total) * 100;

  return (
    <div className="page-top">
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
          <span style={{ fontSize: 12, color: '#7a9ab0', fontWeight: 700 }}>
            問題 {currentIdx + 1} / {total}
          </span>
          <span style={{ fontSize: 12, color: '#7a9ab0' }}>{Math.round(progress)}%</span>
        </div>
        <div className="progress-wrap">
          <motion.div
            className="progress-bar"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIdx}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <div className="card" style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 12, color: '#7a9ab0', fontWeight: 700, marginBottom: 8, letterSpacing: 1 }}>
              Q{String(question.id).padStart(2, '0')}
            </p>
            <h2 style={{ fontSize: 17, lineHeight: 1.7, color: '#2d3748' }}>
              {question.text}
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {question.options.map((opt, i) => (
              <OptionButton
                key={opt.label}
                option={opt}
                isSelected={selectedLabel === opt.label}
                isDisabled={selectedLabel !== null && selectedLabel !== opt.label}
                delay={i * 0.06}
                onClick={() => onSelect(opt)}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function OptionButton({ option, isSelected, isDisabled, delay, onClick }) {
  const cfg = STYLE_CONFIG[option.style] || { emoji: '🎵', color: 'rgba(255,255,255,0.85)', accent: '#7ec8e3' };

  return (
    <motion.button
      onClick={onClick}
      disabled={isDisabled}
      variants={cardVariants}
      initial="initial"
      animate={cardVariants.animate(delay)}
      whileHover={!isDisabled ? { scale: 1.02, y: -1 } : {}}
      whileTap={!isDisabled ? { scale: 0.98 } : {}}
      style={{
        background: isSelected ? cfg.color : 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(12px)',
        border: isSelected ? `2px solid ${cfg.accent}` : '1.5px solid rgba(255,255,255,0.9)',
        borderRadius: 16,
        padding: '13px 15px',
        textAlign: 'left',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: isSelected ? `0 4px 20px ${cfg.accent}33` : '0 2px 10px rgba(180,200,255,0.15)',
        opacity: isDisabled ? 0.45 : 1,
        transition: 'border-color 0.2s, box-shadow 0.2s, opacity 0.25s',
        width: '100%',
      }}
    >
      <span style={{
        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
        background: isSelected ? `linear-gradient(135deg, ${cfg.accent}, #ff9ec4)` : 'rgba(126,200,227,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 800,
        color: isSelected ? '#fff' : '#5a8fa8',
      }}>
        {option.label}
      </span>

      <span style={{ fontSize: 14, color: '#2d3748', lineHeight: 1.55, flex: 1 }}>
        {option.text}
      </span>

      <motion.span
        animate={isSelected ? { scale: [1, 1.4, 1] } : { scale: 1 }}
        transition={{ duration: 0.4 }}
        style={{ fontSize: 18, flexShrink: 0 }}
      >
        {cfg.emoji}
      </motion.span>
    </motion.button>
  );
}

// ─── Radar Chart (純 SVG，無需外部套件）────────────────────
function RadarChart({ avg, size = 220 }) {
  const keys   = DIM_CONFIG.map(d => d.key);
  const labels = DIM_CONFIG.map(d => d.label);
  const N      = keys.length;
  const cx     = size / 2;
  const cy     = size / 2;
  const R      = size * 0.36;
  const angleOf = i => (Math.PI * 2 * i) / N - Math.PI / 2;
  const toXY    = (v, i) => ({ x: cx + v * R * Math.cos(angleOf(i)), y: cy + v * R * Math.sin(angleOf(i)) });

  const dataPoints = keys.map((k, i) => toXY(avg[k] || 0, i));
  const dataPath   = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', margin: '0 auto' }}>
      {[0.25, 0.5, 0.75, 1].map(lvl => (
        <polygon key={lvl}
          points={keys.map((_, i) => { const p = toXY(lvl, i); return `${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(' ')}
          fill="none" stroke="rgba(126,200,227,0.18)" strokeWidth="1"
        />
      ))}
      {keys.map((_, i) => {
        const end = toXY(1, i);
        return <line key={i} x1={cx} y1={cy} x2={end.x.toFixed(1)} y2={end.y.toFixed(1)} stroke="rgba(126,200,227,0.25)" strokeWidth="1" />;
      })}
      <path d={dataPath} fill="rgba(255,158,196,0.22)" stroke="#ff9ec4" strokeWidth="2" strokeLinejoin="round" />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="4" fill="#ff9ec4" stroke="#fff" strokeWidth="1.5" />
      ))}
      {labels.map((label, i) => {
        const angle  = angleOf(i);
        const lr     = R + 26;
        const lx     = cx + lr * Math.cos(angle);
        const ly     = cy + lr * Math.sin(angle);
        return (
          <text key={i} x={lx.toFixed(1)} y={ly.toFixed(1)}
            textAnchor="middle" dominantBaseline="middle"
            fontSize="9.5" fill="#7a9ab0" fontWeight="700"
          >{label}</text>
        );
      })}
    </svg>
  );
}

// ─── Result Screen ────────────────────────────────────────

function ResultScreen({ analysis, styleWeights, avgFeatures, topSongs, onRetry }) {
  const [copyMsg, setCopyMsg] = useState('');
  const shareCardRef = useRef(null);
  const avg        = avgFeatures || {};
  const nickname   = localStorage.getItem('nickname') || '你';
  const mbti       = analysis.mbtiType;
  const preference = PREFERENCE_MAP[mbti] || PREFERENCE_MAP['INFP'];
  const profileSummary  = buildProfileSummary(avg);
  const whyConnection   = buildWhyConnection(mbti, avg);

  const handleDownloadJpg = async () => {
    if (!shareCardRef.current) return;
    try {
      const canvas = await html2canvas(shareCardRef.current, {
        backgroundColor: '#f8f4f0', scale: 2, useCORS: true, logging: false,
      });
      const link = document.createElement('a');
      link.download = `mbti-music-${mbti || 'result'}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.92);
      link.click();
    } catch { alert('截圖失敗，請嘗試長按畫面儲存圖片'); }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin).then(() => {
      setCopyMsg('連結已複製！');
      setTimeout(() => setCopyMsg(''), 2500);
    });
  };

  // 共用 slide-up 動畫
  const su = (delay = 0) => ({
    initial: { opacity: 0, y: 44 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.48, delay, ease: 'easeOut' } },
  });

  return (
    <div className="page-top">

      {/* ── 人格輪廓總結 Banner ───────────────────────────── */}
      <motion.div {...su(0)} style={{
        textAlign: 'center', marginBottom: '4px',
        padding: '10px 20px',
        background: 'linear-gradient(120deg, rgba(255,158,196,0.12), rgba(126,200,227,0.12))',
        borderRadius: '16px', fontSize: '14px', color: '#5a8fa8', fontWeight: '700',
      }}>
        👉 {profileSummary}
      </motion.div>

      {/* ── 大標題：nickname + MBTI ───────────────────────── */}
      <motion.div {...su(0.06)} style={{ textAlign: 'center', marginBottom: '20px', marginTop: '12px' }}>
        <p style={{ fontSize: '13px', color: '#a0b4c0', marginBottom: '8px', fontWeight: '600' }}>
          {nickname} 的音樂人格測驗結果
        </p>
        <div className="gradient-text" style={{ fontSize: '56px', fontWeight: '900', lineHeight: 1 }}>
          {mbti}
        </div>
      </motion.div>

      {/* ① 音樂人格 ─────────────────────────────────────── */}
      <motion.div {...su(0.12)} className="card">
        <div style={{ fontSize: '12px', color: '#a0b4c0', fontWeight: '700', letterSpacing: '1px', marginBottom: '10px' }}>
          ① 音樂人格 Music Personality
        </div>
        <div style={{ fontSize: '20px', fontWeight: '800', marginBottom: '10px' }} className="gradient-text">
          你是：{analysis.musicPersona}
        </div>
        <p style={{ fontSize: '14px', lineHeight: '1.8', color: '#4a5568' }}>{analysis.summary}</p>
        <div style={{
          marginTop: '16px', padding: '12px 16px',
          background: 'linear-gradient(120deg, rgba(255,158,196,0.1), rgba(126,200,227,0.1))',
          borderRadius: '12px', borderLeft: '3px solid #ff9ec4',
          fontSize: '13px', color: '#5a8fa8', fontStyle: 'italic',
        }}>
          🎵 {analysis.likes}
        </div>
        <div style={{ marginTop: '16px' }}>
          <div style={{ fontSize: '12px', color: '#a0b4c0', fontWeight: '600', marginBottom: '8px' }}>偏好曲風</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {preference.genres.map((g, i) => (
              <span key={i} className={i % 2 === 0 ? 'tag' : 'tag tag-pink'}>{g}</span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── 雷達圖 ────────────────────────────────────────── */}
      <motion.div {...su(0.2)} className="card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '12px', color: '#a0b4c0', fontWeight: '700', letterSpacing: '1px', marginBottom: '14px' }}>
          🕸 音樂特徵雷達圖
        </div>
        <RadarChart avg={avg} size={220} />
      </motion.div>

      {/* ② 偏好分析（人格化五維度）────────────────────────── */}
      <motion.div {...su(0.28)} className="card">
        <div style={{ fontSize: '12px', color: '#a0b4c0', fontWeight: '700', letterSpacing: '1px', marginBottom: '16px' }}>
          ② 偏好分析 Preference Analysis
        </div>

        {/* 喜歡 / 不偏好 / 時段 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          {[
            { icon: '👍', label: '喜歡：',  text: analysis.likes },
            { icon: '💛', label: '不偏好：', text: analysis.dislikes },
            { icon: '🕐', label: '時段：',  text: analysis.listenTime },
          ].map(({ icon, label, text }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px' }}>
              <span style={{ fontSize: '16px', flexShrink: 0 }}>{icon}</span>
              <div>
                <span style={{ color: '#a0b4c0', fontWeight: '600' }}>{label}</span>
                <span style={{ color: '#4a5568' }}>{text}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="divider" />

        {/* 人格化五維度 Bar */}
        <div style={{ fontSize: '12px', color: '#a0b4c0', fontWeight: '600', margin: '12px 0' }}>
          音樂人格五維度
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {DIM_CONFIG.map((dim, i) => {
            const pct     = Math.round((avg[dim.key] || 0) * 100);
            const isHigh  = pct >= 55;
            const icon    = isHigh ? dim.highIcon : dim.lowIcon;
            const subLabel = isHigh ? dim.highLabel : dim.lowLabel;
            const insight = getDynamicInsight(dim.key, pct);
            return (
              <motion.div key={dim.key}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.32 + i * 0.07 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#2d3748' }}>
                    {icon} {dim.label}
                    <span style={{ fontSize: '11px', color: '#a0b4c0', fontWeight: '500', marginLeft: '6px' }}>
                      {subLabel}
                    </span>
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#7ec8e3' }}>{pct}%</span>
                </div>
                <div className="progress-wrap">
                  <motion.div
                    className="progress-bar"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.65, delay: 0.35 + i * 0.07, ease: 'easeOut' }}
                  />
                </div>
                {insight && (
                  <p style={{ fontSize: '12px', color: '#8a9ab0', marginTop: '5px', lineHeight: '1.6', fontStyle: 'italic' }}>
                    {insight}
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ── MBTI 理由鏈 ──────────────────────────────────── */}
      <motion.div {...su(0.46)} className="card">
        <div style={{ fontSize: '12px', color: '#a0b4c0', fontWeight: '700', letterSpacing: '1px', marginBottom: '12px' }}>
          🔗 為什麼你像 {mbti}？
        </div>
        <p style={{ fontSize: '14px', lineHeight: '1.85', color: '#4a5568' }}>
          👉 {whyConnection}
        </p>
      </motion.div>

      {/* ③ 推薦歌曲 ──────────────────────────────────────── */}
      <motion.div {...su(0.54)} className="card">
        <div style={{ fontSize: '12px', color: '#a0b4c0', fontWeight: '700', letterSpacing: '1px', marginBottom: '16px' }}>
          ③ 為你精選的 3 首最佳推薦
        </div>
        {topSongs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <p style={{ fontSize: '14px', color: '#b0c4d0' }}>請先在 public/songs/ 放入 CSV 檔案，歌曲才會顯示 🎵</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {topSongs.map((song, i) => {
              const trackId = (song.spotify_id || '').replace('spotify:track:', '');
              const title   = song.name  || song.track_name  || '未知歌曲';
              const artist  = song.artist || song.artist_name || '未知歌手';
              const langTag = song.lang ? (LANG_LABEL[song.lang] || song.lang) : null;
              const reason  = buildSongReason(song, avg);
              return (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.58 + i * 0.1 }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '15px', color: '#2d3748' }}>{title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                        <span style={{ fontSize: '12px', color: '#a0b4c0' }}>{artist}</span>
                        {langTag && (
                          <span style={{
                            fontSize: '10px', padding: '1px 7px', borderRadius: '999px',
                            background: 'rgba(126,200,227,0.12)', color: '#5a8fa8', fontWeight: '600',
                          }}>{langTag}</span>
                        )}
                      </div>
                    </div>
                    <span style={{
                      fontSize: '11px', padding: '3px 10px', flexShrink: 0,
                      background: 'linear-gradient(120deg, rgba(255,158,196,0.15), rgba(126,200,227,0.15))',
                      borderRadius: '999px', border: '1px solid rgba(126,200,227,0.3)',
                      color: '#7ec8e3', fontWeight: '700',
                    }}>#{i + 1}</span>
                  </div>
                  {/* 推薦理由 */}
                  <p style={{
                    fontSize: '12px', color: '#8a9ab0', lineHeight: '1.6', fontStyle: 'italic',
                    marginBottom: '8px', paddingLeft: '4px',
                    borderLeft: '2px solid rgba(126,200,227,0.35)',
                    paddingLeft: '8px',
                  }}>
                    💬 {reason}
                  </p>
                  {trackId && (
                    <iframe
                      src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`}
                      width="100%" height="80" frameBorder="0"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                      style={{ borderRadius: '14px', display: 'block' }}
                      title={title}
                    />
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* 隱藏分享截圖卡片 */}
      <div ref={shareCardRef} style={{
        position: 'fixed', left: '-9999px', top: 0,
        width: '360px', padding: '32px 24px',
        background: 'linear-gradient(145deg, #fff8f5 0%, #f0f8ff 100%)',
        fontFamily: 'sans-serif',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div style={{ fontSize: '12px', color: '#a0b4c0', fontWeight: '600', marginBottom: '4px' }}>{profileSummary}</div>
        </div>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '13px', color: '#a0b4c0', fontWeight: '600', marginBottom: '6px' }}>{nickname} 的音樂人格</div>
          <div style={{
            fontSize: '52px', fontWeight: '900', lineHeight: 1,
            background: 'linear-gradient(120deg, #ff9ec4, #7ec8e3)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>{mbti}</div>
        </div>
        <div style={{
          background: '#fff', borderRadius: '16px', padding: '18px 20px',
          boxShadow: '0 2px 16px rgba(126,200,227,0.12)', marginBottom: '16px',
        }}>
          <div style={{
            fontSize: '16px', fontWeight: '800', marginBottom: '8px',
            background: 'linear-gradient(120deg, #ff9ec4, #7ec8e3)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>{analysis.musicPersona}</div>
          <p style={{ fontSize: '13px', lineHeight: '1.7', color: '#4a5568', margin: 0 }}>{analysis.summary}</p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
          {preference.genres.map((g, i) => (
            <span key={i} style={{
              fontSize: '11px', padding: '4px 10px', borderRadius: '999px',
              background: i % 2 === 0 ? 'rgba(126,200,227,0.15)' : 'rgba(255,158,196,0.15)',
              color: i % 2 === 0 ? '#7ec8e3' : '#ff9ec4', fontWeight: '600',
            }}>{g}</span>
          ))}
        </div>
        {topSongs.length > 0 && (
          <div style={{
            background: '#fff', borderRadius: '16px', padding: '16px 20px',
            boxShadow: '0 2px 16px rgba(126,200,227,0.12)', marginBottom: '16px',
          }}>
            <div style={{ fontSize: '11px', color: '#a0b4c0', fontWeight: '700', letterSpacing: '1px', marginBottom: '12px' }}>
              🎵 為你精選的歌曲
            </div>
            {topSongs.map((song, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{
                  width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(120deg, #ff9ec4, #7ec8e3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: '800', color: '#fff',
                }}>{i + 1}</div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#2d3748' }}>
                    {song.name || song.track_name || '未知歌曲'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#a0b4c0', marginTop: '1px' }}>
                    {song.artist || song.artist_name || ''}
                    {song.lang && ` · ${LANG_LABEL[song.lang] || song.lang}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{ textAlign: 'center', fontSize: '11px', color: '#b0c4d0' }}>mbti-music.vercel.app</div>
      </div>

      {/* ── 底部三大按鈕 ──────────────────────────────────── */}
      <motion.div {...su(0.68)} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
        <button className="btn" onClick={onRetry}>🔄 重新測驗</button>
        <button className="btn-ghost" onClick={handleDownloadJpg}>📸 截圖下載 JPG</button>
        <button className="btn-ghost" onClick={handleCopyLink}>{copyMsg || '🔗 複製分享連結'}</button>
      </motion.div>

    </div>
  );
}



// ─── CSV 路徑 + 語言標記（key = path, value = lang code）──
const LOCAL_CSV_PATHS = {
  '/songs/CH_1.csv':   'zh',
  '/songs/EN_1.csv':   'en',
  '/songs/KPOP_1.csv': 'ko',
};

// ─── 歌曲資料來源：本地 CSV 優先（含語言標記），其次 Supabase ─
async function fetchSpotifyTracks() {
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
    if (songs.length > 0) {
      console.log(`[V2] 本地 CSV 合計載入 ${songs.length} 首歌曲`);
      return songs;
    }
  } catch (err) {
    console.info('[V2] 本地 CSV 讀取失敗，改用 Supabase:', err.message);
  }

  // Supabase fallback
  try {
    const { data, error } = await supabase
      .from('spotify_tracks')
      .select('spotify_id, name, artist, valence, energy, danceability, tempo, acousticness');
    if (error) throw error;
    console.log(`[V2] Supabase 載入 ${(data || []).length} 首歌曲`);
    return data || [];
  } catch (err) {
    console.warn('[V2] Supabase 查詢失敗:', err.message);
    return [];
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
