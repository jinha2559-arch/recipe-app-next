"use client";

import { useState, useEffect, useCallback } from "react";

interface Recipe {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

interface SavedRecipesProps {
  deviceId: string;
  refreshKey: number; // 저장 후 목록 새로고침용
}

export default function SavedRecipes({ deviceId, refreshKey }: SavedRecipesProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchRecipes = useCallback(async () => {
    if (!deviceId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/recipes?deviceId=${deviceId}`);
      const data = await res.json();
      setRecipes(data.recipes || []);
    } catch {
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes, refreshKey]);

  async function handleDelete(id: string) {
    if (!confirm("이 레시피를 삭제할까요?")) return;
    setDeletingId(id);
    try {
      await fetch(`/api/recipes/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId }),
      });
      setRecipes((prev) => prev.filter((r) => r.id !== id));
    } catch {
      alert("삭제 중 오류가 발생했어요.");
    } finally {
      setDeletingId(null);
    }
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ko-KR", {
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // 마크다운 간단 렌더링
  function renderContent(text: string) {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("## ")) {
        return (
          <h3 key={i} className="text-sm font-bold mt-4 mb-1 text-gray-800">
            {line.replace("## ", "")}
          </h3>
        );
      }
      if (line.startsWith("**") && line.endsWith("**")) {
        return (
          <p key={i} className="text-sm font-semibold text-gray-700 mt-2">
            {line.replace(/\*\*/g, "")}
          </p>
        );
      }
      if (line.trim() === "") return <div key={i} className="h-1" />;
      return (
        <p key={i} className="text-xs text-gray-600 leading-relaxed">
          {line}
        </p>
      );
    });
  }

  // 로딩 스켈레톤
  if (loading) {
    return (
      <div className="px-4 py-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-16 w-full" />
        ))}
      </div>
    );
  }

  // 빈 상태 (UC16)
  if (recipes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-8 text-center animate-fade-in">
        <div className="text-5xl mb-4">📭</div>
        <p className="text-gray-500 font-medium mb-1">아직 저장된 레시피가 없어요</p>
        <p className="text-gray-400 text-sm">레시피를 추천받고 저장해보세요!</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-2 space-y-3 pb-10 animate-fade-in">
      <p className="text-xs text-gray-400 text-right mb-1">
        이 기기에서 저장한 레시피 {recipes.length}개
      </p>

      {recipes.map((recipe) => (
        <div
          key={recipe.id}
          className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden"
        >
          {/* 헤더 — 제목 + 버튼 */}
          <div
            className="flex items-center justify-between p-4 cursor-pointer"
            onClick={() => setExpandedId(expandedId === recipe.id ? null : recipe.id)}
          >
            <div className="flex-1 min-w-0 pr-2">
              <p className="font-semibold text-gray-900 text-sm truncate">{recipe.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{formatDate(recipe.created_at)}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* 삭제 버튼 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(recipe.id);
                }}
                disabled={deletingId === recipe.id}
                className="text-gray-300 hover:text-red-400 transition-colors p-1"
                aria-label="삭제"
              >
                {deletingId === recipe.id ? (
                  <span className="text-xs">...</span>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
              </button>
              {/* 펼치기/접기 화살표 */}
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${
                  expandedId === recipe.id ? "rotate-180" : ""
                }`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* 펼쳐진 내용 */}
          {expandedId === recipe.id && (
            <div className="px-4 pb-4 border-t border-orange-50">
              <div className="recipe-content mt-3">{renderContent(recipe.content)}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
