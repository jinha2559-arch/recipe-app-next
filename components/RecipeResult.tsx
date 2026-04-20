"use client";

import { useState } from "react";

interface RecipeResultProps {
  content: string;
  title: string;
  deviceId: string;
  onReanalyze?: () => void;
}

// 섹션 헤딩에 따른 아이콘/색깔 매핑
const SECTION_STYLES: Record<string, { icon: string; bg: string; text: string }> = {
  재료: { icon: "🥕", bg: "#FFF3E0", text: "#E64A19" },
  재료목록: { icon: "🥕", bg: "#FFF3E0", text: "#E64A19" },
  필요한재료: { icon: "🥕", bg: "#FFF3E0", text: "#E64A19" },
  만드는법: { icon: "👨‍🍳", bg: "#F3F8FF", text: "#1565C0" },
  조리법: { icon: "👨‍🍳", bg: "#F3F8FF", text: "#1565C0" },
  요리순서: { icon: "👨‍🍳", bg: "#F3F8FF", text: "#1565C0" },
  조리순서: { icon: "👨‍🍳", bg: "#F3F8FF", text: "#1565C0" },
  팁: { icon: "💡", bg: "#FFFDE7", text: "#F57F17" },
  요리팁: { icon: "💡", bg: "#FFFDE7", text: "#F57F17" },
  포인트: { icon: "💡", bg: "#FFFDE7", text: "#F57F17" },
};

function getSectionStyle(heading: string) {
  const key = heading.replace(/\s/g, "").replace(/[^가-힣]/g, "");
  const found = Object.entries(SECTION_STYLES).find(([k]) => key.includes(k));
  return found
    ? found[1]
    : { icon: "📌", bg: "#F5F5F5", text: "#424242" };
}

