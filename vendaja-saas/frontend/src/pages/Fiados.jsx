import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { 
  Clock, CheckCircle2, User, Calendar, DollarSign, Search, 
  Filter, ArrowUpRight, Loader2, CreditCard, ChevronRight,
  AlertCircle, Eye, Receipt, X
} from 'lucide-react';

const Fiados = ({ usuario, configLoja, avisar }) => {
  const [dividas, setDividas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [pesquisa, setPesquisa] = useState('');
  const [processandoId, setProcessandoId] = useState(null);
  const [vendaSelecionada, setVendaSelecionada] = useState(null); // Para ver detalhes

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
        pagoEm: serverTimestamp()
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

  const totalEmAberto = dividas.reduce((acc, d) => acc + Number(d.total), 0);

  const dadosFiltrados = dividas.filter(d => 
    d.infoAdicional?.toLowerCase().includes(pesquisa.toLowerCase()) ||
    d.clienteNome?.toLowerCase().includes(pesquisa.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER & METRICAS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter">
            Controlo de <span className="text-blue-600">Fiados</span>
          </h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Gestão de Créditos e Cobranças</p>
        </div>

        <div className="bg-slate-900 p-1 rounded-[2.5rem] flex items-center shadow-2xl shadow-blue-200">
           <div className="bg-white px-8 py-5 rounded-[2.2rem] flex items-center gap-6">
              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center animate-pulse">
                <AlertCircle size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total em Dívida</p>
                <p className="text-3xl font-black text-slate-900 italic">
                    {totalEmAberto.toFixed(2)}<small className="text-xs ml-1 opacity-40">{configLoja.moeda}</small>
                </p>
              </div>
           </div>
        </div>
      </div>

      {/* BARRA DE PESQUISA ESTILIZADA */}
      <div className="relative group">
        <div className="absolute inset-0 bg-blue-400/20 blur-xl opacity-0 group-focus-within:opacity-100 transition-all rounded-[2rem]"></div>
        <div className="relative bg-white p-2 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-2">
            <div className="pl-6 text-slate-400">
                <Search size={22} />
            </div>
            <input 
                className="flex-1 bg-transparent p-4 outline-none font-bold text-lg text-slate-700 placeholder:text-slate-300"
                placeholder="Procurar por nome do cliente ou referência..."
                value={pesquisa}
                onChange={e => setPesquisa(e.target.value)}
            />
            <div className="pr-4">
                <span className="text-[10px] font-black bg-slate-100 px-4 py-2 rounded-xl text-slate-400 uppercase">
                    {dadosFiltrados.length} Registos
                </span>
            </div>
        </div>
      </div>

      {/* LISTA DE CARDS */}
      {carregando ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-blue-600" size={40} />
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Sincronizando contas...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
          {dadosFiltrados.length === 0 ? (
            <div className="bg-white rounded-[3rem] p-20 text-center border-2 border-dashed border-slate-100">
              <CheckCircle2 className="mx-auto text-emerald-100 mb-4" size={80} />
              <p className="text-slate-400 font-black uppercase tracking-widest text-sm">Parabéns! Nenhuma dívida pendente.</p>
            </div>
          ) : (
            dadosFiltrados.map((item) => (
              <div key={item.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 hover:shadow-xl hover:shadow-blue-900/5 transition-all flex flex-col lg:flex-row items-center justify-between gap-6 group relative overflow-hidden">
                
                <div className="flex items-center gap-6 flex-1 w-full">
                  <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-[1.8rem] flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-inner">
                    <User size={28} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-black text-slate-900 uppercase text-lg italic">
                            {item.infoAdicional || item.clienteNome || "Cliente Ocasional"}
                        </h4>
                        <span className="text-[9px] font-black bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md uppercase">Pendente</span>
                    </div>
                    <div className="flex flex-wrap gap-4">
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase">
                        <Calendar size={14} className="text-blue-500"/> {new Date(item.timestamp?.seconds * 1000).toLocaleDateString()}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase">
                        <Receipt size={14} className="text-blue-500"/> {item.itens?.length || 0} Produtos
                      </span>
                      <button 
                        onClick={() => setVendaSelecionada(item)}
                        className="text-[10px] font-black text-blue-600 underline uppercase hover:text-blue-800"
                      >
                        Ver Detalhes
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 w-full lg:w-auto bg-slate-50 lg:bg-transparent p-4 lg:p-0 rounded-2xl">
                  <div className="text-center lg:text-right flex-1 lg:flex-none">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Valor em Falta</p>
                    <p className="text-3xl font-black text-red-500 italic leading-none">
                        {Number(item.total).toFixed(2)}<small className="text-xs ml-1 uppercase">{configLoja.moeda}</small>
                    </p>
                  </div>

                  <button 
                    onClick={() => liquidarDivida(item.id)}
                    disabled={processandoId === item.id}
                    className="bg-slate-900 text-white h-16 px-10 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-3"
                  >
                    {processandoId === item.id ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <><CheckCircle2 size={18} /> Liquidar</>
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* MODAL DE DETALHES DA DÍVIDA */}
      {vendaSelecionada && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
                <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                    <div>
                        <h3 className="text-2xl font-black uppercase italic text-slate-900">Detalhes da Conta</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registado em {new Date(vendaSelecionada.timestamp?.seconds * 1000).toLocaleString()}</p>
                    </div>
                    <button onClick={() => setVendaSelecionada(null)} className="p-3 bg-slate-100 text-slate-400 rounded-full hover:text-slate-900 transition-all"><X/></button>
                </div>
                
                <div className="p-8 space-y-4 max-h-[50vh] overflow-y-auto font-medium">
                    {vendaSelecionada.itens.map((it, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
                            <div>
                                <p className="text-sm font-black text-slate-800 uppercase">{it.nome}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">{it.quantidade}x {Number(it.precoUnitario).toFixed(2)} {configLoja.moeda}</p>
                            </div>
                            <p className="font-black text-slate-900">{(it.quantidade * it.precoUnitario).toFixed(2)}</p>
                        </div>
                    ))}
                </div>

                <div className="p-8 bg-slate-50 space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-slate-400 uppercase">Subtotal</span>
                        <span className="font-bold text-slate-600">{Number(vendaSelecionada.total).toFixed(2)} {configLoja.moeda}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-200 pt-4">
                        <span className="text-lg font-black text-slate-900 uppercase italic">Total a Pagar</span>
                        <span className="text-3xl font-black text-red-500 italic">{Number(vendaSelecionada.total).toFixed(2)} {configLoja.moeda}</span>
                    </div>
                    <button 
                        onClick={() => liquidarDivida(vendaSelecionada.id)}
                        className="w-full bg-emerald-500 text-white py-6 rounded-[2rem] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-100 mt-4 flex items-center justify-center gap-3"
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