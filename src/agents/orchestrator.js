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
  console.log('=============================');
  console.log('[Orchestrator] 開始執行 Agent 系統');
  console.log('=============================');

  // Tool 1：計算 MBTI 類型（同步，最快）
  const mbtiType = mbtiTool(answers);

  // Tool 2：查詢人格描述（同步）
  const personality = personalityTool(mbtiType);

  // Tool 3：抽取隨機推薦語（同步）
  const message = messageTool(mbtiType);

  // Tool 4 + Tool 5：同時執行（節省時間）
  const [songs, saveResult] = await Promise.all([
    musicTool(mbtiType),
    userResultTool({ nickname, answers, mbtiResult: mbtiType }),
  ]);

  if (saveResult.success) {
    console.log('[Orchestrator] 用戶資料已成功儲存到 Supabase');
  } else {
    console.warn('[Orchestrator] 用戶資料儲存失敗，但不影響結果顯示');
  }

  const finalResult = {
    mbtiType,
    personality,
    message,
    songs,
  };

  console.log('[Orchestrator] 所有 Agent 執行完畢');
  console.log('[Orchestrator] 最終結果：', finalResult);
  console.log('=============================');

  return finalResult;
}