/** v1 device fingerprint: random id persisted in localStorage. */
export function getDeviceFingerprint(): string {
  const existing = localStorage.getItem("defineux_device_fp");
  if (existing) return existing;
  const fp = `fp_${crypto.randomUUID()}`;
  localStorage.setItem("defineux_device_fp", fp);
  return fp;
}
