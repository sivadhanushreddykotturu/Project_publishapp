/** v1 device fingerprint: random id persisted in localStorage. */
export function getDeviceFingerprint(): string {
  const existing = localStorage.getItem("launchops_device_fp");
  if (existing) return existing;
  const fp = `fp_${crypto.randomUUID()}`;
  localStorage.setItem("launchops_device_fp", fp);
  return fp;
}
