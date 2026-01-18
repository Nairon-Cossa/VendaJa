import React, { useEffect, useState, useMemo } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { 
  Clock, CheckCircle2, User, Calendar, DollarSign, Search, 
  Filter, ArrowUpRight, Loader2, CreditCard, ChevronRight,
  AlertCircle, Eye, Receipt, X, TrendingDown, CalendarDays
} from 'lucide-react';

const Fiados = ({ usuario, configLoja, avisar }) => {
  const [dividas, setDividas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [pesquisa, setPesquisa] = useState('');
  const [filtroTempo, setFiltroTempo] = useState('todos'); // todos, hoje, semana, antigo
  const [filtroValor, setFiltroValor] = useState('recente'); // recente, maior_valor
  const [processandoId, setProcessandoId] = useState(null);
  const [vendaSelecionada, setVendaSelecionada] = useState(null);

  useEffect(() => {
    buscarDividas();
  }, [usuario.lojaId]);

  const buscarDividas = async () => {
    try {
      setCarregando(true);
      const q = query(
        collection(db, "vendas"),
        where("lojaId", "==", usuario.lojaId),
        where("status", "==", "PENDENTE"),
        orderBy("timestamp", "desc")
      );

      const snap = await getDocs(q);
      const lista = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDividas(lista);
    } catch (error) {
      console.error("Erro ao buscar fiados:", error);
      avisar("ERRO AO CARREGAR DÍVIDAS", "erro");
    } finally {
      setCarregando(false);
    }
  };

  const liquidarDivida = async (vendaId) => {
    if (!window.confirm("CONFIRMAR RECEBIMENTO TOTAL DESTA DÍVIDA?")) return;
    
    setProcessandoId(vendaId);
    try {
      const vendaRef = doc(db, "vendas", vendaId);
      await updateDoc(vendaRef, {
        status: "PAGO",
        dataLiquidacao: new Date().toISOString(),
        pagoEm: serverTimestamp(),
        metodoPagamentoOriginal: "Dívida (Fiado)"
      });

      setDividas(dividas.filter(d => d.id !== vendaId));
      setVendaSelecionada(null);
      avisar("CONTA LIQUIDADA COM SUCESSO!", "sucesso");
    } catch (error) {
      avisar("FALHA AO LIQUIDAR", "erro");
    } finally {
      setProcessandoId(null);
    }
  };

  // LÓGICA DE FILTRAGEM AVANÇADA
  const dadosFiltrados = useMemo(() => {
    let resultado = dividas.filter(d => 
      d.infoAdicional?.toLowerCase().includes(pesquisa.toLowerCase()) ||
      d.clienteNome?.toLowerCase().includes(pesquisa.toLowerCase()) ||
      d.id.toLowerCase().includes(pesquisa.toLowerCase())
    );

    // Filtro por Tempo
    const agora = new Date();
    if (filtroTempo === 'hoje') {
      resultado = resultado.filter(d => {
        const data = new Date(d.timestamp?.seconds * 1000);
        return data.toDateString() === agora.toDateString();
      });
    } else if (filtroTempo === 'semana') {
      const umaSemanaAtras = new Date().setDate(agora.getDate() - 7);
      resultado = resultado.filter(d => (d.timestamp?.seconds * 1000) > umaSemanaAtras);
    } else if (filtroTempo === 'antigo') {
      const umaSemanaAtras = new Date().setDate(agora.getDate() - 7);
      resultado = resultado.filter(d => (d.timestamp?.seconds * 1000) < umaSemanaAtras);
    }

    // Ordenação por Valor
    if (filtroValor === 'maior_valor') {
      resultado.sort((a, b) => b.total - a.total);
    } else {
      resultado.sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds);
    }

    return resultado;
  }, [dividas, pesquisa, filtroTempo, filtroValor]);

  const totalEmAberto = dadosFiltrados.reduce((acc, d) => acc + Number(d.total), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER & METRICAS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter">
            Controlo de <span className="text-blue-600">Fiados</span>
          </h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-1 flex items-center gap-2">
            <Filter size={12}/> {dadosFiltrados.length} clientes pendentes
          </p>
        </div>

        <div className="bg-slate-900 p-1.5 rounded-[2.5rem] flex items-center shadow-2xl shadow-blue-200">
           <div className="bg-white px-8 py-4 rounded-[2.2rem] flex items-center gap-6">
              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center">
                <TrendingDown size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Filtrado</p>
                <p className="text-3xl font-black text-slate-900 italic tabular-nums">
                    {totalEmAberto.toFixed(2)}<small className="text-xs ml-1 opacity-40">{configLoja.moeda}</small>
                </p>
              </div>
           </div>
        </div>
      </div>

      {/* BARRA DE FERRAMENTAS: PESQUISA E FILTROS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-6 relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            className="w-full bg-white p-5 pl-16 rounded-[2rem] shadow-sm border border-slate-100 outline-none focus:ring-4 ring-blue-50 font-bold text-slate-700 transition-all"
            placeholder="Procurar cliente..."
            value={pesquisa}
            onChange={e => setPesquisa(e.target.value)}
          />
        </div>

        <div className="lg:col-span-3">
          <select 
            className="w-full bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 outline-none font-bold text-slate-600 appearance-none cursor-pointer"
            value={filtroTempo}
            onChange={e => setFiltroTempo(e.target.value)}
          >
            <option value="todos">📅 Todo o período</option>
            <option value="hoje">☀️ Dívidas de Hoje</option>
            <option value="semana">⏳ Últimos 7 dias</option>
            <option value="antigo">⚠️ Mais de uma semana</option>
          </select>
        </div>

        <div className="lg:col-span-3">
          <select 
            className="w-full bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 outline-none font-bold text-slate-600 appearance-none cursor-pointer"
            value={filtroValor}
            onChange={e => setFiltroValor(e.target.value)}
          >
            <option value="recente">🕒 Mais Recentes</option>
            <option value="maior_valor">💰 Maior Valor</option>
          </select>
        </div>
      </div>

      {/* LISTA DE DÍVIDAS */}
      {carregando ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-blue-600" size={40} />
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Carregando contas...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {dadosFiltrados.length === 0 ? (
            <div className="bg-white rounded-[3rem] p-20 text-center border-2 border-dashed border-slate-100">
              <CheckCircle2 className="mx-auto text-emerald-100 mb-4" size={80} />
              <p className="text-slate-400 font-black uppercase tracking-widest text-sm">Nenhum registo encontrado com estes filtros.</p>
            </div>
          ) : (
            dadosFiltrados.map((item) => {
              const diasDesde = Math.floor((new Date() - new Date(item.timestamp?.seconds * 1000)) / (1000 * 60 * 60 * 24));
              const isUrgente = diasDesde >= 7;

              return (
                <div key={item.id} className={`bg-white p-6 rounded-[2.5rem] border ${isUrgente ? 'border-red-100 bg-red-50/20' : 'border-slate-100'} hover:shadow-xl transition-all flex flex-col lg:flex-row items-center justify-between gap-6 group`}>
                  
                  <div className="flex items-center gap-6 flex-1 w-full">
                    <div className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center transition-all duration-500 ${isUrgente ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-600 group-hover:text-white'}`}>
                      <User size={28} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-black text-slate-900 uppercase text-lg italic tracking-tighter">
                          {item.infoAdicional || item.clienteNome || "Cliente Ocasional"}
                        </h4>
                        {isUrgente && (
                          <span className="text-[8px] font-black bg-red-600 text-white px-2 py-1 rounded-lg uppercase animate-bounce">⚠️ Dívida Antiga</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-4 text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                        <span className="flex items-center gap-1.5"><Calendar size={13}/> {new Date(item.timestamp?.seconds * 1000).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1.5 text-blue-500"><Clock size={13}/> {diasDesde} Dias em aberto</span>
                        <button onClick={() => setVendaSelecionada(item)} className="text-blue-600 underline hover:text-blue-800 transition-colors">Detalhes da Venda</button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 w-full lg:w-auto">
                    <div className="text-right flex-1 lg:flex-none">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Valor Pendente</p>
                      <p className="text-3xl font-black text-slate-900 italic leading-none tabular-nums">
                        {Number(item.total).toFixed(2)}<small className="text-xs ml-1 uppercase">{configLoja.moeda}</small>
                      </p>
                    </div>

                    <button 
                      onClick={() => liquidarDivida(item.id)}
                      disabled={processandoId === item.id}
                      className="bg-slate-900 text-white h-16 px-10 rounded-[1.8rem] font-black text-[11px] uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-3"
                    >
                      {processandoId === item.id ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                      Liquidar
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* MODAL DE DETALHES (SIMPLIFICADO E PROFISSIONAL) */}
      {vendaSelecionada && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
                <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="text-2xl font-black uppercase italic text-slate-900 leading-none">Itens da Conta</h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-2 tracking-widest">Ref: {vendaSelecionada.id.slice(-10)}</p>
                    </div>
                    <button onClick={() => setVendaSelecionada(null)} className="p-4 bg-white text-slate-400 rounded-full hover:text-red-500 transition-all shadow-sm"><X size={20}/></button>
                </div>
                
                <div className="p-8 space-y-3 max-h-[40vh] overflow-y-auto">
                    {vendaSelecionada.itens.map((it, idx) => (
                        <div key={idx} className="flex justify-between items-center p-4 border border-slate-100 rounded-2xl">
                            <div>
                                <p className="text-xs font-black text-slate-800 uppercase leading-none mb-1">{it.nome}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">{it.qtd || it.quantidade} Unidades</p>
                            </div>
                            <p className="font-black text-slate-900 text-sm">{(Number(it.preco) * (it.qtd || it.quantidade)).toFixed(2)}</p>
                        </div>
                    ))}
                </div>

                <div className="p-8 bg-slate-900 text-white rounded-t-[3rem] space-y-6">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-white/40 uppercase italic tracking-widest">Total Acumulado</span>
                        <span className="text-4xl font-black italic tracking-tighter tabular-nums">{Number(vendaSelecionada.total).toFixed(2)} <small className="text-xs not-italic">{configLoja.moeda}</small></span>
                    </div>
                    <button 
                        onClick={() => liquidarDivida(vendaSelecionada.id)}
                        className="w-full bg-emerald-500 text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-3 active:scale-95"
                    >
                        <CheckCircle2 size={20}/> Confirmar Recebimento
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Fiados;