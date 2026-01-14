import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw, Smile, Type, Trash2, ZoomIn, ZoomOut, X, Image as ImageIcon, RotateCw, RotateCcw as RotateLeft, CheckCircle } from 'lucide-react';
import { PhotoData, Template, StickerItem, TextItem } from '../types';
import { generatePhotoStrip } from '../utils/stripGenerator';

interface PreviewViewProps {
  photos: PhotoData[];
  eventName: string;
  template: Template;
  onRetake: () => void;
  onNext: (finalImageUrl: string) => void;
}

const emojiToDataUrl = (emoji: string) => {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.font = '54px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 32, 34);
    return canvas.toDataURL();
  }
  return '';
};

const DEFAULT_STICKERS = ['❤️', '🎉', '😎', '🔥', '👑', '🎂', '⭐', '💋', '🐶', '🦄'];
const TEXT_COLORS = ['#FFFFFF', '#000000', '#FF0055', '#0099FF', '#FFCC00', '#00CC66', '#9900FF'];

const PreviewView: React.FC<PreviewViewProps> = ({ photos, eventName, template, onRetake, onNext }) => {
  const [baseStripUrl, setBaseStripUrl] = useState<string | null>(null);
  const [stickers, setStickers] = useState<StickerItem[]>([]);
  const [textItems, setTextItems] = useState<TextItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedItemType, setSelectedItemType] = useState<'sticker' | 'text' | null>(null);
  const [isStickerMenuOpen, setIsStickerMenuOpen] = useState(false);
  const [isTextMenuOpen, setIsTextMenuOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputText, setInputText] = useState('');
  const [selectedTextColor, setSelectedTextColor] = useState('#FFFFFF');

  const containerRef = useRef<HTMLDivElement>(null);
  const dragItem = useRef<{ id: string; type: 'sticker' | 'text'; startX: number; startY: number; initialLeft: number; initialTop: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const createStrip = async () => {
      const dateStr = new Date().toLocaleDateString('id-ID', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      const url = await generatePhotoStrip({ photos, eventName, dateStr, template });
      setBaseStripUrl(url);
    };
    createStrip();
  }, [photos, eventName, template]);

  const getFinalCompositeUrl = async (): Promise<string> => {
    if (!baseStripUrl || !containerRef.current) return '';
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const baseImg = new Image();
      baseImg.src = baseStripUrl;
      baseImg.onload = async () => {
        canvas.width = baseImg.width;
        canvas.height = baseImg.height;
        if (ctx) {
          ctx.drawImage(baseImg, 0, 0);
          const renderedImg = containerRef.current?.querySelector('img.base-strip') as HTMLImageElement;
          if (renderedImg) {
            const ratio = baseImg.width / renderedImg.offsetWidth;
            for (const sticker of stickers) {
              const stickerImg = new Image();
              stickerImg.src = sticker.src;
              await new Promise<void>(r => { stickerImg.onload = () => r(); stickerImg.onerror = () => r(); });
              const sWidth = 64 * sticker.scale * ratio;
              const sHeight = 64 * sticker.scale * ratio;
              const sX = sticker.x * ratio;
              const sY = sticker.y * ratio;
              ctx.save();
              ctx.translate(sX + sWidth/2, sY + sHeight/2);
              ctx.rotate((sticker.rotation * Math.PI) / 180);
              ctx.drawImage(stickerImg, -sWidth/2, -sHeight/2, sWidth, sHeight);
              ctx.restore();
            }
            for (const text of textItems) {
               ctx.save();
               const fontSize = 40 * text.scale * ratio;
               ctx.font = `${fontSize}px "Chewy", cursive`;
               ctx.fillStyle = text.color;
               ctx.strokeStyle = '#000000';
               ctx.lineWidth = 4 * text.scale * ratio;
               ctx.lineJoin = 'round';
               ctx.textAlign = 'left'; 
               ctx.textBaseline = 'top';
               const tX = text.x * ratio;
               const tY = text.y * ratio;
               ctx.translate(tX, tY);
               ctx.rotate((text.rotation * Math.PI) / 180);
               ctx.strokeText(text.content, 0, 0);
               ctx.fillText(text.content, 0, 0);
               ctx.restore();
            }
          }
        }
        resolve(canvas.toDataURL('image/png'));
      };
    });
  };

  const handleNext = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    const finalUrl = await getFinalCompositeUrl();
    onNext(finalUrl);
  };

  const addSticker = (src: string) => {
    const id = Date.now().toString();
    const container = containerRef.current;
    const x = container ? container.clientWidth / 2 - 32 : 100;
    const y = container ? container.clientHeight / 2 - 32 : 100;
    setStickers([...stickers, { id, src, x, y, scale: 1, rotation: 0 }]);
    setSelectedItemId(id);
    setSelectedItemType('sticker');
    setIsStickerMenuOpen(false);
  };

  const addText = () => {
    if (!inputText.trim()) return;
    const id = Date.now().toString();
    const container = containerRef.current;
    const x = container ? container.clientWidth / 2 - 50 : 100;
    const y = container ? container.clientHeight / 2 - 20 : 100;
    setTextItems([...textItems, { id, content: inputText, color: selectedTextColor, x, y, scale: 1, rotation: 0 }]);
    setSelectedItemId(id);
    setSelectedItemType('text');
    setIsTextMenuOpen(false);
    setInputText('');
  };

  const deleteItem = () => {
    if (selectedItemType === 'sticker') {
      setStickers(prev => prev.filter(s => s.id !== selectedItemId));
    } else if (selectedItemType === 'text') {
      setTextItems(prev => prev.filter(t => t.id !== selectedItemId));
    }
    setSelectedItemId(null);
    setSelectedItemType(null);
  };

  const scaleItem = (delta: number) => {
    if (selectedItemType === 'sticker') {
      setStickers(prev => prev.map(s => s.id === selectedItemId ? { ...s, scale: Math.max(0.5, Math.min(3, s.scale + delta)) } : s));
    } else if (selectedItemType === 'text') {
      setTextItems(prev => prev.map(t => t.id === selectedItemId ? { ...t, scale: Math.max(0.5, Math.min(4, t.scale + delta)) } : t));
    }
  };

  const rotateItem = (degree: number) => {
    if (selectedItemType === 'sticker') {
      setStickers(prev => prev.map(s => s.id === selectedItemId ? { ...s, rotation: s.rotation + degree } : s));
    } else if (selectedItemType === 'text') {
      setTextItems(prev => prev.map(t => t.id === selectedItemId ? { ...t, rotation: t.rotation + degree } : t));
    }
  };

  const handlePointerDown = (e: React.PointerEvent, id: string, type: 'sticker' | 'text') => {
    if (isProcessing) return;
    e.stopPropagation();
    e.preventDefault();
    setSelectedItemId(id);
    setSelectedItemType(type);
    const item = type === 'sticker' ? stickers.find(s => s.id === id) : textItems.find(t => t.id === id);
    if (!item) return;
    dragItem.current = { id, type, startX: e.clientX, startY: e.clientY, initialLeft: item.x, initialTop: item.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragItem.current) return;
    e.preventDefault();
    const dx = e.clientX - dragItem.current.startX;
    const dy = e.clientY - dragItem.current.startY;
    const { id, type, initialLeft, initialTop } = dragItem.current;
    if (type === 'sticker') {
      setStickers(prev => prev.map(s => s.id === id ? { ...s, x: initialLeft + dx, y: initialTop + dy } : s));
    } else {
      setTextItems(prev => prev.map(t => t.id === id ? { ...t, x: initialLeft + dx, y: initialTop + dy } : t));
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragItem.current) {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        dragItem.current = null;
    }
  };

  if (!baseStripUrl) {
    return (
      <div className="flex items-center justify-center h-full text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4"></div>
        <span className="ml-4 text-xl">Developing photos...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-full w-full bg-slate-900 p-2 md:p-4 gap-4 md:gap-6 relative overflow-hidden">
      
      {/* Editor Area: min-h-0 is CRITICAL for flex children with overflow-hidden to prevent vertical stretch */}
      <div className="flex-1 min-h-0 flex items-center justify-center bg-slate-800/50 rounded-2xl p-2 md:p-4 shadow-inner relative overflow-hidden">
        <div 
          ref={containerRef}
          className="relative shadow-2xl ring-2 ring-white/10 inline-flex max-w-full max-h-full"
          style={{ width: 'auto', height: 'auto' }}
        >
          <img 
            src={baseStripUrl} 
            alt="Base Strip" 
            className="base-strip w-auto max-w-full max-h-full object-contain block select-none pointer-events-none"
            draggable={false}
          />

          {stickers.map(sticker => (
            <div
              key={sticker.id}
              onPointerDown={(e) => handlePointerDown(e, sticker.id, 'sticker')}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className={`absolute cursor-move touch-none select-none transition-shadow ${
                selectedItemId === sticker.id ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-transparent' : ''
              }`}
              style={{
                left: sticker.x,
                top: sticker.y,
                width: '64px',
                height: '64px',
                transform: `scale(${sticker.scale}) rotate(${sticker.rotation}deg)`,
                zIndex: selectedItemId === sticker.id ? 20 : 10
              }}
            >
              <img src={sticker.src} alt="sticker" className="w-full h-full object-contain pointer-events-none" />
            </div>
          ))}

          {textItems.map(text => (
            <div
              key={text.id}
              onPointerDown={(e) => handlePointerDown(e, text.id, 'text')}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className={`absolute cursor-move touch-none select-none whitespace-nowrap bubble-font ${
                selectedItemId === text.id ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-transparent' : ''
              }`}
              style={{
                left: text.x,
                top: text.y,
                color: text.color,
                fontSize: '40px',
                transform: `scale(${text.scale}) rotate(${text.rotation}deg)`,
                transformOrigin: 'top left',
                zIndex: selectedItemId === text.id ? 20 : 10,
                textShadow: '2px 2px 0px #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000'
              }}
            >
              {text.content}
            </div>
          ))}
        </div>

        {selectedItemId && !isProcessing && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/95 p-2 rounded-2xl backdrop-blur-md border border-slate-700 shadow-2xl animate-in slide-in-from-bottom-5 z-30 max-w-[90%] overflow-x-auto">
                 <div className="flex gap-1.5 items-center min-w-max">
                     <button onClick={() => rotateItem(-15)} className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-white active:scale-90 transition-transform"><RotateLeft size={18} /></button>
                     <div className="w-px h-6 bg-slate-700 mx-1"></div>
                     <button onClick={() => scaleItem(-0.1)} className="p-2.5 hover:bg-slate-700 rounded-xl text-white active:scale-90 transition-transform"><ZoomOut size={18} /></button>
                     <button onClick={() => scaleItem(0.1)} className="p-2.5 hover:bg-slate-700 rounded-xl text-white active:scale-90 transition-transform"><ZoomIn size={18} /></button>
                     <div className="w-px h-6 bg-slate-700 mx-1"></div>
                     <button onClick={() => rotateItem(15)} className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-white active:scale-90 transition-transform"><RotateCw size={18} /></button>
                     <div className="w-px h-6 bg-slate-700 mx-1"></div>
                     <button onClick={deleteItem} className="p-2.5 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-xl active:scale-90 transition-transform"><Trash2 size={18} /></button>
                     <button onClick={() => { setSelectedItemId(null); setSelectedItemType(null); }} className="p-2.5 hover:bg-slate-700 rounded-xl text-slate-400 active:scale-90 transition-transform"><X size={18} /></button>
                 </div>
            </div>
        )}
      </div>

      <div className="flex-none w-full md:w-80 flex flex-col gap-3 justify-center relative z-20">
        <div className="grid grid-cols-2 gap-3">
             <button 
                onClick={() => setIsStickerMenuOpen(true)}
                disabled={isProcessing}
                className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl flex flex-col items-center justify-center gap-1 shadow-lg shadow-purple-500/20 active:scale-95 transition-all"
            >
                <Smile size={24} />
                <span className="text-xs font-bold uppercase tracking-wider">Stiker</span>
            </button>
            <button 
                onClick={() => setIsTextMenuOpen(true)}
                disabled={isProcessing}
                className="w-full py-4 bg-pink-600 hover:bg-pink-500 text-white rounded-2xl flex flex-col items-center justify-center gap-1 shadow-lg shadow-pink-500/20 active:scale-95 transition-all"
            >
                <Type size={24} />
                <span className="text-xs font-bold uppercase tracking-wider">Teks</span>
            </button>
        </div>

        <button 
            onClick={handleNext}
            disabled={isProcessing}
            className={`w-full py-4 md:py-6 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-blue-500/20 active:scale-95 transition-all ${isProcessing ? 'opacity-70' : ''}`}
        >
            {isProcessing ? <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div> : <CheckCircle size={24} />}
            <span className="text-lg md:text-xl font-bold">Selesai & Lanjut</span>
        </button>

        <button 
          onClick={onRetake}
          disabled={isProcessing}
          className="w-full py-3 bg-slate-700/50 hover:bg-slate-600 text-slate-300 rounded-2xl flex items-center justify-center gap-2 transition-colors"
        >
          <RotateCcw size={16} />
          <span className="text-sm font-semibold">Ulang Foto</span>
        </button>
      </div>

      {isStickerMenuOpen && !isProcessing && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center p-4">
              <div className="bg-slate-900 w-full max-w-md rounded-3xl border border-slate-700 p-6 shadow-2xl animate-in slide-in-from-bottom-10">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-white brand-font">Pilih Stiker</h3>
                      <button onClick={() => setIsStickerMenuOpen(false)} className="p-2 hover:bg-slate-800 rounded-full"><X size={24} className="text-slate-400" /></button>
                  </div>
                  <div className="grid grid-cols-5 gap-3 max-h-60 overflow-y-auto">
                      <button onClick={() => fileInputRef.current?.click()} className="aspect-square bg-slate-800 hover:bg-slate-700 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-slate-600">
                          <ImageIcon size={20} className="text-blue-400" />
                          <input type="file" ref={fileInputRef} onChange={(e) => {
                             const file = e.target.files?.[0];
                             if (file) {
                               const reader = new FileReader();
                               reader.onload = (ev) => ev.target?.result && addSticker(ev.target.result as string);
                               reader.readAsDataURL(file);
                             }
                          }} accept="image/*" className="hidden" />
                      </button>
                      {DEFAULT_STICKERS.map((emoji, idx) => (
                          <button key={idx} onClick={() => addSticker(emojiToDataUrl(emoji))} className="aspect-square bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center text-3xl transition-transform active:scale-90">{emoji}</button>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {isTextMenuOpen && !isProcessing && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 w-full max-w-sm rounded-3xl border border-slate-700 p-6 shadow-2xl animate-in zoom-in-95">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-white brand-font">Tulis Teks</h3>
                      <button onClick={() => setIsTextMenuOpen(false)} className="p-2 hover:bg-slate-800 rounded-full"><X size={24} className="text-slate-400" /></button>
                  </div>
                  <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Ketik sesuatu..." className="w-full bg-slate-800 border-2 border-slate-600 rounded-xl px-4 py-3 text-white text-center text-xl mb-4 focus:border-pink-500 outline-none bubble-font" autoFocus />
                  <div className="mb-6 flex gap-2 justify-center flex-wrap">
                    {TEXT_COLORS.map(color => (
                        <button key={color} onClick={() => setSelectedTextColor(color)} className={`w-8 h-8 rounded-full border-2 transition-transform ${selectedTextColor === color ? 'border-white scale-110 ring-2 ring-pink-500/50' : 'border-transparent opacity-70 hover:opacity-100'}`} style={{ backgroundColor: color }} />
                    ))}
                  </div>
                  <button onClick={addText} disabled={!inputText.trim()} className="w-full py-3 bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white rounded-xl font-bold transition-all active:scale-95">Tambahkan</button>
              </div>
          </div>
      )}
    </div>
  );
};

export default PreviewView;