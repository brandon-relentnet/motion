import type { ReactNode } from "react";

export default function GlassCard({ children }: { children?: ReactNode }) {
  return (
    <div
      className="size-150 p-6 flex flex-col gap-4 backdrop-blur-xl bg-white/40 ring ring-white/50 outline outline-white/20 rounded-2xl shadow-xl"
      style={{
        backgroundImage:
          "radial-gradient(120% 80% at 10% 0%, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 55%)",
      }}
    >
      {children}
    </div>
  );
}
