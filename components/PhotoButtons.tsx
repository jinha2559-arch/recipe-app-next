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
      {/* 카메라로 찍기 (UC3) */}
      <button
        onClick={() => cameraInputRef.current?.click()}
        className="flex-1 flex items-center justify-center gap-2 bg-brand-orange text-white font-semibold text-sm py-4 rounded-2xl shadow-md active:scale-95 transition-transform"
      >
        <span className="text-xl">📷</span>
        <span>카메라로 찍기</span>
      </button>

      {/* 사진 올리기 (UC6) */}
      <button
        onClick={() => galleryInputRef.current?.click()}
        className="flex-1 flex items-center justify-center gap-2 bg-white border-2 border-brand-orange text-brand-orange font-semibold text-sm py-4 rounded-2xl shadow-sm active:scale-95 transition-transform"
      >
        <span className="text-xl">🖼️</span>
        <span>사진 올리기</span>
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
