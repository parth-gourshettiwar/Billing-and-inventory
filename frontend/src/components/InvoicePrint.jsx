import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

const fetchSettings = () => api.get('/settings').then(r => r.data.data);

const fmt = (n) => parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const S = {
  page: { fontFamily: "'Inter', Arial, sans-serif", fontSize: '9.5pt', color: '#1a1a1a', lineHeight: '1.3', background: 'white', width: '194mm', maxWidth: '194mm', margin: '0 auto', padding: '0', pageBreakInside: 'avoid' },
  // Header
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2.5px solid #1e40af', paddingBottom: '8px', marginBottom: '8px' },
  shopName: { fontSize: '15pt', fontWeight: '800', color: '#1e3a8a', margin: '0 0 3px 0' },
  shopSub: { fontSize: '8pt', color: '#475569', margin: '1px 0', lineHeight: '1.4' },
  titleBlock: { textAlign: 'right', flexShrink: 0 },
  taxTitle: { fontSize: '18pt', fontWeight: '900', color: '#1e40af', letterSpacing: '1px', margin: '0 0 4px 0' },
  metaLabel: { color: '#6b7280', textAlign: 'right', fontSize: '8.5pt', padding: '1px 6px 1px 0', whiteSpace: 'nowrap' },
  metaVal: { fontWeight: '600', fontSize: '8.5pt', textAlign: 'left', padding: '1px 0', whiteSpace: 'nowrap' },
  // Party
  partyGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px' },
  partyBox: { border: '1px solid #cbd5e1', borderRadius: '3px', padding: '5px 8px' },
  partyLabel: { fontSize: '7pt', fontWeight: '700', color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #e2e8f0', paddingBottom: '2px', marginBottom: '3px' },
  partyName: { fontSize: '10pt', fontWeight: '700', margin: '2px 0 1px' },
  partyDetail: { fontSize: '8pt', color: '#4b5563', margin: '1px 0' },
  vehicleNo: { fontSize: '13pt', fontWeight: '800', letterSpacing: '2px', color: '#1e3a8a', fontFamily: "'Courier New', monospace", margin: '3px 0 0' },
  // Table
  tableWrap: { width: '100%', marginBottom: '6px', overflowVisible: 'visible' },
  table: { width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '8.5pt' },
  th: { background: '#1e40af', color: 'white', padding: '5px 4px', fontWeight: '600', fontSize: '8pt', whiteSpace: 'nowrap' },
  thR: { background: '#1e40af', color: 'white', padding: '5px 4px', fontWeight: '600', fontSize: '8pt', textAlign: 'right' },
  thC: { background: '#1e40af', color: 'white', padding: '5px 4px', fontWeight: '600', fontSize: '8pt', textAlign: 'center' },
  td: { padding: '4px 4px', borderBottom: '1px solid #e2e8f0', verticalAlign: 'top' },
  tdR: { padding: '4px 4px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', verticalAlign: 'top' },
  tdC: { padding: '4px 4px', borderBottom: '1px solid #e2e8f0', textAlign: 'center', verticalAlign: 'top' },
  tdFoot: { padding: '5px 4px', fontWeight: '700', background: '#eff6ff', borderTop: '2px solid #1e40af', borderBottom: 'none' },
  tdFootR: { padding: '5px 4px', fontWeight: '700', background: '#eff6ff', borderTop: '2px solid #1e40af', textAlign: 'right', borderBottom: 'none' },
  tdFootC: { padding: '5px 4px', fontWeight: '700', background: '#eff6ff', borderTop: '2px solid #1e40af', textAlign: 'center', borderBottom: 'none' },
  evenRow: { background: '#f8fafc' },
  gstBadge: { background: '#dbeafe', color: '#1e40af', padding: '1px 3px', borderRadius: '2px', fontSize: '7.5pt', fontWeight: '600', display: 'inline-block' },
  productName: { fontWeight: '600', wordBreak: 'break-word', overflowWrap: 'anywhere' },
  productSub: { fontSize: '7.5pt', color: '#94a3b8', marginTop: '1px' },
  // Bottom
  bottom: { display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', alignItems: 'start', marginBottom: '6px' },
  gstSectionTitle: { fontSize: '7.5pt', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '3px' },
  gstTable: { borderCollapse: 'collapse', fontSize: '8pt', width: '100%' },
  gstTh: { background: '#f1f5f9', padding: '3px 6px', border: '1px solid #cbd5e1', fontWeight: '700', color: '#374151', textAlign: 'center', fontSize: '7.5pt' },
  gstTd: { padding: '3px 6px', border: '1px solid #e2e8f0', textAlign: 'right', fontSize: '8pt' },
  gstTdC: { padding: '3px 6px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '600', color: '#1e40af' },
  // Totals box
  totalsBox: { minWidth: '60mm', border: '1px solid #cbd5e1', borderRadius: '3px', overflow: 'hidden', flexShrink: 0 },
  totalsRow: { display: 'flex', justifyContent: 'space-between', padding: '4px 10px', borderBottom: '1px solid #f1f5f9', fontSize: '8.5pt' },
  totalsLabel: { color: '#4b5563' },
  totalsVal: { fontWeight: '600' },
  totalsGrand: { display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#1e40af', color: 'white' },
  // Words
  words: { fontSize: '8.5pt', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '3px', padding: '4px 8px', marginBottom: '7px' },
  // Footer
  footer: { display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', borderTop: '1px solid #cbd5e1', paddingTop: '6px', alignItems: 'end' },
  termsLabel: { fontSize: '7.5pt', fontWeight: '700', color: '#1e40af', marginBottom: '2px' },
  termsText: { fontSize: '7.5pt', color: '#64748b', margin: '0', whiteSpace: 'pre-wrap', fontFamily: 'inherit' },
  sigBlock: { textAlign: 'center', minWidth: '48mm' },
  sigLine: { height: '30px', borderBottom: '1px solid #94a3b8', marginBottom: '3px' },
  sigLabel: { fontSize: '7.5pt', color: '#475569' },
  sigName: { fontSize: '8pt', fontWeight: '700', color: '#1e3a8a' },
  footMsg: { textAlign: 'center', fontSize: '7.5pt', color: '#94a3b8', fontStyle: 'italic', marginTop: '5px', paddingTop: '4px', borderTop: '1px dashed #e2e8f0' },
  note: { textAlign: 'center', fontSize: '7pt', color: '#cbd5e1', marginTop: '3px' },
};

export default function InvoicePrint({ invoice }) {
  const { data: settingsData } = useQuery({ queryKey: ['settings'], queryFn: fetchSettings });
  const s = settingsData || invoice?.settings || {};

  const gstSummary = {};
  (invoice?.items || []).forEach(item => {
    const rate = parseFloat(item.gst_rate);
    if (!gstSummary[rate]) gstSummary[rate] = { taxable: 0, cgst: 0, sgst: 0 };
    gstSummary[rate].taxable += parseFloat(item.taxable_value);
    gstSummary[rate].cgst += parseFloat(item.cgst_amount);
    gstSummary[rate].sgst += parseFloat(item.sgst_amount);
  });

  const invoiceDate = invoice?.created_at ? new Date(invoice.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
  const invoiceTime = invoice?.created_at ? new Date(invoice.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '';

  const gstRates = Object.keys(gstSummary);
  const totalItems = (invoice?.items || []).reduce((a, i) => a + parseFloat(i.quantity), 0);

  return (
    <div id="a4-invoice" style={S.page}>
      {/* HEADER */}
      <div style={S.header}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          {s.logo_url && <img src={s.logo_url} alt="logo" style={{ height: '46px', width: 'auto', objectFit: 'contain', marginTop: '2px', flexShrink: 0 }} />}
          <div>
            <p style={S.shopName}>{s.shop_name || 'Spare Parts Showroom'}</p>
            <p style={S.shopSub}>{s.address}</p>
            <p style={S.shopSub}>Ph: <strong>{s.phone}</strong>{s.email ? `  |  ${s.email}` : ''}</p>
            <p style={S.shopSub}><strong>GSTIN:</strong> {s.gstin}</p>
          </div>
        </div>
        <div style={S.titleBlock}>
          <p style={S.taxTitle}>TAX INVOICE</p>
          <table style={{ borderCollapse: 'collapse' }}>
            <tbody>
              <tr><td style={S.metaLabel}>Invoice No</td><td style={S.metaVal}>{invoice?.invoice_number}</td></tr>
              <tr><td style={S.metaLabel}>Date</td><td style={S.metaVal}>{invoiceDate}</td></tr>
              <tr><td style={S.metaLabel}>Time</td><td style={S.metaVal}>{invoiceTime}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* CUSTOMER + VEHICLE */}
      <div style={S.partyGrid}>
        <div style={S.partyBox}>
          <div style={S.partyLabel}>Bill To</div>
          <p style={S.partyName}>{invoice?.customer_name}</p>
          {invoice?.mobile && <p style={S.partyDetail}>📞 {invoice.mobile}</p>}
        </div>
        <div style={S.partyBox}>
          <div style={S.partyLabel}>Vehicle Details</div>
          <p style={S.vehicleNo}>{invoice?.vehicle_number}</p>
        </div>
      </div>

      {/* PRODUCTS TABLE */}
      <div style={S.tableWrap}>
        <table style={S.table}>
          <colgroup>
            <col style={{ width: '7mm' }} />
            <col />
            <col style={{ width: '15mm' }} />
            <col style={{ width: '10mm' }} />
            <col style={{ width: '22mm' }} />
            <col style={{ width: '22mm' }} />
            <col style={{ width: '12mm' }} />
            <col style={{ width: '23mm' }} />
          </colgroup>
          <thead>
            <tr>
              <th style={S.thC}>#</th>
              <th style={{ ...S.th, textAlign: 'left' }}>Product / Description</th>
              <th style={S.thC}>HSN</th>
              <th style={S.thC}>Qty</th>
              <th style={S.thR}>Rate/Unit (₹)</th>
              <th style={S.thR}>Taxable (₹)</th>
              <th style={S.thC}>GST%</th>
              <th style={S.thR}>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {(invoice?.items || []).map((item, idx) => {
              const rowStyle = idx % 2 === 1 ? { ...S.td, ...S.evenRow } : S.td;
              const rowStyleR = idx % 2 === 1 ? { ...S.tdR, ...S.evenRow } : S.tdR;
              const rowStyleC = idx % 2 === 1 ? { ...S.tdC, ...S.evenRow } : S.tdC;
              const gstDisplay = parseFloat(item.gst_rate) % 1 === 0 ? parseInt(item.gst_rate) : parseFloat(item.gst_rate);
              return (
                <tr key={item.id || idx}>
                  <td style={{ ...rowStyleC, color: '#6b7280', fontSize: '8pt' }}>{idx + 1}</td>
                  <td style={rowStyle}>
                    <div style={S.productName}>{item.product_name}</div>
                    {(item.brand || item.oem_number) && (
                      <div style={S.productSub}>{[item.brand, item.oem_number && `Part# ${item.oem_number}`].filter(Boolean).join(' · ')}</div>
                    )}
                  </td>
                  <td style={{ ...rowStyleC, fontFamily: 'monospace', fontSize: '8pt', color: '#4b5563' }}>{item.hsn_code}</td>
                  <td style={{ ...rowStyleC, fontWeight: '600' }}>{item.quantity}</td>
                  <td style={rowStyleR}>{fmt(item.selling_price_inclusive)}</td>
                  <td style={rowStyleR}>{fmt(item.taxable_value)}</td>
                  <td style={rowStyleC}><span style={S.gstBadge}>{gstDisplay}%</span></td>
                  <td style={{ ...rowStyleR, fontWeight: '700' }}>{fmt(item.line_total)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} style={S.tdFoot} />
              <td style={{ ...S.tdFootC, color: '#1e40af' }}>{totalItems}</td>
              <td style={S.tdFoot} />
              <td style={{ ...S.tdFootR, color: '#1e40af' }}>{fmt(invoice?.taxable_total)}</td>
              <td style={S.tdFoot} />
              <td style={{ ...S.tdFootR, color: '#1e40af' }}>{fmt(invoice?.grand_total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* GST SUMMARY + TOTALS */}
      <div style={S.bottom}>
        <div>
          <div style={S.gstSectionTitle}>GST Summary</div>
          <table style={S.gstTable}>
            <thead>
              <tr>
                {['GST Rate', 'Taxable Value', 'CGST Amt', 'SGST Amt', 'Total Tax'].map(h => (
                  <th key={h} style={S.gstTh}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gstRates.map(rate => {
                const v = gstSummary[rate];
                return (
                  <tr key={rate}>
                    <td style={S.gstTdC}>{rate}%</td>
                    <td style={S.gstTd}>₹{fmt(v.taxable)}</td>
                    <td style={S.gstTd}>₹{fmt(v.cgst)}</td>
                    <td style={S.gstTd}>₹{fmt(v.sgst)}</td>
                    <td style={{ ...S.gstTd, fontWeight: '700' }}>₹{fmt(v.cgst + v.sgst)}</td>
                  </tr>
                );
              })}
              {gstRates.length > 1 && (
                <tr style={{ background: '#f1f5f9', fontWeight: '700' }}>
                  <td style={S.gstTdC}>Total</td>
                  <td style={S.gstTd}>₹{fmt(invoice?.taxable_total)}</td>
                  <td style={S.gstTd}>₹{fmt(invoice?.cgst_total)}</td>
                  <td style={S.gstTd}>₹{fmt(invoice?.sgst_total)}</td>
                  <td style={{ ...S.gstTd, fontWeight: '700' }}>₹{fmt(parseFloat(invoice?.cgst_total || 0) + parseFloat(invoice?.sgst_total || 0))}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={S.totalsBox}>
          <div style={S.totalsRow}><span style={S.totalsLabel}>Subtotal (Taxable)</span><span style={S.totalsVal}>₹{fmt(invoice?.taxable_total)}</span></div>
          <div style={S.totalsRow}><span style={S.totalsLabel}>CGST</span><span style={S.totalsVal}>₹{fmt(invoice?.cgst_total)}</span></div>
          <div style={S.totalsRow}><span style={S.totalsLabel}>SGST</span><span style={S.totalsVal}>₹{fmt(invoice?.sgst_total)}</span></div>
          <div style={S.totalsGrand}>
            <span style={{ fontWeight: '700', fontSize: '9.5pt' }}>Grand Total</span>
            <span style={{ fontWeight: '800', fontSize: '12pt' }}>₹{fmt(invoice?.grand_total)}</span>
          </div>
        </div>
      </div>

      {/* AMOUNT IN WORDS */}
      <div style={S.words}>
        <strong style={{ color: '#1e3a8a' }}>Amount in Words: </strong>{invoice?.amount_in_words}
      </div>

      {/* FOOTER */}
      <div style={S.footer}>
        <div>
          <div style={S.termsLabel}>Terms &amp; Conditions</div>
          <pre style={S.termsText}>{s.terms_conditions || 'Goods once sold will not be taken back or exchanged.\nAll disputes subject to local jurisdiction.'}</pre>
        </div>
        <div style={S.sigBlock}>
          <div style={S.sigLine} />
          <div style={S.sigLabel}>Authorised Signatory</div>
          <div style={S.sigName}>{s.shop_name}</div>
        </div>
      </div>

      {s.footer_message && <div style={S.footMsg}>{s.footer_message}</div>}
      <div style={S.note}>This is a computer-generated invoice and does not require a physical signature.</div>
    </div>
  );
}
