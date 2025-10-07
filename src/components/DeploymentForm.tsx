import FormInput from "./FormInput";
import LoadingProgressBar from "./LoadingProgressBar";
import MultiStateBadge from "./MultiStateBadge";

export default function Deploy() {
  return (
    <>
      <div className="flex flex-col gap-4 lg:w-1/3 w-full">
        <h1 className="text-2xl font-poppins">Deploy a new container</h1>
        <FormInput />
        <div className="flex gap-4 items-center">
          <div className="block w-full">
            <LoadingProgressBar />
          </div>
          <MultiStateBadge />
        </div>
      </div>
    </>
  );
}
