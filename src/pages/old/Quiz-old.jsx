import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const QUESTIONS = [
  {
    id: 1,
    text: "晚上回到家時，你通常會怎麼結束一天？",
    options: [
      { text: "關燈後躺著滑 IG，讓大腦慢慢放空", scores: { I: 1, P: 1 } },
      { text: "播音樂後開始整理房間", scores: { J: 1, S: 1 } },
      { text: "打開筆電處理事情或追劇", scores: { T: 1, J: 1 } },
      { text: "洗澡後走到窗邊，看夜景發呆", scores: { I: 1, N: 1 } },
      { text: "躺在床上聽歌直到睡著", scores: { I: 1, F: 1, P: 1 } }
    ]
  },
  {
    id: 2,
    text: "如果今天心情有點悶，你會怎麼排解？",
    options: [
      { text: "去逛便利商店，慢慢走一圈", scores: { S: 1, P: 1 } },
      { text: "聽安靜的歌，躺著休息", scores: { I: 1, F: 1 } },
      { text: "出門散步，讓腳帶著自己走", scores: { S: 1, P: 1 } },
      { text: "找朋友出去聊一聊", scores: { E: 1, F: 1 } },
      { text: "把房間燈光調成喜歡的顏色，放歌", scores: { N: 1, F: 1 } }
    ]
  },
  {
    id: 3,
    text: "你最常聽音樂的時段是？",
    options: [
      { text: "起床準備出門的早晨", scores: { J: 1, E: 1 } },
      { text: "下午懶懶的時候", scores: { P: 1 } },
      { text: "傍晚交通時間", scores: { S: 1, T: 1 } },
      { text: "深夜一個人的時候", scores: { I: 1, N: 1 } },
      { text: "誰傳歌給你，你就什麼時候聽", scores: { P: 1, F: 1 } }
    ]
  },
  {
    id: 4,
    text: "如果把你的生活拍成電影，它會是什麼色調？",
    options: [
      { text: "暖色系、很溫柔", scores: { F: 1, S: 1 } },
      { text: "冷色系、很乾淨", scores: { T: 1, J: 1 } },
      { text: "霓虹色、都市感", scores: { E: 1, P: 1, N: 1 } },
      { text: "暗色、偏寫實", scores: { I: 1, T: 1, S: 1 } },
      { text: "淡淡的粉色，有一點夢幻", scores: { N: 1, F: 1 } }
    ]
  },
  {
    id: 5,
    text: "你走路時的步調最像？",
    options: [
      { text: "悠哉散步，慢慢晃", scores: { P: 1, I: 1 } },
      { text: "有節奏的小跑步", scores: { E: 1, J: 1 } },
      { text: "穩定前進，步伐固定", scores: { J: 1, S: 1 } },
      { text: "完全看心情，有時候快有時候慢", scores: { P: 1, F: 1 } },
      { text: "聽歌時才會走很快", scores: { N: 1, P: 1 } }
    ]
  },
  {
    id: 6,
    text: "你喜歡一個人的時間嗎？",
    options: [
      { text: "是我的能量來源", scores: { I: 2 } },
      { text: "還好，但感覺有時候需要", scores: { I: 1 } },
      { text: "不太喜歡", scores: { E: 1 } },
      { text: "完全不行，我要有人陪", scores: { E: 2 } },
      { text: "看情緒，有時候想躲起來", scores: { F: 1, I: 1 } }
    ]
  },
  {
    id: 7,
    text: "你聽歌時最在意什麼？",
    options: [
      { text: "歌詞，有沒有說中我的心情", scores: { F: 2, N: 1 } },
      { text: "旋律，副歌順不順耳", scores: { S: 1, F: 1 } },
      { text: "整體氣氛，聽起來舒不舒服", scores: { N: 1, P: 1 } },
      { text: "鼓點節奏，能不能帶動身體", scores: { E: 1, S: 1 } },
      { text: "聽起來有沒有畫面感", scores: { N: 2 } }
    ]
  },
  {
    id: 8,
    text: "你喜歡哪種夜晚？",
    options: [
      { text: "房間很安靜，只有自己的呼吸聲", scores: { I: 2, T: 1 } },
      { text: "陽台有風，外面有一點聲音", scores: { N: 1, P: 1 } },
      { text: "街上人不多的路，邊走邊聽歌", scores: { I: 1, S: 1, P: 1 } },
      { text: "便利商店的燈光，明亮但不吵", scores: { S: 2 } },
      { text: "洗完澡的香味，配背景音樂", scores: { F: 1, S: 1 } }
    ]
  },
  {
    id: 9,
    text: "你覺得你的生活比較像哪座城市？",
    options: [
      { text: "首爾", scores: { E: 1, J: 1, S: 1 } },
      { text: "東京", scores: { I: 1, J: 1, S: 1 } },
      { text: "台北", scores: { P: 1, S: 1, F: 1 } },
      { text: "紐約", scores: { E: 1, T: 1, P: 1 } },
      { text: "京都", scores: { I: 1, N: 1, F: 1 } }
    ]
  },
  {
    id: 10,
    text: "當你喜歡一首歌時，通常會是因為？",
    options: [
      { text: "第一秒的氣氛就抓住我", scores: { N: 1, P: 1 } },
      { text: "歌詞某一句讓我記很久", scores: { F: 1, N: 1 } },
      { text: "副歌讓人想跟著唱", scores: { E: 1, S: 1 } },
      { text: "整首歌乾淨又舒服", scores: { J: 1, S: 1 } },
      { text: "聽起來像一個畫面或故事", scores: { N: 2 } }
    ]
  }
];

