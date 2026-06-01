export function formatTaskId(slug: string, taskNumber?: number): string {
  if (!taskNumber) return '—';
  return `${slug.toUpperCase()}-${String(taskNumber).padStart(4, '0')}`;
}