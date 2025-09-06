// app/mine-hester/loading.tsx
export default function Loading() {
  return (
    <div className="p-6">
      <div className="h-6 w-40 rounded bg-gray-200 animate-pulse mb-4" />
      <ul className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <li key={i} className="h-20 rounded bg-gray-200 animate-pulse" />
        ))}
      </ul>
    </div>
  );
}
