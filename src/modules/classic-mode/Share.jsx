import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const PERSONALITY_MAP = {
  INTJ: { name: '孤獨的旋律建築師',    desc: '你用理性解構每一首歌，從編曲到歌詞都有你自己的評分標準。你不追流行，只追那些真正打動你內心深處的作品。' },
  INTP: { name: '音符邏輯探索者',      desc: '你喜歡挖掘冷門神曲，享受發現別人還沒聽過的寶藏。對你來說，聽音樂是一場永無止境的知識探索之旅。' },
  ENTJ: { name: '強勢的聽覺掌控者',   desc: '你的歌單像是一份精心規劃的策略清單。你喜歡有力量感的音樂，需要它在你征服每一天時為你提供燃料。' },
  ENTP: { name: '反叛的聲音獵人',     desc: '你永遠在挑戰主流，喜歡那些有點奇怪、有點挑釁的音樂。你的歌單讓別人摸不透，但你就是愛這種感覺。' },
  INFJ: { name: '靈魂共鳴的追尋者',   desc: '你把每首歌當成一面鏡子，尋找那些能說出你說不出口的感受的旋律。音樂對你來說是靈魂的語言，不只是娛樂。' },
  INFP: { name: '迷霧中的旋律漫遊者', desc: '你是個用音樂做夢的人。一首歌能讓你在腦海裡展開整部電影，你永遠在尋找那首能讓你淚崩的完美歌曲。' },
  ENFJ: { name: '溫暖的音樂傳遞者',   desc: '你聽音樂是為了分享。你總是第一個說「你一定要聽這首！」的人，因為你相信對的音樂能改變一個人的一天。' },
  ENFP: { name: '跳躍感性的音浪衝浪者', desc: '你的心情決定你的歌單，而你的心情每小時都在變。你活在音樂的當下，每首歌都是一次全新的冒險。' },
  ISTJ: { name: '穩定忠實的老派聆聽者', desc: '你有固定的歌單，某些歌你已經聽了幾百遍還不夠。對你來說，熟悉的旋律就是最好的陪伴，可靠又安心。' },
  ISFJ: { name: '懷舊溫柔的記憶守護者', desc: '每首歌背後都有一段你珍藏的回憶。你喜歡能讓心情平靜下來的溫柔旋律，像一杯熱茶陪你度過每個普通的夜晚。' },
  ESTJ: { name: '效率至上的節奏執行者', desc: '你用音樂提升效率。工作時、運動時、通勤時，你都有對應的歌單。你不浪費時間猶豫，直接播最有效果的那首。' },
  ESFJ: { name: '人氣榜單的快樂跟隨者', desc: '你喜歡那些讓大家都能一起唱的歌。流行榜上的金曲是你的最愛，因為音樂就是要一起分享才有意義！' },
  ISTP: { name: '冷靜酷感的獨立聽眾', desc: '你不需要別人推薦，自己挖歌比任何算法都準。你偏好有質感、不做作的音樂，酷感是你選歌的唯一標準。' },
  ISFP: { name: '細膩敏感的美感體驗者', desc: '你用全身感受音樂。一首歌的聲音質地、人聲的顆粒感，都能讓你沉浸其中。你聽的不只是音樂，是一種藝術體驗。' },
  ESTP: { name: '當下燃燒的能量爆發者', desc: '你需要讓你動起來的音樂！節奏強、Bass 重、讓你忍不住點頭的那種。你聽音樂就是要感受當下最大的刺激。' },
  ESFP: { name: '派對靈魂的快樂製造機', desc: '你走到哪裡音樂就跟到哪裡。你是那個會突然在客廳開始跳舞的人，因為對你來說，生活本身就是一場演唱會。' },
};

const PREFERENCE_MAP = {
  INTJ: { genres: ['Ambient', 'Post-Rock', 'Dark Pop', 'Instrumental'] },
  INTP: { genres: ['Indie Rock', 'Math Rock', 'Alternative', 'Chill'] },
  ENTJ: { genres: ['Hip-Hop', 'Power Pop', 'Electronic', 'R&B'] },
  ENTP: { genres: ['Alternative', 'Funk', 'Indie Pop', 'Experimental'] },
  INFJ: { genres: ['Indie Folk', 'Dream Pop', 'Acoustic', 'Soul'] },
  INFP: { genres: ['Indie Pop', 'Soft Pop', 'Dream Pop', 'Chill'] },
  ENFJ: { genres: ['Pop', 'Soul', 'K-Pop', 'Acoustic'] },
  ENFP: { genres: ['Pop', 'Indie Pop', 'Dance', 'K-Pop'] },
  ISTJ: { genres: ['Classic Pop', 'Soft Rock', 'Folk', 'Jazz'] },
  ISFJ: { genres: ['Soft Pop', 'Acoustic', 'City Pop', 'Lo-Fi'] },
  ESTJ: { genres: ['Pop', 'Electronic', 'Dance', 'Hip-Hop'] },
  ESFJ: { genres: ['Pop', 'K-Pop', 'Dance Pop', 'R&B'] },
  ISTP: { genres: ['Indie', 'Rock', 'Electronic', 'Lo-Fi'] },
  ISFP: { genres: ['Indie Pop', 'Dream Pop', 'Acoustic', 'Chillhop'] },
  ESTP: { genres: ['Hip-Hop', 'EDM', 'Dance', 'Urban Pop'] },
  ESFP: { genres: ['Pop', 'Dance', 'K-Pop', 'EDM'] },
};

