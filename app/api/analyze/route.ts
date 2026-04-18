import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, mimeType } = await request.json();

    if (!imageBase64) {
      return NextResponse.json({ error: "이미지가 없습니다." }, { status: 400 });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType || "image/jpeg"};base64,${imageBase64}`,
                detail: "high",
              },
            },
            {
              type: "text",
              text: `이 냉장고 또는 음식 사진을 보고 다음 형식으로 레시피를 추천해줘. 냉장고가 아닌 사진이어도 음식/재료가 보이면 그걸로 추천해줘. 아무것도 없거나 음식과 무관한 사진이면 친절하게 안내해줘.

## 🥬 발견된 재료
- 재료 목록을 bullet point로

## 🍽️ 추천 요리 (3가지)
1. 요리명
2. 요리명
3. 요리명

## 👨‍🍳 레시피 (가장 쉬운 요리 기준)

**재료**
- 재료 목록

**만드는 법**
1. 단계별 설명
2. ...

## 💡 오늘의 요리 팁
간단하고 유용한 팁 1-2가지

모든 설명은 한국어로, 쉽고 친근하게 작성해줘.`,
            },
          ],
        },
      ],
      max_tokens: 1500,
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "AI 분석에 실패했습니다. 다시 시도해주세요." },
        { status: 500 }
      );
    }

    // 제목 추출 (첫 번째 추천 요리)
    const titleMatch = content.match(/1\.\s*(.+)/);
    const title = titleMatch ? titleMatch[1].trim() : "오늘의 레시피";

    return NextResponse.json({ content, title });
  } catch (error) {
    console.error("Analyze error:", error);
    return NextResponse.json(
      { error: "잠시 후 다시 시도해주세요. 서버에 문제가 발생했습니다." },
      { status: 500 }
    );
  }
}
