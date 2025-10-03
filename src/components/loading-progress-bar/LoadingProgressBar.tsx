import { useAdaptiveLoading } from "./hooks/useAdaptiveLoading";
import { useProgressController } from "./hooks/useProgressController";
import { ProgressBadge } from "./components/ProgressBadge";
import { ProgressMeter } from "./components/ProgressMeter";

function LoadingProgressBar() {
  const { progress, start, reset } = useAdaptiveLoading();
  const { badgeState, progressValue, handleBadgeClick } = useProgressController(
    {
      progress,
      start,
      reset,
    }
  );

  return (
    <div
      className="size-150 p-6 flex flex-col gap-4 backdrop-blur-xl bg-white/40 ring ring-white/50 outline outline-white/20 rounded-2xl shadow-xl"
      style={{
        backgroundImage:
          "radial-gradient(120% 80% at 10% 0%, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 55%)",
      }}
    >
      <div className="flex gap-4 items-center">
        <button
          type="button"
          onClick={handleBadgeClick}
          disabled={badgeState === "success" || badgeState === "error"}
          className="bg-transparent p-0 border-0 disabled:cursor-default"
        >
          <ProgressBadge state={badgeState} />
        </button>
      </div>

      <ProgressMeter progress={progress} value={progressValue} />
    </div>
  );
}

export default LoadingProgressBar;

export { ProgressBadge } from "./components/ProgressBadge";
export { ProgressMeter } from "./components/ProgressMeter";
export { useAdaptiveLoading } from "./hooks/useAdaptiveLoading";
export { useProgressController } from "./hooks/useProgressController";
export {
  PROGRESS_BADGE_LABELS,
  AUTO_RESET_DELAY,
  COMPLETION_THRESHOLD,
} from "./constants";
