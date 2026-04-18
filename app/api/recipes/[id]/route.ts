import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// DELETE: 레시피 삭제 (device_id 검증 포함)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { deviceId } = await request.json();

    if (!deviceId) {
      return NextResponse.json({ error: "기기 ID가 없습니다." }, { status: 400 });
    }

    // device_id 일치 확인 후 삭제 (다른 기기의 레시피를 삭제 못하도록)
    const { error } = await supabase
      .from("recipes")
      .delete()
      .eq("id", params.id)
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
