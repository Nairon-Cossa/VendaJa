import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, Package, DollarSign, 
  ArrowUpRight, ShoppingBag, Clock, Activity, ListOrdered, ChevronRight, RefreshCw, CheckCircle2
} from 'lucide-react';

const Dashboard = ({ produtos, usuario, avisar }) => {
  const [vendas, setVendas] = useState([]);
  // Inicializamos com base na existência do usuário para evitar o setCarregando(true) no useEffect
  const [carregando, setCarregando] = useState(!!usuario?.uid);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const navigate = useNavigate();

  // 1. MONITOR DE CONEXÃO
  useEffect(() => {
    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  // 2. ESCUTA DE DADOS (FIREBASE REALTIME)
  useEffect(() => {
    if (!usuario?.uid) return;

    // Não chamamos setCarregando(true) aqui para evitar o erro do ESLint.
    // O estado inicial já cobre o carregamento inicial.

    const q = query(
      collection(db, "vendas"), 
      where("lojaId", "==", usuario.uid),
      orderBy("data", "desc")
    );
    
    const unsubscribe = onSnapshot(q, {
      next: (snapshot) => {
        const listaVendas = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setVendas(listaVendas);
        setCarregando(false); // Seguro: Callback assíncrono
      },
      error: (error) => {
        console.error("Erro Firestore Dashboard:", error);
        if (error.code === 'permission-denied') {
          avisar("ERRO DE PERMISSÃO NA NUVEM", "erro");
        }
        setCarregando(false);
      }
    });

    return () => unsubscribe();
  }, [usuario?.uid, avisar]);

  // 3. CÁLCULOS ESTATÍSTICOS
  const estatisticas = useMemo(() => {
    const hoje = new Date().toLocaleDateString();
    
    const totalHistorico = vendas.reduce((acc, v) => acc + Number(v.total || 0), 0);
    const vendasHojeLista = vendas.filter(v => {
      if (!v.data) return false;
      const dataVenda = v.data.toDate ? v.data.toDate() : new Date(v.data);
      return dataVenda.toLocaleDateString() === hoje;
    });
    
    const totalHoje = vendasHojeLista.reduce((acc, v) => acc + Number(v.total || 0), 0);
    
    let lucroTotal = 0;
    vendas.forEach(v => {
      v.itens?.forEach(item => {
        const prodOriginal = produtos.find(p => p.id === item.id);
        const custoUnitario = prodOriginal?.custo || 0;
        lucroTotal += (Number(item.preco) - Number(custoUnitario)) * item.qtd;
      });
    });

    const meusProdutos = produtos.filter(p => p.lojaId === usuario?.uid);
    const produtosCriticos = meusProdutos.filter(p => Number(p.stock) <= 15);

    let saude = 100;
    if (produtosCriticos.length > 0) saude -= (produtosCriticos.length * 2);
    if (!isOnline) saude -= 50;
    
    return { 
      totalHistorico, 
      totalHoje, 
      lucroTotal, 
      numVendas: vendas.length, 
      numCriticos: produtosCriticos.length, 
      saude: Math.max(saude, 10),
      vendasHojeQtd: vendasHojeLista.length
    };
  }, [vendas, produtos, isOnline, usuario?.uid]);

  // LOADERS
  if (carregando && usuario?.uid && vendas.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="text-blue-600 animate-spin" size={32} />
          <p className="text-slate-400 font-black text-[9px] uppercase tracking-[0.4em]">Sincronizando Performance...</p>
        </div>
      </div>
    );
  }

  if (!usuario?.uid) {
    return (
      <div className="h-96 flex items-center justify-center text-slate-400 font-bold uppercase text-xs tracking-widest">
        Aguardando autenticação...
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-700 space-y-8 pb-10">
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 italic uppercase tracking-tighter">Performance Hub</h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">
            Unidade: <span className="text-blue-600">{usuario.nomeLoja || 'Gestão Local'}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm">
          <div className={`w-2 h-2 ${isOnline ? 'bg-emerald-500' : 'bg-red-500'} rounded-full ${isOnline && 'animate-pulse'}`} />
          <span className="text-slate-600 text-[10px] font-black uppercase tracking-widest">
            {isOnline ? 'Cloud Sync Ativo' : 'Modo Offline'}
          </span>
        </div>
      </div>

      {/* MÉTRICAS EM CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all">
          <DollarSign className="text-blue-600 mb-4" size={28} />
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Faturação Total</p>
          <h3 className="text-3xl font-black text-slate-900 mt-1 italic">
            {estatisticas.totalHistorico.toLocaleString()}<small className="text-xs ml-1">MT</small>
          </h3>
          <div className="flex items-center gap-1 text-emerald-500 font-bold text-[10px] mt-4 uppercase tracking-tighter">
            <ArrowUpRight size={14} /> Receita Acumulada
          </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl transition-all">
          <TrendingUp className="text-emerald-400 mb-4" size={28} />
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Lucro Estimado</p>
          <h3 className="text-3xl font-black text-white mt-1 italic">
            {estatisticas.lucroTotal.toLocaleString()}<small className="text-xs text-slate-500 ml-1">MT</small>
          </h3>
          <p className="text-[10px] font-bold text-emerald-400/50 mt-4 uppercase italic">Margem de Operação</p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <ShoppingBag className="text-orange-500 mb-4" size={28} />
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Vendas Hoje</p>
          <h3 className="text-3xl font-black text-slate-900 mt-1 italic">
            {estatisticas.totalHoje.toLocaleString()}<small className="text-xs ml-1">MT</small>
          </h3>
          <p className="text-[10px] font-bold text-slate-400 mt-4 uppercase">{estatisticas.vendasHojeQtd} Transações</p>
        </div>

        <div className={`p-8 rounded-[2.5rem] border transition-all ${estatisticas.numCriticos > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-slate-100'}`}>
          <Package className={`${estatisticas.numCriticos > 0 ? 'text-red-600' : 'text-slate-300'} mb-4`} size={28} />
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Stock Crítico</p>
          <h3 className={`text-3xl font-black mt-1 italic ${estatisticas.numCriticos > 0 ? 'text-red-700' : 'text-slate-900'}`}>
            {estatisticas.numCriticos}
          </h3>
          <div className="flex items-center gap-1 font-bold text-[10px] mt-4 uppercase">
             {estatisticas.numCriticos > 0 ? 'Reposição Necessária' : 'Inventário Ok'}
          </div>
        </div>
      </div>

      {/* TABELA DE FLUXO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[3.5rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex items-center gap-3">
             <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white"><Clock size={16} /></div>
             <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Fluxo Recente</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">
                  <th className="px-8 py-5">Vendedor / Ref</th>
                  <th className="px-8 py-5">Pagamento</th>
                  <th className="px-8 py-5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {vendas.slice(0, 6).map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate('/historico')}>
                    <td className="px-8 py-4">
                      <p className="font-black text-slate-800 text-xs uppercase">{v.vendedorNome || 'Admin'}</p>
                      <span className="text-[8px] text-slate-300 font-bold uppercase tracking-widest">ID: {v.id.slice(-6)}</span>
                    </td>
                    <td className="px-8 py-4 font-bold text-[10px] uppercase text-slate-500">{v.metodo}</td>
                    <td className="px-8 py-4 text-right font-black text-slate-900 italic text-sm">
                      {Number(v.total).toFixed(2)} MT
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SAÚDE E BOTÕES */}
        <div className="space-y-6">
          <div className={`${estatisticas.saude > 70 ? 'bg-emerald-500' : 'bg-amber-500'} p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden group`}>
            <Activity size={80} className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform" />
            <div className="relative z-10">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80">Saúde Operacional</span>
              <div className="flex items-end gap-2 mt-2">
                <h4 className="text-5xl font-black italic tracking-tighter">{estatisticas.saude}%</h4>
              </div>
              <div className="mt-6 flex items-center gap-2 bg-black/10 p-3 rounded-2xl border border-white/10">
                <CheckCircle2 size={14} />
                <p className="text-[9px] font-black uppercase">{estatisticas.numCriticos === 0 ? 'Sistema Equilibrado' : 'Ajustar Inventário'}</p>
              </div>
            </div>
          </div>

          <button onClick={() => navigate('/historico')} className="w-full bg-blue-600 p-8 rounded-[3rem] text-white shadow-xl hover:bg-slate-900 transition-all text-left group overflow-hidden relative">
            <ListOrdered className="absolute -right-4 -bottom-4 text-white/10 group-hover:scale-125 transition-transform" size={100} />
            <h4 className="text-xl font-black italic uppercase leading-tight relative z-10">Auditoria<br/>Completa</h4>
            <div className="inline-flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-xl text-[9px] font-black uppercase mt-4 relative z-10">
              Ver Histórico <ChevronRight size={14} />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;