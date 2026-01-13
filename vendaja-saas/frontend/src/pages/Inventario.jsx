import React, { useState } from 'react';
import { db } from '../firebase';
import { 
  collection, addDoc, updateDoc, doc, 
  deleteDoc, serverTimestamp 
} from "firebase/firestore";
import { 
  Plus, Search, Edit3, Trash2, AlertTriangle, 
  Package, Filter, X, Loader2, TrendingUp, DollarSign, Hash
} from 'lucide-react';

const Inventario = ({ usuario, produtos }) => {
  const [pesquisa, setPesquisa] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState(null);
  const [carregando, setCarregando] = useState(false);

  const [novoProd, setNovoProd] = useState({
    nome: '', referencia: '', preco: '', custo: '', stock: '', categoria: 'Geral'
  });

  const salvarProduto = async (e) => {
    e.preventDefault();
    if (!usuario?.lojaId) return alert("Sessão expirada.");
    
    setCarregando(true);

    try {
      const dadosLimpos = {
        nome: novoProd.nome.toUpperCase().trim(),
        referencia: novoProd.referencia.toUpperCase().trim(), // Novo campo
        preco: Number(novoProd.preco),
        custo: Number(novoProd.custo),
        stock: Number(novoProd.stock),
        categoria: novoProd.categoria,
        lojaId: usuario.lojaId,
        atualizadoEm: serverTimestamp(),
      };

      if (produtoEditando) {
        await updateDoc(doc(db, "produtos", produtoEditando.id), dadosLimpos);
      } else {
        await addDoc(collection(db, "produtos"), {
          ...dadosLimpos,
          criadoEm: serverTimestamp()
        });
      }
      fecharModal();
    } catch (error) {
      alert("Erro ao comunicar com a base de dados.");
    } finally {
      setCarregando(false);
    }
  };

  const deletarProduto = async (id) => {
    if (window.confirm("Esta acção não pode ser revertida. Eliminar produto?")) {
      try { await deleteDoc(doc(db, "produtos", id)); } 
      catch (error) { alert("Erro ao eliminar."); }
    }
  };

  const abrirEdicao = (p) => {
    setProdutoEditando(p);
    setNovoProd({ ...p });
    setMostrarModal(true);
  };

  const fecharModal = () => {
    setMostrarModal(false);
    setProdutoEditando(null);
    setNovoProd({ nome: '', referencia: '', preco: '', custo: '', stock: '', categoria: 'Geral' });
  };

  // PESQUISA ATUALIZADA: Nome, Categoria ou Referência
  const produtosFiltrados = produtos.filter(p => 
    p.lojaId === usuario.lojaId && 
    (p.nome.toLowerCase().includes(pesquisa.toLowerCase()) || 
     p.categoria.toLowerCase().includes(pesquisa.toLowerCase()) ||
     (p.referencia && p.referencia.toLowerCase().includes(pesquisa.toLowerCase())))
  );

  return (
    <div className="animate-fade-in space-y-8 pb-10">
      
      {/* HEADER E RESUMO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 italic uppercase tracking-tighter">Inventário</h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
            <Package size={14} className="text-blue-500" /> {produtosFiltrados.length} Itens em catálogo
          </p>
        </div>
        
        <button 
          onClick={() => setMostrarModal(true)}
          className="w-full md:w-auto bg-slate-900 text-white px-8 py-5 rounded-[2rem] font-black flex items-center justify-center gap-3 hover:bg-blue-600 transition-all shadow-2xl shadow-slate-200 active:scale-95"
        >
          <Plus size={20} /> ADICIONAR PRODUTO
        </button>
      </div>

      {/* FILTROS RÁPIDOS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3 relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
          <input 
            className="w-full bg-white p-5 pl-16 rounded-[2rem] border border-slate-100 shadow-sm outline-none focus:ring-4 ring-blue-50 font-bold transition-all"
            placeholder="Procurar por nome, referência ou categoria..."
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
          />
        </div>
        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-center gap-3">
          <Filter size={18} className="text-slate-400" />
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Filtros Avançados</span>
        </div>
      </div>

      {/* LISTAGEM */}
      <div className="bg-white rounded-[3.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                <th className="p-8">REF.</th>
                <th className="p-8">Informação do Produto</th>
                <th className="p-8 text-center">Nível de Stock</th>
                <th className="p-8">Financeiro (MT)</th>
                <th className="p-8">Rentabilidade</th>
                <th className="p-8 text-right">Acções</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {produtosFiltrados.map((p) => {
                const margem = p.custo > 0 ? (((p.preco - p.custo) / p.preco) * 100).toFixed(0) : 0;
                const lucroUnitario = p.preco - p.custo;
                
                return (
                  <tr key={p.id} className="hover:bg-blue-50/20 transition-all group">
                    <td className="p-8 font-mono text-[10px] font-black text-blue-600">
                       #{p.referencia || '---'}
                    </td>
                    <td className="p-8">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-800 text-base uppercase tracking-tight">{p.nome}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.categoria}</span>
                      </div>
                    </td>
                    
                    <td className="p-8">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`px-5 py-2 rounded-2xl font-black text-xs shadow-sm ${
                          p.stock <= 5 ? 'bg-red-500 text-white animate-pulse' : 
                          p.stock <= 15 ? 'bg-orange-100 text-orange-600' : 
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {p.stock} uni
                        </span>
                        {p.stock <= 5 && <span className="text-[8px] font-black text-red-500 uppercase">Repor Urgente</span>}
                      </div>
                    </td>

                    <td className="p-8">
                      <div className="flex flex-col text-nowrap">
                        <span className="text-sm font-black text-slate-700">Venda: {Number(p.preco).toFixed(2)}</span>
                        <span className="text-[10px] font-bold text-slate-400 tracking-tighter">Custo: {Number(p.custo).toFixed(2)}</span>
                      </div>
                    </td>

                    <td className="p-8">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1 text-emerald-600">
                          <TrendingUp size={14} />
                          <span className="font-black text-sm">+{margem}%</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                          Lucro: {lucroUnitario.toFixed(2)}
                        </span>
                      </div>
                    </td>

                    <td className="p-8 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => abrirEdicao(p)} className="p-4 bg-white text-blue-600 border border-blue-50 hover:shadow-lg rounded-2xl transition-all"><Edit3 size={18}/></button>
                        <button onClick={() => deletarProduto(p.id)} className="p-4 bg-white text-red-500 border border-red-50 hover:shadow-lg rounded-2xl transition-all"><Trash2 size={18}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE PRODUTO */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 bg-slate-50 border-b flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">
                  {produtoEditando ? 'Actualizar Produto' : 'Novo Registo'}
                </h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Dados de Inventário</p>
              </div>
              <button onClick={fecharModal} className="p-3 bg-white text-slate-400 hover:text-red-500 rounded-full shadow-sm transition-all"><X /></button>
            </div>
            
            <form onSubmit={salvarProduto} className="p-10 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-[0.2em]">Designação</label>
                  <input required className="w-full bg-slate-50 p-5 rounded-[2rem] border-2 border-transparent focus:border-blue-500 focus:bg-white font-bold outline-none transition-all"
                    placeholder="Ex: Coca-Cola"
                    value={novoProd.nome} onChange={e => setNovoProd({...novoProd, nome: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-[0.2em]">Referência/SKU</label>
                  <div className="relative">
                    <Hash className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input className="w-full bg-slate-50 p-5 pl-12 rounded-[2rem] border-2 border-transparent focus:border-blue-500 focus:bg-white font-bold outline-none transition-all"
                      placeholder="Ex: BEB-001"
                      value={novoProd.referencia} onChange={e => setNovoProd({...novoProd, referencia: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-[0.2em]">Preço Venda</label>
                  <input type="number" required className="w-full bg-slate-50 p-5 rounded-[2rem] border-2 border-transparent focus:border-blue-500 focus:bg-white font-bold outline-none transition-all"
                    value={novoProd.preco} onChange={e => setNovoProd({...novoProd, preco: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-[0.2em]">Custo Unit.</label>
                  <input type="number" required className="w-full bg-slate-50 p-5 rounded-[2rem] border-2 border-transparent focus:border-blue-500 focus:bg-white font-bold outline-none transition-all"
                    value={novoProd.custo} onChange={e => setNovoProd({...novoProd, custo: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-[0.2em]">Stock Inicial</label>
                  <input type="number" required className="w-full bg-slate-50 p-5 rounded-[2rem] border-2 border-transparent focus:border-blue-500 focus:bg-white font-bold outline-none transition-all"
                    value={novoProd.stock} onChange={e => setNovoProd({...novoProd, stock: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-[0.2em]">Categoria</label>
                  <select className="w-full bg-slate-50 p-5 rounded-[2rem] border-2 border-transparent focus:border-blue-500 focus:bg-white font-bold outline-none transition-all cursor-pointer appearance-none"
                    value={novoProd.categoria} onChange={e => setNovoProd({...novoProd, categoria: e.target.value})}>
                    <option value="Geral">Geral</option>
                    <option value="Bebidas">Bebidas</option>
                    <option value="Mercearia">Mercearia</option>
                    <option value="Limpeza">Limpeza</option>
                  </select>
                </div>
              </div>

              <button disabled={carregando} className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black shadow-2xl flex items-center justify-center gap-3 mt-4 hover:bg-blue-600 transition-all active:scale-95 group">
                {carregando ? <Loader2 className="animate-spin" /> : (
                  <>
                    <DollarSign size={20} className="group-hover:rotate-12 transition-transform" /> 
                    <span className="uppercase tracking-widest text-xs">Guardar no Sistema</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventario;