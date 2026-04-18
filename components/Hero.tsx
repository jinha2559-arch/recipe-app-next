"use client";

export default function Hero() {
  return (
    <div className="hero-gradient text-white px-6 pt-12 pb-10 text-center relative overflow-hidden">
      {/* 배경 장식 원 */}
      <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-black/10 translate-y-1/2 -translate-x-1/4" />

      {/* 콘텐츠 */}
      <div className="relative z-10">
        <div className="text-5xl mb-4" role="img" aria-label="요리 아이콘">🍳</div>
        <h1 className="text-2xl font-bold leading-snug tracking-tight mb-2">
          냉장고 속 재료로<br />오늘의 레시피를
        </h1>
        <p className="text-white/85 text-sm leading-relaxed">
          사진 한 장이면 충분해요<br />
          AI가 재료를 읽고 요리법을 알려드려요
        </p>
      </div>
    </div>
  );
}
