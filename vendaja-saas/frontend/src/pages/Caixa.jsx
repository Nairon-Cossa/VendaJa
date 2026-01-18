import React, { useState, useRef } from 'react';
import { db } from '../firebase'; 
import { collection, doc, increment, serverTimestamp, writeBatch } from "firebase/firestore";
import { 
  Search, Trash2, CheckCircle2, Banknote, Smartphone, Plus, Minus, Hash, Clock, 
  CreditCard, Building2, Percent, Calculator
} from 'lucide-react';
import Recibo from '../components/Recibo';

const REGRAS_SETOR = {
  'Mercearia': { labelExtra: "Cliente", placeholder: "Nome do Cliente (Opcional)", botaoAcao: "CONCLUIR VENDA" },
  'Restaurante/Bar': { labelExtra: "Mesa/Comando", placeholder: "Ex: Mesa 05", botaoAcao: "PAGAR AGORA" },
  'Bar/Bottle Store': { labelExtra: "Cliente", placeholder: "Nome ou Alcunha", botaoAcao: "PAGAR AGORA" },
  'Oficina': { labelExtra: "Viatura", placeholder: "Matrícula ou Modelo", botaoAcao: "PAGAR AGORA" },
  'Farmácia': { labelExtra: "Paciente", placeholder: "Nome do Paciente", botaoAcao: "CONCLUIR VENDA" },
  'Eletrónicos': { labelExtra: "Garantia/IMEI", placeholder: "Nº de Série ou Cliente", botaoAcao: "CONCLUIR VENDA" },
  'Loja de Roupa': { labelExtra: "Provador", placeholder: "Nome do Cliente", botaoAcao: "CONCLUIR VENDA" }
};

