import { useState, useRef, useCallback, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Minus, Trash2, User, Car, Phone, ShoppingCart, FileText, X } from 'lucide-react';
import { Card, Button, Badge, Modal, formatCurrency } from '../components/ui';
import api from '../services/api';
import toast from 'react-hot-toast';

const calcGST = (sp, gstRate, qty = 1) => {
  const rate = parseFloat(gstRate) || 0;
  const price = parseFloat(sp) || 0;
  const taxableUnit = rate > 0 ? price / (1 + rate / 100) : price;
  const half = rate / 2;
  return {
    taxable_value: parseFloat((taxableUnit * qty).toFixed(2)),
    cgst_rate: half,
    cgst_amount: parseFloat((taxableUnit * half / 100 * qty).toFixed(2)),
    sgst_rate: half,
    sgst_amount: parseFloat((taxableUnit * half / 100 * qty).toFixed(2)),
    line_total: parseFloat((price * qty).toFixed(2)),
  };
};

export default function Billing() {
  const [customerName, setCustomerName] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [mobile, setMobile] = useState('');
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [generating, setGenerating] = useState(false);
  const searchRef = useRef();
  const debounceRef = useRef();
  const qc = useQueryClient();

  const searchProducts = useCallback(async (term) => {
    if (!term.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await api.get('/products', { params: { search: term, filter: 'active', limit: 8 } });
      setSearchResults(res.data.data);
    } catch { } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchProducts(searchTerm), 200);
    return () => clearTimeout(debounceRef.current);
  }, [searchTerm, searchProducts]);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product_id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) { toast.error(`Only ${product.stock} units available`); return prev; }
        return prev.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      if (product.stock === 0) { toast.error('Out of stock'); return prev; }
      return [...prev, {
        product_id: product.id, product_name: product.product_name,
        brand: product.brand, hsn_code: product.hsn_code,
        selling_price_inclusive: parseFloat(product.selling_price_inclusive),
        gst_rate: parseFloat(product.gst_rate),
        available_stock: product.stock, quantity: 1,
      }];
    });
    setSearchTerm('');
    setSearchResults([]);
  };

  const updateQty = (productId, delta) => {
    setCart(prev => prev.map(i => {
      if (i.product_id !== productId) return i;
      const newQty = i.quantity + delta;
      if (newQty <= 0) return null;
      if (newQty > i.available_stock) { toast.error(`Only ${i.available_stock} units available`); return i; }
      return { ...i, quantity: newQty };
    }).filter(Boolean));
  };

  const removeItem = (productId) => setCart(prev => prev.filter(i => i.product_id !== productId));

  // Totals
  const totals = cart.reduce((acc, item) => {
    const g = calcGST(item.selling_price_inclusive, item.gst_rate, item.quantity);
    return {
      taxable: acc.taxable + g.taxable_value,
      cgst: acc.cgst + g.cgst_amount,
      sgst: acc.sgst + g.sgst_amount,
      grand: acc.grand + g.line_total,
    };
  }, { taxable: 0, cgst: 0, sgst: 0, grand: 0 });

  const generateInvoice = async () => {
    if (!customerName.trim()) return toast.error('Customer name is required');
    if (!vehicleNumber.trim()) return toast.error('Vehicle number is required');
    if (cart.length === 0) return toast.error('Add at least one product');
    setGenerating(true);
    try {
      const res = await api.post('/bills', {
        customer_name: customerName.trim(),
        vehicle_number: vehicleNumber.trim().toUpperCase(),
        mobile: mobile.trim(),
        items: cart.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
      });
      const newInvoice = res.data.data;
      setCart([]);
      setCustomerName('');
      setVehicleNumber('');
      setMobile('');
      qc.invalidateQueries(['products']);
      toast.success('Invoice generated! Opening print preview…');
      // Open the dedicated print page in a new tab
      window.open(`/print/invoice/${newInvoice.id}`, '_blank');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate invoice');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Billing</h1>
        <p className="text-sm text-slate-500 mt-0.5">Create GST-compliant invoices for customers</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Left Panel */}
        <div className="xl:col-span-2 space-y-4">
          {/* Customer Info */}
          <Card>
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <User size={16} className="text-blue-600" /> Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-1">
                <label className="block text-xs font-medium text-slate-600 mb-1">Customer Name *</label>
                <input value={customerName} onChange={e => setCustomerName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Customer name" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  <span className="inline-flex items-center gap-1"><Car size={12} /> Vehicle Number *</span>
                </label>
                <input value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value.toUpperCase())}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 uppercase tracking-wider"
                  placeholder="TN01AB1234" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  <span className="inline-flex items-center gap-1"><Phone size={12} /> Mobile (Optional)</span>
                </label>
                <input value={mobile} onChange={e => setMobile(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Mobile number" />
              </div>
            </div>
          </Card>

          {/* Product Search */}
          <Card>
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Search size={16} className="text-blue-600" /> Search & Add Products
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                ref={searchRef}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                placeholder="Search by product name, brand, HSN code, OEM number..."
              />
              {searching && <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />}
            </div>

            {searchResults.length > 0 && (
              <div className="mt-2 border border-slate-200 rounded-xl overflow-hidden shadow-md">
                {searchResults.map(p => (
                  <button key={p.id} onClick={() => addToCart(p)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-blue-50 transition-colors border-b border-slate-100 last:border-0 text-left">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{p.product_name}</p>
                      <p className="text-xs text-slate-500">{p.brand && `${p.brand} · `}HSN: {p.hsn_code}</p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-sm font-semibold text-blue-700">{formatCurrency(p.selling_price_inclusive)}</p>
                      <p className={`text-xs ${p.stock === 0 ? 'text-red-500' : p.stock <= 5 ? 'text-amber-500' : 'text-emerald-600'}`}>
                        {p.stock === 0 ? 'Out of stock' : `${p.stock} available`}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* Cart */}
          <Card padding={false}>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <ShoppingCart size={16} className="text-blue-600" /> Cart ({cart.length} item{cart.length !== 1 ? 's' : ''})
              </h3>
              {cart.length > 0 && (
                <button onClick={() => setCart([])} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"><X size={12} /> Clear all</button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <ShoppingCart size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Cart is empty — search and add products above</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50"><tr>
                    {['Product', 'HSN', 'Qty', 'Price', 'Taxable', 'CGST', 'SGST', 'Total', ''].map(h => (
                      <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {cart.map(item => {
                      const g = calcGST(item.selling_price_inclusive, item.gst_rate, item.quantity);
                      return (
                        <tr key={item.product_id} className="border-t border-slate-50">
                          <td className="px-3 py-3 font-medium text-slate-800 max-w-[160px]">
                            <p className="truncate text-xs">{item.product_name}</p>
                            {item.brand && <p className="text-xs text-slate-400">{item.brand}</p>}
                          </td>
                          <td className="px-3 py-3 text-xs font-mono text-slate-500">{item.hsn_code}</td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1">
                              <button onClick={() => updateQty(item.product_id, -1)} className="w-6 h-6 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"><Minus size={10} /></button>
                              <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                              <button onClick={() => updateQty(item.product_id, 1)} className="w-6 h-6 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"><Plus size={10} /></button>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-slate-700">{formatCurrency(item.selling_price_inclusive)}</td>
                          <td className="px-3 py-3 text-slate-600">{formatCurrency(g.taxable_value)}</td>
                          <td className="px-3 py-3 text-slate-500 text-xs">{formatCurrency(g.cgst_amount)}<br/><span className="text-slate-400">{item.gst_rate/2}%</span></td>
                          <td className="px-3 py-3 text-slate-500 text-xs">{formatCurrency(g.sgst_amount)}<br/><span className="text-slate-400">{item.gst_rate/2}%</span></td>
                          <td className="px-3 py-3 font-semibold text-slate-800">{formatCurrency(g.line_total)}</td>
                          <td className="px-3 py-3">
                            <button onClick={() => removeItem(item.product_id)} className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 size={14} /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Right Panel - Summary */}
        <div className="xl:col-span-1">
          <div className="sticky top-0 space-y-4">
            <Card>
              <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <FileText size={16} className="text-blue-600" /> Invoice Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Taxable Value</span>
                  <span className="font-medium text-slate-800">{formatCurrency(totals.taxable)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">CGST</span>
                  <span className="font-medium text-slate-800">{formatCurrency(totals.cgst)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">SGST</span>
                  <span className="font-medium text-slate-800">{formatCurrency(totals.sgst)}</span>
                </div>
                <div className="border-t border-slate-200 pt-3 flex justify-between">
                  <span className="text-base font-bold text-slate-900">Grand Total</span>
                  <span className="text-xl font-bold text-blue-700">{formatCurrency(totals.grand)}</span>
                </div>
              </div>

              <div className="mt-5 space-y-2">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={generateInvoice}
                  loading={generating}
                  disabled={cart.length === 0}
                >
                  Generate Invoice
                </Button>
                <Button variant="secondary" size="md" className="w-full" onClick={() => { setCart([]); setCustomerName(''); setVehicleNumber(''); setMobile(''); }}>
                  Clear All
                </Button>
              </div>
            </Card>

            {/* Quick hints */}
            <Card>
              <p className="text-xs font-semibold text-slate-600 mb-2">Quick Tips</p>
              <ul className="text-xs text-slate-400 space-y-1">
                <li>• Search by product name, brand, or part number</li>
                <li>• GST is automatically calculated</li>
                <li>• Stock is validated before generating</li>
                <li>• Invoice number is auto-generated</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
