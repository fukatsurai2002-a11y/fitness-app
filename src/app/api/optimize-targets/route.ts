import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `あなたはプロの管理栄養士かつパーソナルトレーナーです。
ユーザーの身体データと目標から、最適な「目標総カロリー（kcal）」「タンパク質（g）」「脂質（g）」「炭水化物（g）」を計算してください。
必ず以下のJSON形式のみを返してください。他のテキスト・マークダウンは一切含めないでください。
{"calories": 2500, "protein": 180, "fat": 70, "carbs": 280, "explanation": "設定理由の詳細な解説文"}`;

const GENDER_MAP: Record<string, string> = {
  male: "男性",
  female: "女性",
};

const ACTIVITY_MAP: Record<string, string> = {
  sedentary: "座りがち（デスクワーク中心、ほとんど運動しない）",
  light: "軽い活動（週1〜3回の軽い運動）",
  moderate: "中程度の活動（週3〜5回の運動）",
  active: "活発（週6〜7回の激しい運動）",
  very_active: "非常に活発（1日2回以上のトレーニング）",
};

const GOAL_MAP: Record<string, string> = {
  bulk: "バルクアップ・筋肥大",
  cut: "減量・ダイエット",
  maintain: "健康維持・現状維持",
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "ここにコピーしたAPIキーを貼り付ける") {
    console.error("[optimize-targets] GEMINI_API_KEY が未設定またはプレースホルダーのままです");
    return NextResponse.json(
      { error: "GEMINI_API_KEY が設定されていません。.env.local を確認してください。" },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const { height, weight, age, gender, activityLevel, goal } = body;

    if (!height || !weight || !age || !gender || !activityLevel || !goal) {
      return NextResponse.json({ error: "必須パラメータが不足しています" }, { status: 400 });
    }

    const userText = `
身長: ${height}cm
体重: ${weight}kg
年齢: ${age}歳
性別: ${GENDER_MAP[gender] ?? gender}
活動レベル: ${ACTIVITY_MAP[activityLevel] ?? activityLevel}
目的: ${GOAL_MAP[goal] ?? goal}
    `.trim();

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userText,
      config: { systemInstruction: SYSTEM_PROMPT },
    });

    const text = response.text;
    if (!text) throw new Error("モデルから空のレスポンスが返されました");

    console.log("[optimize-targets] raw response:", text);

    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) throw new Error(`JSONの取得に失敗しました。モデルの応答: ${text}`);

    const parsed = JSON.parse(jsonMatch[0]);
    const { calories, protein, fat, carbs, explanation } = parsed;

    if (
      typeof calories !== "number" ||
      typeof protein !== "number" ||
      typeof fat !== "number" ||
      typeof carbs !== "number" ||
      typeof explanation !== "string"
    ) {
      throw new Error(`レスポンスの形式が正しくありません: ${JSON.stringify(parsed)}`);
    }

    return NextResponse.json({ calories, protein, fat, carbs, explanation });
  } catch (err) {
    console.error("[optimize-targets] error:", err instanceof Error ? err.stack : err);
    const message = err instanceof Error ? err.message : "計算中にエラーが発生しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
