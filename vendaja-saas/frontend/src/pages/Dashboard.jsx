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
  CheckCircle2
} from 'lucide-react';

const Dashboard = ({ produtos = [], usuario, avisar }) => {
  const [vendas, setVendas] = useState([]);
  const [carregando, setCarregando] = useState(!!usuario?.uid);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const navigate = useNavigate();

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
     ESTATÍSTICAS
  =============================== */
  const estatisticas = useMemo(() => {
    const hoje = new Date().toLocaleDateString();

    const totalHistorico = vendas.reduce(
      (acc, v) => acc + Number(v.total || 0),
      0
    );

    const vendasHoje = vendas.filter(v => {
      if (!v.data) return false;
      const d =
        typeof v.data.toDate === 'function'
          ? v.data.toDate()
          : new Date(v.data);
      return d.toLocaleDateString() === hoje;
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
        const preco = Number(item.preco || 0);
        const qtd = Number(item.qtd || 0);
        lucroTotal += (preco - custo) * qtd;
      });
    });

    // 🔥 PRODUTOS APENAS DA LOJA LOGADA
    const meusProdutos = produtos.filter(
      p => p.lojaId === usuario?.uid
    );

    const produtosCriticos = meusProdutos.filter(
      p => Number(p.stock ?? 0) <= 15
    );

    let saude = 100;
    if (produtosCriticos.length > 0) saude -= produtosCriticos.length * 2;
    if (!isOnline) saude -= 50;

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

  /* ===============================
     LOADERS / GUARDS
  =============================== */
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

  /* ===============================
     UI
  =============================== */
  return (
    <div className="animate-in fade-in duration-700 space-y-8 pb-10">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black italic uppercase">
            Performance Hub
          </h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">
            Unidade:{' '}
            <span className="text-blue-600">
              {usuario.nomeLoja || 'Gestão Local'}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border">
          <div
            className={`w-2 h-2 rounded-full ${
              isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
            }`}
          />
          <span className="text-[10px] font-black uppercase tracking-widest">
            {isOnline ? 'Cloud Sync Ativo' : 'Modo Offline'}
          </span>
        </div>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card icon={<DollarSign />} title="Faturação Total">
          {estatisticas.totalHistorico.toLocaleString()} MT
        </Card>

        <Card dark icon={<TrendingUp />} title="Lucro Estimado">
          {estatisticas.lucroTotal.toLocaleString()} MT
        </Card>

        <Card icon={<ShoppingBag />} title="Vendas Hoje">
          {estatisticas.totalHoje.toLocaleString()} MT
        </Card>

        <Card
          icon={<Package />}
          title="Stock Crítico"
          danger={estatisticas.numCriticos > 0}
        >
          {estatisticas.numCriticos}
        </Card>
      </div>

      {/* TABELA */}
      <div className="bg-white rounded-[3rem] border overflow-hidden">
        <div className="p-8 border-b flex gap-3 items-center">
          <Clock size={16} />
          <h4 className="font-black uppercase text-xs tracking-widest">
            Fluxo Recente
          </h4>
        </div>

        <table className="w-full">
          <tbody>
            {vendas.slice(0, 6).map(v => (
              <tr
                key={v.id}
                onClick={() => navigate('/historico')}
                className="cursor-pointer hover:bg-slate-50"
              >
                <td className="p-6 font-black uppercase text-xs">
                  {v.vendedorNome || 'Admin'}
                </td>
                <td className="p-6 text-xs uppercase">{v.metodo}</td>
                <td className="p-6 text-right font-black">
                  {Number(v.total).toFixed(2)} MT
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* SAÚDE */}
      <div className="bg-emerald-500 p-8 rounded-[3rem] text-white">
        <Activity size={60} className="opacity-20" />
        <h4 className="text-5xl font-black italic">
          {estatisticas.saude}%
        </h4>
        <p className="uppercase text-xs font-black">
          Saúde Operacional
        </p>
        <div className="mt-4 flex items-center gap-2 text-xs">
          <CheckCircle2 size={14} />
          {estatisticas.numCriticos === 0
            ? 'Sistema Equilibrado'
            : 'Ajustar Inventário'}
        </div>
      </div>

      <button
        onClick={() => navigate('/historico')}
        className="w-full bg-blue-600 p-8 rounded-[3rem] text-white font-black uppercase"
      >
        Auditoria Completa <ChevronRight size={16} />
      </button>
    </div>
  );
};

/* ===============================
   CARD COMPONENT
=============================== */
const Card = ({ icon, title, children, dark, danger }) => (
  <div
    className={`p-8 rounded-[2.5rem] border shadow-sm ${
      dark
        ? 'bg-slate-900 text-white'
        : danger
        ? 'bg-red-50 border-red-200'
        : 'bg-white'
    }`}
  >
    <div className="mb-4">{icon}</div>
    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">
      {title}
    </p>
    <h3 className="text-3xl font-black italic mt-2">{children}</h3>
  </div>
);

export default Dashboard;
