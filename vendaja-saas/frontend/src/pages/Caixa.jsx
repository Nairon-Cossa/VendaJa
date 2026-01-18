import React, { useState, useRef } from 'react';
import { db } from '../firebase'; 
import { collection, doc, increment, serverTimestamp, writeBatch, addDoc } from "firebase/firestore";
import { 
  Search, Trash2, CheckCircle2, Banknote, Smartphone, Plus, Minus, Clock, 
  CreditCard, Building2, Percent, Calculator, User, ShoppingBag, AlertTriangle
} from 'lucide-react';
import ReciboA4 from '../components/ReciboA4';

const REGRAS_SETOR = {
  'Mercearia': { labelExtra: "Cliente", placeholder: "Nome do Cliente", botaoAcao: "CONCLUIR VENDA" },
  'Restaurante/Bar': { labelExtra: "Mesa/Comando", placeholder: "Ex: Mesa 05", botaoAcao: "PAGAR AGORA" },
  'Oficina': { labelExtra: "Viatura", placeholder: "Matrícula ou Modelo", botaoAcao: "PAGAR AGORA" },
  'Farmácia': { labelExtra: "Paciente", placeholder: "Nome do Paciente", botaoAcao: "CONCLUIR VENDA" },
  'Geral': { labelExtra: "Cliente", placeholder: "Nome do Cliente", botaoAcao: "CONCLUIR VENDA" }
};

