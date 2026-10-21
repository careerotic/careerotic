type SkeletonProps = { className?: string };

/**
 * Shared decorative placeholder for content that is still loading.
 * Keep dimensions/layout in the caller so the same primitive works for cards,
 * text lines, table rows, and navigation items.
 */
export function Skeleton({ className = "" }: SkeletonProps) {
  return <div aria-hidden="true" className={`animate-pulse motion-reduce:animate-none ${className}`} />;
}
