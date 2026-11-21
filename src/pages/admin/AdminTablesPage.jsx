import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Plus, 
  QrCode, 
  Download, 
  Printer, 
  Edit, 
  Trash2, 
  Users, 
  UtensilsCrossed, 
  X,
  ExternalLink,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';

export default function AdminTablesPage() {
  const { restaurant, tables, addTable, updateTable, deleteTable, activeSlug } = useRestaurant();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [tableNumber, setTableNumber] = useState('');
  const [tableName, setTableName] = useState('');
  const [capacity, setCapacity] = useState('4');

  // Preview or Print Stand Modal
  const [qrModalTable, setQrModalTable] = useState(null);
  const [printAllMode, setPrintAllMode] = useState(false);

  const getTableUrl = (table) => {
    const origin = window.location.origin;
    return `${origin}/r/${activeSlug}?table=${table.id}`;
  };

  const handleOpenAdd = () => {
    setEditingTable(null);
    const nextNum = (tables.length + 1).toString();
    setTableNumber(nextNum);
    setTableName(`Table ${nextNum}`);
    setCapacity('4');
    setModalOpen(true);
  };

  const handleOpenEdit = (t) => {
    setEditingTable(t);
    setTableNumber(t.tableNumber || t.id.replace('T', ''));
    setTableName(t.name);
    setCapacity(t.capacity?.toString() || '4');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tableName.trim()) return;

    if (editingTable) {
      await updateTable(editingTable.id, {
        tableNumber,
        name: tableName.trim(),
        capacity: Number(capacity)
      });
    } else {
      await addTable({
        tableNumber,
        name: tableName.trim(),
        capacity: Number(capacity)
      });
    }

    setModalOpen(false);
  };

  const handleDelete = async (t) => {
    try {
      if (confirm(`Are you sure you want to delete "${t.name}"?`)) {
        await deleteTable(t.id);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDownloadQR = (table) => {
    const svg = document.getElementById(`qr-svg-${table.id}`);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const SVGURL = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = SVGURL;
    downloadLink.download = `${restaurant.slug}-${table.id}-qr.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif font-bold text-2xl text-charcoal-900">
            Table & QR Code Management
          </h1>
          <p className="text-xs text-charcoal-700/70">
            Generate permanent table QR codes, monitor live dine-in occupancy, and print table stands
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPrintAllMode(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-charcoal-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-300"
          >
            <Printer className="w-4 h-4 text-forest-700" />
            <span>Print All QR Cards</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-forest-700 hover:bg-forest-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Table</span>
          </button>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tables.map(table => {
          const tableUrl = getTableUrl(table);
          const isOccupied = table.status === 'occupied';

          return (
            <div 
              key={table.id}
              className={`bg-white rounded-2xl p-4 sm:p-5 border shadow-sm transition-all flex flex-col justify-between ${
                isOccupied ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
              }`}
            >
              <div>
                {/* Card Top */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-lg text-charcoal-900">
                      {table.name}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isOccupied 
                        ? 'bg-amber-100 text-amber-800 border-amber-300' 
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {isOccupied ? 'Occupied (Active Order)' : 'Available'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-slate-400">
                    <button
                      onClick={() => handleOpenEdit(table)}
                      className="p-1.5 hover:text-forest-700 hover:bg-slate-100 rounded-lg transition"
                      title="Edit table details"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(table)}
                      className="p-1.5 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete table"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* QR Code and Info preview */}
                <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200 mb-3">
                  <div 
                    onClick={() => setQrModalTable(table)}
                    className="p-2 bg-white rounded-xl shadow-sm border border-slate-200 cursor-pointer hover:ring-2 hover:ring-forest-600 transition flex-shrink-0"
                    title="Click to view large stand card"
                  >
                    <QRCodeSVG
                      id={`qr-svg-${table.id}`}
                      value={tableUrl}
                      size={80}
                      level="M"
                      includeMargin={false}
                    />
                  </div>

                  <div className="flex-1 min-w-0 text-xs text-charcoal-700 space-y-1">
                    <div className="flex items-center gap-1 font-semibold text-charcoal-900">
                      <Users className="w-3.5 h-3.5 text-forest-700" />
                      <span>Capacity: {table.capacity || 4} guests</span>
                    </div>

                    <div className="text-[11px] text-charcoal-700/60 font-mono truncate" title={tableUrl}>
                      {tableUrl}
                    </div>

                    <a 
                      href={tableUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-forest-700 font-bold hover:underline"
                    >
                      <span>Test Customer View</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => handleDownloadQR(table)}
                  className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-charcoal-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download SVG</span>
                </button>

                <button
                  onClick={() => setQrModalTable(table)}
                  className="flex-1 py-1.5 bg-forest-700 hover:bg-forest-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>View Stand Card</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Table Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-elevated">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-serif font-bold text-base text-charcoal-900">
                {editingTable ? 'Edit Table' : 'Add New Table'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-charcoal-700 mb-1">
                  Table Display Name <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text"
                  required
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  placeholder="e.g. Table 4 or Balcony 1"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-charcoal-700 mb-1">
                    Table Number
                  </label>
                  <input 
                    type="text"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="4"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal-700 mb-1">
                    Seating Capacity
                  </label>
                  <input 
                    type="number"
                    min="1"
                    max="50"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600 font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 text-charcoal-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-forest-700 text-white rounded-xl text-xs font-bold hover:bg-forest-800"
                >
                  Save Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Single Table QR Stand Card Preview Modal */}
      {qrModalTable && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-elevated">
            <div className="flex justify-end">
              <button
                onClick={() => setQrModalTable(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg no-print"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stand Card design */}
            <div id="printable-receipt" className="border-4 border-forest-800 rounded-2xl p-6 bg-cream-50 text-charcoal-900 shadow-md">
              <div className="w-12 h-12 rounded-xl bg-forest-700 text-gold-400 flex items-center justify-center mx-auto mb-2 shadow">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
              <h2 className="font-serif font-bold text-xl text-charcoal-900 leading-tight">
                {restaurant.name}
              </h2>
              <p className="text-xs text-forest-700 font-semibold tracking-wide uppercase mt-0.5">
                Scan to Order &bull; Dine-In
              </p>

              <div className="my-5 p-4 bg-white rounded-2xl shadow-inner border-2 border-forest-100 inline-block">
                <QRCodeSVG
                  value={getTableUrl(qrModalTable)}
                  size={160}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div className="bg-forest-800 text-white py-2 px-4 rounded-xl shadow-sm inline-block">
                <span className="text-xs uppercase tracking-widest text-gold-400 block font-bold">You are seated at</span>
                <span className="font-serif font-bold text-xl">{qrModalTable.name}</span>
              </div>

              <p className="text-[10px] text-charcoal-700/60 mt-4">
                Open phone camera &bull; Point at QR &bull; Order without waiting!
              </p>
            </div>

            <div className="flex gap-2 justify-center pt-2 no-print">
              <button
                onClick={handlePrint}
                className="px-5 py-2.5 bg-forest-700 hover:bg-forest-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow"
              >
                <Printer className="w-4 h-4" />
                <span>Print Stand Card</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print All Tables Stand Cards Modal */}
      {printAllMode && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col p-6 shadow-elevated overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 no-print">
              <h3 className="font-serif font-bold text-lg text-charcoal-900">
                All Table Stand Cards ({tables.length} tables)
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-forest-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print All Cards</span>
                </button>
                <button
                  onClick={() => setPrintAllMode(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Print Container */}
            <div id="printable-receipt" className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {tables.map(table => (
                <div key={table.id} className="border-2 border-forest-800 rounded-2xl p-5 bg-cream-50 text-center flex flex-col items-center justify-between page-break-inside-avoid">
                  <div>
                    <h4 className="font-serif font-bold text-base text-charcoal-900">
                      {restaurant.name}
                    </h4>
                    <p className="text-[10px] text-forest-700 font-bold uppercase tracking-wider">
                      Scan to Order
                    </p>
                  </div>

                  <div className="my-3 p-2 bg-white rounded-xl shadow-sm border border-slate-200">
                    <QRCodeSVG
                      value={getTableUrl(table)}
                      size={120}
                      level="H"
                      includeMargin={false}
                    />
                  </div>

                  <div className="bg-forest-800 text-white py-1 px-3 rounded-lg w-full">
                    <span className="font-serif font-bold text-sm">{table.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
