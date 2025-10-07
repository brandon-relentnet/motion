import LoadingProgressBar from "./LoadingProgressBar";
import MultiStateBadge from "./MultiStateBadge";

export default function CategoriesForm() {
  return (
    <div className="flex flex-col gap-4 w-full">
      <h1 className="text-2xl font-poppins">Add a Category</h1>
      <div className="flex gap-2 flex-col justify-evenly items-center w-full">
        <label className="input w-full">
          Name
          <input type="search" className="grow" placeholder="Category Name" />
        </label>
        <label className="input w-full">
          Color
          <input type="text" className="grow" placeholder="#1e1e2e" />
          <span className="badge badge-neutral badge-xs">Optional</span>
        </label>
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
