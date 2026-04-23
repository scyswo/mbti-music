/* =========================================================
   Orchestrator Agent（主控代理）— 完整版
   負責依序呼叫五個 Tool，整合所有結果

   流程：
   answers → Tool1(mbti) → Tool2(personality)
          → Tool3(message) → Tool4(music)
          → Tool5(儲存用戶結果)
          → 回傳完整結果給 Result 頁面
========================================================= */

import { mbtiTool }        from './mbtiTool';
import { personalityTool } from './personalityTool';
import { messageTool }     from './messageTool';
import { musicTool }       from './musicTool';
import { userResultTool }  from './userResultTool';

export async function orchestrator(answers, nickname) {
  const mbtiType = mbtiTool(answers);
  const personality = personalityTool(mbtiType);
  const message = messageTool(mbtiType);

  const [songs, saveResult] = await Promise.all([
    musicTool(mbtiType),
    userResultTool({ nickname, answers, mbtiResult: mbtiType }),
  ]);

  return {
    mbtiType,
    personality,
    message,
    songs,
    shareId: saveResult.shareId ?? null,
  };
}