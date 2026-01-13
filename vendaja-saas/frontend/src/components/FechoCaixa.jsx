import React, { useMemo } from 'react';
import { X, Printer, Banknote, CreditCard, ShoppingBag, PieChart } from 'lucide-react';

const FechoCaixa = ({ fechar, usuario }) => {
  // 1. Pegar vendas do dia (filtro simples por data atual)
  const todasVendas = useMemo(() => {
    const dados = JSON.parse(localStorage.getItem('vendaJa_vendas') || '[]');
    const hoje = new Date().toISOString().split('T')[0];
    return dados.filter(v => v.data.startsWith(hoje));
  }, []);

  // 2. Totalizar por método
  const resumo = useMemo(() => {
    return todasVendas.reduce((acc, v) => {
      if (v.metodo === 'Dinheiro') acc.dinheiro += v.total;
      if (v.metodo === 'M-Pesa') acc.mpesa += v.total;
      acc.total += v.total;
      return acc;
    }, { dinheiro: 0, mpesa: 0, total: 0 });
  }, [todasVendas]);

  const imprimirFecho = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[200] no-print">
      <div id="area-impressao" className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-zoom-in">
        
        {/* CABEÇALHO */}
        <div className="p-8 border-b bg-slate-50 flex justify-between items-center no-print">
          <h3 className="text-xl font-black italic text-slate-800 uppercase tracking-tighter">Relatório de Fecho</h3>
          <button onClick={fechar} className="p-2 hover:bg-slate-200 rounded-full transition-all">
            <X size={20} />
          </button>
        </div>

        {/* CONTEÚDO DO RELATÓRIO */}
        <div className="p-10 space-y-8" id="ticket-fecho">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black uppercase">{usuario.nomeLoja}</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Fecho de Caixa • {new Date().toLocaleDateString('pt-MZ')}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100">
              <Banknote className="text-emerald-600 mb-2" size={20} />
              <p className="text-[9px] font-black text-emerald-800 uppercase opacity-60">Dinheiro</p>
              <h4 className="text-xl font-black text-emerald-900">{resumo.dinheiro.toFixed(2)}</h4>
            </div>
            <div className="bg-red-50 p-6 rounded-[2rem] border border-red-100">
              <CreditCard className="text-red-600 mb-2" size={20} />
              <p className="text-[9px] font-black text-red-800 uppercase opacity-60">M-Pesa</p>
              <h4 className="text-xl font-black text-red-900">{resumo.mpesa.toFixed(2)}</h4>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-dashed border-slate-200">
            <div className="flex justify-between items-center text-slate-500 font-bold text-sm">
              <span className="flex items-center gap-2"><ShoppingBag size={16}/> Total de Vendas</span>
              <span>{todasVendas.length} transações</span>
            </div>
            <div className="flex justify-between items-center text-slate-900 font-black text-2xl pt-2">
              <span className="flex items-center gap-2"><PieChart size={24} className="text-blue-600"/> TOTAL GERAL</span>
              <span className="italic">{resumo.total.toFixed(2)} MT</span>
            </div>
          </div>

          {/* RODAPÉ DO RECIBO */}
          <div className="text-center pt-8 opacity-40">
            <p className="text-[8px] font-black uppercase tracking-[0.3em]">Operador: {usuario.nome}</p>
            <p className="text-[8px] font-medium mt-1">VendaJá SaaS - Sistema de Gestão</p>
          </div>
        </div>

        {/* ACÇÕES */}
        <div className="p-8 bg-slate-50 flex gap-4 no-print">
          <button 
            onClick={imprimirFecho}
            className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-black transition-all"
          >
            <Printer size={18} /> IMPRIMIR X
          </button>
        </div>
      </div>
    </div>
  );
};

export default FechoCaixa;