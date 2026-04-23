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

// 제목에서 음식 이모지 추정
const FOOD_EMOJIS = ["🍜", "🍚", "🥘", "🍲", "🥗", "🍝", "🥩", "🍗", "🥚", "🥦", "🍅", "🧆", "🥙", "🍛", "🫕"];
function getRecipeEmoji(title: string, index: number): string {
  if (title.includes("파스타") || title.includes("스파게티")) return "🍝";
  if (title.includes("밥") || title.includes("볶음밥") || title.includes("비빔밥")) return "🍚";
  if (title.includes("국") || title.includes("찌개") || title.includes("탕")) return "🍲";
  if (title.includes("샐러드")) return "🥗";
  if (title.includes("계란") || title.includes("달걀")) return "🥚";
  if (title.includes("닭") || title.includes("치킨")) return "🍗";
  if (title.includes("고기") || title.includes("소고기") || title.includes("돼지")) return "🥩";
  if (title.includes("면") || title.includes("라면") || title.includes("우동")) return "🍜";
  return FOOD_EMOJIS[index % FOOD_EMOJIS.length];
}

export default function SavedRecipes({ deviceId, refreshKey }: SavedRecipesProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    setConfirmDeleteId(null);
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
    if (!dateStr) return "날짜 없음";
    const d = new Date(dateStr);
    if (isNaN(d.getTime()) || d.getFullYear() < 2000) return "날짜 없음";
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
          <div key={i} className="skeleton rounded-2xl" style={{ height: "72px" }} />
        ))}
      </div>
    );
  }

  // 빈 상태 (UC16)
  if (recipes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-8 text-center animate-fade-in" style={{ paddingTop: "48px", paddingBottom: "48px" }}>
        {/* 일러스트 느낌 이모지 박스 */}
        <div
          className="flex items-center justify-center rounded-3xl bg-orange-50 mb-5"
          style={{ width: "100px", height: "100px" }}
        >
          <span style={{ fontSize: "52px" }}>🍱</span>
        </div>
        <p className="font-bold text-gray-700 mb-2" style={{ fontSize: "16px" }}>
          아직 저장된 레시피가 없어요
        </p>
        <p className="text-gray-400 leading-relaxed mb-4" style={{ fontSize: "13px", wordBreak: "keep-all" }}>
          레시피를 추천받고 저장 버튼을 누르면<br />
          여기서 언제든 다시 볼 수 있어요!
        </p>
        {/* 안내 칩 */}
        <div
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5"
          style={{ background: "#FFF3E0", fontSize: "12px", color: "#FF7043", fontWeight: 600 }}
        >
          <span>📱</span>
          <span>이 기기에서만 보여요</span>
        </div>
      </div>
    );
  }

  const filteredRecipes = searchQuery.trim()
    ? recipes.filter((r) => r.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : recipes;

  return (
    <div className="px-4 py-2 space-y-3 pb-10 animate-fade-in">
      {/* 검색창 */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-white"
        style={{ border: "1px solid #FFE8DC", boxShadow: "0 1px 4px rgba(255,87,34,0.06)" }}
      >
        <svg className="w-4 h-4 shrink-0" style={{ color: "#FFAB91" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="레시피 이름 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent outline-none text-gray-700"
          style={{ fontSize: "13px" }}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} className="shrink-0 text-gray-400 hover:text-gray-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* 상단 안내 */}
      <div className="flex items-center justify-between mb-1">
        <div
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
          style={{ background: "#FFF3E0", fontSize: "11px", color: "#FF7043", fontWeight: 600 }}
        >
          <span>📱</span>
          <span>이 기기에서만 보여요</span>
        </div>
        <p className="text-xs text-gray-400 font-medium">
          {searchQuery ? `${filteredRecipes.length}/${recipes.length}개` : `${recipes.length}개 저장됨`}
        </p>
      </div>

      {filteredRecipes.length === 0 && searchQuery && (
        <div className="flex flex-col items-center py-10 text-center">
          <span style={{ fontSize: "40px" }}>🔍</span>
          <p className="mt-3 font-bold text-gray-600" style={{ fontSize: "14px" }}>검색 결과가 없어요</p>
          <p className="text-gray-400 mt-1" style={{ fontSize: "12px" }}>다른 키워드로 검색해보세요</p>
        </div>
      )}

      {filteredRecipes.map((recipe, index) => (
        <div
          key={recipe.id}
          className="card-lift bg-white rounded-2xl overflow-hidden"
          style={{
            boxShadow: "0 2px 12px rgba(255,87,34,0.08), 0 1px 3px rgba(0,0,0,0.05)",
            border: "1px solid #FFE8DC",
          }}
        >
          {/* 헤더 — 클릭으로 펼치기/접기 */}
          <div
            className="flex items-center p-4 cursor-pointer"
            onClick={() => {
              setExpandedId(expandedId === recipe.id ? null : recipe.id);
              setConfirmDeleteId(null);
            }}
          >
            {/* 음식 이모지 원형 배지 */}
            <div
              className="shrink-0 flex items-center justify-center rounded-xl mr-3"
              style={{ width: "44px", height: "44px", background: "#FFF3E0", fontSize: "22px" }}
            >
              {getRecipeEmoji(recipe.title, index)}
            </div>

            {/* 제목 + 날짜 */}
            <div className="flex-1 min-w-0">
              <p
                className="font-bold text-gray-900 truncate"
                style={{ fontSize: "14px" }}
              >
                {recipe.title}
              </p>
              <div className="date-badge mt-1">
                <span>🕐</span>
                <span>{formatDate(recipe.created_at)}</span>
              </div>
            </div>

            {/* 버튼들 */}
            <div className="flex items-center gap-2 shrink-0 ml-2">
              {/* 삭제 버튼 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(recipe.id);
                }}
                disabled={deletingId === recipe.id}
                className="transition-all duration-150 rounded-lg px-2 py-1"
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  background: confirmDeleteId === recipe.id ? "#FFEBEE" : "transparent",
                  color: confirmDeleteId === recipe.id ? "#E53935" : "#BDBDBD",
                  border: confirmDeleteId === recipe.id ? "1px solid #FFCDD2" : "1px solid transparent",
                }}
                aria-label="삭제"
              >
                {deletingId === recipe.id ? (
                  <span>삭제 중...</span>
                ) : confirmDeleteId === recipe.id ? (
                  <span>정말 삭제?</span>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
              </button>

              {/* 펼치기/접기 화살표 */}
              <div
                className="flex items-center justify-center rounded-full transition-all duration-200"
                style={{
                  width: "28px",
                  height: "28px",
                  background: expandedId === recipe.id ? "#FFF3E0" : "#F5F5F5",
                }}
              >
                <svg
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    expandedId === recipe.id ? "rotate-180" : ""
                  }`}
                  style={{ color: expandedId === recipe.id ? "#FF5722" : "#9E9E9E" }}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* 펼쳐진 내용 */}
          {expandedId === recipe.id && (
            <div className="px-4 pb-4 border-t" style={{ borderColor: "#FFF0E8" }}>
              <div className="recipe-content mt-3">{renderContent(recipe.content)}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
