import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Eye, PrinterIcon, XCircle } from 'lucide-react';
import { Card, Button, Badge, Modal, EmptyState, SkeletonRow, PageHeader, formatCurrency, formatDateTime } from '../components/ui';
import api from '../services/api';
import toast from 'react-hot-toast';

const fetchBills = (params) => api.get('/bills', { params }).then(r => r.data);
const fetchBill = (id) => api.get(`/bills/${id}`).then(r => r.data.data);

export default function SalesHistory() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [page, setPage] = useState(1);
  const [cancelBill, setCancelBill] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['bills', search, status, dateRange, page],
    queryFn: () => fetchBills({ search, status, dateRange, page, limit: 15 }),
    keepPreviousData: true,
  });


  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }) => api.patch(`/bills/${id}/cancel`, { cancel_reason: reason }),
    onSuccess: () => { qc.invalidateQueries(['bills']); qc.invalidateQueries(['dashboard']); setCancelBill(null); setCancelReason(''); toast.success('Invoice cancelled'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to cancel'),
  });

  const DATE_FILTERS = [
    { value: '', label: 'All Time' }, { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' }, { value: 'month', label: 'This Month' },
  ];

  const rows = data?.data || [];
  const meta = data?.meta || {};

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Sales History" subtitle="View, print and manage all invoices" />

      <Card padding={false}>
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              placeholder="Search by invoice #, customer, vehicle..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {DATE_FILTERS.map(f => (
              <button key={f.value} onClick={() => { setDateRange(f.value); setPage(1); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${dateRange === f.value ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            {[{ value: '', label: 'All' }, { value: 'Active', label: 'Active' }, { value: 'Cancelled', label: 'Cancelled' }].map(f => (
              <button key={f.value} onClick={() => { setStatus(f.value); setPage(1); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${status === f.value ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100"><tr>
              {['Invoice #', 'Customer', 'Vehicle', 'Date & Time', 'Amount', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {isLoading ? Array(8).fill(0).map((_, i) => <SkeletonRow key={i} cols={7} />) :
                rows.length === 0 ? (
                  <tr><td colSpan={7}><EmptyState icon="🧾" title="No invoices found" description="Generated invoices will appear here." /></td></tr>
                ) : rows.map(b => (
                  <tr key={b.id} className="border-t border-slate-50 hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-600">{b.invoice_number}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{b.customer_name}</td>
                    <td className="px-4 py-3 text-slate-600 font-mono tracking-wide">{b.vehicle_number}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{formatDateTime(b.created_at)}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{formatCurrency(b.grand_total)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={b.status === 'Active' ? 'success' : 'danger'}>{b.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => window.open(`/print/invoice/${b.id}`, '_blank')} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-colors" title="View &amp; Print">
                          <Eye size={14} />
                        </button>
                        <button onClick={() => window.open(`/print/invoice/${b.id}`, '_blank')} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-colors" title="Print">
                          <PrinterIcon size={14} />
                        </button>
                        {b.status === 'Active' && (
                          <button onClick={() => { setCancelBill(b); setCancelReason(''); }}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors" title="Cancel Invoice"><XCircle size={14} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {meta.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
            <span>{meta.total} invoices</span>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <Button variant="secondary" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </Card>


      <Modal open={!!cancelBill} onClose={() => setCancelBill(null)} title="Cancel Invoice" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">You are about to cancel invoice <strong>{cancelBill?.invoice_number}</strong>. This cannot be undone.</p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cancellation Reason *</label>
            <textarea
              value={cancelReason} onChange={e => setCancelReason(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-500/20 resize-y min-h-[80px]"
              placeholder="Enter reason for cancellation..."
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setCancelBill(null)}>Back</Button>
            <Button variant="danger" loading={cancelMutation.isPending}
              onClick={() => { if (!cancelReason.trim()) return toast.error('Reason is required'); cancelMutation.mutate({ id: cancelBill.id, reason: cancelReason }); }}>
              Cancel Invoice
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
