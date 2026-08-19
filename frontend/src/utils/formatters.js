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
        bgClass: 'bg-emerald-100/90 text-emerald-800 border-emerald-200 shadow-sm',
        dotClass: 'bg-emerald-500'
      };
    case 'NEEDS_REVIEW':
      return {
        label: 'Needs Review',
        bgClass: 'bg-amber-100/90 text-amber-800 border-amber-200 shadow-sm',
        dotClass: 'bg-amber-500'
      };
    case 'FAILED':
      return {
        label: 'Failed',
        bgClass: 'bg-rose-100/90 text-rose-800 border-rose-200 shadow-sm',
        dotClass: 'bg-rose-500'
      };
    case 'ANALYZING':
      return {
        label: 'Analyzing...',
        bgClass: 'bg-purple-100/90 text-purple-800 border-purple-200 shadow-sm animate-pulse',
        dotClass: 'bg-purple-500 animate-ping'
      };
    case 'UPLOADING':
      return {
        label: 'Uploading...',
        bgClass: 'bg-sky-100/90 text-sky-800 border-sky-200 shadow-sm',
        dotClass: 'bg-sky-500'
      };
    default:
      return {
        label: status || 'Unknown',
        bgClass: 'bg-slate-100 text-slate-700 border-slate-200',
        dotClass: 'bg-slate-400'
      };
  }
}

