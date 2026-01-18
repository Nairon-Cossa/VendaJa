import React, { useMemo, useState, useEffect } from 'react';
import { db } from '../firebase'; 
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { 
  X, Printer, Banknote, Smartphone, Clock, Loader2, 
  ShoppingBag, PieChart, Calendar, User, Building2 
} from 'lucide-react';

const FechoCaixa = ({ fechar, usuario }) => {
  const [vendasDoDia, setVendasDoDia] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. BUSCAR DADOS DO FIREBASE (Lógica mantida)
  useEffect(() => {
    const buscarVendasHoje = async () => {
      try {
        const hoje = new Date().toISOString().split('T')[0];
        const q = query(
          collection(db, "vendas"),
          where("lojaId", "==", usuario.lojaId),
          where("vendedorId", "==", usuario.uid),
          orderBy("data", "desc") 
        );

        const querySnapshot = await getDocs(q);
        const vendas = querySnapshot.docs
          .map(doc => doc.data())
          .filter(v => v.data.startsWith(hoje));

        setVendasDoDia(vendas);
      } catch (error) {
        console.error("Erro ao buscar fecho:", error);
      } finally {
        setLoading(false);
      }
    };

    buscarVendasHoje();
  }, [usuario]);

  // 2. CÁLCULOS (Lógica mantida)
  const resumo = useMemo(() => {
    return vendasDoDia.reduce((acc, v) => {
      const valor = Number(v.total) || 0;
      
      if (v.metodo === 'Dinheiro') acc.dinheiro += valor;
      else if (v.metodo === 'M-Pesa') acc.mpesa += valor;
      else if (v.metodo === 'e-Mola') acc.emola += valor;
      else if (v.metodo === 'Aberto') acc.fiado += valor;
      
      if (v.metodo !== 'Aberto') acc.totalCaixa += valor;
      
      acc.totalGeral += valor;
      return acc;
    }, { dinheiro: 0, mpesa: 0, emola: 0, fiado: 0, totalCaixa: 0, totalGeral: 0 });
  }, [vendasDoDia]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[200]">
        <div className="bg-white p-8 rounded-[2rem] flex flex-col items-center gap-4 shadow-2xl">
          <Loader2 className="animate-spin text-blue-600" size={40} />
          <span className="font-black text-slate-700 uppercase tracking-widest text-xs">Processando Relatório...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-[200] overflow-y-auto">
      
      {/* ESTILO DE IMPRESSÃO */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; }
          #area-impressao, #area-impressao * { visibility: visible; }
          #area-impressao {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            box-shadow: none !important;
            border: none !important;
          }
          .print-hidden { display: none !important; }
        }
      `}} />

      <div id="area-impressao" className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
        
        {/* HEADER PROFISSIONAL */}
        <div className="p-10 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-3xl font-black uppercase italic tracking-tighter">Relatório de Fecho</h3>
              <p className="text-blue-400 font-bold text-xs uppercase tracking-widest mt-1 flex items-center gap-2">
                <PieChart size={14}/> Sumário Consolidado de Vendas
              </p>
            </div>
            <button onClick={fechar} className="relative z-10 p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all print-hidden">
              <X size={24} />
            </button>
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-600/20 rounded-full blur-3xl"></div>
        </div>

        <div className="p-10 space-y-8">
          {/* INFO DA LOJA / CONTEXTO */}
          <div className="flex justify-between items-end border-b border-slate-100 pb-8">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                <Building2 size={12}/> Ponto de Venda
              </p>
              <h2 className="text-xl font-black text-slate-900 uppercase">{usuario.nomeLoja || "SISTEMA POS"}</h2>
              <p className="text-sm font-medium text-slate-500 uppercase flex items-center gap-2 mt-1">
                <Calendar size={14}/> {new Date().toLocaleDateString('pt-MZ', { dateStyle: 'full' })}
              </p>
            </div>
            <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1 flex items-center justify-end gap-2">
                  <User size={12}/> Operador
                </p>
                <p className="font-black text-slate-900 uppercase italic">{usuario.nome}</p>
            </div>
          </div>

          {/* VALORES POR CANAL (GRID) */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Dinheiro (Em Mão)', valor: resumo.dinheiro, icon: <Banknote size={20}/>, color: 'emerald', bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-600' },
              { label: 'M-Pesa (Mobile)', valor: resumo.mpesa, icon: <Smartphone size={20}/>, color: 'red', bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-600' },
              { label: 'e-Mola (Mobile)', valor: resumo.emola, icon: <Smartphone size={20}/>, color: 'orange', bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-600' },
              { label: 'Contas Correntes (Fiado)', valor: resumo.fiado, icon: <Clock size={20}/>, color: 'slate', bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-600' }
            ].map((card, i) => (
              <div key={i} className={`p-6 rounded-[2rem] border ${card.border} ${card.bg}`}>
                <div className={`${card.text} mb-3`}>{card.icon}</div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{card.label}</p>
                <h4 className="text-2xl font-black text-slate-900 tracking-tighter tabular-nums">
                  {card.valor.toFixed(2)} <small className="text-[10px] opacity-40">MT</small>
                </h4>
              </div>
            ))}
          </div>

          {/* RESUMO FINAL (DARK CARD) */}
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex justify-between items-center shadow-2xl shadow-blue-900/20">
              <div>
                <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Total em Caixa Líquido</p>
                <h3 className="text-4xl font-black italic tracking-tighter tabular-nums">
                  {resumo.totalCaixa.toFixed(2)} <small className="text-sm opacity-50 uppercase">MT</small>
                </h3>
              </div>
              <div className="text-right border-l border-white/10 pl-8">
                <p className="text-white/40 text-[10px] font-black uppercase mb-1">Faturação Bruta</p>
                <p className="text-xl font-bold opacity-80">{resumo.totalGeral.toFixed(2)}</p>
                <p className="text-[10px] font-black text-blue-400 mt-1 flex items-center justify-end gap-2">
                  <ShoppingBag size={12}/> {vendasDoDia.length} DOCUMENTOS
                </p>
              </div>
          </div>

          {/* BOTÃO DE IMPRESSÃO */}
          <button 
            onClick={() => window.print()}
            className="w-full bg-slate-100 text-slate-900 py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-3 print-hidden shadow-sm"
          >
            <Printer size={20} /> Imprimir Relatório de Fecho
          </button>
          
          <p className="text-center text-[9px] font-bold text-slate-300 uppercase tracking-[0.5em] print:block hidden">
            Documento Processado por Computador
          </p>
        </div>
      </div>
    </div>
  );
};

export default FechoCaixa;