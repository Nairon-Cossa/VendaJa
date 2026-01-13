import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, Package, DollarSign, 
  ArrowUpRight, ShoppingBag, Clock, Activity, ListOrdered, ChevronRight, AlertTriangle, RefreshCw, CheckCircle2, Globe
} from 'lucide-react';

const Dashboard = ({ produtos, usuario, avisar }) => {
  const [vendas, setVendas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const navigate = useNavigate();

  // Monitor de Internet
  useEffect(() => {
    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  const buscarDadosNovamente = () => {
    avisar("A SINCRONIZAR COM A CLOUD...", "info");
  };

  useEffect(() => {
    if (!usuario?.lojaId) return;

    const q = query(
      collection(db, "vendas"), 
      where("lojaId", "==", usuario.lojaId),
      orderBy("data", "desc")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const listaVendas = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      if (!carregando && listaVendas.length > vendas.length) {
        avisar("NOVA VENDA DETETADA!", "sucesso");
      }

      setVendas(listaVendas);
      setCarregando(false);
    }, (error) => {
      console.error("Erro no Dashboard:", error);
      avisar("ERRO DE LIGAÇÃO", "erro");
      setCarregando(false);
    });

    return () => unsubscribe();
  }, [usuario.lojaId, vendas.length, carregando]);

  // 2. CÁLCULOS ESTATÍSTICOS E SAÚDE DA LOJA
  const estatisticas = useMemo(() => {
    const hoje = new Date().toLocaleDateString();
    
    const totalHistorico = vendas.reduce((acc, v) => acc + Number(v.total || 0), 0);
    const vendasHojeLista = vendas.filter(v => new Date(v.data).toLocaleDateString() === hoje);
    const totalHoje = vendasHojeLista.reduce((acc, v) => acc + Number(v.total || 0), 0);
    
    let lucroTotal = 0;
    vendas.forEach(v => {
      v.itens?.forEach(item => {
        const prodOriginal = produtos.find(p => p.id === item.id);
        const custoUnitario = prodOriginal?.custo || 0;
        lucroTotal += (Number(item.preco) - Number(custoUnitario)) * item.qtd;
      });
    });

    const produtosCriticos = produtos.filter(p => Number(p.stock) <= 15);
    const numCriticos = produtosCriticos.length;

    // Cálculo de Saúde (0 a 100)
    // Fatores: Stock baixo penaliza, Falta de internet penaliza
    let saude = 100;
    if (numCriticos > 0) saude -= (numCriticos * 5);
    if (!isOnline) saude -= 50;
    if (saude < 0) saude = 10;

    return { 
      totalHistorico, totalHoje, lucroTotal, 
      numVendas: vendas.length, numCriticos, 
      produtosCriticos, saude, isOnline 
    };
  }, [vendas, produtos, isOnline]);

  useEffect(() => {
    if (!carregando && estatisticas.numCriticos > 0) {
      const timer = setTimeout(() => {
        avisar(`${estatisticas.numCriticos} ARTIGOS COM STOCK BAIXO!`, "info");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [estatisticas.numCriticos, carregando]);

  if (carregando) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="text-blue-600 animate-spin" size={32} />
          <p className="text-slate-400 font-black text-[9px] uppercase tracking-[0.4em]">A ler dados da Cloud...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-700 space-y-8 pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 italic uppercase tracking-tighter">Performance Hub</h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">
            Gestão Operacional: <span className="text-blue-600">{usuario.nomeLoja || 'Unidade Local'}</span>
          </p>
        </div>
        
        <button onClick={buscarDadosNovamente} className="group flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm hover:border-blue-200 transition-all active:scale-95">
          <div className={`w-2 h-2 ${estatisticas.isOnline ? 'bg-emerald-500' : 'bg-red-500'} rounded-full animate-pulse`} />
          <span className="text-slate-600 text-[10px] font-black uppercase tracking-widest group-hover:text-blue-600">
            {estatisticas.isOnline ? 'Live Sincronizado' : 'Modo Offline'}
          </span>
        </button>
      </div>

      {/* CARDS DE MÉTRICAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* CARD FATURAÇÃO */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:shadow-xl hover:shadow-blue-900/5 transition-all">
          <DollarSign className="text-blue-600 mb-4" size={28} />
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Faturação Total</p>
          <h3 className="text-3xl font-black text-slate-900 mt-1 italic">{estatisticas.totalHistorico.toLocaleString()} <span className="text-xs italic">MT</span></h3>
          <div className="flex items-center gap-1 text-emerald-500 font-bold text-[10px] mt-4 uppercase tracking-tighter"><ArrowUpRight size={14} /> Receita Global</div>
        </div>

        {/* CARD LUCRO */}
        <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200 transition-all">
          <TrendingUp className="text-emerald-400 mb-4" size={28} />
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Estimativa de Lucro</p>
          <h3 className="text-3xl font-black text-white mt-1 italic">{estatisticas.lucroTotal.toLocaleString()} <small className="text-xs text-slate-500 font-bold">MT</small></h3>
          <p className="text-[10px] font-bold text-emerald-400/50 mt-4 uppercase italic">Margem Bruta</p>
        </div>

        {/* CARD VENDAS HOJE */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 transition-all">
          <ShoppingBag className="text-orange-500 mb-4" size={28} />
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Vendas de Hoje</p>
          <h3 className="text-3xl font-black text-slate-900 mt-1 italic">{estatisticas.totalHoje.toLocaleString()} <span className="text-xs">MT</span></h3>
          <p className="text-[10px] font-bold text-slate-400 mt-4 uppercase font-black">{vendas.filter(v => new Date(v.data).toLocaleDateString() === new Date().toLocaleDateString()).length} Transações</p>
        </div>

        {/* CARD STOCK CRÍTICO */}
        <div className={`p-8 rounded-[2.5rem] shadow-sm border transition-all ${estatisticas.numCriticos > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-slate-100'}`}>
          <Package className={`${estatisticas.numCriticos > 0 ? 'text-red-600' : 'text-slate-300'} mb-4`} size={28} />
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Atenção Stock (≤15)</p>
          <h3 className={`text-3xl font-black mt-1 italic ${estatisticas.numCriticos > 0 ? 'text-red-700' : 'text-slate-900'}`}>{estatisticas.numCriticos}</h3>
          <div className={`flex items-center gap-1 font-bold text-[10px] mt-4 uppercase tracking-tighter ${estatisticas.numCriticos > 0 ? 'text-red-600 animate-pulse' : 'text-slate-400'}`}>
             {estatisticas.numCriticos > 0 ? <AlertTriangle size={12}/> : null} Artigos Críticos
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ÚLTIMAS OPERAÇÕES */}
        <div className="lg:col-span-2 bg-white rounded-[3.5rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white"><Clock size={16} /></div>
              <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Fluxo Recente</h4>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">
                  <th className="px-8 py-5">Vendedor</th>
                  <th className="px-8 py-5">Método</th>
                  <th className="px-8 py-5 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {vendas.slice(0, 5).map((venda) => (
                  <tr key={venda.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate('/historico')}>
                    <td className="px-8 py-4">
                      <p className="font-black text-slate-800 text-xs uppercase">{venda.vendedorNome || 'Admin'}</p>
                      <span className="text-[8px] text-slate-300 font-bold uppercase tracking-widest">Ref: {venda.id.slice(-6)}</span>
                    </td>
                    <td className="px-8 py-4 font-bold text-[10px] uppercase text-slate-500">{venda.metodo}</td>
                    <td className="px-8 py-4 text-right font-black text-slate-900 italic text-sm">{Number(venda.total).toFixed(2)} MT</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* COLUNA DIREITA: ALERTAS E SAÚDE */}
        <div className="flex flex-col gap-6">
          
          {/* REPOR STOCK (LIMITE 15) */}
          {estatisticas.numCriticos > 0 && (
            <div className="bg-white p-6 rounded-[2.5rem] border-2 border-red-50 shadow-sm animate-in slide-in-from-right duration-500">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="text-red-500" size={18} />
                <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest">Repor Stock Urgente</h4>
              </div>
              <div className="space-y-3">
                {estatisticas.produtosCriticos.slice(0, 3).map(prod => (
                  <div key={prod.id} className="flex justify-between items-center p-3 bg-red-50/50 rounded-2xl">
                    <span className="text-[10px] font-black text-slate-700 uppercase truncate max-w-[120px]">{prod.nome}</span>
                    <span className="bg-red-600 text-white text-[9px] font-black px-2 py-1 rounded-lg">{prod.stock} UN</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CARD SAÚDE DA LOJA (O teu "Sistema Online" evoluído) */}
          <div className={`${estatisticas.saude > 70 ? 'bg-emerald-500' : 'bg-amber-500'} p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden group transition-all`}>
            <Activity size={80} className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <div className="bg-white/20 p-2 rounded-xl">
                  {estatisticas.isOnline ? <Globe size={16} /> : <AlertTriangle size={16} />}
                </div>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80">
                  {estatisticas.isOnline ? 'Cloud Link Ativo' : 'Offline Mode'}
                </span>
              </div>

              <p className="text-[10px] font-black uppercase opacity-70 tracking-widest">Saúde Operacional</p>
              <div className="flex items-end gap-2 mt-1">
                <h4 className="text-4xl font-black italic uppercase tracking-tighter">{estatisticas.saude}%</h4>
                <span className="text-[10px] font-bold uppercase mb-1 opacity-80">Estável</span>
              </div>

              <div className="mt-6 flex items-center gap-2 bg-black/10 p-3 rounded-2xl border border-white/10">
                <CheckCircle2 size={14} className="text-white" />
                <p className="text-[9px] font-black uppercase tracking-tighter">
                  {estatisticas.numCriticos === 0 ? 'Inventário Saudável' : 'Atenção ao Inventário'}
                </p>
              </div>
            </div>
          </div>

          {/* BOTÃO RELATÓRIOS */}
          <button onClick={() => navigate('/historico')} className="bg-blue-600 p-8 rounded-[3rem] text-white shadow-xl shadow-blue-200 group relative overflow-hidden text-left transition-all hover:bg-slate-900">
            <ListOrdered className="absolute -right-4 -bottom-4 text-white/10 group-hover:scale-125 transition-transform" size={100} />
            <div className="relative z-10">
              <h4 className="text-xl font-black italic mb-2 uppercase leading-tight text-white">Auditoria<br/>Geral</h4>
              <div className="inline-flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-xl text-[9px] font-black uppercase">Relatórios <ChevronRight size={14} /></div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;