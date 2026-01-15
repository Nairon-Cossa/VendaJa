import React, { useMemo, useState, useEffect } from 'react';
import { db } from '../firebase'; // Garante que o caminho está certo
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { X, Printer, Banknote, CreditCard, ShoppingBag, PieChart, Smartphone, Clock, Loader2 } from 'lucide-react';

const FechoCaixa = ({ fechar, usuario }) => {
  const [vendasDoDia, setVendasDoDia] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. BUSCAR DADOS REAIS DO FIREBASE
  useEffect(() => {
    const buscarVendasHoje = async () => {
      try {
        const hoje = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        
        // Dica: Em produção, o ideal é usar timestamps, mas para começar string serve
        const q = query(
          collection(db, "vendas"),
          where("lojaId", "==", usuario.lojaId),
          where("vendedorId", "==", usuario.uid),
          // Nota: Firestore não permite filtro de string 'startsWith' nativo facilmente, 
          // então filtramos no cliente ou usamos intervalo de datas.
          // Aqui busco as últimas 100 e filtro no JS para simplificar o teu código agora.
          orderBy("data", "desc") 
        );

        const querySnapshot = await getDocs(q);
        const vendas = querySnapshot.docs
          .map(doc => doc.data())
          .filter(v => v.data.startsWith(hoje)); // Filtra apenas hoje

        setVendasDoDia(vendas);
      } catch (error) {
        console.error("Erro ao buscar fecho:", error);
      } finally {
        setLoading(false);
      }
    };

    buscarVendasHoje();
  }, [usuario]);

  // 2. TOTALIZAR TODOS OS MÉTODOS (Incluindo e-Mola e Fiado)
  const resumo = useMemo(() => {
    return vendasDoDia.reduce((acc, v) => {
      const valor = Number(v.total) || 0;
      
      if (v.metodo === 'Dinheiro') acc.dinheiro += valor;
      else if (v.metodo === 'M-Pesa') acc.mpesa += valor;
      else if (v.metodo === 'e-Mola') acc.emola += valor;
      else if (v.metodo === 'Aberto') acc.fiado += valor;
      
      // Se não for Fiado, entra no dinheiro em caixa real
      if (v.metodo !== 'Aberto') {
        acc.totalCaixa += valor;
      }
      
      acc.totalGeral += valor;
      return acc;
    }, { dinheiro: 0, mpesa: 0, emola: 0, fiado: 0, totalCaixa: 0, totalGeral: 0 });
  }, [vendasDoDia]);

  const imprimirFecho = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[200]">
        <div className="bg-white p-6 rounded-2xl flex items-center gap-3">
          <Loader2 className="animate-spin text-blue-600" />
          <span className="font-bold text-slate-700">A calcular fecho...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[200]">
      
      {/* CSS PARA IMPRESSÃO PERFEITA */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; }
          #area-impressao, #area-impressao * { visibility: visible; }
          #area-impressao {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            margin: 0;
            padding: 20px;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          /* Esconde botões na impressão */
          .print-hidden { display: none !important; }
        }
      `}} />

      <div id="area-impressao" className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* CABEÇALHO (Botão X esconde na impressão) */}
        <div className="p-6 border-b bg-slate-50 flex justify-between items-center print-hidden">
          <h3 className="text-xl font-black italic text-slate-800 uppercase tracking-tighter">Relatório do Dia</h3>
          <button onClick={fechar} className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-500 hover:text-red-500">
            <X size={20} />
          </button>
        </div>

        {/* CONTEÚDO DO RELATÓRIO */}
        <div className="p-8 space-y-6">
          <div className="text-center space-y-1 pb-6 border-b border-dashed border-slate-200">
            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">{usuario.nomeLoja || "MINHA LOJA"}</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
              Relatório de Fecho (Z)
            </p>
            <p className="text-sm font-medium text-slate-600">
              {new Date().toLocaleDateString('pt-MZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* GRID DE VALORES */}
          <div className="grid grid-cols-2 gap-3">
            {/* Dinheiro */}
            <div className="bg-emerald-50 p-5 rounded-[1.5rem] border border-emerald-100">
              <div className="flex items-center gap-2 mb-2 opacity-70">
                <Banknote className="text-emerald-700" size={16} />
                <p className="text-[9px] font-black text-emerald-800 uppercase">Dinheiro</p>
              </div>
              <h4 className="text-xl font-black text-emerald-900 tracking-tight">{resumo.dinheiro.toFixed(2)}</h4>
            </div>

            {/* M-Pesa */}
            <div className="bg-red-50 p-5 rounded-[1.5rem] border border-red-100">
              <div className="flex items-center gap-2 mb-2 opacity-70">
                <Smartphone className="text-red-600" size={16} />
                <p className="text-[9px] font-black text-red-800 uppercase">M-Pesa</p>
              </div>
              <h4 className="text-xl font-black text-red-900 tracking-tight">{resumo.mpesa.toFixed(2)}</h4>
            </div>

            {/* E-Mola */}
            <div className="bg-orange-50 p-5 rounded-[1.5rem] border border-orange-100">
              <div className="flex items-center gap-2 mb-2 opacity-70">
                <Smartphone className="text-orange-600" size={16} />
                <p className="text-[9px] font-black text-orange-800 uppercase">e-Mola</p>
              </div>
              <h4 className="text-xl font-black text-orange-900 tracking-tight">{resumo.emola.toFixed(2)}</h4>
            </div>

            {/* Fiado / Pendente */}
            <div className="bg-slate-100 p-5 rounded-[1.5rem] border border-slate-200">
              <div className="flex items-center gap-2 mb-2 opacity-70">
                <Clock className="text-slate-600" size={16} />
                <p className="text-[9px] font-black text-slate-800 uppercase">Aberto/Fiado</p>
              </div>
              <h4 className="text-xl font-black text-slate-900 tracking-tight">{resumo.fiado.toFixed(2)}</h4>
            </div>
          </div>

          {/* TOTALIZADORES */}
          <div className="space-y-3 pt-4 border-t-2 border-slate-900">
            <div className="flex justify-between items-center text-slate-500 font-bold text-xs uppercase">
              <span className="flex items-center gap-2"><ShoppingBag size={14}/> Qtd. Vendas</span>
              <span>{vendasDoDia.length}</span>
            </div>
            
            {/* Total Real (O que entrou no bolso) */}
            <div className="flex justify-between items-center text-emerald-700 font-bold text-sm uppercase bg-emerald-50/50 p-2 rounded-lg">
              <span>Total em Caixa:</span>
              <span>{resumo.totalCaixa.toFixed(2)} MT</span>
            </div>

            {/* Total Geral (Incluindo Fiado) */}
            <div className="flex justify-between items-end text-slate-900 font-black text-3xl pt-1">
              <span className="flex items-center gap-2 text-sm uppercase tracking-wide opacity-60">
                 <PieChart size={18}/> Faturação
              </span>
              <span className="italic tracking-tighter">{resumo.totalGeral.toFixed(2)} <small className="text-sm">MT</small></span>
            </div>
          </div>

          {/* RODAPÉ DO RECIBO */}
          <div className="text-center pt-6 opacity-40">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-1">Operador: {usuario.nome}</p>
            <p className="text-[8px] font-medium">Processado em: {new Date().toLocaleTimeString()}</p>
          </div>
        </div>

        {/* ACÇÕES (Escondido na impressão) */}
        <div className="p-6 bg-slate-50 flex gap-4 print-hidden">
          <button 
            onClick={imprimirFecho}
            className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-black transition-all shadow-xl hover:scale-[1.02] active:scale-95"
          >
            <Printer size={18} /> IMPRIMIR FECHO
          </button>
        </div>
      </div>
    </div>
  );
};

export default FechoCaixa;