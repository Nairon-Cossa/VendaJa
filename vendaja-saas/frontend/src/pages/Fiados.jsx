import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { 
  Clock, CheckCircle2, User, Calendar, DollarSign, Search, 
  Filter, ArrowUpRight, Loader2, CreditCard, ChevronRight
} from 'lucide-react';

const Fiados = ({ usuario, configLoja, avisar }) => {
  const [dividas, setDividas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [pesquisa, setPesquisa] = useState('');
  const [processandoId, setProcessandoId] = useState(null);

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
    if (!window.confirm("CONFIRMAR RECEBIMENTO DESTA DÍVIDA?")) return;
    
    setProcessandoId(vendaId);
    try {
      const vendaRef = doc(db, "vendas", vendaId);
      await updateDoc(vendaRef, {
        status: "PAGO",
        dataLiquidacao: new Date().toISOString(),
        pagoEm: serverTimestamp()
      });

      setDividas(dividas.filter(d => d.id !== vendaId));
      avisar("CONTA LIQUIDADA COM SUCESSO!", "sucesso");
    } catch (error) {
      avisar("FALHA AO LIQUIDAR", "erro");
    } finally {
      setProcessandoId(null);
    }
  };

  const totalEmAberto = dividas.reduce((acc, d) => acc + Number(d.total), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER & METRICAS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">
            Controlo de <span className="text-blue-600">Fiados</span>
          </h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Gestão de Contas Correntes e Dívidas</p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 flex items-center gap-6 min-w-[300px]">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
            <Clock size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total a Receber</p>
            <p className="text-3xl font-black text-slate-900 italic">
                {totalEmAberto.toFixed(2)}<small className="text-xs ml-1 opacity-40">{configLoja.moeda}</small>
            </p>
          </div>
        </div>
      </div>

      {/* FILTROS */}
      <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            className="w-full bg-slate-50 p-4 pl-12 rounded-xl outline-none border-2 border-transparent focus:border-blue-500 font-bold text-sm transition-all"
            placeholder="Pesquisar por cliente, mesa ou viatura..."
            value={pesquisa}
            onChange={e => setPesquisa(e.target.value)}
          />
        </div>
        <button className="p-4 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-all">
          <Filter size={20} />
        </button>
      </div>

      {/* LISTA DE DÍVIDAS */}
      {carregando ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-blue-600" size={40} />
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Acedendo aos registos...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {dividas.filter(d => 
            d.infoAdicional?.toLowerCase().includes(pesquisa.toLowerCase())
          ).length === 0 ? (
            <div className="bg-white rounded-[3rem] p-20 text-center border-2 border-dashed border-slate-100">
              <CheckCircle2 className="mx-auto text-slate-200 mb-4" size={60} />
              <p className="text-slate-400 font-black uppercase tracking-widest">Nenhuma conta em aberto encontrada</p>
            </div>
          ) : (
            dividas.filter(d => 
              d.infoAdicional?.toLowerCase().includes(pesquisa.toLowerCase())
            ).map((item) => (
              <div key={item.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 hover:border-blue-200 transition-all flex flex-col lg:flex-row items-center justify-between gap-6 group">
                
                <div className="flex items-center gap-6 flex-1 w-full">
                  <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-[1.5rem] flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <User size={28} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 uppercase text-lg leading-none mb-2">
                        {item.infoAdicional || "Cliente Não Identificado"}
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-3 py-1 rounded-lg flex items-center gap-1 uppercase">
                        <Calendar size={12}/> {new Date(item.data).toLocaleDateString()}
                      </span>
                      <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-lg flex items-center gap-1 uppercase">
                        {item.itens.length} Itens
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8 w-full lg:w-auto border-t lg:border-t-0 pt-4 lg:pt-0">
                  <div className="text-center lg:text-right flex-1 lg:flex-none">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Dívida Total</p>
                    <p className="text-2xl font-black text-red-500 italic">
                        {Number(item.total).toFixed(2)}<small className="text-xs ml-1">{configLoja.moeda}</small>
                    </p>
                  </div>

                  <button 
                    onClick={() => liquidarDivida(item.id)}
                    disabled={processandoId === item.id}
                    className="bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-emerald-600 hover:scale-105 transition-all shadow-lg shadow-emerald-100 flex items-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    {processandoId === item.id ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <><CheckCircle2 size={16} /> Liquidar</>
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Fiados;