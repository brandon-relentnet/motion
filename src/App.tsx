import LoadingProgressBar from "./components/LoadingProgressBar";
import GlassCard from "./components/GlassCard";
import MultiStateBadge from "./components/MultiStateBadge";
import SmoothTabs from "./components/SmoothTabs";

function App() {
  return (
    <div className="bg-gradient-to-br px-8 from-slate-200 via-blue-200 to-indigo-200 min-h-screen flex justify-center items-center flex-col gap-4">
      <GlassCard>
        <h1 className="text-2xl font-poppins">Hello, world!</h1>
        <p>This is a simple glassmorphism card.</p>
        <LoadingProgressBar />
        <MultiStateBadge />
      </GlassCard>
      <SmoothTabs />
    </div>
  );
}

export default App;
