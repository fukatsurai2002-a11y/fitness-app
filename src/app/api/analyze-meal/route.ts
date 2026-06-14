import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT =
  '入力された食事内容からカロリー(kcal)、タンパク質(g)、脂質(g)、炭水化物(g)を推測し、必ず以下のJSONフォーマットのみを返却してください。 {"calories": 0, "protein": 0, "fat": 0, "carbohydrates": 0}';

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "ここにコピーしたAPIキーを貼り付ける") {
    console.error("[analyze-meal] GEMINI_API_KEY が未設定またはプレースホルダーのままです");
    return NextResponse.json(
      { error: "GEMINI_API_KEY が設定されていません。.env.local を確認してください。" },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const mealText: string = body?.mealText ?? "";

    if (!mealText.trim()) {
      return NextResponse.json({ error: "食事内容を入力してください" }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: mealText,
      config: {
        systemInstruction: SYSTEM_PROMPT,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("モデルから空のレスポンスが返されました");
    }

    console.log("[analyze-meal] raw response:", text);

    // JSON部分だけを抽出（```json ... ``` ブロックにも対応）
    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) {
      throw new Error(`JSONの取得に失敗しました。モデルの応答: ${text}`);
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const { calories, protein, fat, carbohydrates } = parsed;

    if (
      typeof calories !== "number" ||
      typeof protein !== "number" ||
      typeof fat !== "number" ||
      typeof carbohydrates !== "number"
    ) {
      throw new Error(`レスポンスの形式が正しくありません: ${JSON.stringify(parsed)}`);
    }

    return NextResponse.json({ calories, protein, fat, carbohydrates });
  } catch (err) {
    console.error("[analyze-meal] error:", err instanceof Error ? err.stack : err);
    const message = err instanceof Error ? err.message : "解析中にエラーが発生しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
