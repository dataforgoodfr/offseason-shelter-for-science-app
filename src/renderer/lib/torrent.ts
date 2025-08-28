export function truncateMagnetLink(magnetLink: string, maxLength: number = 50): string {
  return magnetLink.length > maxLength ? magnetLink.substring(0, maxLength) + '...' : magnetLink;
}