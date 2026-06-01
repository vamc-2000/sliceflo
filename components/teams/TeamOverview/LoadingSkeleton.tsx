const LoadingSkeleton = () => (
  <div className="space-y-2">
    {[1, 2].map(i => (
      <div
        key={i}
        className="h-16 rounded-lg bg-muted animate-pulse"
      />
    ))}
  </div>
);

export default LoadingSkeleton;