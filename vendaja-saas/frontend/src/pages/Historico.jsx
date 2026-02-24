import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { 
  collection, onSnapshot, query, orderBy, 
  where 
} from 'firebase/firestore';
import { 
  Search, Printer, TrendingUp, Clock, 
  Download, Package, BarChart3, ChevronDown
} from 'lucide-react';
import Recibo from '../components/ReciboA4';

const Historico = ({ produtos, usuario, configLoja, avisar }) => {
  const [pesquisa, setPesquisa] = useState('');
  const [vendas, setVendas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [vendaParaReimprimir, setVendaParaReimprimir] = useState(null);
  
  // Estados para Filtros Avançados
  const [filtroMetodo, setFiltroMetodo] = useState('Todos');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  // ID da empresa para garantir isolamento de dados
  const empresaId = usuario?.empresaId || usuario?.uid;

  useEffect(() => {
    if (!empresaId) return;

    // Filtramos por empresaId para garantir que o histórico seja consistente com a conta mestre
    const q = query(
      collection(db, "vendas"), 
      where("empresaId", "==", empresaId),
      orderBy("data", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const listaVendas = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setVendas(listaVendas);
      setCarregando(false);
    }, (error) => {
      console.error("Erro no Snapshot:", error);
      setCarregando(false);
    });

    return () => unsubscribe();
  }, [empresaId]);

  /* ===============================
      LÓGICA DE FILTRAGEM
  =============================== */
  const vendasFiltradas = useMemo(() => {
    return vendas.filter(v => {
      const dataVenda = new Date(v.data);
      const inicio = dataInicio ? new Date(dataInicio) : null;
      const fim = dataFim ? new Date(dataFim) : null;
      if (fim) fim.setHours(23, 59, 59);

      const matchesSearch = v.id.toLowerCase().includes(pesquisa.toLowerCase()) || 
                           v.infoAdicional?.toLowerCase().includes(pesquisa.toLowerCase());
      const matchesMetodo = filtroMetodo === 'Todos' || v.metodo === filtroMetodo;
      const matchesData = (!inicio || dataVenda >= inicio) && (!fim || dataVenda <= fim);

      return matchesSearch && matchesMetodo && matchesData;
    });
  }, [vendas, pesquisa, filtroMetodo, dataInicio, dataFim]);

  const metricas = useMemo(() => {
    let total = 0;
    let lucro = 0;
    vendasFiltradas.forEach(v => {
      total += Number(v.total);
      v.itens?.forEach(item => {
        const prod = produtos.find(p => p.id === item.id);
        // Se não encontrar o custo original, assume-se lucro baseado no preço total
        const custoUnitario = Number(prod?.custo || 0);
        lucro += (Number(item.preco) - custoUnitario) * Number(item.qtd);
      });
    });
    return { total, lucro };
  }, [vendasFiltradas, produtos]);

  /* ===============================
      EXPORTAÇÃO
  =============================== */
  const exportarExcel = (tipo = 'vendas') => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (tipo === 'vendas') {
      csvContent += "Data,ID,Cliente/Info,Metodo,Total,Moeda\n";
      vendasFiltradas.forEach(v => {
        csvContent += `${new Date(v.data).toLocaleDateString()},${v.id.slice(-6).toUpperCase()},${v.infoAdicional || 'Venda Rapida'},${v.metodo},${v.total},${configLoja?.moeda || 'MT'}\n`;
      });
    } else {
      csvContent += "Produto,Stock Atual,Custo,Preco,Valor em Stock\n";
      produtos.forEach(p => {
        csvContent += `${p.nome},${p.stock},${p.custo},${p.preco},${Number(p.stock) * Number(p.custo)}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Relatorio_${tipo}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    avisar?.("RELATÓRIO GERADO COM SUCESSO", "sucesso");
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6 pb-20">
      
      {/* HEADER DINÂMICO */}
      <div className="flex flex-col lg:flex-row justify-between gap-6 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-3xl font-black uppercase italic tracking-tighter italic">Central de <span className="text-blue-600">Relatórios</span></h2>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-[10px] bg-blue-50 text-blue-600 px-4 py-1.5 rounded-xl font-black uppercase tracking-widest border border-blue-100">
              {vendasFiltradas.length} Transações Encontradas
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button onClick={() => exportarExcel('vendas')} className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100/50">
            <Download size={16} /> Vendas (CSV)
          </button>
          <button onClick={() => exportarExcel('stock')} className="flex items-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase hover:bg-black transition-all shadow-lg shadow-slate-200">
            <Package size={16} /> Stock Total
          </button>
        </div>
      </div>

      {/* FILTROS E PESQUISA */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-2 relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
          <input 
            className="w-full bg-white p-5 pl-14 rounded-3xl border-2 border-slate-50 outline-none focus:border-blue-500 font-bold text-sm text-slate-700 transition-all shadow-sm"
            placeholder="PESQUISAR POR CLIENTE OU ID DA VENDA..."
            value={pesquisa}
            onChange={e => setPesquisa(e.target.value)}
          />
        </div>
        
        <div className="bg-white rounded-3xl border-2 border-slate-50 p-2 flex gap-2 shadow-sm">
           <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="flex-1 bg-slate-50/50 p-3 rounded-2xl border-none font-bold text-[11px] text-slate-600 outline-none" />
           <div className="flex items-center text-slate-300 font-black px-1">/</div>
           <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="flex-1 bg-slate-50/50 p-3 rounded-2xl border-none font-bold text-[11px] text-slate-600 outline-none" />
        </div>

        <select 
          value={filtroMetodo} 
          onChange={e => setFiltroMetodo(e.target.value)} 
          className="bg-white px-6 py-5 rounded-3xl border-2 border-slate-50 font-black text-[10px] uppercase text-slate-500 outline-none cursor-pointer hover:border-slate-200 transition-all shadow-sm"
        >
          <option value="Todos">Todos os Métodos</option>
          <option value="Dinheiro">Dinheiro</option>
          <option value="M-Pesa">M-Pesa</option>
          <option value="Emola">Emola</option>
          <option value="POS / Cartão">POS / Cartão</option>
          <option value="Dívida (Fiado)">Dívida (Fiado)</option>
        </select>
      </div>

      {/* DASHBOARD DE RESULTADOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl shadow-slate-200 relative overflow-hidden group">
          <TrendingUp className="absolute right-[-20px] bottom-[-20px] size-48 opacity-10 group-hover:scale-110 transition-transform duration-700" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2">Volume de Negócios</p>
          <h3 className="text-5xl font-black italic tabular-nums tracking-tighter">
            {metricas.total.toLocaleString()} <span className="text-sm not-italic font-bold text-blue-400">{configLoja?.moeda || 'MT'}</span>
          </h3>
        </div>

        <div className="bg-blue-600 p-8 rounded-[3rem] text-white shadow-2xl shadow-blue-100 relative overflow-hidden group">
          <BarChart3 className="absolute right-[-20px] bottom-[-20px] size-48 opacity-10 group-hover:scale-110 transition-transform duration-700" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2">Lucro Bruto Estimado</p>
          <h3 className="text-5xl font-black italic tabular-nums tracking-tighter">
            {metricas.lucro.toLocaleString()} <span className="text-sm not-italic font-bold text-blue-200">{configLoja?.moeda || 'MT'}</span>
          </h3>
        </div>
      </div>

      {/* TABELA DE VENDAS */}
      <div className="bg-white rounded-[3.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 italic">
                <th className="p-8">Data de Registo</th>
                <th className="p-8">Detalhes da Transação</th>
                <th className="p-8">Pagamento</th>
                <th className="p-8 text-right">Valor Total</th>
                <th className="p-8 text-right">Acções</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {carregando ? (
                <tr><td colSpan="5" className="p-20 text-center"><div className="animate-spin inline-block size-8 border-4 border-blue-600 border-t-transparent rounded-full"></div></td></tr>
              ) : vendasFiltradas.length === 0 ? (
                <tr><td colSpan="5" className="p-20 text-center text-slate-400 font-black uppercase text-xs tracking-widest">Nenhuma venda encontrada no período</td></tr>
              ) : vendasFiltradas.map(v => (
                <tr key={v.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="p-8">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-slate-100 rounded-2xl text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                        <Clock size={16} />
                      </div>
                      <span className="font-bold text-slate-700 text-sm">{new Date(v.data).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="p-8">
                    <p className="font-black text-slate-900 uppercase text-xs tracking-tight">{v.infoAdicional || 'Venda sem Identificação'}</p>
                    <p className="text-[9px] text-slate-400 font-black uppercase mt-0.5">Ref: #FT-{v.id.slice(-6).toUpperCase()}</p>
                  </td>
                  <td className="p-8">
                    <span className={`text-[9px] font-black uppercase px-4 py-2 rounded-xl border-2 ${
                      v.metodo === 'Dívida (Fiado)' 
                      ? 'bg-rose-50 border-rose-100 text-rose-600' 
                      : 'bg-white border-slate-100 text-slate-500'
                    }`}>
                      {v.metodo}
                    </span>
                  </td>
                  <td className="p-8 text-right font-black text-slate-900 italic text-xl tabular-nums">
                    {Number(v.total).toFixed(2)}
                  </td>
                  <td className="p-8 text-right">
                    <button 
                      onClick={() => setVendaParaReimprimir(v)} 
                      className="p-4 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-white rounded-2xl border border-transparent hover:border-blue-100 transition-all shadow-sm active:scale-95"
                      title="Reimprimir Recibo"
                    >
                      <Printer size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {vendaParaReimprimir && (
        <Recibo 
          venda={vendaParaReimprimir} 
          configLoja={configLoja} 
          fechar={() => setVendaParaReimprimir(null)} 
        />
      )}
    </div>
  );
};

export default Historico;