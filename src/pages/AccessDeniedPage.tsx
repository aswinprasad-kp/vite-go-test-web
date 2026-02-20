import { Link } from 'react-router-dom';

export default function AccessDeniedPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded border border-amber-200 bg-amber-50 p-8 text-amber-800">
      <strong className="text-lg">Access denied</strong>
      <p className="text-sm">You don’t have permission to view this page.</p>
      <Link to="/claims" className="text-sm font-medium text-[var(--xpense-primary)] hover:underline">
        Go to Claims
      </Link>
    </div>
  );
}
