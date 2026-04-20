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

// EXIF Orientation 값 읽기 (JPEG만 해당, 오류 시 1 반환)
function readExifOrientation(file: File): Promise<number> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buf = e.target!.result as ArrayBuffer;
        const view = new DataView(buf);
        if (view.getUint16(0) !== 0xFFD8) { resolve(1); return; }
        let offset = 2;
        while (offset < buf.byteLength - 4) {
          const marker = view.getUint16(offset);
          offset += 2;
          if (marker === 0xFFE1) {
            if (view.getUint32(offset + 2) !== 0x45786966) { resolve(1); return; }
            const tiffStart = offset + 2 + 6;
            const le = view.getUint16(tiffStart) === 0x4949;
            const ifdStart = tiffStart + view.getUint32(tiffStart + 4, le);
            const tagCount = view.getUint16(ifdStart, le);
            for (let i = 0; i < tagCount; i++) {
              const tagOff = ifdStart + 2 + i * 12;
              if (view.getUint16(tagOff, le) === 0x0112) {
                resolve(view.getUint16(tagOff + 8, le));
                return;
              }
            }
            resolve(1); return;
          } else if ((marker & 0xFF00) !== 0xFF00) { resolve(1); return; }
          else { offset += view.getUint16(offset); }
        }
        resolve(1);
      } catch { resolve(1); }
    };
    reader.onerror = () => resolve(1);
    reader.readAsArrayBuffer(file.slice(0, 65536));
  });
}

// 이미지 압축 + EXIF 회전 보정 — 핸드폰 세로 사진이 옆으로 눕히는 문제 해결
async function compressImage(file: File): Promise<{ base64: string; mimeType: string }> {
  const orientation = await readExifOrientation(file);
  return new Promise((resolve) => {
    const img = new window.Image();
    // 브라우저 자동 회전을 끄고 직접 제어 (구형 브라우저 대응)
    (img.style as CSSStyleDeclaration & { imageOrientation?: string }).imageOrientation = "none";
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const srcW = img.naturalWidth;
      const srcH = img.naturalHeight;
      // orientation 5~8은 가로/세로 축이 바뀜 (90°/270° 회전 필요)
      const swapped = orientation >= 5 && orientation <= 8;
      const visW = swapped ? srcH : srcW;
      const visH = swapped ? srcW : srcH;
      const MAX_PX = 1200;
      let outW = visW;
      let outH = visH;
      if (outW > MAX_PX || outH > MAX_PX) {
        const ratio = Math.min(MAX_PX / outW, MAX_PX / outH);
        outW = Math.round(outW * ratio);
        outH = Math.round(outH * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d")!;
      // sx/sy: 캔버스 출력 크기 기준 스케일
      const sx = outW / visW;
      const sy = outH / visH;
      // EXIF orientation별 캔버스 변환 행렬 적용
      switch (orientation) {
        case 2: ctx.setTransform(-sx, 0, 0,  sy, outW,    0); break;
        case 3: ctx.setTransform(-sx, 0, 0, -sy, outW, outH); break;
        case 4: ctx.setTransform( sx, 0, 0, -sy,    0, outH); break;
        case 5: ctx.setTransform(  0, sy,  sx, 0,    0,    0); break;
        case 6: ctx.setTransform(  0, sy, -sx, 0, outW,    0); break; // 가장 흔한 케이스 (세로 촬영)
        case 7: ctx.setTransform(  0,-sy, -sx, 0, outW, outH); break;
        case 8: ctx.setTransform(  0,-sy,  sx, 0,    0, outH); break;
        default: ctx.setTransform(sx, 0, 0, sy, 0, 0); break;
      }
      ctx.drawImage(img, 0, 0, srcW, srcH);
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

  // 기기 ID 초기화 + 서비스 워커 등록 (PWA 홈화면 추가용)
  useEffect(() => {
    setDeviceId(getDeviceId());
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {/* 미지원 환경 무시 */});
    }
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
                        imageOrientation: "from-image",
                      }}
                    />
                  </div>
                  <RecipeResult
                    content={analysisState.content}
                    title={analysisState.title}
                    deviceId={deviceId}
                  />
                  {/* 다시 분석하기 버튼 */}
                  <div className="px-4 pb-8 -mt-2 text-center">
                    <button
                      onClick={() => {
                        URL.revokeObjectURL(analysisState.imageUrl);
                        setAnalysisState({ status: "idle" });
                      }}
                      className="inline-flex items-center gap-1.5 text-gray-400 font-medium transition-colors hover:text-orange-500 active:scale-95"
                      style={{ fontSize: "13px" }}
                    >
                      <span>↩</span>
                      <span>다른 사진으로 다시 분석하기</span>
                    </button>
                  </div>
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
