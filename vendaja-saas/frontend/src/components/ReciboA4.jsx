import React from 'react';
import { Printer, X, User, Building2, ShieldCheck, Globe, Phone, FileText } from 'lucide-react';

const ReciboA4 = ({ venda, configLoja, fechar }) => {
  const moeda = configLoja.moeda || 'MT';

  const imprimir = () => {
    window.print();
  };

  const DocumentoPagina = ({ tipo }) => (
    <div className="bg-white p-16 mb-8 mx-auto w-[210mm] min-h-[297mm] shadow-none print:shadow-none print:m-0 print:break-after-page flex flex-col border-x border-slate-50 print:border-none">
      
      {/* CABEÇALHO PERSONALIZADO DO NEGÓCIO */}
      <div className="flex justify-between items-start border-b-4 border-slate-900 pb-10 mb-10">
        <div className="flex gap-6 items-center">
          {configLoja.logo ? (
            <img src={configLoja.logo} alt="Logo" className="h-24 w-24 object-contain rounded-xl" />
          ) : (
            <div className="h-24 w-24 bg-slate-100 border-2 border-slate-200 rounded-2xl flex items-center justify-center text-slate-400">
               <Building2 size={40} />
            </div>
          )}
          <div className="space-y-1">
            <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900 leading-none">
              {configLoja.nomeEmpresa || configLoja.nome || "A MINHA LOJA"}
            </h1>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider space-y-0.5">
              <p className="flex items-center gap-2"><Globe size={12}/> {configLoja.endereco || "Endereço não configurado"}</p>
              <p className="flex items-center gap-2"><ShieldCheck size={12}/> NUIT: {configLoja.nuit || "--- --- ---"}</p>
              <p className="flex items-center gap-2"><Phone size={12}/> {configLoja.telefone || "Contacto não disponível"}</p>
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="bg-slate-900 text-white px-8 py-4 rounded-2xl inline-block mb-4">
            <h2 className="text-2xl font-black uppercase tracking-widest">Factura Recibo</h2>
            <p className="text-[10px] font-bold opacity-60 uppercase tracking-[0.3em] text-center">{tipo}</p>
          </div>
          <div className="text-[12px] font-black text-slate-900 uppercase">
            <p className="text-slate-400 font-bold">Documento Nº</p>
            <p className="text-xl"># {venda.id?.slice(-8).toUpperCase()}</p>
            <p className="mt-2 text-slate-500 font-bold">Data: {new Date(venda.timestamp?.seconds * 1000 || Date.now()).toLocaleDateString('pt-MZ')}</p>
          </div>
        </div>
      </div>

      {/* ÁREA DO CLIENTE */}
      <div className="bg-slate-50 rounded-[2rem] p-8 mb-10 flex justify-between items-center border border-slate-100">
        <div>
          <h3 className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-[0.2em] flex items-center gap-2">
            <User size={12}/> Identificação do Cliente
          </h3>
          <p className="text-lg font-black text-slate-900 uppercase">{venda.clienteNome || venda.infoAdicional || "Consumidor Final"}</p>
          <p className="text-xs font-bold text-slate-500 mt-1 uppercase">Ref/NUIT: {venda.clienteNuit || "--- --- ---"}</p>
        </div>
        <div className="text-right border-l border-slate-200 pl-8">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Moeda Local</p>
          <p className="text-2xl font-black text-slate-900">{moeda}</p>
        </div>
      </div>

      {/* TABELA DE ITENS */}
      <div className="flex-grow">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em]">
              <th className="py-5 px-6 text-left rounded-l-2xl">Descrição do Produto/Serviço</th>
              <th className="py-5 px-6 text-center">Qtd</th>
              <th className="py-5 px-6 text-right">Preço Unit.</th>
              <th className="py-5 px-6 text-right rounded-r-2xl">Total ({moeda})</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {venda.itens.map((item, idx) => (
              <tr key={idx} className="text-[11px] font-bold text-slate-700">
                <td className="py-6 px-6 uppercase tracking-tight">{item.nome}</td>
                <td className="py-6 px-6 text-center text-slate-400 italic">{item.quantidade || item.qtd}</td>
                <td className="py-6 px-6 text-right">{(item.precoUnitario || item.preco).toFixed(2)}</td>
                <td className="py-6 px-6 text-right font-black text-slate-900">
                    { ((item.quantidade || item.qtd) * (item.precoUnitario || item.preco)).toFixed(2) }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* TOTAIS E FECHAMENTO */}
      <div className="mt-10 border-t-2 border-slate-100 pt-10">
        <div className="flex justify-between items-end">
          <div className="space-y-4">
            <div className="bg-slate-100 px-6 py-4 rounded-2xl inline-block border border-slate-200">
               <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Método de Liquidação</p>
               <p className="text-sm font-black text-slate-900 uppercase italic tracking-widest">{venda.metodoPagamento || venda.metodo || "Numerário"}</p>
            </div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-loose max-w-sm">
              <p>• {configLoja.mensagemRecibo || "Obrigado pela preferência!"}</p>
              <p>• Documento processado por software de gestão interna.</p>
            </div>
          </div>

          <div className="w-full max-w-[320px] space-y-2">
            <div className="flex justify-between items-center bg-slate-900 text-white p-6 rounded-[2rem] shadow-xl shadow-slate-200">
              <span className="text-sm font-black uppercase tracking-widest italic">Total Final</span>
              <div className="text-right">
                <span className="text-3xl font-black tabular-nums">{Number(venda.total).toFixed(2)}</span>
                <span className="ml-2 text-xs font-bold opacity-60 uppercase">{moeda}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ASSINATURAS */}
      <div className="grid grid-cols-2 gap-20 mt-16 text-center">
        <div>
          <div className="h-px bg-slate-200 w-full mb-4"></div>
          <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.3em]">Assinatura e Carimbo</p>
        </div>
        <div>
          <div className="h-px bg-slate-200 w-full mb-4"></div>
          <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.3em]">Confirmação do Cliente</p>
        </div>
      </div>

      {/* RODAPÉ DO SISTEMA (MUITO DISCRETO E PROFISSIONAL) */}
      <div className="mt-auto pt-10 flex justify-center items-center gap-2 opacity-20 print:opacity-10 grayscale">
        <FileText size={10} />
        <p className="text-[7px] font-black uppercase tracking-[0.4em]">Documento Original emitido via Sistema Profissional de Gestão</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/90 backdrop-blur-md overflow-y-auto pt-10 pb-20">
      <div className="fixed top-6 right-10 flex gap-4 print:hidden z-[10000]">
        <button 
          onClick={imprimir}
          className="bg-white text-slate-900 px-8 py-4 rounded-[1.5rem] font-black uppercase tracking-widest shadow-2xl hover:bg-slate-100 flex items-center gap-3 transition-all active:scale-95"
        >
          <Printer size={20}/> Imprimir
        </button>
        <button 
          onClick={fechar}
          className="bg-red-500 text-white p-4 rounded-[1.5rem] shadow-2xl hover:bg-red-600 transition-all active:scale-95"
        >
          <X size={24} />
        </button>
      </div>

      <div className="print:m-0">
        <DocumentoPagina tipo="Original" />
        <DocumentoPagina tipo="Duplicado (Contabilidade)" />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background: white !important; margin: 0 !important; padding: 0 !important; }
          .fixed { display: none !important; }
          @page { size: A4; margin: 0; }
          div { box-shadow: none !important; border-radius: 0 !important; }
        }
        * { font-family: 'Inter', 'Segoe UI', sans-serif; }
      `}} />
    </div>
  );
};

export default ReciboA4;