export default function RecipeResult({ content, title, deviceId, onReanalyze }: RecipeResultProps) {
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "duplicate" | "error">("idle");

  async function handleSave() {
    setSaveState("saving");
    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, deviceId }),
      });
      const data = await res.json();

      if (res.status === 409) {
        setSaveState("duplicate");
        setTimeout(() => setSaveState("idle"), 3000);
      } else if (!res.ok) {
        throw new Error(data.error || "저장 실패");
      } else {
        setSaveState("saved");
      }
    } catch {
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 3000);
    }
  }

  // 마크다운 스타일 렌더링 (간단 파서)
  function renderContent(text: string) {
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let currentSection: string | null = null;
    let sectionStyle = getSectionStyle("");
    let sectionItems: React.ReactNode[] = [];
    let sectionIndex = 0;

    function flushSection() {
      if (currentSection !== null && sectionItems.length > 0) {
        const sid = sectionIndex++;
        elements.push(
          <div key={`section-${sid}`} className="mb-1">
            {/* 섹션 헤딩 배지 */}
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl mb-2 mt-4"
              style={{ background: sectionStyle.bg }}
            >
              <span style={{ fontSize: "16px" }}>{sectionStyle.icon}</span>
              <span
                className="font-bold"
                style={{ fontSize: "14px", color: sectionStyle.text }}
              >
                {currentSection}
              </span>
            </div>
            <div className="pl-1">{sectionItems}</div>
          </div>
        );
        sectionItems = [];
      }
    }

    lines.forEach((line, i) => {
      if (line.startsWith("## ")) {
        flushSection();
        currentSection = line.replace("## ", "").trim();
        sectionStyle = getSectionStyle(currentSection);
      } else if (line.startsWith("**") && line.endsWith("**")) {
        const text = line.replace(/\*\*/g, "");
        if (currentSection !== null) {
          sectionItems.push(
            <p key={i} className="font-semibold text-gray-800 mt-2 mb-0.5" style={{ fontSize: "13px" }}>
              {text}
            </p>
          );
        } else {
          elements.push(
            <p key={i} className="font-semibold text-gray-800 mt-3 mb-1" style={{ fontSize: "14px" }}>
              {text}
            </p>
          );
        }
      } else if (line.startsWith("- ")) {
        const item = (
          <div key={i} className="flex items-start gap-2 py-0.5">
            <span className="mt-1 shrink-0" style={{ fontSize: "7px", color: "#FF7043" }}>●</span>
            <span className="text-gray-700 leading-relaxed" style={{ fontSize: "13px" }}>
              {line.replace("- ", "")}
            </span>
          </div>
        );
        currentSection !== null ? sectionItems.push(item) : elements.push(item);
      } else if (line.match(/^\d+\.\s/)) {
        const numMatch = line.match(/^(\d+)\.\s(.*)$/);
        const num = numMatch?.[1] ?? "";
        const rest = numMatch?.[2] ?? line;
        const item = (
          <div key={i} className="flex items-start gap-2 py-1">
            <span
              className="shrink-0 flex items-center justify-center rounded-full text-white font-bold"
              style={{ fontSize: "11px", width: "20px", height: "20px", minWidth: "20px", background: "#FF5722", marginTop: "1px" }}
            >
              {num}
            </span>
            <span className="text-gray-700 leading-relaxed" style={{ fontSize: "13px" }}>
              {rest}
            </span>
          </div>
        );
        currentSection !== null ? sectionItems.push(item) : elements.push(item);
      } else if (line.trim() === "") {
        const item = <div key={i} className="h-1" />;
        currentSection !== null ? sectionItems.push(item) : elements.push(item);
      } else {
        const item = (
          <p key={i} className="text-gray-700 leading-relaxed" style={{ fontSize: "13px" }}>
            {line}
          </p>
        );
        currentSection !== null ? sectionItems.push(item) : elements.push(item);
      }
    });

    flushSection();
    return elements;
  }

  const saveButtonConfig = {
    idle: {
      text: "💾  레시피 저장하기",
      className: "btn-save-idle text-white",
      disabled: false,
    },
    saving: {
      text: "저장 중...",
      className: "bg-orange-300 text-white",
      disabled: true,
    },
    saved: {
      text: "✅  저장 완료!",
      className: "bg-green-500 text-white",
      disabled: true,
    },
    duplicate: {
      text: "이미 저장된 레시피예요 👀",
      className: "bg-amber-400 text-white",
      disabled: true,
    },
    error: {
      text: "오류 발생 — 다시 시도해줘",
      className: "bg-red-400 text-white",
      disabled: true,
    },
  }[saveState];

  return (
    <div className="animate-slide-up">
      {/* 레시피 카드 */}
      <div
        className="mx-4 bg-white rounded-3xl overflow-hidden mb-4"
        style={{ boxShadow: "0 2px 20px rgba(255,87,34,0.10), 0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #FFE0D0" }}
      >
        {/* 상단 컬러 라인 */}
        <div className="recipe-card-top-line" />

        {/* 레시피 제목 헤더 */}
        <div className="px-5 pt-4 pb-3 border-b border-orange-50">
          <div className="flex items-center gap-2">
            <span
              className="flex items-center justify-center rounded-xl bg-orange-50"
              style={{ width: "36px", height: "36px", fontSize: "20px" }}
            >
              🍽️
            </span>
            <div>
              <p className="text-xs text-orange-400 font-semibold mb-0.5">AI 추천 레시피</p>
              <h2 className="font-bold text-gray-900" style={{ fontSize: "15px", wordBreak: "keep-all" }}>
                {title}
              </h2>
            </div>
          </div>
        </div>

        {/* 레시피 본문 */}
        <div className="px-5 pt-2 pb-5 recipe-content">
          {renderContent(content)}
        </div>
      </div>

      {/* 다른 레시피 추천받기 버튼 */}
      {onReanalyze && (
        <div className="px-4 pb-3">
          <button
            onClick={onReanalyze}
            className="w-full py-3.5 rounded-2xl font-bold transition-all active:scale-95"
            style={{
              background: "#FFF3EE",
              color: "#FF5722",
              fontSize: "14px",
              border: "1.5px solid #FFD0BC",
            }}
          >
            🔄 이 재료로 다른 레시피 추천받기
          </button>
        </div>
      )}

      {/* 저장 버튼 — full-width 임팩트 */}
      <div className="px-4 pb-6">
        <button
          onClick={handleSave}
          disabled={saveButtonConfig.disabled}
          className={`w-full py-4 rounded-2xl font-bold transition-all active:scale-95 ${saveButtonConfig.className} ${
            saveButtonConfig.disabled ? "opacity-80 cursor-default" : ""
          }`}
          style={{ fontSize: "15px", letterSpacing: "-0.01em" }}
        >
          {saveButtonConfig.text}
        </button>
        {saveState === "idle" && (
          <p className="text-center text-xs text-gray-400 mt-2">
            이 기기에서만 저장돼요
          </p>
        )}
      </div>
    </div>
  );
}
