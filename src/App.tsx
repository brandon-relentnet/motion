import SmoothTabs from "./components/SmoothTabs";
import DeploymentForm from "./components/DeploymentForm";

function App() {
  return (
    <div className="bg-gradient-to-br px-8 from-slate-200 via-blue-200 to-indigo-200 min-h-screen flex justify-center items-center flex-col gap-4">
      <div className="flex gap-8 w-full">
        <DeploymentForm />
        <SmoothTabs />
      </div>
    </div>
  );
}

export default App;
