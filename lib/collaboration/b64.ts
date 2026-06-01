export function uint8ToB64(u8: Uint8Array): string {
  let s = "";
  u8.forEach((b) => {
    s += String.fromCharCode(b);
  });
  return btoa(s);
}

export function b64ToUint8(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
