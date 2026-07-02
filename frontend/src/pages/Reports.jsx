import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, PageHeader, formatCurrency } from '../components/ui';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../services/api';

const fetchReports = (params) => api.get('/reports', { params }).then(r => r.data.data);

export default function Reports() {
  const [type, setType] = useState('monthly');

  const { data, isLoading } = useQuery({
    queryKey: ['reports', type],
    queryFn: () => fetchReports({ type }),
  });

  const TABS = [
    { value: 'daily', label: 'Daily (This Month)' },
    { value: 'monthly', label: 'Monthly (This Year)' },
    { value: 'yearly', label: 'Yearly' },
  ];

  const sales = data?.sales || [];
  const profit = data?.profit || [];
  const gst = data?.gst || [];

  // Aggregate totals
  const totals = sales.reduce((acc, r) => ({
    revenue: acc.revenue + parseFloat(r.revenue),
    bills: acc.bills + parseInt(r.bills),
    cgst: acc.cgst + parseFloat(r.cgst),
    sgst: acc.sgst + parseFloat(r.sgst),
  }), { revenue: 0, bills: 0, cgst: 0, sgst: 0 });

  const profitTotal = profit.reduce((acc, r) => acc + parseFloat(r.profit), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Reports" subtitle="Sales, GST and profit analysis" />

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t.value} onClick={() => setType(t.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${type === t.value ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-4 gap-4">{Array(4).fill(0).map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />)}</div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Revenue', value: formatCurrency(totals.revenue), color: 'text-blue-700' },
              { label: 'Total Profit', value: formatCurrency(profitTotal), color: 'text-emerald-700' },
              { label: 'Total Invoices', value: totals.bills, color: 'text-slate-800' },
              { label: 'Total GST Collected', value: formatCurrency(totals.cgst + totals.sgst), color: 'text-purple-700' },
            ].map(s => (
              <Card key={s.label}>
                <p className="text-xs text-slate-500 mb-1">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </Card>
            ))}
          </div>

          {/* Revenue Chart */}
          <Card>
            <h3 className="text-base font-semibold text-slate-800 mb-4">Revenue & Profit</h3>
            {sales.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No data for this period</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={sales.map((s, i) => ({ ...s, profit: parseFloat(profit[i]?.profit || 0) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
                  <Tooltip formatter={v => formatCurrency(v)} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#2563eb" radius={[3, 3, 0, 0]} name="Revenue" />
                  <Bar dataKey="profit" fill="#10b981" radius={[3, 3, 0, 0]} name="Profit" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* GST Table */}
          <Card padding={false}>
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-800">GST Summary by Rate</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50"><tr>
                  {['Period', 'GST Rate', 'Taxable Value', 'CGST', 'SGST', 'Total Tax'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {gst.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-slate-400">No GST data for this period</td></tr>
                  ) : gst.map((g, i) => (
                    <tr key={i} className="border-t border-slate-50">
                      <td className="px-4 py-3 text-slate-600">{g.period}</td>
                      <td className="px-4 py-3"><span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">{g.gst_rate}%</span></td>
                      <td className="px-4 py-3 text-slate-700">{formatCurrency(g.taxable_value)}</td>
                      <td className="px-4 py-3 text-slate-600">{formatCurrency(g.cgst_amount)}</td>
                      <td className="px-4 py-3 text-slate-600">{formatCurrency(g.sgst_amount)}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{formatCurrency(parseFloat(g.cgst_amount) + parseFloat(g.sgst_amount))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Sales Table */}
          <Card padding={false}>
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-800">Sales Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50"><tr>
                  {['Period', 'Bills', 'Revenue', 'Taxable Total', 'CGST', 'SGST'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {sales.map((s, i) => (
                    <tr key={i} className="border-t border-slate-50 hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-medium text-slate-700">{s.period}</td>
                      <td className="px-4 py-3 text-slate-600">{s.bills}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{formatCurrency(s.revenue)}</td>
                      <td className="px-4 py-3 text-slate-600">{formatCurrency(s.taxable_total)}</td>
                      <td className="px-4 py-3 text-slate-600">{formatCurrency(s.cgst)}</td>
                      <td className="px-4 py-3 text-slate-600">{formatCurrency(s.sgst)}</td>
                    </tr>
                  ))}
                </tbody>
                {sales.length > 1 && (
                  <tfoot>
                    <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
                      <td className="px-4 py-3 text-slate-800">Total</td>
                      <td className="px-4 py-3">{totals.bills}</td>
                      <td className="px-4 py-3 text-blue-700">{formatCurrency(totals.revenue)}</td>
                      <td className="px-4 py-3">{formatCurrency(sales.reduce((a, r) => a + parseFloat(r.taxable_total), 0))}</td>
                      <td className="px-4 py-3">{formatCurrency(totals.cgst)}</td>
                      <td className="px-4 py-3">{formatCurrency(totals.sgst)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
