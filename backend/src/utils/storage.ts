export function gbToBytes(gb: number): number {
  if (gb === -1) return -1;
  return gb * 1000 * 1000 * 1000;
}

export function byteToGb(bytes: number): number {
  if (bytes === -1) return -1;
  return bytes / (1000 * 1000 * 1000);
}
