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

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("recommend");
  const [analysisState, setAnalysisState] = useState<AnalysisState>({ status: "idle" });
  const [deviceId, setDeviceId] = useState("");
  const [savedRefreshKey, setSavedRefreshKey] = useState(0);

  // 기기 ID 초기화 (클라이언트에서만)
  useEffect(() => {
    setDeviceId(getDeviceId());
  }, []);

  const handleImageSelect = useCallback(async (file: File) => {
    setActiveTab("recommend");
    setAnalysisState({ status: "loading" });

    // 이미지 미리보기용 URL
    const imageUrl = URL.createObjectURL(file);

    try {
      // File → Base64 변환
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]); // "data:image/jpeg;base64,..." 에서 base64 부분만
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
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

  return (
    <div className="min-h-screen bg-brand-cream">
      <div className="max-w-md mx-auto">
        {/* 히어로 배너 */}
        <Hero />

        {/* 사진 버튼 — 탭 밖 */}
        <PhotoButtons onImageSelect={handleImageSelect} />

        {/* 탭 */}
        <div className="px-4 mb-1">
          <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-orange-100 relative">
            {/* 활성 탭 배경 */}
            <div
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl bg-brand-orange transition-all duration-250 ease-in-out ${
                activeTab === "recommend" ? "left-1" : "left-[calc(50%+3px)]"
              }`}
            />
            <button
              onClick={() => setActiveTab("recommend")}
              className={`relative flex-1 py-2.5 text-sm font-semibold rounded-xl transition-colors z-10 ${
                activeTab === "recommend" ? "text-white" : "text-gray-500"
              }`}
            >
              🍳 레시피 추천
            </button>
            <button
              onClick={() => setActiveTab("saved")}
              className={`relative flex-1 py-2.5 text-sm font-semibold rounded-xl transition-colors z-10 ${
                activeTab === "saved" ? "text-white" : "text-gray-500"
              }`}
            >
              📋 저장된 레시피
            </button>
          </div>
        </div>

        {/* 탭 콘텐츠 */}
        <div className="mt-3">
          {activeTab === "recommend" && (
            <div>
              {/* 대기 상태 */}
              {analysisState.status === "idle" && (
                <div className="flex flex-col items-center justify-center py-14 px-8 text-center animate-fade-in">
                  <div className="text-5xl mb-4">🥬</div>
                  <p className="text-gray-500 font-medium mb-1">사진을 올려주세요!</p>
                  <p className="text-gray-400 text-sm">
                    냉장고, 식재료 사진을 찍거나<br />
                    갤러리에서 골라주세요
                  </p>
                </div>
              )}

              {/* 로딩 상태 (UC8) */}
              {analysisState.status === "loading" && (
                <div className="px-4 animate-fade-in">
                  <div className="flex flex-col items-center py-10">
                    <div className="w-12 h-12 border-4 border-orange-200 border-t-brand-orange rounded-full animate-spin-slow mb-4" />
                    <p className="text-gray-600 font-medium">재료 분석 중...</p>
                    <p className="text-gray-400 text-sm mt-1">AI가 냉장고를 살펴보고 있어요 🔍</p>
                  </div>
                  {/* 스켈레톤 카드 */}
                  <div className="bg-white rounded-3xl p-5 space-y-3">
                    <div className="skeleton h-4 w-3/4" />
                    <div className="skeleton h-4 w-full" />
                    <div className="skeleton h-4 w-5/6" />
                    <div className="skeleton h-4 w-4/5" />
                    <div className="skeleton h-4 w-2/3" />
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
                      className="w-full max-h-48 object-cover rounded-2xl shadow-sm"
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
                <div className="mx-4 bg-red-50 rounded-2xl p-5 text-center animate-fade-in border border-red-100">
                  <div className="text-3xl mb-2">😓</div>
                  <p className="text-red-700 font-medium text-sm mb-1">분석에 실패했어요</p>
                  <p className="text-red-500 text-xs">{analysisState.message}</p>
                  <button
                    onClick={() => setAnalysisState({ status: "idle" })}
                    className="mt-3 text-xs text-brand-orange underline"
                  >
                    다시 시도하기
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === "saved" && (
            <SavedRecipes deviceId={deviceId} refreshKey={savedRefreshKey} />
          )}
        </div>
      </div>
    </div>
  );
}
