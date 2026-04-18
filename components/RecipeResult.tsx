"use client";

import { useState } from "react";

interface RecipeResultProps {
  content: string;
  title: string;
  deviceId: string;
}

export default function RecipeResult({ content, title, deviceId }: RecipeResultProps) {
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
    return text
      .split("\n")
      .map((line, i) => {
        if (line.startsWith("## ")) {
          return (
            <h2 key={i} className="text-base font-bold mt-5 mb-2 text-gray-900">
              {line.replace("## ", "")}
            </h2>
          );
        }
        if (line.startsWith("**") && line.endsWith("**")) {
          return (
            <p key={i} className="font-semibold text-gray-800 mt-3 mb-1">
              {line.replace(/\*\*/g, "")}
            </p>
          );
        }
        if (line.startsWith("- ") || line.match(/^\d+\.\s/)) {
          return (
            <p key={i} className="text-gray-700 text-sm leading-relaxed pl-1">
              {line}
            </p>
          );
        }
        if (line.trim() === "") {
          return <div key={i} className="h-1" />;
        }
        return (
          <p key={i} className="text-gray-700 text-sm leading-relaxed">
            {line}
          </p>
        );
      });
  }

  const saveButtonConfig = {
    idle: { text: "💾 레시피 저장하기", style: "bg-brand-orange text-white", disabled: false },
    saving: { text: "저장 중...", style: "bg-orange-300 text-white", disabled: true },
    saved: { text: "✅ 저장 완료!", style: "bg-green-500 text-white", disabled: true },
    duplicate: { text: "이미 저장된 레시피예요 👀", style: "bg-amber-400 text-white", disabled: true },
    error: { text: "오류 발생 — 다시 시도해줘", style: "bg-red-400 text-white", disabled: true },
  }[saveState];

  return (
    <div className="animate-slide-up">
      {/* 레시피 카드 */}
      <div className="mx-4 bg-white rounded-3xl shadow-sm border border-orange-100 p-5 mb-4">
        <div className="recipe-content">{renderContent(content)}</div>
      </div>

      {/* 저장 버튼 */}
      <div className="px-4 pb-6">
        <button
          onClick={handleSave}
          disabled={saveButtonConfig.disabled}
          className={`w-full py-4 rounded-2xl font-semibold text-sm transition-all active:scale-95 ${saveButtonConfig.style} ${
            saveButtonConfig.disabled ? "opacity-80 cursor-default" : ""
          }`}
        >
          {saveButtonConfig.text}
        </button>
      </div>
    </div>
  );
}
