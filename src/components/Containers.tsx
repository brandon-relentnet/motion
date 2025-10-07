export default function Containers({ stopped }: { stopped?: boolean }) {
  return <div>Containers {stopped ? "(stopped)" : "(running)"}</div>;
}
