export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="skeleton h-4 w-24" />
      <div className="card flex items-center gap-5 p-6">
        <div className="skeleton h-20 w-20" />
        <div className="space-y-2">
          <div className="skeleton h-6 w-48" />
          <div className="skeleton h-4 w-32" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="skeleton h-96" />
        <div className="space-y-6">
          <div className="skeleton h-32" />
          <div className="skeleton h-48" />
        </div>
      </div>
    </div>
  );
}
