// 기기별 고유 ID 관리 (로그인 없이 개인화)
// 첫 방문 시 랜덤 ID를 생성해서 이 기기에 영구 저장

const DEVICE_ID_KEY = "recipe_app_device_id";

export function getDeviceId(): string {
  if (typeof window === "undefined") return "";

  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    // crypto.randomUUID()로 완전 랜덤 ID 생성
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}
