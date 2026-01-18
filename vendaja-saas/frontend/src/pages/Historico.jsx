import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, onSnapshot, query, orderBy, doc, 
  writeBatch, where, deleteDoc 
} from 'firebase/firestore';
import { 
  Search, Calendar, Trash2, Printer, 
  FileText, Smartphone, Banknote, TrendingUp, Clock, AlertTriangle
} from 'lucide-react';
import Recibo from '../components/ReciboA4';

const Historico = ({ produtos, usuario, configLoja, avisar }) => {
  const [pesquisa, setPesquisa] = useState('');
  const [vendas, setVendas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [vendaParaReimprimir, setVendaParaReimprimir] = useState(null);

  // 1. ESCUTA EM TEMPO REAL
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
    }, (error) => {
      console.error("Erro no Histórico:", error);
      avisar("ERRO AO SINCRONIZAR VENDAS", "erro");
      setCarregando(false);
    });

    return () => unsubscribe();
  }, [usuario.lojaId, avisar]);

  // 2. ANULAR VENDA COM DEVOLUÇÃO DE STOCK
  const anularVenda = async (venda) => {
    // Segurança: Apenas admins podem anular
    if (usuario.role !== 'admin' && usuario.tipoNegocio !== 'Dono') {
      avisar("APENAS ADMINISTRADORES PODEM ANULAR VENDAS", "erro");
      return;
    }

    const confirmacao = window.confirm(`ATENÇÃO: Deseja anular a venda #${venda.id.slice(-6).toUpperCase()}? O stock será devolvido ao inventário.`);
    if (!confirmacao) return;

    const batch = writeBatch(db);

    try {
      venda.itens.forEach(item => {
        const produtoReferencia = produtos.find(p => p.id === item.id);
        if (produtoReferencia) {
          const produtoRef = doc(db, "produtos", item.id);
          batch.update(produtoRef, {
            stock: Number(produtoReferencia.stock) + Number(item.qtd)
          });
        }
      });

      const vendaRef = doc(db, "vendas", venda.id);
      batch.delete(vendaRef);

      await batch.commit();
      avisar("VENDA ANULADA E STOCK REPOSTO", "sucesso");
    } catch (error) {
      console.error("Erro na anulação:", error);
      avisar("ERRO AO PROCESSAR ANULAÇÃO", "erro");
    }
  };

  const vendasFiltradas = vendas.filter(v => 
    v.id.toLowerCase().includes(pesquisa.toLowerCase()) || 
    v.infoAdicional?.toLowerCase().includes(pesquisa.toLowerCase()) ||
    v.vendedorNome?.toLowerCase().includes(pesquisa.toLowerCase())
  );

  // CÁLCULO DE TOTAL DO DIA
  const totalHoje = vendas
    .filter(v => new Date(v.data).toDateString() === new Date().toDateString())
    .reduce((acc, curr) => acc + Number(curr.total), 0);

  if (carregando) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em]">Acedendo ao Arquivo...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8 pb-10">
      
      {/* INDICADORES RÁPIDOS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5 group hover:border-emerald-200 transition-all">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-3xl group-hover:scale-110 transition-transform">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Facturação Hoje</p>
            <p className="text-2xl font-black text-slate-900 italic tracking-tighter">
              {totalHoje.toFixed(2)} 
              <span className="text-xs not-italic text-slate-300 ml-1">{configLoja.moeda}</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-2 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center px-4 md:col-span-3">
          <div className="relative flex-1 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
            <input 
              className="w-full bg-slate-50/50 p-5 pl-16 rounded-[2rem] outline-none border-2 border-transparent focus:border-blue-500/20 focus:bg-white font-bold transition-all text-slate-700 placeholder:text-slate-300"
              placeholder="Pesquisar por ID, Cliente ou Vendedor..."
              value={pesquisa}
              onChange={e => setPesquisa(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* LISTA DE TRANSAÇÕES */}
      <div className="bg-white rounded-[3.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                <th className="p-10">Data & Vendedor</th>
                <th className="p-10">Referência</th>
                <th className="p-10">Pagamento</th>
                <th className="p-10">Montante</th>
                <th className="p-10 text-right">Acções</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {vendasFiltradas.map((venda) => (
                <tr key={venda.id} className="hover:bg-slate-50/80 transition-all group">
                  <td className="p-10">
                    <div className="flex items-center gap-4">
                      <div className="hidden sm:flex p-3 bg-slate-50 text-slate-400 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                        <Clock size={18} />
                      </div>
                      <div>
                        <p className="font-black text-slate-800 text-sm">
                          {new Date(venda.data).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long' })}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                          {new Date(venda.data).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • <span className="text-blue-500">{venda.vendedorNome}</span>
                        </p>
                      </div>
                    </div>
                  </td>
                  
                  <td className="p-10">
                    <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-black text-slate-300 tracking-[0.2em] uppercase">Ref: {venda.id.slice(-8).toUpperCase()}</span>
                        <span className="text-[10px] font-black text-slate-600 uppercase italic bg-slate-100/50 self-start px-3 py-1 rounded-lg border border-slate-100">
                          {venda.infoAdicional || 'Venda Directa'}
                        </span>
                    </div>
                  </td>

                  <td className="p-10">
                    <div className="flex items-center gap-2.5">
                        <div className={`w-2 h-2 rounded-full animate-pulse ${venda.metodo === 'Dinheiro' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                          {venda.metodo}
                        </span>
                    </div>
                  </td>

                  <td className="p-10">
                    <span className="text-2xl font-black text-slate-900 italic tracking-tighter">
                      {Number(venda.total).toFixed(2)}
                      <span className="text-[10px] ml-1.5 not-italic text-slate-300 font-bold">{configLoja.moeda}</span>
                    </span>
                  </td>

                  <td className="p-10 text-right">
                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                        <button 
                          onClick={() => setVendaParaReimprimir(venda)}
                          className="p-4 bg-white text-slate-400 hover:text-blue-600 hover:shadow-xl hover:shadow-blue-100 rounded-2xl border border-slate-100 transition-all active:scale-90"
                          title="Reimprimir Recibo"
                        >
                          <Printer size={20} />
                        </button>
                        <button 
                          onClick={() => anularVenda(venda)}
                          className="p-4 bg-white text-slate-400 hover:text-red-600 hover:shadow-xl hover:shadow-red-100 rounded-2xl border border-slate-100 transition-all active:scale-90"
                          title="Anular Transação"
                        >
                          <Trash2 size={20} />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {vendasFiltradas.length === 0 && (
            <div className="p-32 text-center flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <FileText size={40} className="text-slate-200" />
              </div>
              <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] italic">Nenhuma transação encontrada</p>
            </div>
          )}
        </div>
      </div>

      {vendaParaReimprimir && (
        <Recibo 
          venda={vendaParaReimprimir} 
          configLoja={configLoja}
          nomeSistema="VENDA JÁ PRO"
          fechar={() => setVendaParaReimprimir(null)} 
        />
      )}
    </div>
  );
};

export default Historico;