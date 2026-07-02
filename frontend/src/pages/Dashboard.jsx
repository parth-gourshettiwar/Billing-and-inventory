import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Receipt, Package, AlertTriangle, XCircle, IndianRupee, BarChart2, ShoppingCart } from 'lucide-react';
import { StatCard, Card, Badge, formatCurrency, formatDateTime, SkeletonRow } from '../components/ui';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import api from '../services/api';

const fetchDashboard = () => api.get('/dashboard').then(r => r.data.data);

export default function Dashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: fetchDashboard, refetchInterval: 60000 });

  if (isLoading) return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {Array(9).fill(0).map((_, i) => <div key={i} className="skeleton h-28 rounded-xl" />)}
      </div>
    </div>
  );

  const d = data;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        <StatCard title="Today's Sales" value={formatCurrency(d.today.sales)} icon={IndianRupee} color="blue" subtitle={`${d.today.bills} bills`} />
        <StatCard title="Monthly Sales" value={formatCurrency(d.monthly.sales)} icon={TrendingUp} color="green" subtitle={`${d.monthly.bills} bills`} />
        <StatCard title="Total Revenue" value={formatCurrency(d.totals.revenue)} icon={BarChart2} color="purple" />
        <StatCard title="Total Profit" value={formatCurrency(d.totals.profit)} icon={ShoppingCart} color="green" />
        <StatCard title="Active Products" value={d.products.active} icon={Package} color="slate" />
        <StatCard title="Low Stock" value={d.products.low} icon={AlertTriangle} color="amber" subtitle="Needs restocking" />
        <StatCard title="Out of Stock" value={d.products.outOfStock} icon={XCircle} color="red" />
        <StatCard title="Today's Bills" value={d.today.bills} icon={Receipt} color="blue" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-base font-semibold text-slate-800 mb-4">Monthly Revenue</h3>
          {d.chart.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No chart data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={d.chart}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
                <Tooltip formatter={v => formatCurrency(v)} labelStyle={{ color: '#1e293b', fontWeight: 600 }} />
                <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <h3 className="text-base font-semibold text-slate-800 mb-4">Monthly Profit</h3>
          {d.chart.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No chart data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={d.chart} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
                <Tooltip formatter={v => formatCurrency(v)} />
                <Bar dataKey="profit" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent bills */}
        <Card padding={false} className="xl:col-span-2">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-800">Recent Bills</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {['Invoice #', 'Customer', 'Vehicle', 'Amount', 'Status', 'Date'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.recentBills.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-slate-400">No bills yet</td></tr>
                ) : d.recentBills.map(b => (
                  <tr key={b.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono text-xs text-blue-600 font-semibold">{b.invoice_number}</td>
                    <td className="px-4 py-3 text-slate-700">{b.customer_name}</td>
                    <td className="px-4 py-3 text-slate-500">{b.vehicle_number}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{formatCurrency(b.grand_total)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={b.status === 'Active' ? 'success' : 'danger'}>{b.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{formatDateTime(b.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Top products */}
        <Card>
          <h3 className="text-base font-semibold text-slate-800 mb-4">Top Selling (30 Days)</h3>
          {d.topProducts.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">No sales data yet</p>
          ) : (
            <div className="space-y-3">
              {d.topProducts.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{p.product_name}</p>
                    <p className="text-xs text-slate-400">{p.total_qty} units</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-700 shrink-0">{formatCurrency(p.total_revenue)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
