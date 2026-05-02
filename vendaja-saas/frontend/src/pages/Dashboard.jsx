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
  ShoppingBag,
  Clock,
  ChevronRight,
  RefreshCw,
  Globe,
  Zap,
  Crown,
  BarChart3,
  Users,
  Award,
  Star
} from 'lucide-react';

const Dashboard = ({ produtos = [], usuario, avisar }) => {
  const [vendas, setVendas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const navigate = useNavigate();

  const isPremium = usuario?.plano === 'premium';

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (avisar) avisar('Conexão restabelecida. Sistema Online.', 'success');
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      if (avisar) avisar('Sem conexão à internet. Modo offline ativado.', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [avisar]);

  useEffect(() => {
    const idBusca = usuario?.empresaId || usuario?.lojaId || usuario?.uid;
    
    if (!idBusca) {
        setCarregando(false);
        return;
    }

    const q = query(
      collection(db, 'vendas'),
      where('empresaId', '==', idBusca),
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
        if (error.code === 'failed-precondition') {
          if (avisar) avisar('A criar novos índices de performance. Aguarde...', 'info');
        } else {
          if (avisar) avisar('Erro ao sincronizar os dados das vendas.', 'error');
        }
        setCarregando(false);
      }
    );

    return () => unsubscribe();
  }, [usuario?.uid, usuario?.lojaId, usuario?.empresaId, avisar]);

  /* ===============================
      LÓGICA DE PERFORMANCE AVANÇADA
  =============================== */
  const estatisticas = useMemo(() => {
    const hojeStr = new Date().toLocaleDateString();
    const totalHistorico = vendas.reduce((acc, v) => acc + Number(v.total || 0), 0);

    const vendasHoje = vendas.filter(v => {
      if (!v.data) return false;
      const dataVenda = v.data?.seconds 
        ? new Date(v.data.seconds * 1000) 
        : new Date(v.data);
      return dataVenda.toLocaleDateString() === hojeStr;
    });

    const totalHoje = vendasHoje.reduce((acc, v) => acc + Number(v.total || 0), 0);

    // ANALISE DE PRODUTOS E CLIENTES
    let lucroTotal = 0;
    const rankingProdutos = {};
    const rankingClientes = {};
    
    vendas.forEach(v => {
      // Cálculo de Clientes
      if (v.clienteNome || v.infoAdicional) {
        const cNome = v.clienteNome || v.infoAdicional;
        if (!rankingClientes[cNome]) rankingClientes[cNome] = { total: 0, compras: 0 };
        rankingClientes[cNome].total += Number(v.total || 0);
        rankingClientes[cNome].compras += 1;
      }

      // Cálculo de Produtos e Lucro
      v.itens?.forEach(item => {
        const prod = produtos.find(p => p.id === item.id);
        const custoUnitario = Number(item.custoCompra || prod?.custo || 0);
        const precoVendaUnitario = Number(item.preco || 0);
        const qtd = Number(item.quantidade || item.qtd || 0);
        
        lucroTotal += (precoVendaUnitario - custoUnitario) * qtd;

        // Top Vendidos
        const pNome = item.nome || prod?.nome || 'Produto s/ Nome';
        if (!rankingProdutos[pNome]) rankingProdutos[pNome] = { qtd: 0, valor: 0 };
        rankingProdutos[pNome].qtd += qtd;
        rankingProdutos[pNome].valor += (precoVendaUnitario * qtd);
      });
    });

    const topProdutos = Object.entries(rankingProdutos)
      .map(([nome, data]) => ({ nome, ...data }))
      .sort((a, b) => b.qtd - a.qtd)
      .slice(0, 5);

    const topClientes = Object.entries(rankingClientes)
      .map(([nome, data]) => ({ nome, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const produtosCriticos = produtos.filter(p => Number(p.stock ?? 0) <= 5);

    let saude = 100;
    if (produtosCriticos.length > 0) saude -= (produtosCriticos.length * 2);
    if (vendas.length > 0 && totalHoje === 0) saude -= 10;
    if (!isOnline) saude -= 30;

    return {
      totalHistorico,
      totalHoje,
      lucroTotal,
      numVendas: vendas.length,
      numCriticos: produtosCriticos.length,
      vendasHojeQtd: vendasHoje.length,
      saude: Math.max(saude, 5),
      margemMedia: totalHistorico > 0 ? (lucroTotal / totalHistorico) * 100 : 0,
      topProdutos,
      topClientes
    };
  }, [vendas, produtos, isOnline]);

  if (carregando) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="text-blue-600 animate-spin" size={32} />
          <p className="text-slate-400 font-black text-[9px] uppercase tracking-[0.4em]">Analizando Métrica...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-700 space-y-8 pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-black italic uppercase leading-none tracking-tighter text-slate-900">
              Performance <span className="text-blue-600">Hub</span>
            </h2>
            {isPremium && <Crown size={24} className="text-amber-500" />}
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">
              Loja: <span className="text-slate-900">{usuario?.nomeLoja || 'Unidade Local'}</span>
            </p>
            <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md text-[8px] font-black uppercase border border-blue-100">
              {usuario?.tipoNegocio || 'Geral'}
            </span>
            <span className={`px-3 py-1 rounded-full text-[9px] font-black ${isPremium ? 'bg-amber-100 text-amber-600 border border-amber-200' : 'bg-slate-100 text-slate-400'}`}>
              {isPremium ? 'PLATINUM ACCESS' : 'BASIC PLAN'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border shadow-sm self-start">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">
            {isOnline ? 'Sistema Online' : 'Modo Offline'}
          </span>
        </div>
      </div>

      {/* MÉTRICAS PRINCIPAIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card icon={<DollarSign />} title="Volume de Vendas">
          {estatisticas.totalHistorico.toLocaleString()} <small className="text-xs opacity-50 font-black">MT</small>
        </Card>
        
        <Card dark icon={<TrendingUp />} title="Lucro Líquido Real">
          {estatisticas.lucroTotal.toLocaleString()} <small className="text-xs opacity-50 font-black">MT</small>
          <p className="text-[9px] text-blue-300 font-bold mt-1 uppercase">Margem Média: {estatisticas.margemMedia.toFixed(1)}%</p>
        </Card>

        <Card icon={<ShoppingBag />} title="Receita Hoje">
          {estatisticas.totalHoje.toLocaleString()} <small className="text-xs opacity-50 font-black">MT</small>
          <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase">{estatisticas.vendasHojeQtd} Transações</p>
        </Card>

        <Card icon={<Package />} title="Stock Crítico" danger={estatisticas.numCriticos > 0}>
          {estatisticas.numCriticos} <small className="text-[10px] opacity-50 font-black">PRODUTOS</small>
          {estatisticas.numCriticos > 0 && <p className="text-[9px] text-red-500 font-bold mt-1 animate-pulse uppercase">Reposição Necessária</p>}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* VENDAS RECENTES */}
        <div className="lg:col-span-2 bg-white rounded-[3rem] border shadow-sm overflow-hidden">
          <div className="p-8 border-b flex justify-between items-center text-slate-900">
            <div className="flex gap-3 items-center">
                <Clock className="text-blue-600" size={18} />
                <h4 className="font-black uppercase text-xs tracking-widest">Registos Recentes</h4>
            </div>
            <button onClick={() => navigate('/historico')} className="text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest">Ver Tudo</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <tbody>
                {vendas.length === 0 ? (
                    <tr><td className="p-10 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">Sem registos.</td></tr>
                ) : (
                    vendas.slice(0, 5).map(v => (
                        <tr key={v.id} onClick={() => navigate('/historico')} className="cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                          <td className="p-6">
                              <p className="font-black uppercase text-[11px] text-slate-800">{v.clienteNome || v.infoAdicional || 'Venda Rápida'}</p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                                {v.metodo === 'Dívida (Fiado)' ? '🔴 DÍVIDA PENDENTE' : `Ref: ${v.id.slice(0,8)}`}
                              </p>
                          </td>
                          <td className="p-6 text-right">
                            <p className="font-black text-slate-900 italic">{Number(v.total).toFixed(2)} MT</p>
                          </td>
                        </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SAÚDE E UPGRADE */}
        <div className="flex flex-col gap-6">
          <div className={`p-8 rounded-[3rem] text-white relative overflow-hidden transition-all ${estatisticas.saude > 70 ? 'bg-emerald-500' : 'bg-orange-500'}`}>
              <BarChart3 size={80} className="absolute -right-4 -bottom-4 opacity-20" />
              <p className="uppercase text-[10px] font-black tracking-widest opacity-80 mb-1">Saúde do Negócio</p>
              <h4 className="text-5xl font-black italic mb-4">{estatisticas.saude}%</h4>
              <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                <div className="bg-white h-full transition-all duration-1000" style={{ width: `${estatisticas.saude}%` }}></div>
              </div>
          </div>

          {!isPremium && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-[3rem] p-8 flex flex-col items-center text-center">
              <Zap size={32} className="text-blue-600 mb-4" />
              <h4 className="text-blue-900 font-black uppercase italic leading-tight text-lg">Impulso Premium</h4>
              <button onClick={() => window.open(`https://wa.me/258878296706?text=Ativar+Premium`, '_blank')} className="mt-6 w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest">Ativar Agora</button>
            </div>
          )}
        </div>
      </div>

      {/* NOVAS SECCÕES: RANKINGS DE PRODUTOS E CLIENTES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* TOP PRODUTOS */}
        <div className="bg-slate-900 text-white rounded-[3rem] p-8 relative overflow-hidden">
          <Award className="absolute right-6 top-6 text-blue-500 opacity-20" size={100} />
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-blue-600 p-2 rounded-xl"><Star size={16} /></div>
            <h4 className="font-black uppercase text-xs tracking-[0.2em]">Top Vendidos (Potencial)</h4>
          </div>
          <div className="space-y-6">
            {estatisticas.topProdutos.length > 0 ? estatisticas.topProdutos.map((p, idx) => (
              <div key={idx} className="flex justify-between items-center border-b border-slate-800 pb-4 last:border-0">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-tight">{p.nome}</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase">{p.qtd} unidades movidas</p>
                </div>
                <p className="text-blue-400 font-black italic">{p.valor.toLocaleString()} MT</p>
              </div>
            )) : <p className="text-[10px] text-slate-500 uppercase font-black">Sem dados de movimentação.</p>}
          </div>
        </div>

        {/* TOP CLIENTES */}
        <div className="bg-white border rounded-[3rem] p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-slate-100 p-2 rounded-xl text-slate-900"><Users size={16} /></div>
            <h4 className="font-black uppercase text-xs tracking-[0.2em] text-slate-900">Clientes Frequentes</h4>
          </div>
          <div className="space-y-6">
            {estatisticas.topClientes.length > 0 ? estatisticas.topClientes.map((c, idx) => (
              <div key={idx} className="flex justify-between items-center border-b border-slate-50 pb-4 last:border-0">
                <div>
                  <p className="text-[11px] font-black uppercase text-slate-800">{c.nome}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">{c.compras} compras realizadas</p>
                </div>
                <p className="text-slate-900 font-black italic">{c.total.toLocaleString()} MT</p>
              </div>
            )) : <p className="text-[10px] text-slate-400 uppercase font-black">Nenhum cliente recorrente.</p>}
          </div>
        </div>

      </div>

      <button
        onClick={() => navigate('/historico')}
        className="w-full bg-white border border-slate-100 p-8 rounded-[3rem] text-slate-900 font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-slate-50 transition-all shadow-sm"
      >
        Aceder ao Livro de Auditoria <ChevronRight size={18} className="text-blue-600" />
      </button>
    </div>
  );
};

const Card = ({ icon, title, children, dark, danger }) => (
  <div className={`p-8 rounded-[2.5rem] border shadow-sm transition-all hover:shadow-xl ${dark ? 'bg-slate-900 text-white border-slate-800 shadow-slate-200' : danger ? 'bg-red-50 border-red-200 shadow-red-100' : 'bg-white border-slate-100'}`}>
    <div className={`mb-4 w-10 h-10 rounded-xl flex items-center justify-center ${dark ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-900'}`}>{React.cloneElement(icon, { size: 20 })}</div>
    <p className={`text-[10px] font-black uppercase tracking-widest ${dark ? 'opacity-60' : 'text-slate-400'}`}>{title}</p>
    <div className="text-3xl font-black italic mt-2 tracking-tighter">{children}</div>
  </div>
);

export default Dashboard;