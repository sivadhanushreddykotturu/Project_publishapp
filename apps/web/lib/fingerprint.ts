/** v1 device fingerprint: random id persisted in localStorage. */
export function getDeviceFingerprint(): string {
  const existing = localStorage.getItem("uxos_device_fp");
  if (existing) return existing;
  const fp = crypto.randomUUID();
  localStorage.setItem("uxos_device_fp", fp);
  return fp;
}
