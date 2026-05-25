import { HardDrive } from 'lucide-react';

function formatSize(totalBytes) {
  if (totalBytes < 1024) return `${totalBytes} B`;
  if (totalBytes < 1024 * 1024) return `${(totalBytes / 1024).toFixed(1)} KB`;
  if (totalBytes < 1024 * 1024 * 1024) return `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(totalBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function StorageWidget({ isCollapsed, storageData }) {
  if (storageData === undefined || storageData === null) return null;

  const { totalBytes, limitGB, percentage } = storageData;

  const barColor =
    percentage >= 90
      ? 'bg-red-500'
      : percentage >= 70
      ? 'bg-[#FFC703]/60'
      : 'bg-[#FFC703]';

  // Larghezza minima del 3% per renderla sempre visibile
  const barWidth = Math.max(percentage, totalBytes > 0 ? 3 : 0);
  const formattedPct = percentage === 0 ? '0' : percentage < 0.1 ? '<0.1' : Math.round(percentage);

  if (isCollapsed) {
    return (
      <div className="flex justify-center px-2 py-2 mb-1">
        <HardDrive size={20} className="text-[#FFC703]/70 flex-shrink-0" />
      </div>
    );
  }

  return (
    <div className="mx-2 mb-2 px-3 py-3 bg-white/5 rounded-xl">
      <div className="flex items-center gap-2 mb-2">
        <HardDrive size={14} className="text-[#FFC703]/70 flex-shrink-0" />
        <span className="text-xs font-medium text-white/40">Storage</span>
      </div>
      <div className="w-full bg-white/10 rounded-full h-1.5 mb-2">
        <div
          className={`h-1.5 rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
      <p className="text-xs text-white/40">
        {formatSize(totalBytes)} / {limitGB} GB
        <span className="ml-1 text-white/25">· {formattedPct}%</span>
      </p>
    </div>
  );
}
