"use client";

import { useState, useEffect, useCallback } from "react";
import Hero from "@/components/Hero";
import PhotoButtons from "@/components/PhotoButtons";
import RecipeResult from "@/components/RecipeResult";
import SavedRecipes from "@/components/SavedRecipes";
import { getDeviceId } from "@/lib/deviceId";

type Tab = "recommend" | "saved";

type AnalysisState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; content: string; title: string; imageUrl: string }
  | { status: "error"; message: string };

// 이미지 압축 함수 — 핸드폰 사진(3~5MB)을 1MB 이하로 줄여서 Vercel 요청 한도 초과 방지
function compressImage(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve) => {
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const MAX_PX = 1200; // 최대 가로/세로 크기
      let { width, height } = img;
      if (width > height && width > MAX_PX) {
        height = Math.round((height * MAX_PX) / width);
        width = MAX_PX;
      } else if (height > MAX_PX) {
        width = Math.round((width * MAX_PX) / height);
        height = MAX_PX;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(objectUrl);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      resolve({ base64: dataUrl.split(",")[1], mimeType: "image/jpeg" });
    };
    img.src = objectUrl;
  });
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("recommend");
  const [analysisState, setAnalysisState] = useState<AnalysisState>({ status: "idle" });
  const [deviceId, setDeviceId] = useState("");
  const [savedRefreshKey, setSavedRefreshKey] = useState(0);
  const [tabKey, setTabKey] = useState(0); // 탭 전환 fade 트리거

  // 기기 ID 초기화 (클라이언트에서만)
  useEffect(() => {
    setDeviceId(getDeviceId());
  }, []);

  const handleImageSelect = useCallback(async (file: File) => {
    setActiveTab("recommend");
    setAnalysisState({ status: "loading" });

    // 이미지 미리보기용 URL (원본 파일 그대로 — 화면 표시용)
    const imageUrl = URL.createObjectURL(file);

    try {
      // 이미지 압축 후 base64 변환 (Vercel 4.5MB 한도 대응)
      const { base64, mimeType } = await compressImage(file);

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "분석에 실패했습니다.");
      }

      setAnalysisState({
        status: "success",
        content: data.content,
        title: data.title,
        imageUrl,
      });

      // 저장 후 저장된 레시피 탭 새로고침용 키 올리기
      setSavedRefreshKey((k) => k + 1);
    } catch (err) {
      setAnalysisState({
        status: "error",
        message: err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.",
      });
      URL.revokeObjectURL(imageUrl);
    }
  }, []);

  function handleTabChange(tab: Tab) {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setTabKey((k) => k + 1); // fade 재실행
  }

  return (
    <div className="min-h-screen bg-brand-cream">
      <div className="max-w-md mx-auto">
        {/* 히어로 배너 */}
        <Hero />

        {/* 사진 버튼 — 탭 밖 */}
        <PhotoButtons onImageSelect={handleImageSelect} />

        {/* 탭 */}
        <div className="px-4 mb-1">
          <div
            className="flex p-1 relative"
            style={{
              background: "#fff",
              borderRadius: "18px",
              boxShadow: "0 1px 8px rgba(255,87,34,0.08), 0 0 0 1px #FFE8DC",
            }}
          >
            {/* 활성 탭 배경 슬라이더 */}
            <div
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-2xl transition-all duration-300 ease-in-out ${
                activeTab === "recommend" ? "left-1" : "left-[calc(50%+3px)]"
              }`}
              style={{
                background: "linear-gradient(135deg, #FF5722, #FF7043)",
                boxShadow: "0 2px 8px rgba(255,87,34,0.3)",
              }}
            />
            <button
              onClick={() => handleTabChange("recommend")}
              className={`relative flex-1 py-2.5 font-semibold rounded-2xl transition-colors z-10 ${
                activeTab === "recommend" ? "text-white" : "text-gray-400"
              }`}
              style={{ fontSize: "13px" }}
            >
              🍳 레시피 추천
            </button>
            <button
              onClick={() => handleTabChange("saved")}
              className={`relative flex-1 py-2.5 font-semibold rounded-2xl transition-colors z-10 ${
                activeTab === "saved" ? "text-white" : "text-gray-400"
              }`}
              style={{ fontSize: "13px" }}
            >
              📋 저장된 레시피
            </button>
          </div>
        </div>

        {/* 탭 콘텐츠 */}
        <div className="mt-3">
          {activeTab === "recommend" && (
            <div key={`recommend-${tabKey}`} className="tab-content-enter">
              {/* 대기 상태 */}
              {analysisState.status === "idle" && (
                <div className="flex flex-col items-center justify-center py-14 px-8 text-center">
                  <div
                    className="flex items-center justify-center rounded-3xl bg-orange-50 mb-5"
                    style={{ width: "88px", height: "88px" }}
                  >
                    <span style={{ fontSize: "44px" }}>🥬</span>
                  </div>
                  <p className="font-bold text-gray-700 mb-1.5" style={{ fontSize: "16px" }}>
                    사진을 올려주세요!
                  </p>
                  <p className="text-gray-400 leading-relaxed" style={{ fontSize: "13px", wordBreak: "keep-all" }}>
                    냉장고 또는 식재료 사진을 찍거나<br />
                    갤러리에서 골라주세요
                  </p>
                </div>
              )}

              {/* 로딩 상태 (UC8) */}
              {analysisState.status === "loading" && (
                <div className="px-4">
                  <div className="flex flex-col items-center py-10">
                    {/* dots 애니메이션 */}
                    <div className="flex items-center gap-2 mb-5">
                      <div className="loading-dot" />
                      <div className="loading-dot" />
                      <div className="loading-dot" />
                    </div>
                    <p className="font-bold text-gray-700 mb-1" style={{ fontSize: "15px" }}>
                      재료 분석 중이에요
                    </p>
                    <p className="text-gray-400" style={{ fontSize: "13px" }}>
                      AI가 냉장고를 살펴보고 있어요 🔍
                    </p>
                  </div>
                  {/* 스켈레톤 카드 */}
                  <div
                    className="bg-white rounded-3xl p-5 space-y-3"
                    style={{ boxShadow: "0 2px 12px rgba(255,87,34,0.08)", border: "1px solid #FFE8DC" }}
                  >
                    <div className="skeleton h-3.5 w-2/3" />
                    <div className="skeleton h-3 w-full" />
                    <div className="skeleton h-3 w-5/6" />
                    <div className="skeleton h-3 w-4/5" />
                    <div className="skeleton h-3 w-3/4" />
                    <div className="h-2" />
                    <div className="skeleton h-3.5 w-1/2" />
                    <div className="skeleton h-3 w-full" />
                    <div className="skeleton h-3 w-11/12" />
                  </div>
                </div>
              )}

              {/* 성공 상태 */}
              {analysisState.status === "success" && (
                <div>
                  {/* 업로드한 사진 미리보기 */}
                  <div className="px-4 mb-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={analysisState.imageUrl}
                      alt="분석한 사진"
                      className="w-full object-cover rounded-2xl"
                      style={{
                        maxHeight: "200px",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                      }}
                    />
                  </div>
                  <RecipeResult
                    content={analysisState.content}
                    title={analysisState.title}
                    deviceId={deviceId}
                  />
                </div>
              )}

              {/* 오류 상태 (UC5, UC19) */}
              {analysisState.status === "error" && (
                <div
                  className="mx-4 error-card rounded-2xl p-5 text-center animate-fade-in"
                >
                  <div
                    className="inline-flex items-center justify-center rounded-2xl mb-3"
                    style={{ width: "56px", height: "56px", background: "#FFEBEE", fontSize: "28px" }}
                  >
                    😓
                  </div>
                  <p className="font-bold text-red-700 mb-1" style={{ fontSize: "15px" }}>
                    분석에 실패했어요
                  </p>
                  <p className="text-red-400 mb-4" style={{ fontSize: "12px", wordBreak: "keep-all" }}>
                    {analysisState.message}
                  </p>
                  <button
                    onClick={() => setAnalysisState({ status: "idle" })}
                    className="inline-flex items-center gap-1.5 font-semibold rounded-xl px-4 py-2 transition-all active:scale-95"
                    style={{
                      background: "#FF5722",
                      color: "#fff",
                      fontSize: "13px",
                    }}
                  >
                    <span>↩</span>
                    <span>다시 시도하기</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === "saved" && (
            <div key={`saved-${tabKey}`} className="tab-content-enter">
              <SavedRecipes deviceId={deviceId} refreshKey={savedRefreshKey} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
