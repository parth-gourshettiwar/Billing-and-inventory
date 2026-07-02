import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Upload } from 'lucide-react';
import { Card, Button, PageHeader } from '../components/ui';
import api from '../services/api';
import toast from 'react-hot-toast';

const fetchSettings = () => api.get('/settings').then(r => r.data.data);

const GST_RATES = ['0', '5', '12', '18', '28'];

export default function Settings() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['settings'], queryFn: fetchSettings });
  const [form, setForm] = useState({
    shop_name: '', owner_name: '', address: '', phone: '', email: '', gstin: '',
    invoice_prefix: 'INV', footer_message: '', terms_conditions: '', currency: '₹',
    date_format: 'DD-MM-YYYY', low_stock_threshold: 10, logo_url: '',
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');

  useEffect(() => {
    if (data) { setForm({ ...form, ...data }); setLogoPreview(data.logo_url || ''); }
  }, [data]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const saveMutation = useMutation({
    mutationFn: async (formData) => {
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => fd.append(k, v));
      if (logoFile) fd.append('logo', logoFile);
      return api.put('/settings', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: (res) => {
      qc.invalidateQueries(['settings']);
      toast.success('Settings saved successfully!');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to save'),
  });

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const inputCls = "w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all";

  if (isLoading) return <div className="space-y-4">{Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-40 rounded-xl" />)}</div>;

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <PageHeader title="Settings" subtitle="Configure shop information and system preferences" />

      {/* Shop Info */}
      <Card>
        <h3 className="text-base font-semibold text-slate-800 mb-4">Shop Information</h3>
        <div className="space-y-4">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50">
              {logoPreview ? <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" /> : <Upload className="h-6 w-6 text-slate-300" />}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Shop Logo</label>
              <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                <Upload size={14} /> Upload Logo
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              </label>
              <p className="text-xs text-slate-400 mt-1">Max 5MB. JPEG, PNG, WebP</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Shop Name *</label>
              <input className={inputCls} value={form.shop_name} onChange={e => set('shop_name', e.target.value)} placeholder="My Auto Parts" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Owner Name *</label>
              <input className={inputCls} value={form.owner_name} onChange={e => set('owner_name', e.target.value)} placeholder="Owner Full Name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
              <input className={inputCls} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="9876543210" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input className={inputCls} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="shop@email.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">GSTIN *</label>
              <input className={inputCls} value={form.gstin} onChange={e => set('gstin', e.target.value.toUpperCase())} placeholder="33AAAAA0000A1Z5" maxLength={15} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Address *</label>
              <textarea className={`${inputCls} resize-y min-h-[70px]`} value={form.address} onChange={e => set('address', e.target.value)} placeholder="Full shop address" />
            </div>
          </div>
        </div>
      </Card>

      {/* Invoice Settings */}
      <Card>
        <h3 className="text-base font-semibold text-slate-800 mb-4">Invoice Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Invoice Prefix</label>
            <input className={inputCls} value={form.invoice_prefix} onChange={e => set('invoice_prefix', e.target.value)} placeholder="INV" />
            <p className="text-xs text-slate-400 mt-1">Example: INV → INV/2026/000001</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Currency Symbol</label>
            <input className={inputCls} value={form.currency} onChange={e => set('currency', e.target.value)} placeholder="₹" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Footer Message</label>
            <input className={inputCls} value={form.footer_message} onChange={e => set('footer_message', e.target.value)} placeholder="Thank you for your business!" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Terms & Conditions</label>
            <textarea className={`${inputCls} resize-y min-h-[80px]`} value={form.terms_conditions} onChange={e => set('terms_conditions', e.target.value)} placeholder="Terms printed on every invoice..." />
          </div>
        </div>
      </Card>

      {/* Inventory Settings */}
      <Card>
        <h3 className="text-base font-semibold text-slate-800 mb-4">Inventory Settings</h3>
        <div className="max-w-xs">
          <label className="block text-sm font-medium text-slate-700 mb-1">Low Stock Threshold</label>
          <input className={inputCls} type="number" min="1" value={form.low_stock_threshold}
            onChange={e => set('low_stock_threshold', parseInt(e.target.value))} />
          <p className="text-xs text-slate-400 mt-1">Products with stock at or below this value will show as "Low Stock"</p>
        </div>
      </Card>

      {/* Change Password */}
      <ChangePasswordCard />

      <div className="flex justify-end">
        <Button icon={Save} size="lg" loading={saveMutation.isPending} onClick={() => saveMutation.mutate(form)}>
          Save Settings
        </Button>
      </div>
    </div>
  );
}

function ChangePasswordCard() {
  const [curr, setCurr] = useState('');
  const [next, setNext] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = async (e) => {
    e.preventDefault();
    if (!curr || !next) return toast.error('Both fields are required');
    if (next.length < 6) return toast.error('New password must be at least 6 characters');
    setSaving(true);
    try {
      await api.put('/auth/change-password', { currentPassword: curr, newPassword: next });
      toast.success('Password changed successfully!');
      setCurr(''); setNext('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

  return (
    <Card>
      <h3 className="text-base font-semibold text-slate-800 mb-4">Change Password</h3>
      <form onSubmit={handleChange} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
          <input className={inputCls} type="password" value={curr} onChange={e => setCurr(e.target.value)} placeholder="Current password" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
          <input className={inputCls} type="password" value={next} onChange={e => setNext(e.target.value)} placeholder="Min 6 characters" />
        </div>
        <div className="md:col-span-2">
          <Button type="submit" variant="secondary" loading={saving}>Update Password</Button>
        </div>
      </form>
    </Card>
  );
}
