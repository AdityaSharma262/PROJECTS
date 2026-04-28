const StatusBadge = ({ status }) => {
  const statusConfig = {
    open: {
      label: 'Open',
      className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    },
    'in-progress': {
      label: 'In Progress',
      className: 'bg-amber-100 text-amber-700 border-amber-200',
    },
    submitted: {
      label: 'Submitted',
      className: 'bg-purple-100 text-purple-700 border-purple-200',
    },
    'pending-review': {
      label: 'Pending Review',
      className: 'bg-blue-100 text-blue-700 border-blue-200',
    },
    completed: {
      label: 'Completed',
      className: 'bg-gray-100 text-gray-700 border-gray-200',
    },
    rejected: {
      label: 'Rejected',
      className: 'bg-red-100 text-red-700 border-red-200',
    },
  };

  const config = statusConfig[status] || statusConfig.open;

  return (
    <span className={`badge border ${config.className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
      {config.label}
    </span>
  );
};

export default StatusBadge;
