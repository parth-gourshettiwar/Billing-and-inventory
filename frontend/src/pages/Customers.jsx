import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Eye } from 'lucide-react';
import { Card, Button, Modal, EmptyState, SkeletonRow, PageHeader, Badge, formatCurrency, formatDate, formatDateTime } from '../components/ui';
import api from '../services/api';
import toast from 'react-hot-toast';

const fetchCustomers = (params) => api.get('/customers', { params }).then(r => r.data);
const fetchCustomer = (id) => api.get(`/customers/${id}`).then(r => r.data.data);

export default function Customers() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [viewId, setViewId] = useState(null);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['customers', search, page],
    queryFn: () => fetchCustomers({ search, page, limit: 15 }),
    keepPreviousData: true,
  });

  const { data: customerDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['customer', viewId],
    queryFn: () => fetchCustomer(viewId),
    enabled: !!viewId,
  });

  const createMutation = useMutation({
    mutationFn: (body) => api.post('/customers', body),
    onSuccess: () => { qc.invalidateQueries(['customers']); setShowAdd(false); setName(''); setMobile(''); toast.success('Customer added!'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const rows = data?.data || [];
  const meta = data?.meta || {};

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Customers" subtitle="Manage customer records and purchase history" actions={
        <Button icon={Plus} onClick={() => setShowAdd(true)}>Add Customer</Button>
      } />

      <Card padding={false}>
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              placeholder="Search by name or mobile..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Customer', 'Mobile', 'Total Bills', 'Total Purchase', 'Last Purchase', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? Array(6).fill(0).map((_, i) => <SkeletonRow key={i} cols={6} />) :
                rows.length === 0 ? (
                  <tr><td colSpan={6}><EmptyState icon="👥" title="No customers yet" description="Customers are auto-created during billing or added manually." /></td></tr>
                ) : rows.map(c => (
                  <tr key={c.id} className="border-t border-slate-50 hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">{c.customer_name}</td>
                    <td className="px-4 py-3 text-slate-500">{c.mobile || '—'}</td>
                    <td className="px-4 py-3 text-slate-700 font-semibold">{c.total_bills}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{formatCurrency(c.total_purchase)}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{c.last_purchase ? formatDate(c.last_purchase) : '—'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setViewId(c.id)}
                        className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors">
                        <Eye size={13} /> View History
                      </button>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>

        {meta.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
            <span>{meta.total} customers</span>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <Button variant="secondary" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </Card>

      {/* Add Customer Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Customer" size="sm">
        <form onSubmit={e => { e.preventDefault(); createMutation.mutate({ customer_name: name, mobile }); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Customer Name *</label>
            <input className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              value={name} onChange={e => setName(e.target.value)} placeholder="Full name" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mobile (Optional)</label>
            <input className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              value={mobile} onChange={e => setMobile(e.target.value)} placeholder="10-digit mobile" />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" type="button" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending}>Add Customer</Button>
          </div>
        </form>
      </Modal>

      {/* Customer History Modal */}
      <Modal open={!!viewId} onClose={() => setViewId(null)} title="Customer Profile" size="xl">
        {detailLoading ? <div className="space-y-3">{Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-8 rounded" />)}</div> :
          customerDetail && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Name', val: customerDetail.customer_name },
                  { label: 'Mobile', val: customerDetail.mobile || '—' },
                  { label: 'Total Bills', val: customerDetail.total_bills },
                  { label: 'Total Purchase', val: formatCurrency(customerDetail.total_purchase) },
                ].map(s => (
                  <div key={s.label} className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-500 mb-1">{s.label}</p>
                    <p className="font-semibold text-slate-800">{s.val}</p>
                  </div>
                ))}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Invoice History</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50"><tr>
                      {['Invoice #', 'Vehicle', 'Amount', 'Status', 'Date'].map(h => (
                        <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {customerDetail.bills?.length === 0 ? (
                        <tr><td colSpan={5} className="text-center py-6 text-slate-400">No invoices yet</td></tr>
                      ) : customerDetail.bills?.map(b => (
                        <tr key={b.id} className="border-t border-slate-50">
                          <td className="px-3 py-2.5 font-mono text-xs text-blue-600 font-semibold">{b.invoice_number}</td>
                          <td className="px-3 py-2.5 text-slate-600">{b.vehicle_number}</td>
                          <td className="px-3 py-2.5 font-semibold text-slate-800">{formatCurrency(b.grand_total)}</td>
                          <td className="px-3 py-2.5"><Badge variant={b.status === 'Active' ? 'success' : 'danger'}>{b.status}</Badge></td>
                          <td className="px-3 py-2.5 text-slate-400 text-xs">{formatDateTime(b.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )
        }
      </Modal>
    </div>
  );
}
