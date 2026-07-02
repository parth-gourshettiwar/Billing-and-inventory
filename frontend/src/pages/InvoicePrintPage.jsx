import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import InvoicePrint from '../components/InvoicePrint';

const fetchBill = (id) => api.get(`/bills/${id}`).then(r => r.data.data);

export default function InvoicePrintPage() {
  const { id } = useParams();
  const { data: invoice, isLoading, isError } = useQuery({
    queryKey: ['bill', id],
    queryFn: () => fetchBill(id),
    staleTime: Infinity,
  });

  // Auto-trigger print once the invoice has rendered
  useEffect(() => {
    if (!invoice) return;
    const timer = setTimeout(() => window.print(), 800);
    return () => clearTimeout(timer);
  }, [invoice]);

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Arial', color: '#374151' }}>
      Loading invoice…
    </div>
  );

  if (isError) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Arial', color: '#dc2626' }}>
      Failed to load invoice. Please close this window and try again.
    </div>
  );

  return (
    <>
      <style>{`
        /* ── Screen styles for the print page ── */
        *, *::before, *::after { box-sizing: border-box; }
        html, body {
          margin: 0;
          padding: 0;
          background: #f3f4f6;
          font-family: 'Inter', Arial, sans-serif;
        }

        /* Toolbar shown only on screen, hidden when printing */
        #print-toolbar {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 20px;
          background: #1e40af;
          color: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        #print-toolbar h2 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          flex: 1;
        }
        .toolbar-btn {
          padding: 7px 18px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
        }
        .btn-print { background: white; color: #1e40af; }
        .btn-close { background: rgba(255,255,255,0.2); color: white; }
        .btn-close:hover { background: rgba(255,255,255,0.3); }

        /* Invoice wrapper on screen */
        #invoice-screen-wrap {
          display: flex;
          justify-content: center;
          padding: 24px;
          min-height: calc(100vh - 52px);
        }
        #invoice-screen-inner {
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.10);
          padding: 20px;
          width: 210mm;
          max-width: 100%;
        }

        /* ── Print styles ── */
        @page {
          size: A4 portrait;
          margin: 10mm 10mm 10mm 10mm;
        }
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          /* Hide everything except the invoice */
          #print-toolbar { display: none !important; }
          #invoice-screen-wrap {
            padding: 0 !important;
            min-height: unset !important;
            display: block !important;
          }
          #invoice-screen-inner {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          /* The invoice itself fills the page */
          #a4-invoice {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* Screen-only toolbar */}
      <div id="print-toolbar">
        <h2>Tax Invoice — {invoice?.invoice_number}</h2>
        <button className="toolbar-btn btn-print" onClick={() => window.print()}>🖨 Print / Save PDF</button>
        <button className="toolbar-btn btn-close" onClick={() => window.close()}>✕ Close</button>
      </div>

      {/* Invoice content */}
      <div id="invoice-screen-wrap">
        <div id="invoice-screen-inner">
          <InvoicePrint invoice={invoice} />
        </div>
      </div>
    </>
  );
}
