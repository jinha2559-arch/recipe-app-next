"use client";

export default function Hero() {
  return (
    <div className="hero-gradient hero-noise text-white relative overflow-hidden" style={{ minHeight: "220px" }}>
      {/* 음식 dots 패턴 오버레이 */}
      <div className="food-dots-pattern absolute inset-0 z-[1]" />

      {/* 큰 배경 원 — 오른쪽 위 */}
      <div
        className="absolute -top-16 -right-16 rounded-full bg-white/10"
        style={{ width: "200px", height: "200px", zIndex: 1 }}
      />
      {/* 중간 배경 원 — 왼쪽 아래 */}
      <div
        className="absolute -bottom-10 -left-10 rounded-full bg-black/10"
        style={{ width: "150px", height: "150px", zIndex: 1 }}
      />
      {/* 작은 강조 원 — 오른쪽 아래 */}
      <div
        className="absolute bottom-8 right-6 rounded-full bg-white/10"
        style={{ width: "60px", height: "60px", zIndex: 1 }}
      />

      {/* 콘텐츠 */}
      <div className="relative px-6 pt-12 pb-11 text-center" style={{ zIndex: 2 }}>
        {/* 아이콘 배지 */}
        <div
          className="inline-flex items-center justify-center mb-4 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30"
          style={{ width: "68px", height: "68px" }}
          role="img"
          aria-label="요리 아이콘"
        >
          <span style={{ fontSize: "36px", lineHeight: 1 }}>🍳</span>
        </div>

        {/* 태그라인 */}
        <div className="inline-flex items-center gap-1.5 bg-white/20 text-white/90 text-xs font-semibold px-3 py-1 rounded-full mb-3 border border-white/20">
          <span>✨</span>
          <span>AI 레시피 추천</span>
        </div>

        {/* 타이틀 */}
        <h1
          className="font-bold leading-tight tracking-tight mb-3"
          style={{
            fontSize: "26px",
            textShadow: "0 2px 12px rgba(0,0,0,0.15)",
            wordBreak: "keep-all",
          }}
        >
          냉장고 속 재료로<br />
          <span className="text-yellow-200">오늘의 레시피</span>를
        </h1>

        {/* 서브 텍스트 */}
        <p
          className="text-white/80 leading-relaxed"
          style={{ fontSize: "13px", wordBreak: "keep-all" }}
        >
          사진 한 장이면 충분해요 — AI가 재료를 읽고<br />
          딱 맞는 요리법을 바로 알려드려요
        </p>
      </div>
    </div>
  );
}
