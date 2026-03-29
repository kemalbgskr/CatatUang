"use client";
import { useState, useMemo } from "react";
import { formatRupiah } from "@/lib/utils";
import { Target, Plus, TrendingUp, Calendar, Trophy, Zap, AlertCircle } from "lucide-react";

interface Goal {
  id: number;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  emoji: string;
  color: string;
}

const INITIAL_GOALS: Goal[] = [
  {
    id: 1,
    title: "Dana Darurat",
    targetAmount: 50000000,
    currentAmount: 12500000,
    deadline: "2026-12-31",
    emoji: "🛡️",
    color: "from-blue-500 to-cyan-400"
  },
  {
    id: 2,
    title: "DP Rumah Baru",
    targetAmount: 250000000,
    currentAmount: 180000000,
    deadline: "2027-06-30",
    emoji: "🏠",
    color: "from-rose-500 to-pink-400"
  },
  {
    id: 3,
    title: "Liburan ke Jepang",
    targetAmount: 35000000,
    currentAmount: 8000000,
    deadline: "2026-09-15",
    emoji: "✈️",
    color: "from-amber-500 to-orange-400"
  }
];

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>(INITIAL_GOALS);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: "", targetAmount: "", deadline: "" });

  const handleAddValue = (id: number, addVal: number) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, currentAmount: Math.min(g.currentAmount + addVal, g.targetAmount) } : g));
  };

  const totalProgress = useMemo(() => {
    const totalTarget = goals.reduce((a, b) => a + b.targetAmount, 0);
    const totalCurrent = goals.reduce((a, b) => a + b.currentAmount, 0);
    return totalTarget ? (totalCurrent / totalTarget) * 100 : 0;
  }, [goals]);

  return (
    <div className="max-w-6xl mx-auto space-y-12 pt-12 md:pt-4 pb-20 fade-in zoom-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-4 md:px-0">
        <div>
          <h1 className="text-3xl font-extrabold text-[#2C2C2C] flex items-center gap-3">
             <Target className="text-rose-500" size={32} /> Financial Goals
          </h1>
          <p className="text-[#848484] text-[15px] font-medium mt-1">Wujudkan impianmu dengan perencanaan matang.</p>
        </div>
        <button 
          onClick={() => setModalOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3.5 rounded-2xl text-[14px] font-extrabold transition-all ease-out transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20"
        >
          <Plus size={18} strokeWidth={3} /> Buat Goal Baru
        </button>
      </div>

      <div className="px-4 md:px-0 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Progress Overview Section (Left Side 1 col if 3 col grid) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-[32px] p-8 text-white shadow-xl shadow-rose-500/20 relative overflow-hidden">
             <div className="absolute -top-10 -right-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
             <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
             
             <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mb-2 shadow-inner ring-4 ring-white/10">
                   <Trophy size={40} className="text-white drop-shadow-md" />
                </div>
                <div>
                   <h3 className="text-[13px] font-black tracking-widest uppercase text-rose-100 mb-1">Total Pencapaian</h3>
                   <div className="text-[42px] font-black tracking-tighter leading-none">{totalProgress.toFixed(0)}<span className="text-[24px]">%</span></div>
                </div>
                <div className="w-full h-2 rounded-full bg-black/20 mt-6 overflow-hidden">
                   <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${totalProgress}%` }}></div>
                </div>
                <p className="text-[14px] font-medium text-rose-100 mt-4 leading-tight">Terus menabung, sedikit lagi menuju kebebasan finansial!</p>
             </div>
          </div>
          
          <div className="bg-white rounded-[32px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-100">
             <h3 className="text-[14px] font-extrabold text-slate-800 mb-4 flex items-center gap-2">
               <Zap className="text-amber-500" size={18} /> Quick Tips
             </h3>
             <ul className="space-y-4 text-[13px] font-medium text-slate-500">
               <li className="flex gap-3"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" /> Evaluasi progressmu setiap akhir bulan.</li>
               <li className="flex gap-3"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" /> Prioritaskan Dana Darurat sebelum aset lain.</li>
               <li className="flex gap-3"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" /> Konsisten lebih baik dari jumlah besar namun jarang.</li>
             </ul>
          </div>
        </div>

        {/* Goals List (Right Side - 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-6">
             <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Target Aktif</h3>
             <span className="text-[12px] font-bold text-slate-400">{goals.length} Goals Berjalan</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {goals.map(goal => {
              const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
              const isCompleted = progress === 100;
              
              return (
                <div key={goal.id} className={`bg-white rounded-[24px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${isCompleted ? 'border-emerald-200 bg-emerald-50/10' : 'border-slate-100'}`}>
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-[16px] bg-gradient-to-br ${goal.color} flex items-center justify-center text-[24px] shadow-sm`}>
                        {goal.emoji}
                      </div>
                      <div>
                        <h4 className={`font-extrabold text-[16px] leading-tight ${isCompleted ? 'text-emerald-900' : 'text-slate-800'}`}>{goal.title}</h4>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 mt-1">
                          <Calendar size={12} /> {new Date(goal.deadline).toLocaleDateString("id-ID", { month: "short", year: "numeric" })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between items-end mb-2">
                       <div className="text-[12px] font-black text-slate-400 uppercase tracking-wider">Terkumpul</div>
                       <div className="text-right">
                         <span className={`text-[17px] font-black font-mono tracking-tight ${isCompleted ? 'text-emerald-600' : 'text-slate-800'}`}>
                           {formatRupiah(goal.currentAmount)}
                         </span>
                         <span className="text-[12px] font-bold text-slate-400 block -mt-1">
                           / {formatRupiah(goal.targetAmount)}
                         </span>
                       </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                       <div className={`h-full rounded-full bg-gradient-to-r ${goal.color} transition-all duration-700 ease-out`} style={{ width: `${progress}%` }}></div>
                    </div>
                    <div className="text-[12px] font-bold text-slate-400 text-right mt-1.5">{progress.toFixed(1)}% Tercapai</div>
                  </div>

                  {!isCompleted ? (
                    <div className="pt-4 border-t border-slate-100 flex gap-2">
                       <button onClick={() => handleAddValue(goal.id, 500000)} className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 py-2.5 rounded-xl text-[12px] font-extrabold transition-all">
                         + Rp 500rb
                       </button>
                       <button onClick={() => handleAddValue(goal.id, 1000000)} className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 py-2.5 rounded-xl text-[12px] font-extrabold transition-all">
                         + Rp 1jt
                       </button>
                    </div>
                  ) : (
                    <div className="pt-4 border-t border-emerald-100 flex justify-center items-center gap-2 text-emerald-600 font-extrabold text-[13px] bg-emerald-50 py-3 rounded-xl">
                      <Trophy size={16} /> GOAL TERCAPAI
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
