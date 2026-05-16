function metersToMiles(meters: number) {
  return meters / 1609.344;
}

export function formatDistance(meters: number) {
  return `${metersToMiles(meters).toFixed(1)} mi`;
}

export function formatDuration(seconds: number) {
  const minutes = Math.round(seconds / 60);

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${remainingMinutes} min`;
}
