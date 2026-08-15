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
        bgClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        dotClass: 'bg-emerald-400'
      };
    case 'NEEDS_REVIEW':
      return {
        label: 'Needs Review',
        bgClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        dotClass: 'bg-amber-400'
      };
    case 'FAILED':
      return {
        label: 'Failed',
        bgClass: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
        dotClass: 'bg-rose-400'
      };
    case 'ANALYZING':
      return {
        label: 'Analyzing...',
        bgClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 animate-pulse',
        dotClass: 'bg-indigo-400 animate-ping'
      };
    case 'UPLOADING':
      return {
        label: 'Uploading...',
        bgClass: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
        dotClass: 'bg-sky-400'
      };
    default:
      return {
        label: status || 'Unknown',
        bgClass: 'bg-slate-700/30 text-slate-400 border-slate-700',
        dotClass: 'bg-slate-400'
      };
  }
}