const LANG_LABEL = { zh: '🇹🇼 中文', ko: '🇰🇷 韓文', en: '🇺🇸 英文' };

function Share() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) { setNotFound(true); setLoading(false); return; }

    supabase
      .from('user_results')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data: row, error }) => {
        if (error || !row) {
          setNotFound(true);
        } else {
          setData(row);
        }
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="page" style={{ alignItems: 'center' }}>
        <p style={{ color: '#7ec8e3' }}>載入中...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="page" style={{ alignItems: 'center', textAlign: 'center', gap: '16px' }}>
        <div style={{ fontSize: '48px' }}>🎵</div>
        <p style={{ color: '#a0b4c0', fontSize: '15px' }}>找不到這份測驗結果</p>
        <button className="btn" onClick={() => navigate('/')}>去測測看我的音樂人格</button>
      </div>
    );
  }

  const mbti = data.mbti_result;
  const nickname = data.nickname || '某位朋友';
  const personality = PERSONALITY_MAP[mbti] || PERSONALITY_MAP['INFP'];
  const preference = PREFERENCE_MAP[mbti] || PREFERENCE_MAP['INFP'];
  const songs = data.songs || [];

  return (
    <div className="page-top">

      {/* 頂部提示 */}
      <div style={{
        background: 'linear-gradient(120deg, rgba(255,158,196,0.15), rgba(126,200,227,0.15))',
        border: '1px solid rgba(126,200,227,0.25)',
        borderRadius: '12px',
        padding: '10px 16px',
        fontSize: '13px',
        color: '#7ec8e3',
        textAlign: 'center',
        marginBottom: '4px',
      }}>
        👀 你正在看 <strong>{nickname}</strong> 的音樂人格測驗結果
      </div>

      {/* 大標題 */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <p style={{ fontSize: '13px', color: '#a0b4c0', marginBottom: '8px', fontWeight: '600' }}>
          {nickname} 的音樂人格測驗結果
        </p>
        <div className="gradient-text" style={{ fontSize: '56px', fontWeight: '900', lineHeight: 1 }}>
          {mbti}
        </div>
      </div>

      {/* 音樂人格 */}
      <div className="card">
        <div style={{ fontSize: '12px', color: '#a0b4c0', fontWeight: '700', letterSpacing: '1px', marginBottom: '10px' }}>
          ① 音樂人格 Music Personality
        </div>
        <div style={{ fontSize: '20px', fontWeight: '800', marginBottom: '10px' }} className="gradient-text">
          {personality.name}
        </div>
        <p style={{ fontSize: '14px', lineHeight: '1.8', color: '#4a5568' }}>
          {personality.desc}
        </p>
        <div style={{ marginTop: '16px' }}>
          <div style={{ fontSize: '12px', color: '#a0b4c0', fontWeight: '600', marginBottom: '8px' }}>
            偏好曲風
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {preference.genres.map((g, i) => (
              <span key={i} className={i % 2 === 0 ? 'tag' : 'tag tag-pink'}>{g}</span>
            ))}
          </div>
        </div>
      </div>

      {/* 推薦歌曲（如果有儲存） */}
      {songs.length > 0 && (
        <div className="card">
          <div style={{ fontSize: '12px', color: '#a0b4c0', fontWeight: '700', letterSpacing: '1px', marginBottom: '16px' }}>
            ③ 精選推薦歌曲
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {songs.map((song, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '15px', color: '#2d3748' }}>{song.title}</div>
                    <div style={{ fontSize: '12px', color: '#a0b4c0', marginTop: '2px' }}>
                      {song.artist} · {LANG_LABEL[song.lang] || song.lang}
                    </div>
                  </div>
                  <span style={{
                    fontSize: '11px', padding: '3px 10px',
                    background: 'linear-gradient(120deg, rgba(255,158,196,0.15), rgba(126,200,227,0.15))',
                    borderRadius: '999px', border: '1px solid rgba(126,200,227,0.3)',
                    color: '#7ec8e3', fontWeight: '700', flexShrink: 0,
                  }}>#{i + 1}</span>
                </div>
                <iframe
                  src={`https://open.spotify.com/embed/track/${song.spotify_id}?utm_source=generator&theme=0`}
                  width="100%" height="80" frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy" style={{ borderRadius: '14px', display: 'block' }}
                  title={song.title}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div style={{ marginTop: '8px' }}>
        <button className="btn" onClick={() => navigate('/')}>
          🎵 測測看我的音樂人格
        </button>
      </div>

    </div>
  );
}

export default Share;
