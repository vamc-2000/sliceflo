// utils/device-info.ts
export async function getClientIp(): Promise<string> {
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    const data = await res.json();
    return data.ip || "0.0.0.0";
  } catch {
    return "0.0.0.0";
  }
}

export function getBrowserInfo(): string {
  if (typeof navigator === "undefined") return "Unknown";
  return navigator.userAgent;
}

export function getDeviceType(): string {
  if (typeof navigator === "undefined") return "Unknown";

  const ua = navigator.userAgent;

  if (/Mobi|Android/i.test(ua)) return "Mobile";
  if (/iPad|Tablet/i.test(ua)) return "Tablet";
  return "Desktop";
}

export function getDeviceName(): string {
  if (typeof navigator === "undefined") return "Unknown";

  const ua = navigator.userAgent;

  if (ua.includes("Windows")) return "Windows PC";
  if (ua.includes("Macintosh")) return "Mac";
  if (/iPhone|Android/i.test(ua)) return "Phone";
  return "Unknown";
}

export async function getAutoDetectData() {
  const ipAddress = await getClientIp();

  return {
    ipAddress,
    deviceType: getDeviceType(),
    deviceName: getDeviceName(),
    browserInfo: getBrowserInfo(),
  };
}
