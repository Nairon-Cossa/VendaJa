import React from 'react';
import { Printer, X, User, Building2, ShieldCheck, Globe, Phone, FileText, CheckCircle2 } from 'lucide-react';

const ReciboA4 = ({ venda, configLoja, fechar }) => {
  const moeda = configLoja.moeda || 'MT';

  const imprimir = () => {
    window.print();
  };

  const DocumentoPagina = ({ tipo }) => (
    <div className="documento-a4 flex flex-col bg-white shadow-none print:shadow-none print:border-none border-x border-slate-100 mx-auto overflow-hidden">
      
      {/* CABEÇALHO REFINADO */}
      <div className="p-12 pb-8 flex justify-between items-start border-b-[6px] border-slate-900">
        <div className="flex gap-8 items-center">
          {configLoja.logoUrl || configLoja.logo ? (
            <img 
              src={configLoja.logoUrl || configLoja.logo} 
              alt="Logo" 
              className="h-28 w-28 object-contain rounded-2xl" 
            />
          ) : (
            <div className="h-24 w-24 bg-slate-50 border-2 border-slate-200 rounded-3xl flex items-center justify-center text-slate-300">
               <Building2 size={44} />
            </div>
          )}
          <div className="space-y-2">
            <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 leading-none">
              {configLoja.nomeEmpresa || configLoja.nome || "A MINHA LOJA"}
            </h1>
            <div className="text-[12px] font-bold text-slate-500 uppercase tracking-wide leading-relaxed">
              <p className="flex items-center gap-2 font-black text-slate-700 underline decoration-blue-500/30 underline-offset-4">
                <ShieldCheck size={14} className="text-blue-600"/> NUIT: {configLoja.nuit || "--- --- ---"}
              </p>
              <p className="flex items-center gap-2"><Globe size={13} className="text-slate-400"/> {configLoja.endereco || "Endereço não configurado"}</p>
              <p className="flex items-center gap-2"><Phone size={13} className="text-slate-400"/> {configLoja.telefone || "Contacto não disponível"}</p>
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="bg-slate-900 text-white px-10 py-5 rounded-3xl inline-block mb-6 shadow-xl shadow-slate-200 print:shadow-none">
            <h2 className="text-3xl font-black uppercase tracking-widest leading-none">Factura</h2>
            <p className="text-[11px] font-black opacity-70 uppercase tracking-[0.4em] mt-2 text-center border-t border-white/20 pt-2">{tipo}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Documento Nº</p>
            <p className="text-2xl font-black text-slate-900 tabular-nums"># {venda.id?.slice(-8).toUpperCase()}</p>
            <div className="flex flex-col items-end mt-2 pt-2 border-t border-slate-100">
              <p className="text-[11px] font-black text-slate-400 uppercase">Data de Emissão</p>
              <p className="font-black text-slate-700 text-sm">
                {new Date(venda.timestamp?.seconds * 1000 || Date.now()).toLocaleDateString('pt-MZ', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-12 pt-10 flex-grow">
        {/* ÁREA DO CLIENTE COM DESIGN DE CARTÃO */}
        <div className="grid grid-cols-12 gap-6 mb-12">
          <div className="col-span-8 bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5">
                <User size={80} />
             </div>
             <h3 className="text-[11px] font-black uppercase text-blue-600 mb-4 tracking-[0.25em] flex items-center gap-2">
                <User size={14}/> Dados do Cliente
             </h3>
             <p className="text-2xl font-black text-slate-900 uppercase leading-none mb-2">
                {venda.clienteNome || venda.infoAdicional || "Consumidor Final"}
             </p>
             <p className="text-xs font-black text-slate-500 uppercase tracking-widest bg-white/50 inline-block px-3 py-1 rounded-full border border-slate-200">
                NUIT: {venda.clienteNuit || "--- --- ---"}
             </p>
          </div>
          <div className="col-span-4 bg-slate-900 rounded-[2.5rem] p-8 text-white flex flex-col justify-center items-center">
             <p className="text-[10px] font-black opacity-50 uppercase tracking-[0.3em] mb-2">Moeda de Liquidação</p>
             <p className="text-4xl font-black">{moeda}</p>
          </div>
        </div>

        {/* TABELA DE ITENS PROFISSIONAL */}
        <div className="overflow-hidden rounded-[2rem] border border-slate-100 mb-12 shadow-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[11px] font-black uppercase tracking-[0.2em]">
                <th className="py-6 px-8 text-left">Descrição do Item</th>
                <th className="py-6 px-6 text-center">Qtd</th>
                <th className="py-6 px-6 text-right">Preço Unit.</th>
                <th className="py-6 px-8 text-right bg-slate-800">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {venda.itens.map((item, idx) => (
                <tr key={idx} className="text-[12px] font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                  <td className="py-6 px-8 uppercase tracking-tight font-black text-slate-900">{item.nome}</td>
                  <td className="py-6 px-6 text-center text-slate-500 font-black tabular-nums">{item.quantidade || item.qtd}</td>
                  <td className="py-6 px-6 text-right tabular-nums">{(item.precoUnitario || item.preco).toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}</td>
                  <td className="py-6 px-8 text-right font-black text-slate-900 bg-slate-50/50 tabular-nums">
                      { ((item.quantidade || item.qtd) * (item.precoUnitario || item.preco)).toLocaleString('pt-MZ', { minimumFractionDigits: 2 }) }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* RESUMO DE VALORES */}
        <div className="flex justify-between items-start gap-12">
          <div className="flex-grow space-y-6">
            <div className="bg-blue-50/50 border border-blue-100 px-8 py-6 rounded-[2rem]">
               <p className="text-[10px] font-black text-blue-600 uppercase mb-2 tracking-[0.2em]">Condições de Pagamento</p>
               <div className="flex items-center gap-3">
                  <div className="bg-blue-600 text-white p-2 rounded-xl">
                    <CheckCircle2 size={16} />
                  </div>
                  <p className="text-md font-black text-slate-900 uppercase italic tracking-widest">{venda.metodoPagamento || venda.metodo || "Numerário"}</p>
               </div>
            </div>
            <div className="text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-loose pl-2">
              <p className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-slate-300 rounded-full" /> {configLoja.mensagemRecibo || "Obrigado pela preferência!"}</p>
              <p className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-slate-300 rounded-full" /> Software certificado pela Autoridade Tributária.</p>
            </div>
          </div>

          <div className="w-full max-w-[350px]">
            <div className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-2xl shadow-slate-200 print:shadow-none relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-1 opacity-50">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Valor Bruto</span>
                  <span className="text-sm font-black tabular-nums">{Number(venda.total).toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="h-px bg-white/10 my-4"></div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-black uppercase tracking-[0.2em] italic">Total Geral</span>
                  <div className="text-right">
                    <span className="text-4xl font-black tabular-nums leading-none">{Number(venda.total).toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}</span>
                    <span className="ml-2 text-xs font-black opacity-50 uppercase">{moeda}</span>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
            </div>
          </div>
        </div>
      </div>

      {/* RODAPÉ DE AUTENTICAÇÃO */}
      <div className="p-12 pt-4 mt-auto">
        <div className="grid grid-cols-2 gap-20 text-center mb-12">
          <div>
            <div className="h-px bg-slate-200 w-full mb-4"></div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">Carimbo e Assinatura Autorizada</p>
          </div>
          <div>
            <div className="h-px bg-slate-200 w-full mb-4"></div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">Recebi em Conformidade</p>
          </div>
        </div>

        <div className="flex justify-between items-center pt-8 border-t border-slate-100 opacity-30 grayscale print:opacity-20">
          <div className="flex items-center gap-3">
             <FileText size={14} />
             <p className="text-[8px] font-black uppercase tracking-[0.4em]">Documento Processado por Computador • VendaJá Pro</p>
          </div>
          <p className="text-[8px] font-black uppercase tracking-[0.4em]">Página 1 / 1</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/95 backdrop-blur-xl overflow-y-auto pt-10 pb-20 print:p-0 print:bg-white">
      {/* BOTÕES DE CONTROLO */}
      <div className="fixed top-8 right-12 flex gap-4 print:hidden z-[10000]">
        <button 
          onClick={imprimir}
          className="bg-blue-600 text-white px-10 py-5 rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:bg-blue-700 flex items-center gap-3 transition-all active:scale-95 group"
        >
          <Printer size={20} className="group-hover:rotate-12 transition-transform"/> Imprimir Factura
        </button>
        <button 
          onClick={fechar}
          className="bg-white/10 text-white p-5 rounded-[2rem] backdrop-blur-md border border-white/20 hover:bg-red-500 hover:border-red-500 transition-all active:scale-95 group"
        >
          <X size={24} className="group-hover:rotate-90 transition-transform" />
        </button>
      </div>

      {/* CONTENTOR DE IMPRESSÃO */}
      <div className="print:m-0 print:p-0">
        <DocumentoPagina tipo="Original" />
        <div className="print:break-after-page mb-20 print:mb-0"></div>
        <DocumentoPagina tipo="Duplicado (Contabilidade)" />
      </div>

      {/* ESTILOS CRÍTICOS PARA PDF PERFEITO */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        
        @media print {
          body { 
            background: white !important; 
            margin: 0 !important; 
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .fixed, .print\\:hidden { display: none !important; }
          @page { 
            size: A4; 
            margin: 0; 
          }
          .documento-a4 {
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            border: none !important;
            page-break-after: always !important;
          }
        }

        .documento-a4 {
          width: 210mm;
          min-height: 297mm;
          font-family: 'Inter', sans-serif;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        /* Prevenir que o navegador adicione headers/footers dele */
        @page { margin: 0; }
      `}} />
    </div>
  );
};

export default ReciboA4;