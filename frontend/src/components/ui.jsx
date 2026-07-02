// Reusable UI Components

// Badge
export const Badge = ({ children, variant = 'default', size = 'sm' }) => {
  const variants = {
    default: 'bg-slate-100 text-slate-700',
    primary: 'bg-blue-100 text-blue-700',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
    inactive: 'bg-slate-100 text-slate-500',
  };
  const sizes = { xs: 'text-xs px-1.5 py-0.5', sm: 'text-xs px-2 py-1', md: 'text-sm px-2.5 py-1' };
  return (
    <span className={`inline-flex items-center font-medium rounded-full ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
};

// Button
export const Button = ({ children, variant = 'primary', size = 'md', loading = false, disabled = false, icon: Icon, className = '', ...props }) => {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm',
    secondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm',
    ghost: 'hover:bg-slate-100 text-slate-600',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm',
  };
  const sizes = {
    xs: 'text-xs px-2.5 py-1.5 gap-1',
    sm: 'text-sm px-3 py-2 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-5 py-3 gap-2',
  };
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 
        disabled:opacity-50 disabled:cursor-not-allowed active:scale-95
        ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
      {children}
    </button>
  );
};

// Card
export const Card = ({ children, className = '', padding = true }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-100 ${padding ? 'p-5' : ''} ${className}`}>
    {children}
  </div>
);

// Input
export const Input = ({ label, error, icon: Icon, className = '', ...props }) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />}
      <input
        className={`w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900
          placeholder-slate-400 transition-all outline-none
          focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
          disabled:bg-slate-50 disabled:text-slate-500
          ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : ''}
          ${Icon ? 'pl-9' : ''}`}
        {...props}
      />
    </div>
    {error && <p className="text-xs text-red-600">{error}</p>}
  </div>
);

// Select
export const Select = ({ label, error, options = [], className = '', ...props }) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
    <select
      className={`w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900
        transition-all outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
        ${error ? 'border-red-400' : ''} ${className}`}
      {...props}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    {error && <p className="text-xs text-red-600">{error}</p>}
  </div>
);

// Textarea
export const Textarea = ({ label, error, className = '', ...props }) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
    <textarea
      className={`w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900
        placeholder-slate-400 transition-all outline-none resize-y min-h-[80px]
        focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
        ${error ? 'border-red-400' : ''}`}
      {...props}
    />
    {error && <p className="text-xs text-red-600">{error}</p>}
  </div>
);

// Modal
export const Modal = ({ open, onClose, title, children, size = 'md' }) => {
  if (!open) return null;
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl', '2xl': 'max-w-6xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className={`relative bg-white rounded-2xl shadow-2xl w-full ${sizes[size]} max-h-[90vh] overflow-y-auto animate-scale-in`}
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-1 transition-colors">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

// Stat card
export const StatCard = ({ title, value, icon: Icon, color = 'blue', subtitle }) => {
  const colors = {
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600', val: 'text-blue-700' },
    green: { bg: 'bg-emerald-50', icon: 'text-emerald-600', val: 'text-emerald-700' },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-600', val: 'text-amber-700' },
    red: { bg: 'bg-red-50', icon: 'text-red-600', val: 'text-red-700' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600', val: 'text-purple-700' },
    slate: { bg: 'bg-slate-50', icon: 'text-slate-600', val: 'text-slate-700' },
  };
  const c = colors[color] || colors.blue;
  return (
    <Card className="animate-fade-in hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <p className={`text-2xl font-bold ${c.val}`}>{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`${c.bg} rounded-xl p-3`}>
          <Icon className={`h-6 w-6 ${c.icon}`} />
        </div>
      </div>
    </Card>
  );
};

// Empty state
export const EmptyState = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
    <div className="text-5xl mb-4">{icon}</div>
    <h3 className="text-lg font-semibold text-slate-700 mb-1">{title}</h3>
    <p className="text-sm text-slate-400 max-w-xs mb-4">{description}</p>
    {action}
  </div>
);

// Skeleton row
export const SkeletonRow = ({ cols = 6 }) => (
  <tr className="border-b border-slate-50">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <div className="skeleton h-4 rounded" style={{ width: `${60 + (i % 3) * 20}%` }} />
      </td>
    ))}
  </tr>
);

// Page header
export const PageHeader = ({ title, subtitle, actions }) => (
  <div className="flex items-start justify-between mb-6 animate-fade-in">
    <div>
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);

// Confirmation dialog
export const ConfirmDialog = ({ open, onClose, onConfirm, title, message, confirmText = 'Confirm', confirmVariant = 'danger', loading = false }) => (
  <Modal open={open} onClose={onClose} title={title} size="sm">
    <p className="text-sm text-slate-600 mb-5">{message}</p>
    <div className="flex gap-2 justify-end">
      <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
      <Button variant={confirmVariant} onClick={onConfirm} loading={loading}>{confirmText}</Button>
    </div>
  </Modal>
);

// Format helpers
export const formatCurrency = (amount, currency = '₹') =>
  `${currency}${parseFloat(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};
