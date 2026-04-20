"use client";

import { useRef } from "react";

interface PhotoButtonsProps {
  onImageSelect: (file: File) => void;
}

export default function PhotoButtons({ onImageSelect }: PhotoButtonsProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      // jpg, png 외 파일 차단 (UC7)
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        alert("jpg, png, webp 사진만 올릴 수 있어요!");
        e.target.value = "";
        return;
      }
      onImageSelect(file);
    }
    // 같은 파일 다시 선택 가능하도록 초기화
    e.target.value = "";
  }

  return (
    <div className="px-4 py-5 flex gap-3">
      {/* 카메라로 찍기 (UC3) — 채운 카드 버튼 */}
      <button
        onClick={() => cameraInputRef.current?.click()}
        className="btn-camera flex-1 flex flex-col items-center justify-center gap-1.5 text-white rounded-2xl active:scale-95 transition-all duration-150"
        style={{ paddingTop: "18px", paddingBottom: "18px" }}
      >
        <span style={{ fontSize: "28px", lineHeight: 1 }}>📷</span>
        <span className="font-bold" style={{ fontSize: "14px" }}>카메라로 찍기</span>
        <span className="text-white/75 font-medium" style={{ fontSize: "11px" }}>실시간 촬영</span>
      </button>

      {/* 사진 올리기 (UC6) — 선 카드 버튼 */}
      <button
        onClick={() => galleryInputRef.current?.click()}
        className="btn-gallery flex-1 flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-brand-orange active:scale-95 transition-all duration-150"
        style={{ paddingTop: "18px", paddingBottom: "18px" }}
      >
        <span style={{ fontSize: "28px", lineHeight: 1 }}>🖼️</span>
        <span className="font-bold text-brand-orange" style={{ fontSize: "14px" }}>사진 올리기</span>
        <span className="font-medium" style={{ fontSize: "11px", color: "#FF8A65" }}>갤러리에서 선택</span>
      </button>

      {/* 숨겨진 파일 입력 — 카메라 (capture=environment) */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
      />

      {/* 숨겨진 파일 입력 — 갤러리 */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
      />
    </div>
  );
}