function Quiz() {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [totalScores, setTotalScores] = useState({ E:0, I:0, S:0, N:0, T:0, F:0, J:0, P:0 });
  const navigate = useNavigate();

  const question = QUESTIONS[current];
  const progress = Math.round((current / QUESTIONS.length) * 100);

  function handleSelect(option) {
    setSelected(option);
  }

  function handleNext() {
    if (!selected) return;

    // 累加這題的分數
    const newScores = { ...totalScores };
    Object.entries(selected.scores).forEach(([dim, val]) => {
      newScores[dim] = (newScores[dim] || 0) + val;
    });

    if (current + 1 < QUESTIONS.length) {
      setTotalScores(newScores);
      setSelected(null);
      setCurrent(current + 1);
    } else {
      // 計算最終 MBTI
      const mbti = calculateMBTI(newScores);
      localStorage.setItem('mbtiScores', JSON.stringify(newScores));
      localStorage.setItem('mbtiResult', mbti);
      navigate('/loading');
    }
  }

  function calculateMBTI(scores) {
    const EI = (scores.E || 0) >= (scores.I || 0) ? 'E' : 'I';
    const SN = (scores.S || 0) >= (scores.N || 0) ? 'S' : 'N';
    const TF = (scores.T || 0) >= (scores.F || 0) ? 'T' : 'F';
    const JP = (scores.J || 0) >= (scores.P || 0) ? 'J' : 'P';
    return EI + SN + TF + JP;
  }

  return (
    <div className="page">
      <div className="card">

        {/* 進度條 */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', opacity: 0.6 }}>
            <span>第 {current + 1} / {QUESTIONS.length} 題</span>
            <span>{progress}%</span>
          </div>
          <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #ff8ad4, #9b71ff)',
              borderRadius: '999px',
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>

        {/* 題目 */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '19px', lineHeight: '1.6', fontWeight: '700' }}>
            {question.text}
          </h2>
        </div>

        {/* 選項（5個） */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {question.options.map((option, i) => {
            const isSelected = selected === option;
            return (
              <button
                key={i}
                onClick={() => handleSelect(option)}
                style={{
                  background: isSelected
                    ? 'linear-gradient(120deg, rgba(255,138,212,0.3), rgba(155,113,255,0.3))'
                    : 'rgba(255,255,255,0.04)',
                  border: isSelected
                    ? '1px solid rgba(155,113,255,0.8)'
                    : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '14px',
                  padding: '14px 18px',
                  color: '#fff',
                  fontSize: '14px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  lineHeight: '1.5',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <span style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: isSelected
                    ? 'linear-gradient(120deg, #ff8ad4, #9b71ff)'
                    : 'rgba(255,255,255,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: '700',
                  flexShrink: 0,
                  transition: 'all 0.2s',
                }}>
                  {isSelected ? '✓' : String.fromCharCode(65 + i)}
                </span>
                {option.text}
              </button>
            );
          })}
        </div>

        {/* 下一題按鈕 */}
        <button
          className="btn"
          onClick={handleNext}
          disabled={!selected}
          style={{
            marginTop: '20px',
            opacity: selected ? 1 : 0.3,
            cursor: selected ? 'pointer' : 'not-allowed',
          }}
        >
          {current + 1 === QUESTIONS.length ? '查看我的結果 🎵' : '下一題 →'}
        </button>

      </div>
    </div>
  );
}

export default Quiz;
