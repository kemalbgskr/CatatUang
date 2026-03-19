"use client";
import { useState, useRef } from "react";
import { Camera, Upload, Check, Loader2, ArrowLeft, Image as ImageIcon } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ScannerPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setResult(null); // Reset prev result
    }
  };

  const handleScan = async () => {
    if (!photo) return;
    setIsScanning(true);
    setResult(null);

    const fd = new FormData();
    fd.append("receipt", photo);

    try {
      const res = await fetch("/api/analyze-receipt", {
        method: "POST",
        body: fd
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal scan struk");
      setResult(data);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsScanning(false);
    }
  };

  const saveExpense = async () => {
    if (!result) return;
    setIsSaving(true);
    try {
      const payload = {
        date: result.date || new Date().toISOString().split("T")[0],
        categoryId: null, // Since scanner might not have correct ID instantly, we send null or prompt user list. We need a category ID!
        amount: result.total,
        description: result.merchantName ? `Struk: ${result.merchantName}` : "Hasil Scan Struk",
        items: result.items
      };

      // To properly save, we actually need to ask them to pick a category or we map it via AI.
      // For now, let's redirect them to /pengeluaran with prefilled query params.
      
      const queryParams = new URLSearchParams({
        amount: result.total.toString(),
        description: payload.description,
        date: payload.date
      });
      
      router.push(`/pengeluaran?${queryParams.toString()}&openModal=true`);
    } catch (e: any) {
      alert("Gagal lanjut: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pt-12 md:pt-0 pb-20">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/" className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Scanner Struk</h1>
          <p className="text-slate-500 text-[15px] font-medium mt-0.5">Foto struknya, AI kami yang catat detailnya.</p>
        </div>
      </div>

      <div className="bg-white rounded-[32px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-100 p-8">
        
        {/* Upload Area */}
        {!previewUrl ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-[4/3] bg-slate-50 hover:bg-rose-50 border-2 border-dashed border-slate-200 hover:border-rose-300 rounded-[24px] flex flex-col items-center justify-center cursor-pointer transition-all group"
          >
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-400 group-hover:text-rose-500 group-hover:scale-110 transition-transform mb-4">
              <Camera size={32} />
            </div>
            <p className="text-[16px] font-bold text-slate-700 group-hover:text-rose-700">Ambil Foto / Pilih Struk</p>
            <p className="text-[13px] text-slate-400 font-medium mt-1">Mendukung format JPG, PNG</p>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileSelect}
            />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="relative w-full aspect-[4/3] rounded-[24px] overflow-hidden bg-slate-900 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Preview Struk" className="w-full h-full object-contain" />
              
              {!isScanning && !result && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white/20 backdrop-blur-md border border-white/30 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-white/30"
                  >
                    <Upload size={18} /> Ganti Foto
                  </button>
                  <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
                </div>
              )}

              {isScanning && (
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none">
                  <div className="w-16 h-16 bg-rose-500 text-white rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-rose-500/30">
                    <Loader2 size={32} className="animate-spin" />
                  </div>
                  <p className="text-white font-bold text-[16px]">AI Sedang Membaca...</p>
                  <p className="text-slate-300 text-[13px] mt-1">Menganalisis item, harga, dan merchant.</p>
                </div>
              )}
            </div>

            {!isScanning && !result && (
              <button 
                onClick={handleScan}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl text-[16px] font-bold transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2"
              >
                <Sparkles size={20} /> Mulai Scan dengan AI
              </button>
            )}

            {/* Results */}
            {result && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-inner space-y-6 animate-in slide-in-from-bottom-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-400 tracking-wider uppercase">Merchant</h3>
                    <p className="text-[18px] font-black text-slate-800">{result.merchantName || "Tidak Ditemukan"}</p>
                  </div>
                  <div className="text-right">
                    <h3 className="text-sm font-extrabold text-slate-400 tracking-wider uppercase">Tanggal</h3>
                    <p className="text-[16px] font-bold text-slate-700">{result.date ? new Date(result.date).toLocaleDateString("id-ID") : "-"}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-extrabold text-slate-400 tracking-wider uppercase mb-3">Item Terbaca</h3>
                  <div className="space-y-3">
                    {result.items && result.items.length > 0 ? result.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-[15px]">
                        <span className="font-semibold text-slate-700">{item.name} {item.qty > 1 && <span className="text-slate-400 ml-1">x{item.qty}</span>}</span>
                        <span className="font-bold text-slate-900">{formatRupiah(item.price)}</span>
                      </div>
                    )) : (
                      <p className="text-sm text-slate-500 italic">Tidak ada item rinci yang terbaca.</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between bg-white border border-rose-100 rounded-xl p-4 shadow-sm">
                  <span className="font-extrabold text-slate-700">Total Harga</span>
                  <span className="text-[20px] font-black text-rose-600">{formatRupiah(result.total || 0)}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button 
                    onClick={() => setResult(null)}
                    className="w-full bg-white border-2 border-slate-200 text-slate-600 font-bold py-3.5 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    Ulangi Scan
                  </button>
                  <button 
                    onClick={saveExpense}
                    disabled={isSaving}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex justify-center items-center gap-2"
                  >
                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                    Lanjut Simpan
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
