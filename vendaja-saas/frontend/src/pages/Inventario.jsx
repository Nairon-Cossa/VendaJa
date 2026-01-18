import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
  collection, addDoc, updateDoc, doc,
  deleteDoc, serverTimestamp,
  onSnapshot, query, where, orderBy
} from "firebase/firestore";
import {
  Plus, Search, Edit3, Trash2,
  Package, Filter, X, Loader2,
  TrendingUp, DollarSign, Hash, Globe, Crown, FileText, Truck, Receipt
} from 'lucide-react';

const Inventario = ({ usuario, avisar }) => {
  const [pesquisa, setPesquisa] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [produtos, setProdutos] = useState([]);

  const isPremium = usuario?.plano === 'premium';

  // ESTADO INICIAL AMPLIADO (ESTILO PRIMAVERA)
  const [novoProd, setNovoProd] = useState({
    nome: '', 
    referencia: '', 
    preco: '', 
    custo: '', 
    stock: '', 
    categoria: 'Geral', 
    venderOnline: false,
    descricao: '', // NOVO
    fornecedor: '', // NOVO
    temIva: true    // NOVO (Padrão 16%)
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
        descricao: novoProd.descricao.trim(), // NOVO
        fornecedor: novoProd.fornecedor.toUpperCase().trim(), // NOVO
        temIva: novoProd.temIva, // NOVO
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-black uppercase flex items-center gap-3">
            Inventário {isPremium && <Crown className="text-amber-500" size={24} />}
          </h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
            {produtosFiltrados.length} Produtos • Gestão Profissional
          </p>
        </div>
        <button onClick={() => setMostrarModal(true)} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black flex gap-2 hover:bg-blue-600 transition-all shadow-lg">
          <Plus /> Novo Produto
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
        <input className="w-full bg-white p-5 pl-16 rounded-2xl border focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium"
          placeholder="Pesquisar por nome, ref ou fornecedor..."
          value={pesquisa} onChange={e => setPesquisa(e.target.value)} />
      </div>

      {/* TABELA COM NOVAS COLUNAS */}
      <div className="bg-white rounded-[2.5rem] overflow-hidden border shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-[10px] uppercase text-slate-400 font-black tracking-tighter">
              <th className="p-6">Referência</th>
              <th className="p-6">Produto / Descrição</th>
              <th className="p-6">Fornecedor</th>
              <th className="p-6">Imposto</th>
              <th className="p-6 text-center">Stock</th>
              <th className="p-6">Preço Venda</th>
              <th className="p-6 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {produtosFiltrados.map(p => (
              <tr key={p.id} className="border-t hover:bg-slate-50/50 transition-colors">
                <td className="p-6 font-mono text-blue-600 text-xs font-bold">#{p.referencia || '---'}</td>
                <td className="p-6 max-w-xs">
                  <div className="font-black text-slate-900 uppercase text-sm">{p.nome}</div>
                  <div className="text-[10px] text-slate-400 line-clamp-1 italic">{p.descricao || 'Sem descrição'}</div>
                </td>
                <td className="p-6">
                   <span className="text-[10px] font-black bg-slate-100 px-2 py-1 rounded-md text-slate-600 uppercase">
                     {p.fornecedor || 'N/A'}
                   </span>
                </td>
                <td className="p-6">
                    <div className={`flex items-center gap-1 font-bold text-xs ${p.temIva ? 'text-emerald-600' : 'text-slate-300'}`}>
                        <Receipt size={14}/> {p.temIva ? 'IVA 16%' : 'ISENTO'}
                    </div>
                </td>
                <td className="p-6 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-black ${p.stock <= 5 ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                    {p.stock}
                  </span>
                </td>
                <td className="p-6 font-black text-slate-900">{Number(p.preco).toFixed(2)} <small>MT</small></td>
                <td className="p-6 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => abrirEdicao(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Edit3 size={18} /></button>
                    <button onClick={() => deletarProduto(p.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL COM CAMPOS DE DESCRIÇÃO E FORNECEDOR */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={salvarProduto} className="bg-white p-8 md:p-10 rounded-[3rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-center">
              <h3 className="text-3xl font-black italic uppercase tracking-tighter text-slate-800">
                {produtoEditando ? "Editar Ficha" : "Nova Ficha de Produto"}
              </h3>
              <button type="button" onClick={fecharModal} className="bg-slate-100 p-2 rounded-full text-slate-400 hover:text-slate-900"><X /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Nome do Artigo</label>
                <input required placeholder="Ex: IPAD PRO M2 12.9"
                  className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all font-bold"
                  value={novoProd.nome} onChange={e => setNovoProd({ ...novoProd, nome: e.target.value })} />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2 flex items-center gap-1"><FileText size={10}/> Descrição Detalhada (Opcional)</label>
                <textarea placeholder="Especificações técnicas, cores, tamanhos..."
                  className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all text-sm h-20 resize-none"
                  value={novoProd.descricao} onChange={e => setNovoProd({ ...novoProd, descricao: e.target.value })} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Referência / SKU</label>
                <input placeholder="Ex: ART-2024"
                  className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all font-mono text-sm"
                  value={novoProd.referencia} onChange={e => setNovoProd({ ...novoProd, referencia: e.target.value })} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2 flex items-center gap-1"><Truck size={10}/> Fornecedor</label>
                <input placeholder="Ex: SDO / REFRESH"
                  className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-sm"
                  value={novoProd.fornecedor} onChange={e => setNovoProd({ ...novoProd, fornecedor: e.target.value })} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Stock Inicial</label>
                <input type="number" required placeholder="0"
                  className="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all font-black"
                  value={novoProd.stock} onChange={e => setNovoProd({ ...novoProd, stock: e.target.value })} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Preço de Venda (MT)</label>
                <input type="number" required step="0.01" placeholder="0.00"
                  className="w-full p-4 border-2 border-blue-100 rounded-2xl bg-blue-50/30 focus:bg-white focus:border-blue-500 outline-none transition-all font-black text-blue-600 text-lg"
                  value={novoProd.preco} onChange={e => setNovoProd({ ...novoProd, preco: e.target.value })} />
              </div>
            </div>

            {/* CONFIGURAÇÃO DE IMPOSTO */}
            <div className="p-5 rounded-3xl bg-emerald-50 border-2 border-emerald-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Receipt className="text-emerald-600" size={24}/>
                    <div>
                        <p className="text-xs font-black uppercase text-emerald-800">Aplicar IVA (16%)</p>
                        <p className="text-[10px] font-medium text-emerald-600">Este produto inclui imposto na venda</p>
                    </div>
                </div>
                <input type="checkbox" className="w-6 h-6 accent-emerald-600 cursor-pointer"
                  checked={novoProd.temIva} onChange={e => setNovoProd({ ...novoProd, temIva: e.target.checked })} />
            </div>

            <button disabled={carregando}
              className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl disabled:opacity-50 active:scale-95">
              {carregando ? "A processar..." : (produtoEditando ? "Salvar Alterações" : "Gravar no Inventário")}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Inventario;