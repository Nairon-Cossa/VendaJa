import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import {
  collection, doc, deleteDoc, serverTimestamp,
  onSnapshot, query, where, orderBy, writeBatch
} from "firebase/firestore";
import {
  Plus, Search, Edit3, Trash2,
  Package, X, Loader2,
  DollarSign, FileText, Truck, Receipt, AlertTriangle, Inbox,
  BarChart3, ArrowUpRight, ShoppingCart, Info, CheckCircle2
} from 'lucide-react';

const Inventario = ({ usuario, avisar, configLoja }) => {
  const [pesquisa, setPesquisa] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [produtos, setProdutos] = useState([]);

  const isPremium = usuario?.plano === 'premium';
  const empresaId = usuario?.empresaId || usuario?.lojaId || usuario?.uid;

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
    if (!empresaId) {
      setCarregandoDados(false);
      return;
    }

    const q = query(
      collection(db, "produtos"),
      where("lojaId", "==", empresaId),
      orderBy("nome", "asc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setProdutos(lista);
      setCarregandoDados(false);
    }, (error) => {
      console.error("Erro Firestore Inventário:", error);
      avisar?.("ERRO AO CARREGAR INVENTÁRIO", "erro");
      setCarregandoDados(false);
    });

    return () => unsub();
  }, [empresaId, avisar]);

  /* ===============================
      MÉTRICAS DE PERFORMANCE
  =============================== */
  const metricas = useMemo(() => {
    const totalItens = produtos.reduce((acc, p) => acc + Number(p.stock || 0), 0);
    const valorCusto = produtos.reduce((acc, p) => acc + (Number(p.custo || 0) * Number(p.stock || 0)), 0);
    const valorVendaEstimado = produtos.reduce((acc, p) => acc + (Number(p.preco || 0) * Number(p.stock || 0)), 0);
    const stockBaixo = produtos.filter(p => Number(p.stock || 0) <= 5).length;
    
    // Saúde do Stock: Percentagem de itens acima do stock crítico
    const saudeStock = produtos.length > 0 
      ? Math.round(((produtos.length - stockBaixo) / produtos.length) * 100) 
      : 100;

    return { 
      totalItens, 
      valorCusto, 
      valorVendaEstimado, 
      stockBaixo, 
      lucroPotencial: valorVendaEstimado - valorCusto,
      saudeStock 
    };
  }, [produtos]);

  const salvarProduto = async (e) => {
    e.preventDefault();
    if (!empresaId) {
        avisar?.("ERRO: USUÁRIO NÃO IDENTIFICADO", "erro");
        return;
    }
    
    setCarregando(true);
    const batch = writeBatch(db);
    
    try {
      const dados = {
        nome: novoProd.nome.toUpperCase().trim(),
        referencia: (novoProd.referencia || '').toUpperCase().trim(),
        preco: Number(novoProd.preco),
        custo: Number(novoProd.custo),
        stock: Number(novoProd.stock),
        categoria: novoProd.categoria,
        descricao: (novoProd.descricao || '').trim(),
        fornecedor: (novoProd.fornecedor || '').toUpperCase().trim(),
        temIva: novoProd.temIva,
        venderOnline: isPremium ? novoProd.venderOnline : false,
        lojaId: empresaId, 
        empresaId: empresaId,
        atualizadoEm: serverTimestamp()
      };

      if (produtoEditando) {
        const prodRef = doc(db, "produtos", produtoEditando.id);
        batch.update(prodRef, dados);
      } else {
        const novoProdRef = doc(collection(db, "produtos"));
        batch.set(novoProdRef, { ...dados, criadoEm: serverTimestamp() });
      }

      await batch.commit();
      fecharModal();
      avisar?.("PRODUTO GUARDADO COM SUCESSO", "sucesso");

    } catch (err) {
      console.error(err);
      avisar?.("ERRO AO GUARDAR PRODUTO", "erro");
    } finally { 
      setCarregando(false); 
    }
  };

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
    p.nome?.toLowerCase().includes(pesquisa.toLowerCase()) ||
    p.fornecedor?.toLowerCase().includes(pesquisa.toLowerCase()) ||
    p.referencia?.toLowerCase().includes(pesquisa.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* HEADER DINÂMICO */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-200">
                <Package size={28}/>
            </div>
            <h2 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900">
              Inventário <span className="text-blue-600">Pro</span>
            </h2>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.4em] mt-3 ml-1">
             Gestão Estratégica de Ativos
          </p>
        </div>
        
        <div className="flex gap-3 w-full lg:w-auto">
            <button onClick={() => setMostrarModal(true)} className="flex-1 lg:flex-none bg-slate-900 text-white px-8 py-5 rounded-[2rem] font-black flex items-center justify-center gap-3 hover:bg-blue-600 transition-all shadow-2xl active:scale-95 text-xs uppercase tracking-widest">
              <Plus size={18}/> Novo Artigo
            </button>
        </div>
      </div>

      {/* PAINEL DE MÉTRICAS PREMIUM */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard 
            label="Capital Imobilizado" 
            value={`${metricas.valorCusto.toLocaleString()} ${configLoja?.moeda || 'MT'}`} 
            icon={<DollarSign size={18}/>}
            sub="Preço de Custo Total"
          />
          <MetricCard 
            label="Projeção de Lucro" 
            value={`${metricas.lucroPotencial.toLocaleString()} ${configLoja?.moeda || 'MT'}`} 
            icon={<ArrowUpRight size={18}/>}
            color="text-emerald-500"
            sub="Ganho em Venda Total"
          />
          <MetricCard 
            label="Saúde do Stock" 
            value={`${metricas.saudeStock}%`} 
            icon={<BarChart3 size={18}/>}
            progress={metricas.saudeStock}
            sub={`${metricas.totalItens} Unidades em Loja`}
          />
          <MetricCard 
            label="Alertas de Ruptura" 
            value={metricas.stockBaixo} 
            icon={<AlertTriangle size={18}/>}
            color={metricas.stockBaixo > 0 ? "text-red-600" : "text-slate-300"}
            danger={metricas.stockBaixo > 0}
            sub="Necessitam Reposição"
          />
      </div>

      {/* PESQUISA E FILTROS */}
      <div className="relative group">
        <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-3 pointer-events-none">
            <Search className="text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
        </div>
        <input className="w-full bg-white p-7 pl-16 rounded-[2.5rem] border border-slate-100 shadow-sm focus:ring-8 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300 text-sm"
          placeholder="Pesquisar por nome, referência ou fornecedor do artigo..."
          value={pesquisa} onChange={e => setPesquisa(e.target.value)} />
      </div>

      {/* TABELA CUSTOMIZADA */}
      <div className="bg-white rounded-[3rem] overflow-hidden border border-slate-100 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[9px] uppercase text-slate-400 font-black tracking-[0.2em]">
                <th className="p-8">Identificação</th>
                <th className="p-8">Detalhes do Artigo</th>
                <th className="p-8 text-center">Disponibilidade</th>
                <th className="p-8 text-right">Financeiro</th>
                <th className="p-8 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {carregandoDados ? (
                <tr>
                  <td colSpan="5" className="p-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="animate-spin text-blue-500" size={40} />
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Sincronizando Inventário...</p>
                    </div>
                  </td>
                </tr>
              ) : produtosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-24 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-20">
                        <Inbox size={60} />
                        <p className="text-xs font-black uppercase tracking-widest">Stock Vazio</p>
                    </div>
                  </td>
                </tr>
              ) : (
                produtosFiltrados.map(p => {
                  const margem = (p.preco || 0) - (p.custo || 0);
                  const percentagem = p.custo > 0 ? (margem / p.custo) * 100 : 0;
                  const isCritico = Number(p.stock) <= 5;
                  
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-all group">
                      <td className="p-8">
                        <div className="flex flex-col">
                            <span className="font-mono text-blue-600 text-[10px] font-black bg-blue-50 px-2 py-1 rounded-lg self-start mb-2">
                                #{p.referencia || 'S/ REF'}
                            </span>
                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-tighter flex items-center gap-1">
                                <Truck size={10}/> {p.fornecedor || 'Local'}
                            </span>
                        </div>
                      </td>
                      <td className="p-8">
                        <div className="max-w-xs">
                            <div className="font-black text-slate-900 uppercase text-sm mb-1">{p.nome}</div>
                            <div className="text-[10px] text-slate-400 font-medium line-clamp-1 italic">{p.descricao || 'Sem descrição técnica.'}</div>
                        </div>
                      </td>
                      <td className="p-8 text-center">
                        <div className={`inline-flex flex-col items-center justify-center px-6 py-3 rounded-2xl font-black text-xs ${isCritico ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-900 text-white'}`}>
                          <span className="text-lg leading-none">{p.stock}</span>
                          <span className="text-[7px] uppercase tracking-tighter mt-1 opacity-60">Em Stock</span>
                        </div>
                      </td>
                      <td className="p-8 text-right">
                        <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-900 italic">{Number(p.preco || 0).toLocaleString()} <small className="text-[8px] not-italic opacity-40">{configLoja?.moeda || 'MT'}</small></span>
                            <span className="text-[9px] font-black text-emerald-500 uppercase mt-1">Margem: {percentagem.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="p-8">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => abrirEdicao(p)} className="p-4 bg-white border border-slate-100 text-slate-400 hover:text-blue-600 hover:border-blue-100 hover:shadow-lg rounded-2xl transition-all active:scale-90"><Edit3 size={18} /></button>
                          <button onClick={() => deletarProduto(p.id)} className="p-4 bg-white border border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-100 hover:shadow-lg rounded-2xl transition-all active:scale-90"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE EDIÇÃO/CRIAÇÃO - ESTILO DASHBOARD */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <form onSubmit={salvarProduto} className="bg-white p-8 md:p-12 rounded-[3.5rem] w-full max-w-4xl max-h-[92vh] overflow-y-auto space-y-10 shadow-2xl animate-in zoom-in-95 duration-500">
            
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                    <Info size={16} />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Formulário de Registo</span>
                </div>
                <h3 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">
                  {produtoEditando ? "Editar Ficha" : "Entrada de Stock"}
                </h3>
              </div>
              <button type="button" onClick={fecharModal} className="bg-slate-100 p-5 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"><X /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              
              {/* NOME E REF */}
              <div className="md:col-span-8 space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Nome do Artigo Principal</label>
                <input required placeholder="EX: MACBOOK PRO M3 14 PLEGADAS"
                  className="w-full p-6 bg-slate-50 rounded-[2rem] border-2 border-transparent focus:bg-white focus:border-blue-600 outline-none transition-all font-black text-slate-800 placeholder:opacity-30"
                  value={novoProd.nome} onChange={e => setNovoProd({ ...novoProd, nome: e.target.value })} />
              </div>

              <div className="md:col-span-4 space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Referência / SKU</label>
                <input placeholder="SKU-000"
                  className="w-full p-6 bg-slate-50 rounded-[2rem] border-2 border-transparent focus:bg-white focus:border-blue-600 outline-none transition-all font-mono font-bold text-blue-600 uppercase"
                  value={novoProd.referencia} onChange={e => setNovoProd({ ...novoProd, referencia: e.target.value })} />
              </div>

              {/* DESCRIÇÃO */}
              <div className="md:col-span-12 space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4 flex items-center gap-1"><FileText size={12}/> Notas Técnicas</label>
                <textarea placeholder="Especificações como cor, tamanho, modelo ou estado do produto..."
                  className="w-full p-6 bg-slate-50 rounded-[2rem] border-2 border-transparent focus:bg-white focus:border-blue-600 outline-none transition-all text-sm h-32 resize-none font-medium"
                  value={novoProd.descricao} onChange={e => setNovoProd({ ...novoProd, descricao: e.target.value })} />
              </div>

              {/* FORNECEDOR E STOCK */}
              <div className="md:col-span-7 space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4 flex items-center gap-1"><Truck size={12}/> Fornecedor Oficial</label>
                <input placeholder="NOME DA EMPRESA OU CONTACTO"
                  className="w-full p-6 bg-slate-50 rounded-[2rem] border-2 border-transparent focus:bg-white focus:border-blue-600 outline-none transition-all font-bold uppercase"
                  value={novoProd.fornecedor} onChange={e => setNovoProd({ ...novoProd, fornecedor: e.target.value })} />
              </div>

              <div className="md:col-span-5 space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4 flex items-center gap-1"><Package size={12}/> Quantidade em Stock</label>
                <div className="relative">
                    <input type="number" required placeholder="0"
                    className="w-full p-6 bg-slate-900 rounded-[2rem] text-white outline-none transition-all font-black text-2xl"
                    value={novoProd.stock} onChange={e => setNovoProd({ ...novoProd, stock: e.target.value })} />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-500 uppercase">Unid.</span>
                </div>
              </div>

              {/* FINANCEIRO */}
              <div className="md:col-span-6 p-8 bg-blue-50 rounded-[2.5rem] border border-blue-100 space-y-4">
                <label className="text-[10px] font-black uppercase text-blue-400 ml-2">Custo de Aquisição</label>
                <div className="flex items-end gap-2">
                    <span className="text-2xl font-black text-blue-900 mb-1">{configLoja?.moeda || 'MT'}</span>
                    <input type="number" required step="0.01" placeholder="0.00"
                    className="w-full bg-transparent border-none p-0 text-blue-900 focus:ring-0 outline-none font-black text-5xl tabular-nums placeholder:opacity-20"
                    value={novoProd.custo} onChange={e => setNovoProd({ ...novoProd, custo: e.target.value })} />
                </div>
              </div>

              <div className="md:col-span-6 p-8 bg-slate-900 rounded-[2.5rem] space-y-4 shadow-xl shadow-slate-200">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-2">Preço de Venda Final (PVP)</label>
                <div className="flex items-end gap-2">
                    <span className="text-2xl font-black text-white mb-1">{configLoja?.moeda || 'MT'}</span>
                    <input type="number" required step="0.01" placeholder="0.00"
                    className="w-full bg-transparent border-none p-0 text-white focus:ring-0 outline-none font-black text-5xl tabular-nums placeholder:opacity-20"
                    value={novoProd.preco} onChange={e => setNovoProd({ ...novoProd, preco: e.target.value })} />
                </div>
              </div>
            </div>

            {/* IVA E ONLINE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between p-7 bg-white rounded-[2rem] border-2 border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600"><Receipt size={20}/></div>
                        <div>
                            <p className="text-xs font-black uppercase text-slate-900">Taxar IVA ({configLoja?.ivaPercent || 16}%)</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase italic">Imposto incluído no PVP</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={novoProd.temIva} onChange={e => setNovoProd({ ...novoProd, temIva: e.target.checked })} />
                        <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                <div className={`flex items-center justify-between p-7 rounded-[2rem] border-2 transition-all ${isPremium ? 'bg-white border-slate-100' : 'bg-slate-50 border-transparent opacity-60'}`}>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500"><ShoppingCart size={20}/></div>
                        <div>
                            <p className="text-xs font-black uppercase text-slate-900">Venda Online</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase italic">Visível no Catálogo Web</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input disabled={!isPremium} type="checkbox" className="sr-only peer" checked={novoProd.venderOnline} onChange={e => setNovoProd({ ...novoProd, venderOnline: e.target.checked })} />
                        <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                </div>
            </div>

            <button disabled={carregando}
              className="group w-full bg-slate-900 text-white py-10 rounded-[2.5rem] font-black uppercase tracking-[0.4em] hover:bg-blue-600 transition-all shadow-2xl active:scale-[0.98] disabled:opacity-50 text-sm flex items-center justify-center gap-4">
              {carregando ? <Loader2 className="animate-spin"/> : (
                <>
                    {produtoEditando ? "Confirmar Alterações" : "Efetivar Registo de Inventário"}
                    <CheckCircle2 size={20} className="group-hover:translate-x-2 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

/* COMPONENTE DE CARD DE MÉTRICA */
const MetricCard = ({ label, value, icon, color = "text-slate-900", sub, progress, danger }) => (
    <div className={`bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all duration-500 ${danger ? 'bg-red-50/30' : ''}`}>
        <div className="flex justify-between items-start mb-6">
            <div className="bg-slate-50 p-3 rounded-xl text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors">
                {icon}
            </div>
            {progress !== undefined && (
                <div className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">LIVE</div>
            )}
        </div>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <p className={`text-3xl font-black italic tracking-tighter tabular-nums ${color}`}>{value}</p>
            <p className="text-[9px] font-bold text-slate-300 uppercase mt-2 tracking-tighter">{sub}</p>
        </div>
        {progress !== undefined && (
            <div className="absolute bottom-0 left-0 w-full h-1.5 bg-slate-50">
                <div 
                    className="h-full bg-blue-600 transition-all duration-1000" 
                    style={{ width: `${progress}%` }}
                />
            </div>
        )}
    </div>
);

export default Inventario;