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
  TrendingUp, DollarSign, Hash
} from 'lucide-react';

const Inventario = ({ usuario, avisar }) => {
  const [pesquisa, setPesquisa] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [produtos, setProdutos] = useState([]);

  const [novoProd, setNovoProd] = useState({
    nome: '', referencia: '', preco: '', custo: '', stock: '', categoria: 'Geral'
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
    setNovoProd({ ...p });
    setMostrarModal(true);
  };

  const fecharModal = () => {
    setMostrarModal(false);
    setProdutoEditando(null);
    setNovoProd({
      nome: '', referencia: '', preco: '', custo: '', stock: '', categoria: 'Geral'
    });
  };

  // 🔍 FILTRO LOCAL
  const produtosFiltrados = produtos.filter(p =>
    p.nome.toLowerCase().includes(pesquisa.toLowerCase()) ||
    p.categoria.toLowerCase().includes(pesquisa.toLowerCase()) ||
    p.referencia?.toLowerCase().includes(pesquisa.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-10">

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-black uppercase">Inventário</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
            {produtosFiltrados.length} Produtos
          </p>
        </div>
        <button
          onClick={() => setMostrarModal(true)}
          className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black flex gap-2"
        >
          <Plus /> Novo Produto
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
        <input
          className="w-full bg-white p-5 pl-16 rounded-2xl border"
          placeholder="Pesquisar produto..."
          value={pesquisa}
          onChange={e => setPesquisa(e.target.value)}
        />
      </div>

      {/* TABELA */}
      <div className="bg-white rounded-3xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 text-xs uppercase text-slate-400">
              <th className="p-6">Ref</th>
              <th className="p-6">Produto</th>
              <th className="p-6">Stock</th>
              <th className="p-6">Preço</th>
              <th className="p-6 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {produtosFiltrados.map(p => (
              <tr key={p.id} className="border-t hover:bg-slate-50">
                <td className="p-6 font-mono text-blue-600">#{p.referencia}</td>
                <td className="p-6">
                  <div className="font-black">{p.nome}</div>
                  <div className="text-xs text-slate-400">{p.categoria}</div>
                </td>
                <td className="p-6">{p.stock}</td>
                <td className="p-6">{p.preco.toFixed(2)}</td>
                <td className="p-6 text-right">
                  <button onClick={() => abrirEdicao(p)} className="mr-3 text-blue-600"><Edit3 /></button>
                  <button onClick={() => deletarProduto(p.id)} className="text-red-500"><Trash2 /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL (igual ao teu, funcional) */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <form onSubmit={salvarProduto} className="bg-white p-10 rounded-3xl w-full max-w-xl space-y-6">
            <h3 className="text-2xl font-black">
              {produtoEditando ? "Editar Produto" : "Novo Produto"}
            </h3>

            <input required placeholder="Nome"
              className="w-full p-4 border rounded-xl"
              value={novoProd.nome}
              onChange={e => setNovoProd({ ...novoProd, nome: e.target.value })}
            />

            <input placeholder="Referência"
              className="w-full p-4 border rounded-xl"
              value={novoProd.referencia}
              onChange={e => setNovoProd({ ...novoProd, referencia: e.target.value })}
            />

            <input type="number" placeholder="Preço"
              className="w-full p-4 border rounded-xl"
              value={novoProd.preco}
              onChange={e => setNovoProd({ ...novoProd, preco: e.target.value })}
            />

            <input type="number" placeholder="Custo"
              className="w-full p-4 border rounded-xl"
              value={novoProd.custo}
              onChange={e => setNovoProd({ ...novoProd, custo: e.target.value })}
            />

            <input type="number" placeholder="Stock"
              className="w-full p-4 border rounded-xl"
              value={novoProd.stock}
              onChange={e => setNovoProd({ ...novoProd, stock: e.target.value })}
            />

            <button disabled={carregando}
              className="w-full bg-slate-900 text-white py-4 rounded-xl font-black">
              {carregando ? "A guardar..." : "Guardar"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Inventario;
