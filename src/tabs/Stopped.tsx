type Tab = {
  label: string;
  color?: string;
  description?: string;
};

export default function Stopped({ tab }: { tab: Tab }) {
  return (
    <>
      <div className="flex gap-3 items-center">
        <span
          className="h-5 w-5 rounded-[16px]"
          style={{
            backgroundColor: tab.color,
          }}
        />
        <h3 className="m-0">{tab.label}</h3>
      </div>
      <p className="text-[var(--feint-text)]">{tab.description}</p>
    </>
  );
}
