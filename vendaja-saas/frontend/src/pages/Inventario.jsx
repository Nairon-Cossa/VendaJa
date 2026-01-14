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
  TrendingUp, DollarSign, Hash, Globe, Crown
} from 'lucide-react';

const Inventario = ({ usuario, avisar }) => {
  const [pesquisa, setPesquisa] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [produtos, setProdutos] = useState([]);

  // Verificação de plano
  const isPremium = usuario?.plano === 'premium';

  const [novoProd, setNovoProd] = useState({
    nome: '', referencia: '', preco: '', custo: '', stock: '', categoria: 'Geral', venderOnline: false
  });

  // 🔴 LISTENER SEGURO DO INVENTÁRIO
  useEffect(() => {
    if (!usuario?.lojaId) return;

    const q = query(
      collection(db, "produtos"),
      where("lojaId", "==", usuario.lojaId),
      orderBy("nome")
    );

    const unsub = onSnapshot(q,
      (snapshot) => {
        const lista = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        }));
        setProdutos(lista);
      },
      (error) => {
        console.error("Erro Firestore Inventário:", error);
        avisar?.("ERRO AO CARREGAR INVENTÁRIO", "erro");
      }
    );

    return () => unsub();
  }, [usuario?.lojaId]);

  // 💾 SALVAR / EDITAR
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
        venderOnline: isPremium ? novoProd.venderOnline : false, // Bloqueio por plano
        lojaId: usuario.lojaId,
        atualizadoEm: serverTimestamp()
      };

      if (produtoEditando) {
        await updateDoc(doc(db, "produtos", produtoEditando.id), dados);
      } else {
        await addDoc(collection(db, "produtos"), {
          ...dados,
          criadoEm: serverTimestamp()
        });
      }

      fecharModal();
      avisar?.("PRODUTO GUARDADO COM SUCESSO", "sucesso");
    } catch (err) {
      console.error(err);
      avisar?.("ERRO AO GUARDAR PRODUTO", "erro");
    } finally {
      setCarregando(false);
    }
  };

  // 🗑️ DELETE
  const deletarProduto = async (id) => {
    if (!window.confirm("Eliminar produto permanentemente?")) return;
    try {
      await deleteDoc(doc(db, "produtos", id));
      avisar?.("PRODUTO ELIMINADO", "sucesso");
    } catch {
      avisar?.("ERRO AO ELIMINAR", "erro");
    }
  };

  const abrirEdicao = (p) => {
    setProdutoEditando(p);
    setNovoProd({ ...p, venderOnline: p.venderOnline || false });
    setMostrarModal(true);
  };

  const fecharModal = () => {
    setMostrarModal(false);
    setProdutoEditando(null);
    setNovoProd({
      nome: '', referencia: '', preco: '', custo: '', stock: '', categoria: 'Geral', venderOnline: false
    });
  };

  const produtosFiltrados = produtos.filter(p =>
    p.nome.toLowerCase().includes(pesquisa.toLowerCase()) ||
    p.categoria.toLowerCase().includes(pesquisa.toLowerCase()) ||
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
            {produtosFiltrados.length} Produtos • Plano {usuario?.plano?.toUpperCase()}
          </p>
        </div>
        <button
          onClick={() => setMostrarModal(true)}
          className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black flex gap-2 hover:bg-slate-800 transition-all"
        >
          <Plus /> Novo Produto
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
        <input
          className="w-full bg-white p-5 pl-16 rounded-2xl border focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          placeholder="Pesquisar produto ou referência..."
          value={pesquisa}
          onChange={e => setPesquisa(e.target.value)}
        />
      </div>

      {/* TABELA */}
      <div className="bg-white rounded-3xl overflow-hidden border">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-[10px] uppercase text-slate-400 font-black">
              <th className="p-6">Ref</th>
              <th className="p-6">Produto</th>
              <th className="p-6">Stock</th>
              <th className="p-6">Preço</th>
              {isPremium && <th className="p-6 text-center">Online</th>}
              <th className="p-6 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {produtosFiltrados.map(p => (
              <tr key={p.id} className="border-t hover:bg-slate-50 transition-colors">
                <td className="p-6 font-mono text-blue-600 text-xs">#{p.referencia || '---'}</td>
                <td className="p-6">
                  <div className="font-black text-slate-900">{p.nome}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">{p.categoria}</div>
                </td>
                <td className="p-6">
                  <span className={`font-bold ${p.stock <= 5 ? 'text-red-500' : 'text-slate-700'}`}>
                    {p.stock}
                  </span>
                </td>
                <td className="p-6 font-bold text-slate-900">{p.preco.toFixed(2)} MT</td>
                {isPremium && (
                  <td className="p-6 text-center">
                    {p.venderOnline ? <Globe size={16} className="text-blue-500 mx-auto" /> : <div className="w-1.5 h-1.5 bg-slate-200 rounded-full mx-auto" />}
                  </td>
                )}
                <td className="p-6 text-right">
                  <button onClick={() => abrirEdicao(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit3 size={18} /></button>
                  <button onClick={() => deletarProduto(p.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all ml-1"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={salvarProduto} className="bg-white p-8 md:p-10 rounded-[2.5rem] w-full max-w-xl space-y-5 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-2xl font-black italic uppercase">
                {produtoEditando ? "Editar Produto" : "Novo Registro"}
              </h3>
              <button type="button" onClick={fecharModal} className="text-slate-400 hover:text-slate-900"><X /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Nome do Produto</label>
                <input required placeholder="Ex: Coca-Cola 330ml"
                  className="w-full p-4 border rounded-2xl bg-slate-50 focus:bg-white outline-none transition-all"
                  value={novoProd.nome}
                  onChange={e => setNovoProd({ ...novoProd, nome: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Referência / SKU</label>
                <input placeholder="Ex: BEB-001"
                  className="w-full p-4 border rounded-2xl bg-slate-50 focus:bg-white outline-none transition-all"
                  value={novoProd.referencia}
                  onChange={e => setNovoProd({ ...novoProd, referencia: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Stock Atual</label>
                <input type="number" required placeholder="0"
                  className="w-full p-4 border rounded-2xl bg-slate-50 focus:bg-white outline-none transition-all"
                  value={novoProd.stock}
                  onChange={e => setNovoProd({ ...novoProd, stock: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Preço de Venda (MT)</label>
                <input type="number" required step="0.01" placeholder="0.00"
                  className="w-full p-4 border rounded-2xl bg-slate-50 focus:bg-white border-blue-100 outline-none transition-all font-bold text-blue-600"
                  value={novoProd.preco}
                  onChange={e => setNovoProd({ ...novoProd, preco: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Custo de Compra (MT)</label>
                <input type="number" required step="0.01" placeholder="0.00"
                  className="w-full p-4 border rounded-2xl bg-slate-50 focus:bg-white outline-none transition-all"
                  value={novoProd.custo}
                  onChange={e => setNovoProd({ ...novoProd, custo: e.target.value })}
                />
              </div>
            </div>

            {/* SELEÇÃO DE VENDA ONLINE (BLOQUEADO PARA BÁSICO) */}
            <div className={`p-4 rounded-2xl flex items-center justify-between ${isPremium ? 'bg-blue-50 border border-blue-100' : 'bg-slate-50 border border-slate-100 opacity-60'}`}>
              <div className="flex items-center gap-3">
                <Globe size={20} className={isPremium ? 'text-blue-600' : 'text-slate-400'} />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-tight">Disponível Online</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase">Sincronizar com Loja Virtual</p>
                </div>
              </div>
              <input 
                type="checkbox"
                disabled={!isPremium}
                className="w-5 h-5 accent-blue-600"
                checked={novoProd.venderOnline}
                onChange={e => setNovoProd({ ...novoProd, venderOnline: e.target.checked })}
              />
            </div>

            {!isPremium && (
              <p className="text-[8px] font-black text-amber-600 uppercase text-center tracking-widest">
                Upgrade para Premium para vender online
              </p>
            )}

            <button disabled={carregando}
              className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl disabled:opacity-50">
              {carregando ? "A processar..." : (produtoEditando ? "Atualizar Produto" : "Confirmar Cadastro")}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Inventario;