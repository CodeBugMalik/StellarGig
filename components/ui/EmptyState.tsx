import { FiInbox } from 'react-icons/fi';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export default function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-surface-600 px-6 py-16 text-center">
      <FiInbox className="mb-4 h-10 w-10 text-surface-600" />
      <p className="text-lg font-medium text-white">{title}</p>
      <p className="mt-2 max-w-sm text-sm text-slate-400">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
