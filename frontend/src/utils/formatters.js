/**
 * Formatting utilities for UI components
 */

export function formatBytes(bytes, decimals = 2) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  } catch (e) {
    return dateString;
  }
}

export function formatConfidence(confidence) {
  if (confidence === undefined || confidence === null) return 'N/A';
  const num = parseFloat(confidence);
  if (isNaN(num)) return 'N/A';
  return `${Math.round(num * 100)}%`;
}

export function getStatusBadgeConfig(status) {
  switch (status?.toUpperCase()) {
    case 'COMPLETED':
      return {
        label: 'Completed',
        bgClass: 'bg-[rgba(61,122,82,0.1)] text-[#3D7A52] border-[rgba(61,122,82,0.2)] shadow-sm',
        dotClass: 'bg-[#3D7A52]'
      };
    case 'NEEDS_REVIEW':
      return {
        label: 'Needs Review',
        bgClass: 'bg-[rgba(243,159,90,0.1)] text-[#1D1A39] border-[rgba(243,159,90,0.25)] shadow-sm',
        dotClass: 'bg-[#F39F5A]'
      };
    case 'FAILED':
      return {
        label: 'Failed',
        bgClass: 'bg-[rgba(174,68,90,0.08)] text-[#AE445A] border-[rgba(174,68,90,0.2)] shadow-sm',
        dotClass: 'bg-[#AE445A]'
      };
    case 'ANALYZING':
      return {
        label: 'Analyzing...',
        bgClass: 'bg-[rgba(69,25,82,0.08)] text-[#451952] border-[rgba(69,25,82,0.18)] shadow-sm animate-pulse',
        dotClass: 'bg-[#451952] animate-ping'
      };
    case 'UPLOADING':
      return {
        label: 'Uploading...',
        bgClass: 'bg-[rgba(102,37,73,0.08)] text-[#662549] border-[rgba(102,37,73,0.18)] shadow-sm',
        dotClass: 'bg-[#662549]'
      };
    default:
      return {
        label: status || 'Unknown',
        bgClass: 'bg-[rgba(232,188,185,0.2)] text-[#1D1A39] border-[rgba(232,188,185,0.3)]',
        dotClass: 'bg-[#A8949F]'
      };
  }
}
