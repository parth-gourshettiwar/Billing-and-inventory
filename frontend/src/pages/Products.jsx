import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit2, ToggleLeft, ToggleRight, Eye, History } from 'lucide-react';
import { Card, Button, Badge, Input, Modal, EmptyState, SkeletonRow, PageHeader, ConfirmDialog, formatCurrency } from '../components/ui';
import api from '../services/api';
import toast from 'react-hot-toast';

const fetchProducts = (params) => api.get('/products', { params }).then(r => r.data);

const GST_RATES = [0, 5, 12, 18, 28].map(r => ({ value: r, label: `${r}%` }));
const UNITS = ['PCS', 'SET', 'KG', 'LTR', 'MTR', 'NOS', 'BOX', 'PAIR', 'ROLL'];

const ProductForm = ({ initial, onSave, onClose }) => {
  const [form, setForm] = useState({
    product_name: '', brand: '', oem_number: '', hsn_code: '', purchase_price: '',
    selling_price_inclusive: '', gst_rate: 18, stock: 0, unit: 'PCS', description: '',
    ...initial,
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.product_name || !form.hsn_code) return toast.error('Product name and HSN code are required');
    const sp = parseFloat(form.selling_price_inclusive), pp = parseFloat(form.purchase_price);
    if (sp < pp) {
      const proceed = window.confirm('⚠️ Selling price is below purchase price (negative margin). Continue?');
      if (!proceed) return;
    }
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Product Name *</label>
          <input className={inputCls} value={form.product_name} onChange={e => set('product_name', e.target.value)} placeholder="e.g. Engine Oil 20W50" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Brand</label>
          <input className={inputCls} value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="e.g. Castrol" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">HSN Code *</label>
          <input className={inputCls} value={form.hsn_code} onChange={e => set('hsn_code', e.target.value)} placeholder="e.g. 2710" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">OEM / Part Number</label>
          <input className={inputCls} value={form.oem_number} onChange={e => set('oem_number', e.target.value)} placeholder="e.g. MO-2020-K" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Purchase Price (₹)</label>
          <input className={inputCls} type="number" step="0.01" min="0" value={form.purchase_price} onChange={e => set('purchase_price', e.target.value)} placeholder="0.00" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Selling Price - GST Inclusive (₹)</label>
          <input className={inputCls} type="number" step="0.01" min="0" value={form.selling_price_inclusive} onChange={e => set('selling_price_inclusive', e.target.value)} placeholder="0.00" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">GST Rate</label>
          <select className={inputCls} value={form.gst_rate} onChange={e => set('gst_rate', e.target.value)}>
            {GST_RATES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Stock</label>
          <input className={inputCls} type="number" min="0" value={form.stock} onChange={e => set('stock', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
          <select className={inputCls} value={form.unit} onChange={e => set('unit', e.target.value)}>
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea className={`${inputCls} resize-y min-h-[70px]`} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Optional product description..." />
        </div>
      </div>

      {/* GST Preview */}
      {form.selling_price_inclusive && form.gst_rate != null && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm">
          <p className="font-semibold text-blue-800 mb-2">GST Breakdown Preview</p>
          <div className="grid grid-cols-4 gap-2 text-center">
            {(() => {
              const sp = parseFloat(form.selling_price_inclusive) || 0;
              const rate = parseFloat(form.gst_rate) || 0;
              const taxable = rate > 0 ? sp / (1 + rate / 100) : sp;
              const cgst = (taxable * rate / 2 / 100);
              return (
                <>
                  <div><p className="text-blue-600 font-bold">₹{taxable.toFixed(2)}</p><p className="text-blue-400 text-xs">Taxable</p></div>
                  <div><p className="text-blue-600 font-bold">₹{cgst.toFixed(2)}</p><p className="text-blue-400 text-xs">CGST {rate/2}%</p></div>
                  <div><p className="text-blue-600 font-bold">₹{cgst.toFixed(2)}</p><p className="text-blue-400 text-xs">SGST {rate/2}%</p></div>
                  <div><p className="text-blue-600 font-bold">₹{sp.toFixed(2)}</p><p className="text-blue-400 text-xs">Total</p></div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={saving}>{initial?.id ? 'Update Product' : 'Add Product'}</Button>
      </div>
    </form>
  );
};

export default function Products() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [viewProduct, setViewProduct] = useState(null);
  const [historyProduct, setHistoryProduct] = useState(null);
  const [toggleConfirm, setToggleConfirm] = useState(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['products', search, filter, page],
    queryFn: () => fetchProducts({ search, filter, page, limit: 15 }),
    keepPreviousData: true,
  });

  const { data: historyData } = useQuery({
    queryKey: ['product-history', historyProduct?.id],
    queryFn: () => api.get(`/products/${historyProduct.id}/history`).then(r => r.data.data),
    enabled: !!historyProduct,
  });

  const createMutation = useMutation({
    mutationFn: (body) => api.post('/products', body),
    onSuccess: () => { qc.invalidateQueries(['products']); setShowForm(false); toast.success('Product added!'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to add product'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }) => api.put(`/products/${id}`, body),
    onSuccess: () => { qc.invalidateQueries(['products']); setEditProduct(null); toast.success('Product updated!'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to update'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => api.patch(`/products/${id}/status`),
    onSuccess: (_, id) => { qc.invalidateQueries(['products']); setToggleConfirm(null); toast.success('Status updated!'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const FILTERS = [
    { value: 'all', label: 'All' }, { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }, { value: 'low_stock', label: 'Low Stock' },
    { value: 'out_of_stock', label: 'Out of Stock' },
  ];

  const rows = data?.data || [];
  const meta = data?.meta || {};

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Products" subtitle="Manage your spare parts catalogue" actions={
        <Button icon={Plus} onClick={() => setShowForm(true)}>Add Product</Button>
      } />

      <Card padding={false}>
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              placeholder="Search by name, brand, HSN, OEM..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {FILTERS.map(f => (
              <button key={f.value} onClick={() => { setFilter(f.value); setPage(1); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${filter === f.value ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Product', 'Brand', 'OEM #', 'HSN', 'Purchase', 'Selling', 'GST', 'Stock', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? Array(6).fill(0).map((_, i) => <SkeletonRow key={i} cols={10} />) :
                rows.length === 0 ? (
                  <tr><td colSpan={10}><EmptyState icon="📦" title="No products found" description="Add your first product to get started." /></td></tr>
                ) : rows.map(p => (
                  <tr key={p.id} className="border-t border-slate-50 hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800 max-w-[200px]">
                      <p className="truncate">{p.product_name}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{p.brand || '—'}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">{p.oem_number || '—'}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">{p.hsn_code}</td>
                    <td className="px-4 py-3 text-slate-700">{formatCurrency(p.purchase_price)}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{formatCurrency(p.selling_price_inclusive)}</td>
                    <td className="px-4 py-3">
                      <Badge variant="primary">{p.gst_rate}%</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${p.stock === 0 ? 'text-red-600' : p.stock <= meta.threshold ? 'text-amber-600' : 'text-slate-800'}`}>
                        {p.stock} {p.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={p.status === 'Active' ? 'success' : 'inactive'}>{p.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setViewProduct(p)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors" title="View"><Eye size={15} /></button>
                        <button onClick={() => setEditProduct(p)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors" title="Edit"><Edit2 size={15} /></button>
                        <button onClick={() => setToggleConfirm(p)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-amber-600 transition-colors" title="Toggle Status">
                          {p.status === 'Active' ? <ToggleRight size={15} className="text-emerald-500" /> : <ToggleLeft size={15} />}
                        </button>
                        <button onClick={() => setHistoryProduct(p)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-purple-600 transition-colors" title="History"><History size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
            <span>Showing {rows.length} of {meta.total} products</span>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <Button variant="secondary" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </Card>

      {/* Add Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add New Product" size="lg">
        <ProductForm onSave={(f) => createMutation.mutateAsync(f)} onClose={() => setShowForm(false)} />
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editProduct} onClose={() => setEditProduct(null)} title="Edit Product" size="lg">
        {editProduct && <ProductForm initial={editProduct} onSave={(f) => updateMutation.mutateAsync({ id: editProduct.id, ...f })} onClose={() => setEditProduct(null)} />}
      </Modal>

      {/* View Modal */}
      <Modal open={!!viewProduct} onClose={() => setViewProduct(null)} title="Product Details" size="md">
        {viewProduct && (
          <div className="space-y-3 text-sm">
            {[
              ['Product Name', viewProduct.product_name], ['Brand', viewProduct.brand || '—'], ['OEM/Part #', viewProduct.oem_number || '—'],
              ['HSN Code', viewProduct.hsn_code], ['Purchase Price', formatCurrency(viewProduct.purchase_price)],
              ['Selling Price (Inclusive)', formatCurrency(viewProduct.selling_price_inclusive)], ['GST Rate', `${viewProduct.gst_rate}%`],
              ['Current Stock', `${viewProduct.stock} ${viewProduct.unit}`], ['Status', viewProduct.status],
              ['Description', viewProduct.description || '—'],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between py-2 border-b border-slate-50">
                <span className="text-slate-500 font-medium">{label}</span>
                <span className="text-slate-800 text-right max-w-[60%]">{val}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Toggle confirm */}
      <ConfirmDialog
        open={!!toggleConfirm}
        onClose={() => setToggleConfirm(null)}
        onConfirm={() => toggleMutation.mutate(toggleConfirm.id)}
        title={toggleConfirm?.status === 'Active' ? 'Deactivate Product' : 'Activate Product'}
        message={toggleConfirm?.status === 'Active'
          ? `Deactivating "${toggleConfirm?.product_name}" will remove it from billing. Continue?`
          : `Activating "${toggleConfirm?.product_name}" will make it available for billing.`}
        confirmText={toggleConfirm?.status === 'Active' ? 'Deactivate' : 'Activate'}
        confirmVariant={toggleConfirm?.status === 'Active' ? 'danger' : 'success'}
        loading={toggleMutation.isPending}
      />

      {/* History Modal */}
      <Modal open={!!historyProduct} onClose={() => setHistoryProduct(null)} title={`History — ${historyProduct?.product_name}`} size="lg">
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {!historyData ? <div className="skeleton h-8 rounded" /> :
            historyData.length === 0 ? <p className="text-slate-400 text-sm text-center py-6">No history yet</p> :
              historyData.map(h => (
                <div key={h.id} className="flex gap-3 text-sm border-b border-slate-50 py-2">
                  <Badge variant="primary" size="xs">{h.action}</Badge>
                  <span className="text-slate-700 flex-1">{h.description}</span>
                  <span className="text-slate-400 text-xs shrink-0">{new Date(h.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                </div>
              ))
          }
        </div>
      </Modal>
    </div>
  );
}
