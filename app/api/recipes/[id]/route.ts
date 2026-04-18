import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 빌드 타임에 에러 방지 — 런타임에만 실제 값 사용
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

// UUID v4 형식 검증 정규식
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// DELETE: 레시피 삭제 (device_id 검증 포함)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // id가 유효한 UUID v4 형식인지 검증
    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json({ error: "유효하지 않은 레시피 ID입니다." }, { status: 400 });
    }

    const { deviceId } = await request.json();

    if (!deviceId) {
      return NextResponse.json({ error: "기기 ID가 없습니다." }, { status: 400 });
    }

    const supabase = getSupabase();

    // 삭제 전 레시피 존재 여부 + 소유권 확인
    const { data: existing, error: fetchError } = await supabase
      .from("recipes")
      .select("id")
      .eq("id", id)
      .eq("device_id", deviceId)
      .single();

    if (fetchError || !existing) {
      // 레시피가 없거나 다른 기기 소유 — 두 경우 모두 404로 통일
      return NextResponse.json(
        { error: "레시피를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // device_id 일치 확인 후 삭제 (다른 기기의 레시피를 삭제 못하도록)
    const { error } = await supabase
      .from("recipes")
      .delete()
      .eq("id", id)
      .eq("device_id", deviceId);

    if (error) {
      console.error("Supabase DELETE error:", error);
      return NextResponse.json({ error: "삭제에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE error:", error);
    return NextResponse.json({ error: "삭제 중 오류가 발생했습니다." }, { status: 500 });
  }
}
