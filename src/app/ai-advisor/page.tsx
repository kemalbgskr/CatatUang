"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Loader2, User, Bot, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AIAdvisorPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<{ role: "user" | "ai"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Smooth scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      // In a real app we'd fetch recent transactions to send as context.
      // For now we just send the message to the AI.
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghubungi AI");

      setMessages(prev => [...prev, { role: "ai", content: data.reply }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: "ai", content: "🚨 Maaf, terjadi kesalahan: " + err.message }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-2rem)] pt-12 md:pt-4 pb-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 px-4 md:px-0 shrink-0">
        <Link href="/" className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            AI Advisor <span className="bg-rose-200 text-rose-900 text-[11px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider">PRO</span>
          </h1>
          <p className="text-slate-500 text-[15px] font-medium mt-0.5">Tanya AI, dapat jawaban personal kondisi keuanganmu.</p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-white rounded-[32px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-100 p-4 md:p-6 flex flex-col overflow-hidden relative">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-rose-50 rounded-full blur-3xl opacity-50 pointer-events-none" />

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-6 pr-2 mb-4 relative z-10 no-scrollbar">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div className="w-20 h-20 bg-rose-50 rounded-[20px] flex items-center justify-center text-rose-500 mb-6 group hover:scale-105 transition-transform">
                <Sparkles size={36} className="group-hover:animate-pulse" />
              </div>
              <h2 className="text-lg font-bold text-slate-800 mb-2">Ceritakan Masalah Keuanganmu</h2>
              <p className="text-slate-500 text-[15px] font-medium max-w-sm mb-8">
                Saya adalah AI Advisor yang siap membantu. Coba tanyakan sesuatu, seperti:
              </p>
              <div className="grid gap-3 w-full max-w-md">
                {[
                  "Apakah budget makanku bulan ini terlalu besar?",
                  "Bagaimana cara menabung untuk beli motor baru?",
                  "Bantu analisis pengeluaranku secara umum."
                ].map((q, i) => (
                  <button
                    key={i}
                    onClick={() => { setInput(q); }}
                    className="text-left bg-slate-50 hover:bg-rose-50 hover:text-rose-700 text-slate-600 border border-slate-100 hover:border-rose-200 px-5 py-3.5 rounded-2xl text-[14px] font-bold transition-all shadow-sm"
                  >
                    "{q}"
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, idx) => (
            <div key={idx} className={`flex items-start gap-4 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm ${
                m.role === "user" ? "bg-slate-900 text-white" : "bg-rose-100 text-rose-600"
              }`}>
                {m.role === "user" ? <User size={18} /> : <Bot size={20} />}
              </div>
              <div className={`max-w-[75%] px-5 py-3.5 rounded-3xl text-[15px] ${
                m.role === "user" 
                  ? "bg-slate-900 text-white font-medium rounded-tr-sm" 
                  : "bg-slate-50 text-slate-700 font-medium border border-slate-100 rounded-tl-sm whitespace-pre-wrap leading-relaxed shadow-sm"
              }`}>
                {m.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-sm">
                <Bot size={20} />
              </div>
              <div className="bg-slate-50 px-6 py-4 rounded-3xl rounded-tl-sm border border-slate-100 shadow-sm flex gap-2 w-24">
                <span className="w-2 h-2 bg-rose-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="relative z-10 -mx-2 md:mx-0">
          <div className="relative flex items-center bg-slate-50 border-2 border-slate-100 focus-within:bg-white focus-within:border-primary-200 rounded-[24px] p-2 transition-all shadow-sm">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tanya apapun tentang keuangan..."
              className="w-full bg-transparent px-4 py-3 text-[15px] font-semibold text-slate-800 outline-none placeholder:font-medium placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-rose-500 hover:bg-rose-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none text-white w-12 h-12 rounded-[18px] flex items-center justify-center transition-all shadow-lg shadow-rose-500/30 shrink-0 mr-1"
            >
              <Send size={20} className={isLoading ? "animate-pulse" : ""} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
