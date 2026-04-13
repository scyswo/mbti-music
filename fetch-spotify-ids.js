const fs = require('fs');

// 填入你的 YouTube API 金鑰
const YOUTUBE_API_KEY = '108802353185-qrhfoqppnhjthb44nl483n40uvvjf43c.apps.googleusercontent.com';

async function searchYouTube(title, artist) {
  const query = encodeURIComponent(`${title} ${artist} official`);
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&maxResults=1&key=${YOUTUBE_API_KEY}`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.items && data.items.length > 0) {
    const video = data.items[0];
    return {
      id: video.id.videoId,
      title: video.snippet.title
    };
  }
  return null;
}

async function main() {
  console.log('🎵 開始抓取 YouTube ID...\n');

  if (YOUTUBE_API_KEY === '你的YouTube_API_KEY') {
    console.log('❌ 請先填入 YOUTUBE_API_KEY！');
    process.exit(1);
  }

  const songs = JSON.parse(fs.readFileSync('./public/songs.json', 'utf-8'));

  let found = 0;
  const notFound = [];

  for (let i = 0; i < songs.length; i++) {
    const song = songs[i];

    const result = await searchYouTube(song.title, song.artist);

    if (result) {
      songs[i].youtube_id = result.id;
      found++;
      console.log(`✅ [${i+1}/${songs.length}] ${song.title}`);
      console.log(`   → ${result.title}`);
      console.log(`   → ID: ${result.id}`);
    } else {
      notFound.push(`${song.title} - ${song.artist}`);
      console.log(`❌ [${i+1}/${songs.length}] 找不到：${song.title}`);
    }

    // 每首間隔 500ms
    await new Promise(r => setTimeout(r, 500));
  }

  fs.writeFileSync('./public/songs.json', JSON.stringify(songs, null, 2), 'utf-8');

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ 成功：${found} 首`);
  console.log(`❌ 找不到：${notFound.length} 首`);
  if (notFound.length > 0) {
    notFound.forEach(s => console.log(`   - ${s}`));
  }
  console.log('📁 songs.json 已更新！');
}

main();