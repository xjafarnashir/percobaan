
import React from 'react';
import { Printer, Download, Home, Check } from 'lucide-react';

interface FinalViewProps {
  finalImageUrl: string;
  onHome: () => void;
}

const FinalView: React.FC<FinalViewProps> = ({ finalImageUrl, onHome }) => {
  
  const handlePrint = () => {
    const printArea = document.getElementById('print-area');
    if (printArea) {
      printArea.innerHTML = '';
      const img = document.createElement('img');
      img.src = finalImageUrl;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'contain';
      
      img.onload = () => {
        /** 
         * Memanggil window.print() yang sudah di-override di index.html.
         * Ini akan otomatis memicu AndroidPrint.printNow() di WebView.
         */
        window.print();
      };
      printArea.appendChild(img);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = finalImageUrl;
    link.download = `snapstrip-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col md:flex-row h-full w-full bg-slate-900 p-2 md:p-4 gap-4 md:gap-6 relative overflow-hidden">
        <div id="print-area" className="hidden"></div>

        {/* Static Preview: Always fits inside the screen */}
        <div className="flex-1 min-h-0 flex items-center justify-center bg-slate-800/50 rounded-2xl p-2 md:p-4 shadow-inner overflow-hidden">
            <img 
                src={finalImageUrl} 
                alt="Final Strip" 
                className="w-auto max-w-full max-h-full object-contain shadow-2xl rounded-lg ring-1 ring-white/10" 
            />
        </div>

        <div className="flex-none w-full md:w-80 flex flex-col gap-3 justify-center">
            <div className="bg-emerald-900/20 border border-emerald-500/30 p-4 rounded-2xl text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500 text-white mb-1">
                    <Check size={20} />
                </div>
                <h2 className="text-lg font-bold text-white brand-font">Selesai!</h2>
            </div>

            <button 
                onClick={handlePrint}
                className="w-full py-5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white rounded-2xl flex flex-col items-center justify-center gap-1 transition-transform active:scale-95 shadow-lg shadow-emerald-500/20"
            >
                <Printer size={28} />
                <span className="text-lg font-bold uppercase tracking-wide">Cetak Foto</span>
            </button>

            <button 
                onClick={handleDownload}
                className="w-full py-5 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-2xl flex flex-col items-center justify-center gap-1 transition-transform active:scale-95 shadow-lg shadow-blue-500/20"
            >
                <Download size={28} />
                <span className="text-lg font-bold uppercase tracking-wide">Simpan</span>
            </button>

            <div className="hidden md:block flex-1"></div>

            <button 
                onClick={onHome}
                className="w-full py-4 bg-slate-700/50 hover:bg-slate-600 text-slate-300 rounded-2xl flex items-center justify-center gap-2 transition-colors"
            >
                <Home size={18} />
                <span className="text-sm font-semibold">Ke Halaman Awal</span>
            </button>
        </div>
    </div>
  );
};

export default FinalView;
