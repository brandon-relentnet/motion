import type { ReactNode } from "react";

export default function GlassCard({ children }: { children?: ReactNode }) {
  return (
    <div className="card w-full shadow-md backdrop-blur-[100px] dark:bg-black/30 bg-white/30 bg-no-repeat bg-[radial-gradient(120%_80%_at_10%_0%,rgba(255,255,255,0.25)_0%,rgba(255,255,255,0)_55%)] dark:bg-[radial-gradient(120%_80%_at_10%_0%,rgba(99,102,241,0.12)_0%,rgba(99,102,241,0)_55%)]">
      {children}
    </div>
  );
}