const Caixa = ({ usuario, produtos, configLoja, avisar }) => {
  const [carrinho, setCarrinho] = useState([]);
  const [pesquisa, setPesquisa] = useState('');
  
  // ESTADOS FINANCEIROS
  const [metodo, setMetodo] = useState('Dinheiro');
  const [referencia, setReferencia] = useState('');
  const [desconto, setDesconto] = useState(''); // Novo: Desconto em Valor
  const [aplicarIva, setAplicarIva] = useState(false); // Novo: Toggle IVA
  const [valorRecebido, setValorRecebido] = useState(''); 
  
  const [vendaFinalizada, setVendaFinalizada] = useState(null);
  const [infoExtra, setInfoExtra] = useState('');
  const [carregando, setCarregando] = useState(false);
  
  const inputPesquisa = useRef(null);
  const config = REGRAS_SETOR[usuario.tipoNegocio] || REGRAS_SETOR['Mercearia'];

  // CÁLCULOS MATEMÁTICOS (PRIMAVERA STYLE)
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
    
    // Validação de pagamentos móveis/bancários
    const metodosComRef = ['M-Pesa', 'e-Mola', 'mKesh', 'Transferência'];
    if (metodosComRef.includes(metodo) && !referencia) {
        avisar(`INSIRA A REFERÊNCIA (${metodo.toUpperCase()})`, "erro");
        return;
    }

    // Validação de Troco negativo
    if (metodo === 'Dinheiro' && (Number(valorRecebido) < totalFinal) && valorRecebido !== '') {
        avisar("VALOR RECEBIDO MENOR QUE O TOTAL", "erro");
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
        configRecibo: {
            nuit: configLoja.nuit || '',
            telefone: configLoja.telefone || '',
            endereco: configLoja.endereco || '',
            logo: configLoja.logo || null,
            mensagem: configLoja.mensagemRecibo || ''
        },
        itens: carrinho.map(item => ({
          id: item.id,
          nome: item.nome,
          preco: Number(item.preco),
          qtd: item.qtd
        })),
        // DADOS FINANCEIROS COMPLETOS
        subtotal: subtotal,
        desconto: valorDesconto,
        imposto: valorIva, // Valor monetário do IVA
        taxaImposto: aplicarIva ? 16 : 0, // % do IVA
        total: totalFinal,
        
        metodo,
        status: metodo === 'Aberto' ? 'PENDENTE' : 'PAGO',
        referencia: referencia.toUpperCase(),
        valorRecebido: Number(valorRecebido) || totalFinal,
        troco: (Number(valorRecebido) - totalFinal) > 0 ? (Number(valorRecebido) - totalFinal) : 0,
        infoAdicional: infoExtra.toUpperCase(),
        data: new Date().toISOString(),
        timestamp: serverTimestamp()
      };

      batch.set(vendaRef, dadosVenda);

      // Atualizar Stock
      carrinho.forEach(item => {
        const produtoRef = doc(db, "produtos", item.id);
        batch.update(produtoRef, { stock: increment(-item.qtd) });
      });

      await batch.commit();
      
      setVendaFinalizada(dadosVenda);
      avisar("VENDA REGISTADA COM SUCESSO!", "sucesso");

    } catch (error) {
      console.error("Erro:", error);
      avisar("ERRO AO SALVAR VENDA", "erro");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)] animate-in fade-in zoom-in-95 duration-500">
        
        {/* ESQUERDA: PRODUTOS */}
        <div className="flex-1 bg-white rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col overflow-hidden">
          <div className="p-6 border-b flex items-center gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={22} />
              <input 
                ref={inputPesquisa}
                className="w-full bg-slate-100/50 p-5 pl-14 rounded-2xl outline-none font-bold text-slate-700 focus:bg-white focus:ring-4 ring-blue-50 transition-all border-2 border-transparent focus:border-blue-200"
                placeholder="Pesquisar produto ou ref..."
                value={pesquisa}
                onChange={e => setPesquisa(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 bg-slate-50/50">
            {produtosDaLoja.map(p => (
              <button 
                key={p.id} 
                onClick={() => adicionarAoCarrinho(p)} 
                disabled={p.stock <= 0}
                className={`group p-4 rounded-[2rem] border-2 transition-all text-left h-48 flex flex-col justify-between ${p.stock <= 0 ? 'bg-slate-100 opacity-60' : 'bg-white border-transparent hover:border-blue-500 hover:shadow-2xl hover:-translate-y-1 active:scale-95 shadow-sm'}`}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                      <span className="text-[8px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg uppercase">{p.categoria}</span>
                      <span className="text-[9px] font-bold text-slate-400">STK: {p.stock}</span>
                  </div>
                  <h4 className="font-black text-slate-800 text-sm uppercase leading-tight line-clamp-3">{p.nome}</h4>
                </div>
                <div className="flex items-end justify-between">
                  <p className="text-xl font-black text-slate-900 italic tracking-tighter">
                    {Number(p.preco).toFixed(2)}<small className="text-[10px] ml-1 text-slate-400 not-italic">{configLoja.moeda}</small>
                  </p>
                  <div className="bg-slate-900 text-white p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all">
                    <Plus size={16} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* DIREITA: CHECKOUT "PRIMAVERA STYLE" */}
        <div className="w-full lg:w-[450px] bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
          <div className="p-8 space-y-6 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-black italic uppercase text-2xl tracking-tighter text-slate-800">Caixa / POS</h3>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">{config.labelExtra}</label>
              <input 
                  className="w-full bg-slate-50 p-4 rounded-xl outline-none border-2 border-transparent focus:border-blue-500 font-bold text-sm"
                  placeholder={config.placeholder}
                  value={infoExtra} 
                  onChange={e => setInfoExtra(e.target.value)} 
              />
            </div>

            {/* SELEÇÃO DE PAGAMENTO MELHORADA */}
            <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Método de Pagamento</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                  { id: 'Dinheiro', color: 'border-emerald-100 text-emerald-600', active: 'bg-emerald-600 text-white border-emerald-600', icon: <Banknote size={16}/> },
                  { id: 'M-Pesa', color: 'border-red-100 text-red-600', active: 'bg-red-600 text-white border-red-600', icon: <Smartphone size={16}/> },
                  { id: 'e-Mola', color: 'border-orange-100 text-orange-600', active: 'bg-orange-600 text-white border-orange-600', icon: <Smartphone size={16}/> },
                  { id: 'Cartão', color: 'border-blue-100 text-blue-600', active: 'bg-blue-600 text-white border-blue-600', icon: <CreditCard size={16}/> },
                  { id: 'Transferência', color: 'border-purple-100 text-purple-600', active: 'bg-purple-600 text-white border-purple-600', icon: <Building2 size={16}/> },
                  { id: 'Aberto', color: 'border-slate-200 text-slate-400', active: 'bg-slate-900 text-white border-slate-900', icon: <Clock size={16}/> } // LIBERADO
                  ].map((m) => (
                  <button
                      key={m.id}
                      onClick={() => { 
                          setMetodo(m.id); 
                          if(m.id === 'Dinheiro' || m.id === 'Aberto') setReferencia(''); 
                      }}
                      className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border-2 font-black text-[10px] uppercase transition-all ${metodo === m.id ? m.active : 'bg-white ' + m.color} active:scale-95`}
                  >
                      {m.icon} {m.id === 'Transferência' ? 'Transf.' : m.id}
                  </button>
                  ))}
              </div>

              {metodo !== 'Dinheiro' && metodo !== 'Aberto' && metodo !== 'Cartão' && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] font-black text-blue-600 uppercase ml-1 flex items-center gap-1">
                    <Hash size={12}/> Referência / Comprovativo
                  </label>
                  <input 
                    className="w-full bg-blue-50 p-4 rounded-xl outline-none border-2 border-blue-200 focus:border-blue-600 font-black text-blue-700 placeholder:text-blue-200 mt-1 uppercase"
                    placeholder="CÓDIGO SMS..."
                    value={referencia}
                    onChange={e => setReferencia(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2 pt-4 border-t">
              {carrinho.map((item, i) => (
                <div key={i} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl group">
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-800 text-[11px] uppercase truncate pr-4">{item.nome}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <button onClick={() => removerOuDiminuir(item.id)} className="p-1 hover:bg-white rounded-md border shadow-sm"><Minus size={12}/></button>
                      <span className="text-[12px] font-black text-blue-600 w-6 text-center">{item.qtd}</span>
                      <button onClick={() => adicionarAoCarrinho(item)} className="p-1 hover:bg-white rounded-md border shadow-sm"><Plus size={12}/></button>
                    </div>
                  </div>
                  <div className="text-right">
                      <p className="font-black text-slate-900 text-sm italic">{(item.qtd * item.preco).toFixed(2)}</p>
                      <button onClick={() => setCarrinho(carrinho.filter(c => c.id !== item.id))} className="text-red-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 size={14}/>
                      </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FOOTER FINANCEIRO - ESTILO ERP */}
          <div className="p-8 bg-slate-900 rounded-t-[3.5rem] space-y-4">
            
            {/* LINHA DE DESCONTO E IVA */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase ml-1 flex items-center gap-1"><Percent size={10}/> Desconto ({configLoja.moeda})</label>
                    <input 
                        type="number"
                        className="w-full bg-white/5 border border-white/10 p-2 rounded-xl text-white font-bold text-sm outline-none focus:border-blue-500"
                        placeholder="0.00"
                        value={desconto}
                        onChange={e => setDesconto(e.target.value)}
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase ml-1 flex items-center gap-1"><Calculator size={10}/> Impostos</label>
                    <button 
                        onClick={() => setAplicarIva(!aplicarIva)}
                        className={`w-full p-2 rounded-xl border font-bold text-sm transition-all ${aplicarIva ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white/5 border-white/10 text-slate-400'}`}
                    >
                        IVA (16%)
                    </button>
                </div>
            </div>

            {/* TOTAIS */}
            <div className="flex justify-between items-end border-t border-white/10 pt-4">
              <div className="text-slate-400 text-[10px] font-bold uppercase space-y-1">
                  <p>Subtotal: {subtotal.toFixed(2)}</p>
                  {aplicarIva && <p className="text-blue-400">IVA (16%): +{valorIva.toFixed(2)}</p>}
                  {valorDesconto > 0 && <p className="text-emerald-400">Desconto: -{valorDesconto.toFixed(2)}</p>}
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] block mb-1">Total a Pagar</span>
                <span className="text-4xl font-black italic text-white tracking-tighter">
                    {totalFinal.toFixed(2)}<small className="text-sm ml-1 opacity-50">{configLoja.moeda}</small>
                </span>
              </div>
            </div>

            {metodo === 'Dinheiro' && (
              <div className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/10">
                  <span className="text-[10px] font-black text-slate-400 uppercase whitespace-nowrap">Valor Entregue:</span>
                  <input 
                      type="number"
                      className="flex-1 bg-transparent text-right text-white font-black text-xl outline-none placeholder:text-slate-600"
                      placeholder="0.00"
                      value={valorRecebido}
                      onChange={e => setValorRecebido(e.target.value)}
                  />
                  <div className="text-right border-l border-white/10 pl-4">
                      <span className="text-[9px] text-slate-500 block">TROCO</span>
                      <span className="text-emerald-400 font-black">
                        {(Number(valorRecebido) - totalFinal > 0 ? Number(valorRecebido) - totalFinal : 0).toFixed(2)}
                      </span>
                  </div>
              </div>
            )}

            <button 
                onClick={finalizarVenda}
                disabled={carrinho.length === 0 || carregando}
                className={`w-full py-5 rounded-[2rem] font-black text-sm transition-all flex items-center justify-center gap-3 uppercase tracking-widest ${carrinho.length === 0 || carregando ? 'bg-white/5 text-white/20' : 'bg-blue-600 text-white hover:bg-blue-500 hover:scale-[1.02] shadow-xl shadow-blue-500/20 active:scale-95'}`}
            >
              {carregando ? (
                  <div className="flex items-center gap-2 animate-pulse">PROCESSANDO...</div>
              ) : (
                  <><CheckCircle2 size={22} /> {metodo === 'Aberto' ? 'LANÇAR NA CONTA (FIADO)' : config.botaoAcao}</>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {vendaFinalizada && (
        <Recibo 
          venda={vendaFinalizada} 
          configLoja={configLoja}
          fechar={() => { 
            setVendaFinalizada(null); 
            setCarrinho([]); 
            setInfoExtra('');
            setValorRecebido('');
            setReferencia('');
            setDesconto('');
            setAplicarIva(false);
            inputPesquisa.current?.focus();
          }} 
        />
      )}
    </>
  );
};

export default Caixa;