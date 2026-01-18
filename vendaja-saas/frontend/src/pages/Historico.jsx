import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { 
  collection, onSnapshot, query, orderBy, doc, 
  writeBatch, where 
} from 'firebase/firestore';
import { 
  Search, Calendar, Trash2, Printer, 
  FileText, TrendingUp, Clock, 
  Download, Filter, ArrowRight, Package, BarChart3, ChevronDown
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
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

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
      setVendas(listaVendas);
      setCarregando(false);
    });
    return () => unsubscribe();
  }, [usuario.lojaId]);

  /* ===============================
      LÓGICA DE FILTRAGEM POR DATA
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
        lucro += (Number(item.preco) - Number(prod?.custo || 0)) * Number(item.qtd);
      });
    });
    return { total, lucro };
  }, [vendasFiltradas, produtos]);

  /* ===============================
      EXPORTAÇÃO PARA EXCEL (CSV)
  =============================== */
  const exportarExcel = (tipo = 'vendas') => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (tipo === 'vendas') {
      csvContent += "Data,ID,Cliente/Info,Metodo,Total,LucroEstimado\n";
      vendasFiltradas.forEach(v => {
        let lucroVenda = 0;
        v.itens?.forEach(i => {
          const p = produtos.find(pr => pr.id === i.id);
          lucroVenda += (Number(i.preco) - Number(p?.custo || 0)) * Number(i.qtd);
        });
        csvContent += `${new Date(v.data).toLocaleDateString()},${v.id.slice(-6)},${v.infoAdicional || 'N/A'},${v.metodo},${v.total},${lucroVenda}\n`;
      });
    } else {
      csvContent += "Produto,Stock,CustoUnitario,PrecoVenda,ValorTotalStock\n";
      produtos.forEach(p => {
        csvContent += `${p.nome},${p.stock},${p.custo},${p.preco},${Number(p.stock) * Number(p.custo)}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Relatorio_${tipo}_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    avisar("RELATÓRIO GERADO COM SUCESSO", "sucesso");
  };

  return (
    <div className="animate-fade-in space-y-6 pb-20">
      
      {/* HEADER DINÂMICO */}
      <div className="flex flex-col lg:flex-row justify-between gap-6 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-3xl font-black uppercase italic tracking-tighter">Central de <span className="text-blue-600">Relatórios</span></h2>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-[10px] bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-black uppercase">
              {vendasFiltradas.length} Transações Filtradas
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button onClick={() => exportarExcel('vendas')} className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">
            <Download size={16} /> Exportar Vendas (Excel)
          </button>
          <button onClick={() => exportarExcel('stock')} className="flex items-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase hover:bg-black transition-all">
            <Package size={16} /> Relatório de Stock
          </button>
        </div>
      </div>

      {/* PAINEL DE FILTROS AVANÇADOS */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase ml-2 text-slate-400">Data Início</label>
            <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="w-full bg-slate-50 p-4 rounded-2xl border-none font-bold text-slate-700" />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase ml-2 text-slate-400">Data Fim</label>
            <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="w-full bg-slate-50 p-4 rounded-2xl border-none font-bold text-slate-700" />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase ml-2 text-slate-400">Método</label>
            <select value={filtroMetodo} onChange={e => setFiltroMetodo(e.target.value)} className="w-full bg-slate-50 p-4 rounded-2xl border-none font-bold text-slate-700 appearance-none">
              <option value="Todos">Todos os Métodos</option>
              <option value="Dinheiro">Dinheiro</option>
              <option value="M-Pesa">M-Pesa</option>
              <option value="Dívida (Fiado)">Dívida (Fiado)</option>
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={() => {setDataInicio(''); setDataFim(''); setFiltroMetodo('Todos')}} className="w-full p-4 text-[10px] font-black uppercase text-slate-400 hover:text-red-500 transition-colors">Limpar Filtros</button>
          </div>
        </div>
      </div>

      {/* DASHBOARD DE RESULTADOS DO FILTRO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[3rem] text-white shadow-xl shadow-blue-100 relative overflow-hidden">
          <TrendingUp className="absolute right-[-10px] bottom-[-10px] size-40 opacity-10" />
          <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">Faturação no Período</p>
          <h3 className="text-4xl font-black italic">{metricas.total.toLocaleString()} <small className="text-sm not-italic opacity-60">MT</small></h3>
        </div>
        <div className="bg-emerald-500 p-8 rounded-[3rem] text-white shadow-xl shadow-emerald-100 relative overflow-hidden">
          <BarChart3 className="absolute right-[-10px] bottom-[-10px] size-40 opacity-10" />
          <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">Lucro Real no Período</p>
          <h3 className="text-4xl font-black italic">{metricas.lucro.toLocaleString()} <small className="text-sm not-italic opacity-60">MT</small></h3>
        </div>
      </div>

      {/* TABELA DE VENDAS (SIMPLIFICADA PARA RELATÓRIO) */}
      <div className="bg-white rounded-[3.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
              <th className="p-8">Data</th>
              <th className="p-8">Descrição/Cliente</th>
              <th className="p-8">Método</th>
              <th className="p-8 text-right">Valor</th>
              <th className="p-8 text-right">Acções</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {vendasFiltradas.map(v => (
              <tr key={v.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="p-8 font-bold text-slate-600 text-sm">{new Date(v.data).toLocaleDateString()}</td>
                <td className="p-8">
                  <p className="font-black text-slate-800 uppercase text-xs">{v.infoAdicional || 'Venda Rápida'}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">ID: {v.id.slice(-6)}</p>
                </td>
                <td className="p-8">
                  <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-lg ${v.metodo === 'Dívida (Fiado)' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>{v.metodo}</span>
                </td>
                <td className="p-8 text-right font-black text-slate-900 italic text-lg">{Number(v.total).toFixed(2)}</td>
                <td className="p-8 text-right">
                  <button onClick={() => setVendaParaReimprimir(v)} className="p-3 bg-white text-slate-400 hover:text-blue-600 rounded-xl border border-slate-100 transition-all opacity-0 group-hover:opacity-100">
                    <Printer size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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