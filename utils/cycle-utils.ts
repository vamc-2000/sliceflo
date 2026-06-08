export function formatCycleName(name: string | null | undefined, cycleNumber?: number | null): string {
  if (!name) return "";
  if (cycleNumber === undefined || cycleNumber === null || cycleNumber === 0) {
    return name;
  }
  
  return `${name} ${cycleNumber}`;
}
