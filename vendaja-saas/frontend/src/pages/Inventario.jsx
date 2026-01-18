import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import {
  collection, addDoc, updateDoc, doc,
  deleteDoc, serverTimestamp,
  onSnapshot, query, where, orderBy
} from "firebase/firestore";
import {
  Plus, Search, Edit3, Trash2,
  Package, Filter, X, Loader2,
  TrendingUp, DollarSign, Hash, Globe, Crown, FileText, Truck, Receipt, AlertTriangle, ArrowDown
} from 'lucide-react';

const Inventario = ({ usuario, avisar, configLoja }) => {
  const [pesquisa, setPesquisa] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [produtos, setProdutos] = useState([]);

  const isPremium = usuario?.plano === 'premium';

  const [novoProd, setNovoProd] = useState({
    nome: '', 
    referencia: '', 
    preco: '', 
    custo: '', 
    stock: '', 
    categoria: 'Geral', 
    venderOnline: false,
    descricao: '', 
    fornecedor: '', 
    temIva: true
  });

  useEffect(() => {
    if (!usuario?.lojaId) return;
    const q = query(
      collection(db, "produtos"),
      where("lojaId", "==", usuario.lojaId),
      orderBy("nome")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setProdutos(lista);
    }, (error) => {
      console.error("Erro Firestore Inventário:", error);
      avisar?.("ERRO AO CARREGAR INVENTÁRIO", "erro");
    });
    return () => unsub();
  }, [usuario?.lojaId]);

  // MÉTRICAS FINANCEIRAS DO INVENTÁRIO
  const metricas = useMemo(() => {
    const totalItens = produtos.reduce((acc, p) => acc + Number(p.stock), 0);
    const valorCusto = produtos.reduce((acc, p) => acc + (Number(p.custo) * Number(p.stock)), 0);
    const valorVendaEstimado = produtos.reduce((acc, p) => acc + (Number(p.preco) * Number(p.stock)), 0);
    const stockBaixo = produtos.filter(p => p.stock <= 5).length;

    return { totalItens, valorCusto, valorVendaEstimado, stockBaixo, lucroPotencial: valorVendaEstimado - valorCusto };
  }, [produtos]);

  const salvarProduto = async (e) => {
    e.preventDefault();
    if (!usuario?.lojaId) return;
    setCarregando(true);
    try {
      const dados = {
        nome: novoProd.nome.toUpperCase().trim(),
        referencia: novoProd.referencia.toUpperCase().trim(),
        preco: Number(novoProd.preco),
        custo: Number(novoProd.custo),
        stock: Number(novoProd.stock),
        categoria: novoProd.categoria,
        descricao: novoProd.descricao.trim(),
        fornecedor: novoProd.fornecedor.toUpperCase().trim(),
        temIva: novoProd.temIva,
        venderOnline: isPremium ? novoProd.venderOnline : false,
        lojaId: usuario.lojaId,
        atualizadoEm: serverTimestamp()
      };

      if (produtoEditando) {
        await updateDoc(doc(db, "produtos", produtoEditando.id), dados);
      } else {
        await addDoc(collection(db, "produtos"), { ...dados, criadoEm: serverTimestamp() });
      }
      fecharModal();
      avisar?.("PRODUTO GUARDADO COM SUCESSO", "sucesso");
    } catch (err) {
      avisar?.("ERRO AO GUARDAR PRODUTO", "erro");
    } finally { setCarregando(false); }
  };

  const deletarProduto = async (id) => {
    if (!window.confirm("Eliminar produto permanentemente?")) return;
    try {
      await deleteDoc(doc(db, "produtos", id));
      avisar?.("PRODUTO ELIMINADO", "sucesso");
    } catch { avisar?.("ERRO AO ELIMINAR", "erro"); }
  };

  const abrirEdicao = (p) => {
    setProdutoEditando(p);
    setNovoProd({ 
        ...p, 
        venderOnline: p.venderOnline || false,
        descricao: p.descricao || '',
        fornecedor: p.fornecedor || '',
        temIva: p.temIva !== undefined ? p.temIva : true
    });
    setMostrarModal(true);
  };

  const fecharModal = () => {
    setMostrarModal(false);
    setProdutoEditando(null);
    setNovoProd({
      nome: '', referencia: '', preco: '', custo: '', stock: '', categoria: 'Geral', venderOnline: false,
      descricao: '', fornecedor: '', temIva: true
    });
  };

  const produtosFiltrados = produtos.filter(p =>
    p.nome.toLowerCase().includes(pesquisa.toLowerCase()) ||
    p.fornecedor?.toLowerCase().includes(pesquisa.toLowerCase()) ||
    p.referencia?.toLowerCase().includes(pesquisa.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-10">
      
      {/* HEADER DINÂMICO */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black uppercase flex items-center gap-3 italic">
            <Package className="text-blue-600" size={35}/> Inventário
          </h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.3em] mt-1">
             Controlo Físico e Financeiro de Stock
          </p>
        </div>
        <button onClick={() => setMostrarModal(true)} className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black flex gap-3 hover:bg-blue-600 transition-all shadow-2xl active:scale-95 text-sm uppercase tracking-widest">
          <Plus size={20}/> Novo Artigo
        </button>
      </div>

      {/* PAINEL DE MÉTRICAS RÁPIDAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
             <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Valor em Stock (Custo)</p>
             <p className="text-2xl font-black text-slate-900 tabular-nums">{metricas.valorCusto.toFixed(2)} <small className="text-xs opacity-50">MT</small></p>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
             <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Lucro Potencial</p>
             <p className="text-2xl font-black text-emerald-500 tabular-nums">+{metricas.lucroPotencial.toFixed(2)} <small className="text-xs opacity-50">MT</small></p>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
             <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Qtd Total Itens</p>
             <p className="text-2xl font-black text-slate-900 tabular-nums">{metricas.totalItens} <small className="text-xs opacity-50">UN</small></p>
          </div>
          <div className={`p-6 rounded-[2rem] border shadow-sm transition-all ${metricas.stockBaixo > 0 ? 'bg-red-50 border-red-100 animate-pulse' : 'bg-white border-slate-100'}`}>
             <p className="text-[10px] font-black text-red-400 uppercase mb-2 flex items-center gap-2">
                <AlertTriangle size={12}/> Stock Crítico
             </p>
             <p className={`text-2xl font-black ${metricas.stockBaixo > 0 ? 'text-red-600' : 'text-slate-300'}`}>
                {metricas.stockBaixo} <small className="text-xs opacity-50 uppercase">Avisos</small>
             </p>
          </div>
      </div>

      {/* PESQUISA */}
      <div className="relative group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
        <input className="w-full bg-white p-6 pl-16 rounded-[2rem] border-none shadow-sm focus:ring-4 focus:ring-blue-100 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
          placeholder="Pesquisar por nome, referência ou fornecedor do artigo..."
          value={pesquisa} onChange={e => setPesquisa(e.target.value)} />
      </div>

      {/* TABELA PROFISSIONAL */}
      <div className="bg-white rounded-[3rem] overflow-hidden border border-slate-100 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-[10px] uppercase text-slate-400 font-black tracking-widest">
                <th className="p-8">Ref / Fornecedor</th>
                <th className="p-8">Produto</th>
                <th className="p-8 text-center">Stock Físico</th>
                <th className="p-8 text-right">Custo Unit.</th>
                <th className="p-8 text-right">PVP (Venda)</th>
                <th className="p-8 text-right">Margem</th>
                <th className="p-8 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {produtosFiltrados.map(p => {
                const margem = p.preco - p.custo;
                const percentagem = p.custo > 0 ? (margem / p.custo) * 100 : 0;
                
                return (
                  <tr key={p.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="p-8">
                      <div className="font-mono text-blue-600 text-[11px] font-black">#{p.referencia || 'SEM-REF'}</div>
                      <div className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">{p.fornecedor || 'Fornecedor Local'}</div>
                    </td>
                    <td className="p-8">
                      <div className="font-black text-slate-800 uppercase text-sm group-hover:text-blue-700 transition-colors">{p.nome}</div>
                      <div className="text-[10px] text-slate-400 italic line-clamp-1">{p.descricao || 'Nenhuma nota adicional registrada.'}</div>
                    </td>
                    <td className="p-8 text-center">
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-xs ${p.stock <= 5 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-700'}`}>
                        {p.stock} {p.stock <= 5 && <AlertTriangle size={12}/>}
                      </div>
                    </td>
                    <td className="p-8 text-right font-bold text-slate-400 tabular-nums">{Number(p.custo || 0).toFixed(2)}</td>
                    <td className="p-8 text-right font-black text-slate-900 tabular-nums text-lg">{Number(p.preco).toFixed(2)}</td>
                    <td className="p-8 text-right">
                        <div className="text-[10px] font-black text-emerald-600 uppercase">+{margem.toFixed(2)} MT</div>
                        <div className="text-[9px] text-slate-300 font-bold">{percentagem.toFixed(0)}% Lucro</div>
                    </td>
                    <td className="p-8">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => abrirEdicao(p)} className="p-3 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-2xl transition-all shadow-sm"><Edit3 size={18} /></button>
                        <button onClick={() => deletarProduto(p.id)} className="p-3 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white rounded-2xl transition-all shadow-sm"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE FICHA TÉCNICA */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <form onSubmit={salvarProduto} className="bg-white p-8 md:p-12 rounded-[3.5rem] w-full max-w-3xl max-h-[90vh] overflow-y-auto space-y-8 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">
                  {produtoEditando ? "Editar Ficha Técnica" : "Nova Entrada de Stock"}
                </h3>
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1">Configurações de inventário e impostos</p>
              </div>
              <button type="button" onClick={fecharModal} className="bg-slate-100 p-4 rounded-full text-slate-400 hover:text-red-500 transition-all shadow-inner"><X /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
              {/* NOME E DESCRIÇÃO */}
              <div className="md:col-span-4 space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Nome do Artigo / Modelo</label>
                <input required placeholder="Ex: IPHONE 15 PRO MAX 256GB"
                  className="w-full p-5 border-2 border-slate-50 rounded-3xl bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all font-black text-slate-800"
                  value={novoProd.nome} onChange={e => setNovoProd({ ...novoProd, nome: e.target.value })} />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Referência / SKU</label>
                <input placeholder="REF-2024-X"
                  className="w-full p-5 border-2 border-slate-50 rounded-3xl bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all font-mono font-bold text-blue-600"
                  value={novoProd.referencia} onChange={e => setNovoProd({ ...novoProd, referencia: e.target.value })} />
              </div>

              <div className="md:col-span-6 space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4 flex items-center gap-1"><FileText size={12}/> Notas Técnicas ou Descrição</label>
                <textarea placeholder="Detalhes de cor, tamanho, especificações..."
                  className="w-full p-5 border-2 border-slate-50 rounded-3xl bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all text-sm h-24 resize-none font-medium"
                  value={novoProd.descricao} onChange={e => setNovoProd({ ...novoProd, descricao: e.target.value })} />
              </div>

              {/* FORNECEDOR E STOCK */}
              <div className="md:col-span-3 space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4 flex items-center gap-1"><Truck size={12}/> Nome do Fornecedor</label>
                <input placeholder="Ex: APPLE MOZAMBIQUE"
                  className="w-full p-5 border-2 border-slate-50 rounded-3xl bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all font-bold uppercase"
                  value={novoProd.fornecedor} onChange={e => setNovoProd({ ...novoProd, fornecedor: e.target.value })} />
              </div>

              <div className="md:col-span-3 space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4 flex items-center gap-1"><Package size={12}/> Stock Inicial Físico</label>
                <input type="number" required placeholder="0"
                  className="w-full p-5 border-2 border-slate-50 rounded-3xl bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all font-black text-xl"
                  value={novoProd.stock} onChange={e => setNovoProd({ ...novoProd, stock: e.target.value })} />
              </div>

              {/* FINANCEIRO */}
              <div className="md:col-span-3 p-6 bg-slate-900 rounded-[2.5rem] space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-2">Preço de Compra (Custo)</label>
                <div className="relative">
                    <DollarSign className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-500" size={20}/>
                    <input type="number" required step="0.01" placeholder="0.00"
                    className="w-full bg-transparent pl-8 border-none text-white focus:ring-0 outline-none font-black text-2xl tabular-nums"
                    value={novoProd.custo} onChange={e => setNovoProd({ ...novoProd, custo: e.target.value })} />
                </div>
              </div>

              <div className="md:col-span-3 p-6 bg-blue-600 rounded-[2.5rem] space-y-2">
                <label className="text-[10px] font-black uppercase text-blue-200 ml-2">Preço de Venda (PVP)</label>
                <div className="relative">
                    <DollarSign className="absolute left-0 top-1/2 -translate-y-1/2 text-blue-200" size={20}/>
                    <input type="number" required step="0.01" placeholder="0.00"
                    className="w-full bg-transparent pl-8 border-none text-white focus:ring-0 outline-none font-black text-2xl tabular-nums"
                    value={novoProd.preco} onChange={e => setNovoProd({ ...novoProd, preco: e.target.value })} />
                </div>
              </div>
            </div>

            {/* IVA */}
            <div className="flex items-center justify-between p-6 bg-emerald-50 rounded-[2rem] border-2 border-emerald-100">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm"><Receipt/></div>
                    <div>
                        <p className="text-xs font-black uppercase text-emerald-900">Taxar IVA (16%)</p>
                        <p className="text-[10px] font-bold text-emerald-600 uppercase">Incluir imposto no preço final de venda</p>
                    </div>
                </div>
                <input type="checkbox" className="w-8 h-8 accent-emerald-600 cursor-pointer"
                  checked={novoProd.temIva} onChange={e => setNovoProd({ ...novoProd, temIva: e.target.checked })} />
            </div>

            <button disabled={carregando}
              className="w-full bg-slate-900 text-white py-8 rounded-[2.5rem] font-black uppercase tracking-[0.3em] hover:bg-blue-600 transition-all shadow-2xl shadow-blue-200 disabled:opacity-50 active:scale-95 text-lg">
              {carregando ? <Loader2 className="animate-spin mx-auto"/> : (produtoEditando ? "Confirmar Edição" : "Finalizar Registo de Stock")}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Inventario;