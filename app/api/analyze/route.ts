import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// base64 문자열의 바이트 크기 계산 (패딩 고려)
function getBase64ByteSize(base64: string): number {
  const paddingCount = (base64.match(/=+$/) ?? []).length;
  return Math.floor((base64.length * 3) / 4) - paddingCount;
}

// base64 유효성 검사 (RFC 4648 표준 문자셋)
function isValidBase64(str: string): boolean {
  return /^[A-Za-z0-9+/]+={0,2}$/.test(str);
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB
const OPENAI_TIMEOUT_MS = 30_000; // 30초

export async function POST(request: NextRequest) {
  // 요청마다 초기화 (빌드 타임에 API 키 없어도 에러 안 남)
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const { imageBase64, mimeType } = await request.json();

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return NextResponse.json({ error: "이미지가 없습니다." }, { status: 400 });
    }

    // base64 유효성 검사
    if (!isValidBase64(imageBase64)) {
      return NextResponse.json(
        { error: "이미지 형식이 올바르지 않습니다." },
        { status: 400 }
      );
    }

    // 이미지 크기 제한 (10MB)
    const imageSizeBytes = getBase64ByteSize(imageBase64);
    if (imageSizeBytes > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: "이미지가 너무 큽니다. 10MB 이하의 사진을 사용해주세요." },
        { status: 400 }
      );
    }

    // OpenAI 호출 — 30초 타임아웃
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), OPENAI_TIMEOUT_MS);

    let response: Awaited<ReturnType<typeof openai.chat.completions.create>>;
    try {
      response = await openai.chat.completions.create(
        {
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
                  text: `이 사진을 분석해서 레시피를 추천해줘.

[판단 기준]
- 냉장고 내부 사진이면: 보이는 재료를 파악해줘.
- 식재료나 음식이 보이는 사진이면: 그 재료/음식으로 추천해줘.
- 요리 도구(냄비, 프라이팬 등)만 있고 재료가 없으면: "재료가 보이지 않아요. 냉장고나 식재료 사진을 찍어주세요!" 라고만 답해줘.
- 음식/재료와 전혀 무관한 사진(사람, 풍경, 동물, 건물 등)이면: "음식이나 냉장고 사진이 아닌 것 같아요. 냉장고 안이나 식재료 사진을 찍어주시면 레시피를 추천해드릴게요! 😊" 라고만 답해줘.

[레시피 형식 — 음식/재료가 있을 때만 사용]

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
        },
        { signal: timeoutController.signal }
      );
    } finally {
      clearTimeout(timeoutId);
    }

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

    // AbortError = 타임아웃
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { error: "AI 분석이 너무 오래 걸리고 있어요. 잠시 후 다시 시도해주세요." },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: "잠시 후 다시 시도해주세요. 서버에 문제가 발생했습니다." },
      { status: 500 }
    );
  }
}
