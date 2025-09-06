function HorseSkeletonLoading() {
  return (
    <ul className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i} className="h-20 rounded bg-gray-200 animate-pulse" />
      ))}
    </ul>
  );
}

export default HorseSkeletonLoading;