import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  where
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Package,
  DollarSign,
  ArrowUpRight,
  ShoppingBag,
  Clock,
  Activity,
  ListOrdered,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
  Globe,
  Zap,
  Crown
} from 'lucide-react';

const Dashboard = ({ produtos = [], usuario, avisar }) => {
  const [vendas, setVendas] = useState([]);
  const [carregando, setCarregando] = useState(!!usuario?.uid);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const navigate = useNavigate();

  // Verifica se o plano é premium
  const isPremium = usuario?.plano === 'premium';

  /* ===============================
      MONITOR DE CONEXÃO
  =============================== */
  useEffect(() => {
    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  /* ===============================
      FIRESTORE – VENDAS POR UID
  =============================== */
  useEffect(() => {
    if (!usuario?.uid) return;

    const q = query(
      collection(db, 'vendas'),
      where('lojaId', '==', usuario.uid),
      orderBy('data', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const lista = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setVendas(lista);
        setCarregando(false);
      },
      (error) => {
        console.error('Erro Firestore Dashboard:', error);
        if (error.code === 'permission-denied') {
          avisar?.('ERRO DE PERMISSÃO NA NUVEM', 'erro');
        }
        setCarregando(false);
      }
    );

    return () => unsubscribe();
  }, [usuario?.uid, avisar]);

  /* ===============================
      ESTATÍSTICAS (Relatório de Performance)
  =============================== */
  const estatisticas = useMemo(() => {
    const hojeStr = new Date().toLocaleDateString();

    const totalHistorico = vendas.reduce(
      (acc, v) => acc + Number(v.total || 0),
      0
    );

    const vendasHoje = vendas.filter(v => {
      if (!v.data) return false;
      const dataVenda = v.data?.seconds 
        ? new Date(v.data.seconds * 1000) 
        : new Date(v.data);
      return dataVenda.toLocaleDateString() === hojeStr;
    });

    const totalHoje = vendasHoje.reduce(
      (acc, v) => acc + Number(v.total || 0),
      0
    );

    let lucroTotal = 0;
    vendas.forEach(v => {
      v.itens?.forEach(item => {
        const prod = produtos.find(p => p.id === item.id);
        const custo = Number(prod?.custo || 0);
        const precoVenda = Number(item.preco || 0);
        const qtd = Number(item.quantidade || item.qtd || 0);
        lucroTotal += (precoVenda - custo) * qtd;
      });
    });

    const meusProdutos = produtos.filter(
      p => p.lojaId === usuario?.uid
    );

    const produtosCriticos = meusProdutos.filter(
      p => Number(p.stock ?? 0) <= 5
    );

    let saude = 100;
    if (produtosCriticos.length > 0) saude -= produtosCriticos.length * 5;
    if (!isOnline) saude -= 30;

    return {
      totalHistorico,
      totalHoje,
      lucroTotal,
      numVendas: vendas.length,
      numCriticos: produtosCriticos.length,
      vendasHojeQtd: vendasHoje.length,
      saude: Math.max(saude, 10)
    };
  }, [vendas, produtos, isOnline, usuario?.uid]);

  if (carregando && usuario?.uid && vendas.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="text-blue-600 animate-spin" size={32} />
          <p className="text-slate-400 font-black text-[9px] uppercase tracking-[0.4em]">
            Sincronizando Performance...
          </p>
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
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-black italic uppercase leading-none tracking-tighter">
              Performance <span className="text-blue-600">Hub</span>
            </h2>
            {isPremium && <Crown size={24} className="text-amber-500" />}
          </div>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-1">
            Loja: <span className="text-slate-900">{usuario.nomeLoja || 'Unidade Local'}</span>
            <span className={`ml-3 px-3 py-1 rounded-full text-[9px] font-black ${isPremium ? 'bg-amber-100 text-amber-600 border border-amber-200' : 'bg-slate-100 text-slate-400'}`}>
              {isPremium ? 'PLATINUM ACCESS' : 'BASIC PLAN'}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border shadow-sm self-start">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-[10px] font-black uppercase tracking-widest">
            {isOnline ? 'Sistema Online' : 'Modo Offline'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card icon={<DollarSign />} title="Volume de Vendas">
          {estatisticas.totalHistorico.toLocaleString()} <small className="text-xs opacity-50 font-black">MT</small>
        </Card>
        <Card dark icon={<TrendingUp />} title="Lucro Estimado">
          {estatisticas.lucroTotal.toLocaleString()} <small className="text-xs opacity-50 font-black">MT</small>
        </Card>
        <Card icon={<ShoppingBag />} title="Hoje">
          {estatisticas.totalHoje.toLocaleString()} <small className="text-xs opacity-50 font-black">MT</small>
        </Card>
        <Card icon={<Package />} title="Stock Crítico" danger={estatisticas.numCriticos > 0}>
          {estatisticas.numCriticos} <small className="text-[10px] opacity-50 font-black">PRODUTOS</small>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[3rem] border shadow-sm overflow-hidden group">
          <div className="p-8 border-b flex justify-between items-center">
            <div className="flex gap-3 items-center">
                <Clock className="text-blue-600" size={18} />
                <h4 className="font-black uppercase text-xs tracking-widest">Registos Recentes</h4>
            </div>
            <button onClick={() => navigate('/historico')} className="text-[10px] font-black text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest">Ver Tudo</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <tbody>
                {vendas.slice(0, 5).map(v => (
                  <tr key={v.id} onClick={() => navigate('/historico')} className="cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                    <td className="p-6">
                        <p className="font-black uppercase text-[11px] text-slate-800">{v.infoAdicional || 'Venda Rápida'}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Vendedor: {v.vendedorNome || 'Admin'}</p>
                    </td>
                    <td className="p-6">
                        <span className="text-[9px] font-black uppercase bg-slate-100 px-3 py-1 rounded-lg text-slate-500">{v.metodo}</span>
                    </td>
                    <td className="p-6 text-right">
                      <p className="font-black text-slate-900 italic">{Number(v.total).toFixed(2)} MT</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {isPremium ? (
            <div className="bg-slate-900 rounded-[3rem] p-8 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                <Globe size={120} />
              </div>
              <div className="relative z-10">
                <div className="bg-blue-600 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
                  <Globe size={24} />
                </div>
                <h4 className="text-xl font-black uppercase italic leading-tight">Loja Online<br/>Activa</h4>
                <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest mt-2">Sincronização em Tempo Real</p>
                
                <div className="mt-8 space-y-4">
                  <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
                    <p className="text-[9px] font-black uppercase opacity-50">Link da Tua Loja</p>
                    <p className="text-xs font-bold truncate tracking-tight text-blue-100">venda-japro.vercel.app/loja/{usuario.nomeLoja?.toLowerCase().replace(/\s+/g, '')}</p>
                  </div>
                  <button 
                    onClick={() => navigate('/definicoes')}
                    className="w-full bg-blue-600 p-4 rounded-2xl text-[10px] font-black uppercase hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/10"
                  >
                    Configurar Minha Loja
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-[3rem] p-8 flex flex-col justify-center items-center text-center group">
              <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center shadow-xl mb-6 group-hover:rotate-12 transition-transform">
                <Zap size={32} className="text-blue-600" />
              </div>
              <h4 className="text-blue-900 font-black uppercase italic leading-tight">Upgrade para<br/>Premium</h4>
              <p className="text-blue-400 text-[10px] font-bold uppercase tracking-widest mt-4 leading-relaxed">
                Desbloqueia Gestão de Fiados, Loja Online e Relatórios Avançados.
              </p>
              <button 
                onClick={() => window.open(`https://wa.me/258878296706?text=Olá+Nairon,+estou+na+loja+${usuario.nomeLoja}+e+quero+ativar+o+Premium.`, '_blank')}
                className="mt-8 w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-95"
              >
                Ativar Agora
              </button>
            </div>
          )}

          <div className={`p-8 rounded-[3rem] text-white relative overflow-hidden transition-colors ${estatisticas.saude > 70 ? 'bg-emerald-500' : 'bg-orange-500'}`}>
             <Activity size={80} className="absolute -right-4 -bottom-4 opacity-20" />
             <p className="uppercase text-[10px] font-black tracking-widest opacity-80 mb-1">Saúde do Negócio</p>
             <h4 className="text-5xl font-black italic">
               {estatisticas.saude}%
             </h4>
          </div>
        </div>
      </div>

      <button
        onClick={() => navigate('/historico')}
        className="w-full bg-white border border-slate-100 p-8 rounded-[3rem] text-slate-900 font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-slate-50 transition-all shadow-sm"
      >
        Auditoria Completa de Vendas <ChevronRight size={18} className="text-blue-600" />
      </button>
    </div>
  );
};

const Card = ({ icon, title, children, dark, danger }) => (
  <div
    className={`p-8 rounded-[2.5rem] border shadow-sm transition-all hover:shadow-xl ${
      dark
        ? 'bg-slate-900 text-white border-slate-800 shadow-slate-200'
        : danger
        ? 'bg-red-50 border-red-200 shadow-red-100'
        : 'bg-white border-slate-100'
    }`}
  >
    <div className={`mb-4 w-10 h-10 rounded-xl flex items-center justify-center ${dark ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-900'}`}>
      {React.cloneElement(icon, { size: 20 })}
    </div>
    <p className="text-[10px] font-black uppercase tracking-widest opacity-50">
      {title}
    </p>
    <h3 className="text-3xl font-black italic mt-2 tracking-tighter">{children}</h3>
  </div>
);

export default Dashboard;