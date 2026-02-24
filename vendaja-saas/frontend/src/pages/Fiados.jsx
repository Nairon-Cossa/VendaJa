import React, { useEffect, useState, useMemo } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, orderBy } from "firebase/firestore";
import { 
  CheckCircle2, AlertCircle, Eye, X, Loader2, Printer, Search
} from 'lucide-react';

const Fiados = ({ usuario, configLoja, avisar }) => {
  const [dividas, setDividas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [pesquisa, setPesquisa] = useState('');
  const [filtroTempo, setFiltroTempo] = useState('todos'); 
  const [filtroValor, setFiltroValor] = useState('recente'); 
  const [processandoId, setProcessandoId] = useState(null);
  const [vendaSelecionada, setVendaSelecionada] = useState(null);

  // Garantir que usamos o ID da empresa mestre para os dados financeiros
  const empresaId = usuario?.empresaId || usuario?.uid;

  useEffect(() => {
    if (empresaId) {
      buscarDividas();
    }
  }, [empresaId]);

  const buscarDividas = async () => {
    try {
      setCarregando(true);
      // Busca vendas pendentes atreladas à empresa
      const q = query(
        collection(db, "vendas"),
        where("empresaId", "==", empresaId),
        where("status", "==", "PENDENTE"),
        orderBy("data", "desc")
      );

      const snap = await getDocs(q);
      const lista = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDividas(lista);
    } catch (error) {
      console.error("Erro ao buscar fiados:", error);
      avisar?.("ERRO AO CARREGAR REGISTOS", "erro");
    } finally {
      setCarregando(false);
    }
  };

  const liquidarDivida = async (vendaId) => {
    if (!window.confirm("CONFIRMAR RECEBIMENTO TOTAL DESTA DÍVIDA?")) return;
    
    setProcessandoId(vendaId);
    try {
      const vendaRef = doc(db, "vendas", vendaId);
      await updateDoc(vendaRef, {
        status: "PAGO",
        dataLiquidacao: new Date().toISOString(),
        // Mantemos o registro de que nasceu de uma dívida para fins de histórico
        origemPagamento: "Dívida Liquidada",
        metodo: "Dinheiro",
        liquidadoPor: usuario.nome || "Sistema"
      });

      setDividas(dividas.filter(d => d.id !== vendaId));
      setVendaSelecionada(null);
      avisar?.("CONTA LIQUIDADA COM SUCESSO", "sucesso");
    } catch (error) {
      console.error(error);
      avisar?.("FALHA NA OPERAÇÃO", "erro");
    } finally {
      setProcessandoId(null);
    }
  };

  const imprimirExtrato = (venda) => {
    const janelaImpressao = window.open('', '_blank');
    janelaImpressao.document.write(`
      <html>
        <head>
          <title>EXTRATO DE DÍVIDA - ${configLoja?.nomeOficial || 'LOJA'}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
            .header { border-bottom: 3px solid #000; padding-bottom: 20px; margin-bottom: 20px; text-align: center; }
            .loja-nome { font-size: 28px; font-weight: 900; text-transform: uppercase; letter-spacing: -1px; }
            .titulo { font-size: 14px; margin-top: 5px; font-weight: 800; color: #64748b; letter-spacing: 2px; }
            .dados { margin-bottom: 30px; font-size: 13px; background: #f8fafc; padding: 20px; border-radius: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { text-align: left; border-bottom: 2px solid #e2e8f0; padding: 12px; font-size: 11px; text-transform: uppercase; color: #64748b; }
            td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 600; }
            .total-container { margin-top: 30px; text-align: right; border-top: 3px solid #000; padding-top: 15px; }
            .total-valor { font-size: 26px; font-weight: 900; color: #000; }
            .rodape { margin-top: 50px; font-size: 10px; text-align: center; color: #94a3b8; border-top: 1px dashed #e2e8f0; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="loja-nome">${configLoja?.nomeOficial || 'A MINHA LOJA'}</div>
            <div class="titulo">EXTRATO DE DÉBITO PENDENTE</div>
          </div>
          <div class="dados">
            <strong>CLIENTE:</strong> ${venda.infoAdicional?.toUpperCase() || 'NÃO ESPECIFICADO'}<br/>
            <strong>DATA DA COMPRA:</strong> ${new Date(venda.data).toLocaleDateString()}<br/>
            <strong>REFERÊNCIA:</strong> #FT-${venda.id.slice(-6).toUpperCase()}
          </div>
          <table>
            <thead>
              <tr>
                <th>PRODUTO</th>
                <th style="text-align: center">QTD</th>
                <th style="text-align: right">PREÇO</th>
                <th style="text-align: right">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${venda.itens.map(it => `
                <tr>
                  <td>${it.nome.toUpperCase()}</td>
                  <td style="text-align: center">${it.qtd}</td>
                  <td style="text-align: right">${Number(it.preco).toFixed(2)}</td>
                  <td style="text-align: right">${(Number(it.preco) * Number(it.qtd)).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total-container">
            <div style="font-size: 10px; font-weight: 800; color: #64748b;">VALOR TOTAL EM DÍVIDA</div>
            <div class="total-valor">${Number(venda.total).toFixed(2)} ${configLoja?.moeda || 'MT'}</div>
          </div>
          <div class="rodape">
            Este documento é um extrato de conta corrente para conferência.<br/>
            Gerado em ${new Date().toLocaleString()}
          </div>
        </body>
      </html>
    `);
    janelaImpressao.document.close();
    janelaImpressao.print();
  };

  const dadosFiltrados = useMemo(() => {
    let resultado = dividas.filter(d => 
      d.infoAdicional?.toLowerCase().includes(pesquisa.toLowerCase()) ||
      d.id.toLowerCase().includes(pesquisa.toLowerCase())
    );

    const agora = new Date();
    if (filtroTempo === 'hoje') {
      resultado = resultado.filter(d => new Date(d.data).toDateString() === agora.toDateString());
    } else if (filtroTempo === 'antigo') {
      const umaSemanaAtras = new Date();
      umaSemanaAtras.setDate(agora.getDate() - 7);
      resultado = resultado.filter(d => new Date(d.data) < umaSemanaAtras);
    }

    if (filtroValor === 'maior_valor') {
      resultado.sort((a, b) => b.total - a.total);
    } else {
      resultado.sort((a, b) => new Date(b.data) - new Date(a.data));
    }

    return resultado;
  }, [dividas, pesquisa, filtroTempo, filtroValor]);

  const totalEmAberto = dadosFiltrados.reduce((acc, d) => acc + Number(d.total), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white p-8 rounded-[2rem] border border-slate-200 flex flex-col justify-between shadow-sm">
            <div>
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">
                    Contas a <span className="text-blue-600">Receber</span>
                </h2>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                    Gestão de crédito concedido e cobranças
                </p>
            </div>
            <div className="flex flex-wrap gap-2 mt-8">
                {['todos', 'hoje', 'antigo'].map(f => (
                    <button 
                        key={f}
                        onClick={() => setFiltroTempo(f)}
                        className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${filtroTempo === f ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'}`}
                    >
                        {f === 'antigo' ? 'Dívidas Críticas (+7 Dias)' : f}
                    </button>
                ))}
            </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-[2rem] text-white relative overflow-hidden shadow-xl">
            <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Total Pendente</p>
                <h3 className="text-4xl font-black tabular-nums italic">
                    {totalEmAberto.toLocaleString()} <span className="text-sm font-bold text-blue-400">{configLoja?.moeda || 'MT'}</span>
                </h3>
                <div className="mt-4 flex items-center gap-2 text-rose-400 font-black text-[10px] uppercase italic">
                    <AlertCircle size={14}/> {dadosFiltrados.length} clientes em débito
                </div>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10">
                 <AlertCircle size={120} />
            </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
          <input 
            className="w-full bg-white p-5 pl-14 rounded-2xl border-2 border-slate-100 outline-none focus:border-blue-500 font-bold text-sm text-slate-700 transition-all shadow-sm"
            placeholder="PESQUISAR NOME DO CLIENTE OU RECIBO..."
            value={pesquisa}
            onChange={e => setPesquisa(e.target.value)}
          />
        </div>
        <select 
            className="bg-white px-6 py-5 rounded-2xl border-2 border-slate-100 font-black text-[10px] uppercase text-slate-500 outline-none cursor-pointer hover:border-slate-300 transition-all shadow-sm"
            value={filtroValor}
            onChange={e => setFiltroValor(e.target.value)}
        >
            <option value="recente">Ordenar por Data</option>
            <option value="maior_valor">Ordenar por Maior Valor</option>
        </select>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase italic">
                <th className="p-8">Identificação Cliente</th>
                <th className="p-8">Estado da Dívida</th>
                <th className="p-8 text-right">Valor em Aberto</th>
                <th className="p-8 text-right">Acções de Cobrança</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {carregando ? (
                  <tr><td colSpan="4" className="p-20 text-center"><Loader2 className="animate-spin inline text-blue-600" size={32}/></td></tr>
              ) : dadosFiltrados.length === 0 ? (
                  <tr><td colSpan="4" className="p-20 text-center text-slate-400 font-bold uppercase text-xs">Nenhum registo de dívida encontrado</td></tr>
              ) : dadosFiltrados.map((item) => {
                  const dias = Math.floor((new Date() - new Date(item.data)) / (1000 * 60 * 60 * 24));
                  return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                          <td className="p-8">
                              <div className="font-black text-slate-800 uppercase text-sm tracking-tighter">{item.infoAdicional || "Cliente S/ Nome"}</div>
                              <div className="text-[9px] text-slate-400 font-bold mt-1 uppercase">Venda: #{item.id.slice(-6).toUpperCase()} • {new Date(item.data).toLocaleDateString()}</div>
                          </td>
                          <td className="p-8">
                              <span className={`text-[9px] font-black px-4 py-2 rounded-lg uppercase border-2 ${dias >= 7 ? 'border-rose-100 bg-rose-50 text-rose-600 animate-pulse' : 'border-slate-100 bg-white text-slate-400'}`}>
                                  {dias === 0 ? 'Dívida de Hoje' : `${dias} Dias em Atraso`}
                              </span>
                          </td>
                          <td className="p-8 text-right font-black text-slate-900 text-lg tabular-nums italic">
                              {Number(item.total).toFixed(2)}
                          </td>
                          <td className="p-8 text-right flex justify-end gap-2">
                              <button onClick={() => imprimirExtrato(item)} className="p-4 text-slate-400 hover:text-slate-900 border-2 border-slate-50 rounded-2xl hover:bg-white transition-all shadow-sm" title="Imprimir Extrato">
                                  <Printer size={18} />
                              </button>
                              <button onClick={() => setVendaSelecionada(item)} className="p-4 text-slate-400 hover:text-blue-600 border-2 border-slate-50 rounded-2xl hover:bg-white transition-all shadow-sm">
                                  <Eye size={18} />
                              </button>
                              <button 
                                  disabled={processandoId === item.id}
                                  onClick={() => liquidarDivida(item.id)}
                                  className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
                              >
                                  {processandoId === item.id ? '...' : 'Liquidar'}
                              </button>
                          </td>
                      </tr>
                  )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {vendaSelecionada && (
          <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-xl rounded-[3rem] overflow-hidden shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300">
                  <div className="p-10 flex justify-between items-start">
                      <div>
                          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1 italic">Venda a Crédito</p>
                          <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">{vendaSelecionada.infoAdicional || "Sem Nome"}</h3>
                          <p className="text-slate-400 text-[10px] font-bold">Referência: {vendaSelecionada.id}</p>
                      </div>
                      <button onClick={() => setVendaSelecionada(null)} className="bg-slate-100 p-3 rounded-2xl text-slate-400 hover:text-rose-500 transition-all"><X size={20}/></button>
                  </div>
                  
                  <div className="px-10 space-y-3 max-h-[300px] overflow-y-auto">
                      {vendaSelecionada.itens.map((it, idx) => (
                          <div key={idx} className="flex justify-between items-center p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                              <div>
                                <span className="block font-black text-slate-800 uppercase text-xs">{it.nome}</span>
                                <span className="text-[10px] text-slate-400 font-bold">{it.qtd} Unidades x {Number(it.preco).toFixed(2)}</span>
                              </div>
                              <span className="font-black text-slate-900 tabular-nums">{(it.preco * it.qtd).toFixed(2)}</span>
                          </div>
                      ))}
                  </div>

                  <div className="p-10 bg-white">
                      <div className="flex justify-between items-center mb-8 p-6 bg-slate-900 rounded-[2rem] text-white">
                          <span className="text-[10px] font-black uppercase text-white/40 italic">Total a Receber</span>
                          <span className="text-3xl font-black italic tabular-nums">{Number(vendaSelecionada.total).toFixed(2)} <small className="text-xs text-blue-400">{configLoja?.moeda || 'MT'}</small></span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button onClick={() => imprimirExtrato(vendaSelecionada)} className="flex items-center justify-center gap-3 border-2 border-slate-100 py-5 rounded-2xl font-black uppercase text-[10px] hover:bg-slate-50 transition-all text-slate-600">
                            <Printer size={18}/> Imprimir
                        </button>
                        <button 
                          onClick={() => liquidarDivida(vendaSelecionada.id)} 
                          className="flex items-center justify-center gap-3 bg-blue-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] hover:bg-slate-900 transition-all shadow-xl shadow-blue-200"
                        >
                            <CheckCircle2 size={18}/> Confirmar Pagamento
                        </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Fiados;