import React, { useState, useMemo } from 'react';
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
  Copy,
  Check,
  Search,
  Eye,
  Layers,
  Sparkles
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';

export default function AdminTablesPage() {
  const { 
    restaurant, 
    tables, 
    addTable, 
    updateTable, 
    deleteTable, 
    activeSlug 
  } = useRestaurant();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [tableNumber, setTableNumber] = useState('');
  const [tableName, setTableName] = useState('');
  const [capacity, setCapacity] = useState('4');

  // Preview or Print Stand Modal
  const [qrModalTable, setQrModalTable] = useState(null);
  const [printAllMode, setPrintAllMode] = useState(false);

  // Search query & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const getTableUrl = (table) => {
    const origin = window.location.origin;
    return `${origin}/r/${activeSlug}?table=${table.id}`;
  };

  const handleCopyLink = (table) => {
    const url = getTableUrl(table);
    navigator.clipboard.writeText(url);
    setCopiedId(table.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadQR = (table) => {
    const svg = document.getElementById(`qr-svg-${table.id}`);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const SVGURL = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = SVGURL;
    downloadLink.download = `${restaurant.slug || 'menu'}-${table.id}-qr.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
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

  const handlePrint = () => {
    window.print();
  };

  // Filter tables by search query
  const filteredTables = useMemo(() => {
    if (!searchQuery.trim()) return tables;
    const q = searchQuery.toLowerCase().trim();
    return tables.filter(t => 
      t.name?.toLowerCase().includes(q) || 
      t.tableNumber?.toLowerCase().includes(q) ||
      t.id?.toLowerCase().includes(q)
    );
  }, [tables, searchQuery]);

  // Total dining seating capacity across all tables
  const totalCapacity = useMemo(() => {
    return tables.reduce((sum, t) => sum + (Number(t.capacity) || 4), 0);
  }, [tables]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif font-bold text-2xl text-charcoal-900 flex items-center gap-2">
            <QrCode className="w-6 h-6 text-forest-700" />
            <span>Table QR Codes</span>
          </h1>
          <p className="text-xs text-charcoal-700/70">
            Dedicated dining table QR codes &bull; Customers scan with phone camera to view menu &amp; order &bull; Print acrylic table stands
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPrintAllMode(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-charcoal-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-300 shadow-xs"
          >
            <Printer className="w-4 h-4 text-forest-700" />
            <span>Print All QR Stands</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-forest-700 hover:bg-forest-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Table</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-charcoal-500 uppercase tracking-wider">Total Tables</div>
          <div className="font-serif font-bold text-2xl text-charcoal-900 mt-0.5">{tables.length}</div>
          <span className="text-[10px] text-charcoal-400">All have dedicated QR codes</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-charcoal-500 uppercase tracking-wider">Total Dining Capacity</div>
          <div className="font-serif font-bold text-2xl text-forest-900 mt-0.5">{totalCapacity} Seats</div>
          <span className="text-[10px] text-forest-700">Combined restaurant seating</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-emerald-200 shadow-sm bg-emerald-50/20 col-span-2 sm:col-span-1">
          <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">QR Code Type</div>
          <div className="font-serif font-bold text-base text-emerald-900 mt-1 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Instant Camera Scan</span>
          </div>
          <span className="text-[10px] text-emerald-700/80">No app download required</span>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="text-xs font-semibold text-charcoal-700">
          Showing {filteredTables.length} of {tables.length} Table QR Codes
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by table name or number..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* GRID OF TABLE QR CARDS (DEDICATED SECTION SHOWING EACH QR FOR EACH TABLE) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTables.map(table => {
          const tableUrl = getTableUrl(table);
          const isCopied = copiedId === table.id;

          return (
            <div 
              key={table.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
            >
              <div>
                {/* Table Header: Name, Capacity & Actions */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-forest-800 text-gold-400 font-bold font-serif flex items-center justify-center text-sm shadow-xs">
                      {table.name?.replace('Table ', 'T') || table.id}
                    </div>
                    <div>
                      <h2 className="font-serif font-bold text-lg text-charcoal-900 leading-tight">
                        {table.name}
                      </h2>
                      <div className="flex items-center gap-1.5 text-xs text-charcoal-500 mt-0.5">
                        <Users className="w-3.5 h-3.5 text-forest-700" />
                        <span>{table.capacity || 4} Guests Capacity</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(table)}
                      className="p-1.5 text-slate-400 hover:text-forest-700 hover:bg-slate-100 rounded-lg transition"
                      title="Edit table"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(table)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete table"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Big Centered High-Res QR Code */}
                <div className="my-4 text-center">
                  <div 
                    onClick={() => setQrModalTable(table)}
                    className="p-4 bg-slate-50 hover:bg-cream-50 rounded-2xl border-2 border-slate-200 hover:border-forest-600 transition inline-block cursor-pointer shadow-xs group-hover:scale-102"
                    title="Click to preview large printable table stand"
                  >
                    <div className="p-3 bg-white rounded-xl shadow-inner border border-slate-200">
                      <QRCodeSVG
                        id={`qr-svg-${table.id}`}
                        value={tableUrl}
                        size={160}
                        level="H"
                        includeMargin={false}
                      />
                    </div>
                    <span className="text-[10px] text-forest-700 font-bold uppercase tracking-wider block mt-2">
                      Scan to Order at {table.name}
                    </span>
                  </div>
                </div>

                {/* Direct Link Box with Copy & Test Open */}
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-charcoal-500 uppercase tracking-wider text-[10px]">
                      Menu Link ({table.name})
                    </span>
                    <a 
                      href={tableUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-forest-700 font-bold hover:underline"
                    >
                      <span>Open Customer View</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="flex items-center justify-between gap-2 font-mono text-[11px] text-charcoal-600 bg-white px-2 py-1.5 rounded-lg border border-slate-200">
                    <span className="truncate" title={tableUrl}>
                      {tableUrl}
                    </span>
                    <button
                      onClick={() => handleCopyLink(table)}
                      className="p-1 hover:bg-slate-100 rounded text-charcoal-500 hover:text-forest-700 transition flex-shrink-0"
                      title="Copy link to clipboard"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Print Stand Card & Download SVG */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setQrModalTable(table)}
                  className="py-2 px-3 bg-forest-700 hover:bg-forest-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Stand</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadQR(table)}
                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-charcoal-800 border border-slate-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Download className="w-3.5 h-3.5 text-forest-700" />
                  <span>Download SVG</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / EDIT TABLE MODAL                                           */}
      {/* ========================================================================= */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-elevated border border-slate-200 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-serif font-bold text-lg text-charcoal-900">
                {editingTable ? `Edit ${editingTable.name}` : 'Add New Table'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-1">
                  Table Number
                </label>
                <input
                  type="text"
                  required
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="e.g. 7"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  placeholder="e.g. Table 7"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-1">
                  Seating Capacity (Guests)
                </label>
                <select
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600"
                >
                  <option value="2">2 Guests (Small Table)</option>
                  <option value="4">4 Guests (Standard Table)</option>
                  <option value="6">6 Guests (Medium Booth)</option>
                  <option value="8">8 Guests (Large Family Table)</option>
                  <option value="10">10+ Guests (Party Table)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-charcoal-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-forest-700 hover:bg-forest-800 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  {editingTable ? 'Save Changes' : 'Create Table & Generate QR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: PRINT STAND CARD MODAL (INDIVIDUAL TABLE TENT / ACRYLIC STAND)    */}
      {/* ========================================================================= */}
      {qrModalTable && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-elevated">
            <div className="flex justify-end no-print">
              <button
                onClick={() => setQrModalTable(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Table Tent Container */}
            <div id="printable-receipt" className="border-4 border-forest-800 rounded-3xl p-6 bg-cream-50 text-charcoal-900 shadow-md">
              <div className="w-12 h-12 rounded-2xl bg-forest-800 text-gold-400 flex items-center justify-center mx-auto mb-2 shadow">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
              <h2 className="font-serif font-bold text-xl text-charcoal-900 leading-tight">
                {restaurant.name}
              </h2>
              <p className="text-xs text-forest-700 font-semibold tracking-wide uppercase mt-0.5">
                Scan to Order &bull; Dine-In
              </p>

              <div className="my-4 p-4 bg-white rounded-2xl shadow-inner border-2 border-forest-100 inline-block">
                <QRCodeSVG
                  value={getTableUrl(qrModalTable)}
                  size={165}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div className="bg-forest-800 text-white py-2 px-5 rounded-xl shadow-sm inline-block">
                <span className="text-[10px] uppercase tracking-widest text-gold-400 block font-bold">You are seated at</span>
                <span className="font-serif font-bold text-xl">{qrModalTable.name}</span>
              </div>

              <p className="text-[10px] text-charcoal-700/70 mt-3 font-medium">
                Open phone camera &bull; Point at QR &bull; Order without waiting!
              </p>
            </div>

            <div className="flex gap-2 justify-center pt-2 no-print">
              <button
                onClick={handlePrint}
                className="px-5 py-2.5 bg-forest-700 hover:bg-forest-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow"
              >
                <Printer className="w-4 h-4" />
                <span>Print Table Stand</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: BATCH PRINT ALL TABLE STAND CARDS                                 */}
      {/* ========================================================================= */}
      {printAllMode && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col p-6 shadow-elevated overflow-hidden">
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

            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {tables.map(table => (
                <div key={table.id} className="border-2 border-forest-800 rounded-2xl p-4 bg-cream-50 text-center text-charcoal-900 shadow-sm">
                  <div className="w-8 h-8 rounded-xl bg-forest-800 text-gold-400 flex items-center justify-center mx-auto mb-1">
                    <UtensilsCrossed className="w-4 h-4" />
                  </div>
                  <h4 className="font-serif font-bold text-sm">{restaurant.name}</h4>
                  <div className="my-2 p-2 bg-white rounded-xl shadow-inner inline-block border border-forest-100">
                    <QRCodeSVG
                      value={getTableUrl(table)}
                      size={120}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                  <div className="bg-forest-800 text-white py-1 px-3 rounded-lg text-xs font-bold inline-block">
                    {table.name}
                  </div>
                  <p className="text-[9px] text-charcoal-600 mt-1">Scan camera to order</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