const CORES_METODOS = {
  'Dinheiro': 'bg-emerald-600 border-emerald-600',
  'M-Pesa': 'bg-red-600 border-red-600',
  'e-Mola': 'bg-orange-600 border-orange-600',
  'Cartão': 'bg-blue-600 border-blue-600',
  'Transferência': 'bg-purple-600 border-purple-600',
  'Dívida (Fiado)': 'bg-slate-700 border-slate-700'
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
    
    // Validação de Fiado
    if (metodo === 'Dívida (Fiado)' && !nomeCliente) {
        avisar("NOME DO CLIENTE OBRIGATÓRIO PARA FIADO", "erro");
        return;
    }

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
        status: metodo === 'Dívida (Fiado)' ? 'PENDENTE' : 'PAGO',
        referencia: referencia.toUpperCase(),
        data: new Date().toISOString(),
        timestamp: serverTimestamp()
      };

      batch.set(vendaRef, dadosVenda);

      // Se for Fiado, criar registo na coleção de fiados
      if (metodo === 'Dívida (Fiado)') {
        const fiadoRef = collection(db, "fiados");
        await addDoc(fiadoRef, {
            lojaId: usuario.lojaId,
            vendaId: vendaRef.id,
            clienteNome: nomeCliente.toUpperCase(),
            valorTotal: totalFinal,
            valorPago: 0,
            status: 'pendente',
            dataCriacao: serverTimestamp()
        });
      }

      carrinho.forEach(item => {
        const produtoRef = doc(db, "produtos", item.id);
        batch.update(produtoRef, { stock: increment(-item.qtd) });
      });

      await batch.commit();
      setVendaFinalizada(dadosVenda);
      avisar("VENDA REGISTADA!", "sucesso");
    } catch (error) {
      console.error(error);
      avisar("ERRO AO SALVAR", "erro");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-100px)] overflow-hidden">
        
        {/* PRODUTOS */}
        <div className="flex-1 bg-slate-50 rounded-[2rem] flex flex-col overflow-hidden border border-slate-200">
          <div className="p-4 bg-white border-b shadow-sm">
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                ref={inputPesquisa}
                className="w-full bg-slate-100 p-4 pl-14 rounded-2xl outline-none font-bold text-slate-700 focus:bg-white focus:ring-2 ring-blue-100 transition-all border-2 border-transparent focus:border-blue-400"
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
                className={`group p-3 rounded-[1.5rem] border-2 transition-all text-left flex flex-col justify-between h-36 ${p.stock <= 0 ? 'bg-slate-200 opacity-50 cursor-not-allowed' : 'bg-white border-transparent hover:border-blue-500 hover:shadow-lg shadow-sm active:scale-95'}`}
              >
                <div>
                  <span className="text-[7px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-widest">{p.categoria}</span>
                  <h4 className="font-black text-slate-800 text-[11px] uppercase leading-tight line-clamp-2 mt-1">{p.nome}</h4>
                  <p className="text-[9px] font-bold text-slate-400 mt-1">S: {p.stock}</p>
                </div>
                <div className="flex items-end justify-between">
                  <p className="text-base font-black text-slate-900 italic tracking-tighter">
                    {Number(p.preco).toFixed(2)} <small className="text-[9px] not-italic opacity-40">{moeda}</small>
                  </p>
                  <div className="bg-blue-600 text-white p-1.5 rounded-lg">
                    <Plus size={14} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* CARRINHO (LARGURA FIXA E SCROLL INDEPENDENTE) */}
        <div className="w-full lg:w-[420px] bg-white rounded-[2rem] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
          
          {/* CLIENTE */}
          <div className="p-5 bg-slate-50 border-b">
            <div className="flex items-center gap-2 mb-3">
               <User size={14} className="text-blue-600" />
               <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dados do Cliente</h3>
            </div>
            <div className="space-y-2">
              <input 
                className="w-full bg-white p-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-bold text-xs"
                placeholder={config.placeholder}
                value={nomeCliente} 
                onChange={e => setNomeCliente(e.target.value)} 
              />
              <div className="grid grid-cols-2 gap-2">
                <input 
                  className="bg-white p-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-bold text-xs text-center"
                  placeholder="NUIT"
                  value={nuitCliente} 
                  onChange={e => setNuitCliente(e.target.value)} 
                />
                <input 
                  className="bg-white p-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-bold text-xs text-center"
                  placeholder="Endereço"
                  value={enderecoCliente} 
                  onChange={e => setEnderecoCliente(e.target.value)} 
                />
              </div>
            </div>
          </div>

          {/* ITENS */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-white">
            {carrinho.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-200 grayscale opacity-50">
                <ShoppingBag size={40} className="mb-2" />
                <p className="font-black uppercase text-[9px]">Aguardando Itens</p>
              </div>
            ) : (
              carrinho.map((item, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-800 text-[10px] uppercase truncate">{item.nome}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <button onClick={() => removerOuDiminuir(item.id)} className="text-slate-400 hover:text-red-500"><Minus size={12}/></button>
                      <span className="text-xs font-black text-blue-600 w-6 text-center">{item.qtd}</span>
                      <button onClick={() => adicionarAoCarrinho(item)} className="text-slate-400 hover:text-blue-500"><Plus size={12}/></button>
                      <span className="text-[9px] font-bold text-slate-400 ml-2">x {item.preco.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-black text-slate-900 text-xs">{(item.qtd * item.preco).toFixed(2)}</p>
                    <button onClick={() => setCarrinho(carrinho.filter(c => c.id !== item.id))} className="text-red-300 hover:text-red-500">
                      <Trash2 size={12}/>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* CHECKOUT SECTION */}
          <div className="p-6 bg-slate-900 text-white rounded-t-[2.5rem]">
            <div className="grid grid-cols-6 gap-2 mb-4">
              {[
                { id: 'Dinheiro', icon: <Banknote size={14}/> },
                { id: 'M-Pesa', icon: <Smartphone size={14}/> },
                { id: 'e-Mola', icon: <Smartphone size={14}/> },
                { id: 'Cartão', icon: <CreditCard size={14}/> },
                { id: 'Transferência', icon: <Building2 size={14}/> },
                { id: 'Dívida (Fiado)', icon: <Clock size={14}/> }
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setMetodo(m.id)}
                  className={`flex flex-col items-center justify-center py-2 rounded-xl border-2 transition-all ${metodo === m.id ? `${CORES_METODOS[m.id]} text-white border-transparent` : 'border-white/10 text-white/30 hover:border-white/30'}`}
                >
                  {m.icon}
                  <span className="text-[6px] font-black uppercase mt-1">{m.id.substring(0, 5)}</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
               <button onClick={() => setAplicarIva(!aplicarIva)} className={`p-2 rounded-xl border text-[10px] font-black transition-all ${aplicarIva ? 'bg-blue-600 border-blue-600' : 'bg-white/5 border-white/10 text-white/40'}`}>+ IVA (16%)</button>
               <input type="number" placeholder="Desconto" className="bg-white/5 border border-white/10 p-2 rounded-xl text-white font-bold text-[10px] outline-none" value={desconto} onChange={e => setDesconto(e.target.value)} />
            </div>

            {['M-Pesa', 'e-Mola', 'Transferência'].includes(metodo) && (
              <input 
                className="w-full bg-blue-500/10 border border-blue-500/30 p-3 rounded-xl text-blue-300 font-black text-[10px] outline-none uppercase mb-4"
                placeholder="REFERÊNCIA DO PAGAMENTO"
                value={referencia}
                onChange={e => setReferencia(e.target.value)}
              />
            )}

            <div className="flex justify-between items-end mb-4 border-t border-white/10 pt-4">
              <div className="text-white/30 uppercase font-black text-[9px]">Total a Cobrar</div>
              <div className="text-3xl font-black italic tracking-tighter tabular-nums">{totalFinal.toFixed(2)} <small className="text-xs not-italic">{moeda}</small></div>
            </div>

            <button 
                onClick={finalizarVenda}
                disabled={carrinho.length === 0 || carregando}
                className={`w-full py-4 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 uppercase tracking-widest ${carrinho.length === 0 || carregando ? 'bg-white/5 text-white/10' : 'bg-blue-600 hover:bg-blue-500 active:scale-95 shadow-xl shadow-blue-900/20'}`}
            >
              {carregando ? <Clock className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
              {metodo === 'Dívida (Fiado)' ? 'REGISTAR DÍVIDA' : config.botaoAcao}
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
            setDesconto('');
            setReferencia('');
            inputPesquisa.current?.focus();
          }} 
        />
      )}
    </>
  );
};

export default Caixa;