import React, { useState, useRef } from 'react';
import { db } from '../firebase'; 
import { collection, doc, increment, serverTimestamp, writeBatch } from "firebase/firestore";
import { 
  Search, Trash2, CheckCircle2, Banknote, Smartphone, Plus, Minus, Hash, Clock, 
  CreditCard, Building2, Percent, Calculator, User, MapPin, FileText, ShoppingBag, AlertTriangle
} from 'lucide-react';
import ReciboA4 from '../components/ReciboA4';

const REGRAS_SETOR = {
  'Mercearia': { labelExtra: "Cliente", placeholder: "Nome do Cliente", botaoAcao: "CONCLUIR VENDA" },
  'Restaurante/Bar': { labelExtra: "Mesa/Comando", placeholder: "Ex: Mesa 05", botaoAcao: "PAGAR AGORA" },
  'Oficina': { labelExtra: "Viatura", placeholder: "Matrícula ou Modelo", botaoAcao: "PAGAR AGORA" },
  'Farmácia': { labelExtra: "Paciente", placeholder: "Nome do Paciente", botaoAcao: "CONCLUIR VENDA" },
  'Geral': { labelExtra: "Cliente", placeholder: "Nome do Cliente", botaoAcao: "CONCLUIR VENDA" }
};

// Mapeamento de cores para evitar bugs de compilação do Tailwind
const CORES_METODOS = {
  'Dinheiro': 'bg-emerald-600 border-emerald-600',
  'M-Pesa': 'bg-red-600 border-red-600',
  'e-Mola': 'bg-orange-600 border-orange-600',
  'Cartão': 'bg-blue-600 border-blue-600',
  'Transferência': 'bg-purple-600 border-purple-600',
  'Aberto': 'bg-amber-600 border-amber-600'
};

