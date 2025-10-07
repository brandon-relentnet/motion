import LoadingProgressBar from "./LoadingProgressBar";
import MultiStateBadge from "./MultiStateBadge";

export default function EditForm() {
  return (
    <div className="flex flex-col gap-4 w-full">
      <h1 className="text-2xl font-poppins">Edit a container</h1>
      <div className="flex gap-2 flex-col justify-evenly items-center w-full">
        <label className="input w-full">
          Name
          <input type="search" className="grow" placeholder="Project Name" />
        </label>
        <label className="input w-full">
          Link
          <input
            type="text"
            className="grow"
            placeholder="GitHub Repository URL"
          />
        </label>
        <label className="input w-full">
          Path
          <input type="text" className="grow" placeholder="src/app/" />
          <span className="badge badge-neutral badge-xs">Optional</span>
        </label>
        <select defaultValue="Framework Preset" className="select w-full">
          <option disabled={true}>Framework Preset</option>
          <option>Vite</option>
          <option>NextJS</option>
        </select>
      </div>
      <div className="flex gap-4 items-center">
        <div className="block w-full">
          <LoadingProgressBar />
        </div>
        <MultiStateBadge />
      </div>
    </div>
  );
}
