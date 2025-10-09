import Containers from "../components/Containers";

type Tab = {
  label: string;
  color?: string;
  description?: string;
};

export default function Active({ tab }: { tab: Tab }) {
  return (
    <>
      <div className="flex gap-3 items-center">
        <span className={`h-5 w-5 rounded-box ${tab.color}`} />
        <h3 className="m-0">{tab.label}</h3>
      </div>
      <Containers filter="running" />
    </>
  );
}
