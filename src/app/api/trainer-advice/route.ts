import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `あなたは「優しく褒めて伸ばしてくれる管理栄養士」です。

キャラクター設定：
- 敬語ベースで、親しみやすくポジティブ、モチベーションを高めてくれるお姉さん風の口調
- 語尾は「〜ですね！」「〜していきましょう♪」「〜ですよ♪」など
- 不足している栄養素があっても決して責めず、優しく前向きに導く
- 例：「お疲れ様です！素晴らしい取り組みですね。あと少しタンパク質が足りないので、夜食にギリシャヨーグルトやプロテインをプラスすると完璧ですよ♪」
- できている部分を必ず褒め、改善点は次の一食や明日への前向きな提案として伝える

ユーザーの今日の摂取栄養素と目標値を分析して、2〜4件のアドバイスを生成してください。
必ず以下のJSON形式のみを返してください。他のテキスト・マークダウンは一切含めないでください。

{"advices": [{"kind": "success", "title": "タイトル", "text": "詳細テキスト（キャラクター口調で）"}]}

kindは以下のいずれかにしてください:
- "success": 達成・良い点（目標達成、良い食習慣など）
- "info": 情報・補足（現在の状況説明、栄養素の豆知識など）
- "warning": 注意（ただし優しく。超過・大幅不足など）
- "tip": ヒント・アドバイス（次の一食への具体的な提案、明日への改善案など）`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "ここにコピーしたAPIキーを貼り付ける") {
    console.error("[trainer-advice] GEMINI_API_KEY が未設定またはプレースホルダーのままです");
    return NextResponse.json(
      { error: "GEMINI_API_KEY が設定されていません。.env.local を確認してください。" },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const { totals, goals } = body;

    if (!totals || !goals) {
      return NextResponse.json({ error: "必須パラメータが不足しています" }, { status: 400 });
    }

    const { calories: tCal, protein: tPro, carbs: tCarbs, fat: tFat } = totals;
    const { calories: gCal, protein: gPro, carbs: gCarbs, fat: gFat } = goals;

    const diff = (actual: number, target: number) => {
      const d = actual - target;
      return `${d > 0 ? "+" : ""}${Math.round(d)}`;
    };

    const pct = (actual: number, target: number) =>
      target > 0 ? `${Math.round((actual / target) * 100)}%` : "—";

    const userText = `
【今日の栄養摂取状況】
カロリー:   ${Math.round(tCal)} kcal / 目標 ${gCal} kcal（${pct(tCal, gCal)}、差分 ${diff(tCal, gCal)} kcal）
タンパク質: ${Math.round(tPro)}g / 目標 ${gPro}g（${pct(tPro, gPro)}、差分 ${diff(tPro, gPro)}g）
炭水化物:   ${Math.round(tCarbs)}g / 目標 ${gCarbs}g（${pct(tCarbs, gCarbs)}、差分 ${diff(tCarbs, gCarbs)}g）
脂質:       ${Math.round(tFat)}g / 目標 ${gFat}g（${pct(tFat, gFat)}、差分 ${diff(tFat, gFat)}g）
    `.trim();

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userText,
      config: { systemInstruction: SYSTEM_PROMPT },
    });

    const text = response.text;
    if (!text) throw new Error("モデルから空のレスポンスが返されました");

    console.log("[trainer-advice] raw response:", text);

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error(`JSONの取得に失敗しました。モデルの応答: ${text}`);

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed.advices)) {
      throw new Error(`レスポンスの形式が正しくありません: ${JSON.stringify(parsed)}`);
    }

    const VALID_KINDS = new Set(["success", "warning", "info", "tip"]);
    const advices = parsed.advices.map((a: Record<string, unknown>) => ({
      kind: VALID_KINDS.has(String(a.kind)) ? a.kind : "info",
      title: String(a.title ?? ""),
      text: String(a.text ?? ""),
    }));

    return NextResponse.json({ advices });
  } catch (err) {
    console.error("[trainer-advice] error:", err instanceof Error ? err.stack : err);
    const message = err instanceof Error ? err.message : "アドバイス生成中にエラーが発生しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
