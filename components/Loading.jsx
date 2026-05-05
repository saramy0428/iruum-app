"use client";

export default function Loading() {
  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center gap-12">
      {/* Pulsing seal — like ink being pressed onto paper */}
      <div className="relative">
        <div className="w-20 h-20 border border-ink/20" />
        <div
          className="absolute inset-0 bg-vermilion"
          style={{
            animation: "stampPulse 1.6s ease-in-out infinite",
          }}
        />
      </div>

      <div className="text-center space-y-2">
        <p className="eyebrow">Reading your chart</p>
        <p className="font-display italic text-xl text-ink/60">
          Calculating the four pillars…
        </p>
      </div>

      <style jsx>{`
        @keyframes stampPulse {
          0%, 100% { opacity: 0; transform: scale(0.85); }
          50%      { opacity: 0.85; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