const Caixa = ({ usuario, produtos, configLoja, avisar }) => {
  const [carrinho, setCarrinho] = useState([]);
  const [pesquisa, setPesquisa] = useState('');
  const [metodo, setMetodo] = useState('Dinheiro');
  const [referencia, setReferencia] = useState('');
  const [desconto, setDesconto] = useState('');
  const [aplicarIva, setAplicarIva] = useState(false);
  const [valorRecebido, setValorRecebido] = useState(''); 
  const [nomeCliente, setNomeCliente] = useState('');
  const [nuitCliente, setNuitCliente] = useState('');
  const [enderecoCliente, setEnderecoCliente] = useState('');
  const [vendaFinalizada, setVendaFinalizada] = useState(null);
  const [carregando, setCarregando] = useState(false);
  
  const inputPesquisa = useRef(null);
  const config = REGRAS_SETOR[usuario.tipoNegocio] || REGRAS_SETOR['Geral'];
  const moeda = configLoja.moeda || 'MT';

  const subtotal = carrinho.reduce((acc, item) => acc + (Number(item.preco) * item.qtd), 0);
  const valorDesconto = Number(desconto) || 0;
  const baseTributavel = Math.max(0, subtotal - valorDesconto);
  const valorIva = aplicarIva ? (baseTributavel * 0.16) : 0;
  const totalFinal = baseTributavel + valorIva;

  const produtosDaLoja = produtos.filter(p => 
    p.lojaId === usuario.lojaId && 
    (p.nome.toLowerCase().includes(pesquisa.toLowerCase()) || 
     (p.referencia && p.referencia.toLowerCase().includes(pesquisa.toLowerCase())))
  );

  const adicionarAoCarrinho = (p) => {
    const itemNoCarrinho = carrinho.find(item => item.id === p.id);
    if (p.stock <= (itemNoCarrinho?.qtd || 0)) {
      avisar("STOCK ESGOTADO", "erro");
      return;
    }
    if (itemNoCarrinho) {
      setCarrinho(carrinho.map(item => item.id === p.id ? { ...item, qtd: item.qtd + 1 } : item));
    } else {
      setCarrinho([...carrinho, { ...p, qtd: 1 }]);
    }
    setPesquisa(''); 
  };

  const removerOuDiminuir = (id) => {
    const item = carrinho.find(i => i.id === id);
    if (item.qtd > 1) {
      setCarrinho(carrinho.map(i => i.id === id ? { ...i, qtd: i.qtd - 1 } : i));
    } else {
      setCarrinho(carrinho.filter(i => i.id !== id));
    }
  };

  const finalizarVenda = async () => {
    if (carrinho.length === 0 || carregando) return;
    if (['M-Pesa', 'e-Mola', 'Transferência'].includes(metodo) && !referencia) {
        avisar(`INSIRA A REFERÊNCIA DO PAGAMENTO`, "erro");
        return;
    }

    setCarregando(true);
    const batch = writeBatch(db);
    
    try {
      const vendaRef = doc(collection(db, "vendas"));
      const dadosVenda = {
        id: vendaRef.id,
        lojaId: usuario.lojaId, 
        vendedorId: usuario.uid,
        vendedorNome: usuario.nome,
        lojaNome: usuario.nomeLoja,
        infoAdicional: nomeCliente.toUpperCase() || "CONSUMIDOR FINAL",
        clienteNuit: nuitCliente,
        clienteEndereco: enderecoCliente,
        itens: carrinho.map(item => ({
          id: item.id,
          nome: item.nome,
          preco: Number(item.preco),
          qtd: item.qtd
        })),
        subtotal,
        desconto: valorDesconto,
        imposto: valorIva,
        total: totalFinal,
        metodo,
        status: metodo === 'Aberto' ? 'PENDENTE' : 'PAGO',
        referencia: referencia.toUpperCase(),
        valorRecebido: Number(valorRecebido) || totalFinal,
        troco: (Number(valorRecebido) - totalFinal) > 0 ? (Number(valorRecebido) - totalFinal) : 0,
        data: new Date().toISOString(),
        timestamp: serverTimestamp()
      };

      batch.set(vendaRef, dadosVenda);
      carrinho.forEach(item => {
        const produtoRef = doc(db, "produtos", item.id);
        batch.update(produtoRef, { stock: increment(-item.qtd) });
      });

      await batch.commit();
      setVendaFinalizada(dadosVenda);
      avisar("VENDA REGISTADA!", "sucesso");
    } catch (error) {
      avisar("ERRO AO SALVAR", "erro");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-120px)] overflow-hidden">
        
        {/* LADO ESQUERDO: LISTA DE PRODUTOS */}
        <div className="flex-1 bg-slate-50 rounded-[2.5rem] flex flex-col overflow-hidden border border-slate-200">
          <div className="p-4 bg-white border-b shadow-sm">
            <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
              <input 
                ref={inputPesquisa}
                className="w-full bg-slate-100 p-4 pl-14 rounded-2xl outline-none font-bold text-slate-700 focus:bg-white focus:ring-4 ring-blue-50 transition-all border-2 border-transparent focus:border-blue-200"
                placeholder="Pesquisar produto ou código..."
                value={pesquisa}
                onChange={e => setPesquisa(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 custom-scrollbar">
            {produtosDaLoja.map(p => (
              <button 
                key={p.id} 
                onClick={() => adicionarAoCarrinho(p)} 
                disabled={p.stock <= 0}
                className={`group p-3 rounded-[1.8rem] border-2 transition-all text-left flex flex-col justify-between h-40 ${p.stock <= 0 ? 'bg-slate-200 opacity-50 cursor-not-allowed' : 'bg-white border-transparent hover:border-blue-500 hover:shadow-xl shadow-sm active:scale-95'}`}
              >
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <span className="text-[7px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">{p.categoria}</span>
                    {p.stock < 5 && p.stock > 0 && <AlertTriangle size={12} className="text-amber-500" />}
                  </div>
                  <h4 className="font-black text-slate-800 text-[11px] uppercase leading-tight line-clamp-2 mt-1">{p.nome}</h4>
                  <p className="text-[9px] font-bold text-slate-400">Stock: {p.stock}</p>
                </div>
                <div className="flex items-end justify-between">
                  <p className="text-lg font-black text-slate-900 italic tracking-tighter">
                    {Number(p.preco).toFixed(2)} <small className="text-[10px] not-italic opacity-40">{moeda}</small>
                  </p>
                  <div className="bg-blue-600 text-white p-2 rounded-xl group-hover:scale-110 transition-transform">
                    <Plus size={14} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* LADO DIREITO: CARRINHO E CHECKOUT */}
        <div className="w-full lg:w-[480px] bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
          
          {/* CABEÇALHO DO CLIENTE */}
          <div className="p-6 bg-slate-50 border-b space-y-3">
            <div className="flex items-center gap-2 mb-1">
               <User size={16} className="text-blue-600" />
               <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dados de Faturação</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input 
                className="col-span-2 bg-white p-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-bold text-xs"
                placeholder={config.placeholder}
                value={nomeCliente} 
                onChange={e => setNomeCliente(e.target.value)} 
              />
              <input 
                className="bg-white p-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-bold text-xs"
                placeholder="NUIT Cliente"
                value={nuitCliente} 
                onChange={e => setNuitCliente(e.target.value)} 
              />
              <input 
                className="bg-white p-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-bold text-xs"
                placeholder="Cidade/Endereço"
                value={enderecoCliente} 
                onChange={e => setEnderecoCliente(e.target.value)} 
              />
            </div>
          </div>

          {/* LISTA DE ITENS */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-white">
            {carrinho.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-50">
                <ShoppingBag size={48} className="mb-2" />
                <p className="font-black uppercase text-[10px]">Carrinho Vazio</p>
              </div>
            )}
            {carrinho.map((item, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-slate-50/50 rounded-2xl border border-transparent hover:border-slate-200 transition-all animate-in slide-in-from-right-4 duration-200">
                <div className="flex-1 min-w-0">
                  <p className="font-black text-slate-800 text-[10px] uppercase truncate pr-2">{item.nome}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-2 bg-white border rounded-lg p-1 shadow-sm">
                      <button onClick={() => removerOuDiminuir(item.id)} className="text-slate-400 hover:text-red-500 transition-colors px-1"><Minus size={12}/></button>
                      <span className="text-xs font-black text-blue-600 w-6 text-center">{item.qtd}</span>
                      <button onClick={() => adicionarAoCarrinho(item)} className="text-slate-400 hover:text-blue-500 transition-colors px-1"><Plus size={12}/></button>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">{item.preco.toFixed(2)} /un</span>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="font-black text-slate-900 text-sm">{(item.qtd * item.preco).toFixed(2)}</p>
                  <button onClick={() => setCarrinho(carrinho.filter(c => c.id !== item.id))} className="text-red-200 hover:text-red-500 transition-colors mt-1">
                    <Trash2 size={12}/>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* PAGAMENTO E TOTAIS */}
          <div className="p-6 bg-slate-900 text-white rounded-t-[3rem] shadow-2xl">
            <div className="grid grid-cols-6 gap-1.5 mb-6">
              {[
                { id: 'Dinheiro', icon: <Banknote size={14}/> },
                { id: 'M-Pesa', icon: <Smartphone size={14}/> },
                { id: 'e-Mola', icon: <Smartphone size={14}/> },
                { id: 'Cartão', icon: <CreditCard size={14}/> },
                { id: 'Transferência', icon: <Building2 size={14}/> },
                { id: 'Aberto', icon: <Clock size={14}/> }
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setMetodo(m.id)}
                  title={m.id}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all ${metodo === m.id ? `${CORES_METODOS[m.id]} text-white shadow-lg` : 'border-white/10 text-white/40 hover:border-white/30'}`}
                >
                  {m.icon}
                  <span className="text-[7px] font-black uppercase mt-1">{m.id.substring(0, 4)}</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="space-y-1">
                <label className="text-[8px] font-black text-white/40 uppercase ml-1 flex items-center gap-1"><Percent size={10}/> Desconto ({moeda})</label>
                <input 
                  type="number"
                  className="w-full bg-white/5 border border-white/10 p-2.5 rounded-xl text-white font-bold text-xs outline-none focus:border-blue-500 transition-colors"
                  placeholder="0.00"
                  value={desconto}
                  onChange={e => setDesconto(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black text-white/40 uppercase ml-1 flex items-center gap-1"><Calculator size={10}/> Impostos</label>
                <button 
                  onClick={() => setAplicarIva(!aplicarIva)}
                  className={`w-full p-2.5 rounded-xl border font-bold text-xs transition-all ${aplicarIva ? 'bg-blue-600 border-blue-600' : 'bg-white/5 border-white/10 text-white/40'}`}
                >
                  IVA (16%)
                </button>
              </div>
              {['M-Pesa', 'e-Mola', 'Transferência'].includes(metodo) && (
                <div className="col-span-2 space-y-1 animate-in zoom-in-95 duration-200">
                  <input 
                    className="w-full bg-blue-500/20 border border-blue-500/30 p-3 rounded-xl text-blue-300 font-black text-xs outline-none uppercase placeholder:text-blue-500/50"
                    placeholder="DIGITE A REFERÊNCIA / ID DA TRANSAÇÃO..."
                    value={referencia}
                    onChange={e => setReferencia(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="space-y-1.5 border-t border-white/10 pt-4 mb-6">
              <div className="flex justify-between text-[10px] font-bold text-white/40 uppercase">
                <span>Subtotal Carrinho</span>
                <span>{subtotal.toFixed(2)}</span>
              </div>
              {valorDesconto > 0 && (
                <div className="flex justify-between text-[10px] font-bold text-emerald-400 uppercase">
                  <span>Desconto Aplicado</span>
                  <span>- {valorDesconto.toFixed(2)}</span>
                </div>
              )}
              {aplicarIva && (
                <div className="flex justify-between text-[10px] font-bold text-blue-400 uppercase">
                  <span>Imposto IVA (16%)</span>
                  <span>+ {valorIva.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-end pt-2">
                <div className="text-white/30">
                  <p className="text-[8px] font-black uppercase leading-none">Total Liquido</p>
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter">{moeda}</p>
                </div>
                <span className="text-4xl font-black italic tracking-tighter tabular-nums text-white">
                  {totalFinal.toFixed(2)}
                </span>
              </div>
            </div>

            <button 
                onClick={finalizarVenda}
                disabled={carrinho.length === 0 || carregando}
                className={`w-full py-5 rounded-[1.8rem] font-black text-xs transition-all flex items-center justify-center gap-3 uppercase tracking-[0.2em] shadow-2xl ${carrinho.length === 0 || carregando ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-500 hover:scale-[1.02] active:scale-95'}`}
            >
              {carregando ? (
                <Clock className="animate-spin" size={18} />
              ) : (
                <>
                  <CheckCircle2 size={18} /> 
                  {metodo === 'Aberto' ? 'LANÇAR EM CONTA (FIADO)' : config.botaoAcao}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {vendaFinalizada && (
        <ReciboA4 
          venda={vendaFinalizada} 
          configLoja={configLoja}
          fechar={() => { 
            setVendaFinalizada(null); 
            setCarrinho([]); 
            setNomeCliente('');
            setNuitCliente('');
            setEnderecoCliente('');
            setDesconto('');
            setReferencia('');
            setAplicarIva(false); // Reset do IVA para a próxima venda
            setValorRecebido('');
            inputPesquisa.current?.focus();
          }} 
        />
      )}
    </>
  );
};

export default Caixa;