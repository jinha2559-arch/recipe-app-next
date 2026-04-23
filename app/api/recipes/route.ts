import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 빌드 타임에 에러 방지 — 런타임에만 실제 값 사용
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

const MAX_DEVICE_ID_LENGTH = 36; // UUID v4 고정 길이
const MIN_DEVICE_ID_LENGTH = 8;  // 비정상적으로 짧은 ID 차단
const MAX_TITLE_LENGTH = 100;
const MAX_CONTENT_LENGTH = 5000;

// GET: 저장된 레시피 목록 조회 (device_id로 개인화)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get("deviceId");

  if (!deviceId) {
    return NextResponse.json({ error: "기기 ID가 없습니다." }, { status: 400 });
  }

  // deviceId 길이 검증
  if (deviceId.length < MIN_DEVICE_ID_LENGTH || deviceId.length > MAX_DEVICE_ID_LENGTH) {
    return NextResponse.json({ error: "기기 ID가 올바르지 않습니다." }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .eq("device_id", deviceId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase GET error:", error);
    return NextResponse.json({ error: "목록을 불러오지 못했습니다." }, { status: 500 });
  }

  return NextResponse.json({ recipes: data });
}

// POST: 레시피 저장
export async function POST(request: NextRequest) {
  try {
    const { title, content, deviceId } = await request.json();

    if (!title || !content || !deviceId) {
      return NextResponse.json({ error: "필수 정보가 없습니다." }, { status: 400 });
    }

    // title 길이 제한
    if (typeof title !== "string" || title.length > MAX_TITLE_LENGTH) {
      return NextResponse.json(
        { error: `제목은 ${MAX_TITLE_LENGTH}자 이하로 입력해주세요.` },
        { status: 400 }
      );
    }

    // content 길이 제한
    if (typeof content !== "string" || content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        { error: `레시피 내용이 너무 깁니다. (최대 ${MAX_CONTENT_LENGTH}자)` },
        { status: 400 }
      );
    }

    // deviceId 길이 검증
    if (
      typeof deviceId !== "string" ||
      deviceId.length < MIN_DEVICE_ID_LENGTH ||
      deviceId.length > MAX_DEVICE_ID_LENGTH
    ) {
      return NextResponse.json({ error: "기기 ID가 올바르지 않습니다." }, { status: 400 });
    }

    // 중복 체크: 같은 기기에서 같은 제목의 레시피가 이미 있는지
    const supabase = getSupabase();
    const { data: existing } = await supabase
      .from("recipes")
      .select("id")
      .eq("device_id", deviceId)
      .eq("title", title)
      .single();

    if (existing) {
      return NextResponse.json({ error: "이미 저장된 레시피예요!" }, { status: 409 });
    }

    const { data, error } = await supabase
      .from("recipes")
      .insert([{ title, content, device_id: deviceId }])
      .select()
      .single();

    if (error) {
      console.error("Supabase POST error:", error);
      return NextResponse.json({ error: "저장에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ recipe: data });
  } catch (error) {
    console.error("POST error:", error);
    return NextResponse.json({ error: "저장 중 오류가 발생했습니다." }, { status: 500 });
  }
}
