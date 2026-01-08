/**
 * Formats duration in seconds to a human-readable string
 * @param seconds - Duration in seconds
 * @returns Formatted string (e.g., "45 min", "1h 23m", "2h")
 */
export function formatDuration(seconds: number | undefined | null): string {
  if (!seconds || seconds < 0) {
    return 'N/A';
  }

  if (seconds < 60) {
    return '< 1 min';
  }

  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Formats duration in seconds to MM:SS format
 * @param seconds - Duration in seconds
 * @returns Formatted string (e.g., "45:30", "1:23:45")
 */
export function formatDurationMMSS(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}





