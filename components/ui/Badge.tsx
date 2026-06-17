import { STATUS_COLORS, STATUS_LABELS } from '@/lib/constants';

interface BadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export default function Badge({ status, size = 'sm' }: BadgeProps) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.open;
  const label = STATUS_LABELS[status] || status;

  return (
    <span
      className={`status-badge ${colors.bg} ${colors.text} ${
        size === 'md' ? 'px-3 py-1.5 text-sm' : ''
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
      {label}
    </span>
  );
}
