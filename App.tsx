import React, { useState, useRef } from 'react';
import { Camera, Settings, Check, Upload, Info, X, Home } from 'lucide-react';
import CameraView from './components/CameraView';
import PreviewView from './components/PreviewView';
import FinalView from './components/FinalView';
import { AppState, PhotoData, Template } from './types';
import { TEMPLATES } from './constants/templates';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>('IDLE');
  const [eventName, setEventName] = useState('SUMMER PARTY');
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(TEMPLATES[0]);
  const [showGuide, setShowGuide] = useState(false);
  const [finalStripUrl, setFinalStripUrl] = useState<string | null>(null);
  
  // Ref for file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startSession = () => {
    setPhotos([]);
    setFinalStripUrl(null);
    setState('COUNTDOWN');
  };

  const handleCaptureComplete = (captured: PhotoData[]) => {
    setPhotos(captured);
    setState('EDITING'); // Changed from PREVIEW to EDITING
  };

  const handleEditComplete = (url: string) => {
      setFinalStripUrl(url);
      setState('RESULT');
  };

  const resetSession = () => {
    setState('IDLE');
    setPhotos([]);
    setFinalStripUrl(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        // Create a custom template object
        const customTemplate: Template = {
          id: `custom-${Date.now()}`,
          name: 'Custom',
          background: '#ffffff', // Fallback
          backgroundImage: result,
          textColor: '#ffffff', // Default to white text for custom images (often dark)
          accentColor: '#ffffff',
          borderColor: 'rgba(255,255,255,0.5)'
        };
        setSelectedTemplate(customTemplate);
        
        // Reset the input value so the same file can be selected again if needed
        if (e.target) {
            e.target.value = '';
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full h-screen bg-slate-950 flex flex-col text-white">
      {/* Header - Only show in Idle, Editing or Result */}
      {state !== 'CAPTURING' && state !== 'COUNTDOWN' && (
        <header className="flex-none h-16 px-6 flex items-center justify-between bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Camera className="text-pink-500" />
            <span className="text-xl font-bold brand-font tracking-wide">SnapStrip</span>
          </div>
          
          {/* Add Home Button in Editing/Result Mode to allow full exit */}
          {(state === 'EDITING' || state === 'RESULT') && (
             <button onClick={resetSession} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                <Home size={20} />
             </button>
          )}
          
          {state === 'IDLE' && (
             <div className="text-xs text-slate-500 font-mono">v1.5</div>
          )}
        </header>
      )}

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden">
        
        {/* IDLE STATE: Start Screen */}
        {state === 'IDLE' && (
          <div className="h-full flex flex-col items-center justify-center p-6 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"></div>
            
            <div className="relative z-10 flex flex-col items-center w-full max-w-lg h-full overflow-y-auto py-4 no-scrollbar">
              <div className="mb-6 p-6 bg-slate-900/50 rounded-3xl border border-white/10 backdrop-blur-md text-center shadow-2xl w-full">
                <h1 className="text-4xl md:text-6xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 brand-font">
                  PHOTO BOOTH
                </h1>
                <p className="text-slate-300 text-sm md:text-base">Create your memories in a strip</p>
              </div>

              {/* Event Name Input */}
              <div className="w-full mb-6">
                <label className="block text-slate-400 text-xs font-bold mb-2 ml-2 uppercase tracking-wider">
                  Event Name
                </label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl bg-slate-800/80 border border-slate-700 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/50 text-white text-xl text-center outline-none transition-all placeholder-slate-600"
                  placeholder="ENTER EVENT NAME"
                />
              </div>

              {/* Template Selection */}
              <div className="w-full mb-8">
                <div className="flex justify-between items-end mb-3 ml-2 mr-2">
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider">
                    Select Style
                  </label>
                  <button 
                    onClick={() => setShowGuide(true)}
                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                  >
                    <Info size={12} />
                    Design Specs
                  </button>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  {/* Built-in Templates */}
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTemplate(t)}
                      className={`relative aspect-square rounded-xl border-2 transition-all overflow-hidden group ${
                        selectedTemplate.id === t.id 
                          ? 'border-pink-500 ring-2 ring-pink-500/30 scale-105 shadow-xl' 
                          : 'border-slate-700 opacity-70 hover:opacity-100 hover:scale-105'
                      }`}
                      style={{ backgroundColor: t.background }}
                    >
                      {selectedTemplate.id === t.id && (
                        <div className="absolute top-2 right-2 bg-pink-500 rounded-full p-0.5 z-10">
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                      
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                        <div 
                          className="text-xs font-bold text-center leading-tight mb-1" 
                          style={{ color: t.textColor }}
                        >
                          {t.name}
                        </div>
                        <div 
                          className="w-8 h-1 rounded-full" 
                          style={{ backgroundColor: t.accentColor }}
                        ></div>
                      </div>
                    </button>
                  ))}

                  {/* Upload Custom Button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative aspect-square rounded-xl border-2 border-dashed border-slate-600 hover:border-blue-500 hover:bg-slate-800 transition-all flex flex-col items-center justify-center gap-2 group ${selectedTemplate.id.startsWith('custom') ? 'border-blue-500 bg-slate-800' : ''}`}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      className="hidden" 
                      accept="image/png, image/jpeg"
                    />
                    {selectedTemplate.id.startsWith('custom') ? (
                       <>
                         <div className="absolute top-2 right-2 bg-blue-500 rounded-full p-0.5 z-10">
                            <Check size={12} className="text-white" />
                         </div>
                         {selectedTemplate.backgroundImage && (
                           <img src={selectedTemplate.backgroundImage} className="absolute inset-0 w-full h-full object-cover opacity-50" />
                         )}
                         <span className="relative z-10 text-xs font-bold text-white">Custom Selected</span>
                       </>
                    ) : (
                      <>
                        <Upload size={20} className="text-slate-400 group-hover:text-blue-400" />
                        <span className="text-xs text-slate-400 group-hover:text-blue-400">Import</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <button
                onClick={startSession}
                className="group relative w-full mt-auto mb-4"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 to-purple-600 rounded-3xl blur opacity-70 group-hover:opacity-100 transition duration-200"></div>
                <div className="relative w-full py-6 bg-slate-900 rounded-3xl ring-1 ring-white/10 flex items-center justify-center gap-4 group-hover:bg-slate-800 transition-all active:scale-[0.98]">
                  <Camera size={32} className="text-pink-500" />
                  <span className="text-2xl font-bold brand-font">START BOOTH</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Design Guide Modal */}
        {showGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-sm w-full p-6 shadow-2xl relative">
              <button 
                onClick={() => setShowGuide(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
              
              <h3 className="text-xl font-bold text-white mb-4 brand-font">Spesifikasi Desain</h3>
              
              <div className="space-y-4 text-sm text-slate-300">
                <p>Agar foto pas di dalam strip, desain background harus mengikuti ukuran ini:</p>
                <div className="bg-slate-800 p-3 rounded-lg font-mono text-xs">
                  <div className="flex justify-between mb-1">
                    <span>Kanvas Total:</span> <span className="text-green-400">600px x 1490px</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-bold text-white">Area Zoning (Y Position):</h4>
                  <ul className="list-disc pl-5 space-y-1 text-xs">
                    <li><span className="text-yellow-400">Judul Event:</span> 0px - 160px</li>
                    <li><span className="text-pink-400">Foto 1:</span> Y: 160px (Size: 520x390)</li>
                    <li><span className="text-pink-400">Foto 2:</span> Y: 580px (Size: 520x390)</li>
                    <li><span className="text-pink-400">Foto 3:</span> Y: 1000px (Size: 520x390)</li>
                    <li><span className="text-yellow-400">Tanggal:</span> 1390px - 1490px</li>
                  </ul>
                </div>

                <div className="pt-2 border-t border-slate-700">
                  <p className="text-xs text-slate-500 italic">
                    Tips: Gunakan background gelap agar teks putih terbaca jelas. Format: PNG/JPG.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CAPTURE STATE: Camera View */}
        {(state === 'COUNTDOWN' || state === 'CAPTURING') && (
          <CameraView 
            onCaptureComplete={handleCaptureComplete}
          />
        )}

        {/* EDITING STATE: Add Stickers/Text */}
        {state === 'EDITING' && (
          <PreviewView 
            photos={photos} 
            eventName={eventName} 
            template={selectedTemplate}
            onRetake={startSession}
            onNext={handleEditComplete}
          />
        )}

        {/* RESULT STATE: Print/Save */}
        {state === 'RESULT' && finalStripUrl && (
            <FinalView 
                finalImageUrl={finalStripUrl}
                onHome={resetSession}
            />
        )}
      </main>
    </div>
  );
};

export default App;