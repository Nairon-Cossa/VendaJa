import React, { useEffect } from 'react';
import { 
  Printer, Building2, ShieldCheck, 
  Globe, Phone 
} from 'lucide-react';

const ReciboA4 = ({ venda, configLoja = {}, fechar }) => {
  const moeda = configLoja.moeda || 'MT';

  useEffect(() => {
    if (venda) {
      const timer = setTimeout(() => {
        window.print();
      }, 1000); 
      return () => clearTimeout(timer);
    }
  }, [venda]);

  if (!venda) return null;

  const docId = venda.id ? String(venda.id).slice(-8).toUpperCase() : "00000000";
  const itensVenda = venda.itens || [];
  
  let dataEmissao = new Date();
  if (venda.timestamp?.seconds) {
    dataEmissao = new Date(venda.timestamp.seconds * 1000);
  } else if (venda.data) {
    dataEmissao = new Date(venda.data);
  }

  const DocumentoPagina = ({ tipo }) => (
    <div className="documento-a4 flex flex-col bg-white border-b border-slate-200 print:border-0 mx-auto shadow-2xl print:shadow-none box-border">
      
      {/* HEADER CORPORATIVO */}
      <div className="p-8 md:p-12 pb-6 md:pb-8 flex justify-between items-start border-b-2 border-slate-900">
        <div className="flex gap-6 items-center">
          {configLoja.logoUrl || configLoja.logo ? (
            <img 
              src={configLoja.logoUrl || configLoja.logo} 
              alt="Logo" 
              className="h-16 w-16 md:h-20 md:w-20 object-contain grayscale" 
            />
          ) : (
            <div className="h-12 w-12 md:h-16 md:w-16 bg-slate-100 flex items-center justify-center text-slate-400 rounded">
               <Building2 size={32} />
            </div>
          )}
          <div className="space-y-1">
            <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-slate-900 leading-none">
              {configLoja.nomeEmpresa || configLoja.nome || "EMPRESA NÃO CONFIGURADA"}
            </h1>
            <div className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-wider space-y-0.5">
              <p className="text-slate-800 font-black">NUIT: {configLoja.nuit || "--- --- ---"}</p>
              <p className="flex items-center gap-1.5"><Globe size={10}/> {configLoja.endereco || "Endereço Indisponível"}</p>
              <p className="flex items-center gap-1.5"><Phone size={10}/> {configLoja.telefone || "Contacto Indisponível"}</p>
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="inline-block border-2 border-slate-900 px-3 py-1.5 md:px-4 md:py-2 mb-4">
            <h2 className="text-lg md:text-xl font-black uppercase tracking-widest leading-none">
                {venda.tipoDocumento || "Factura"}
            </h2>
            <p className="text-[8px] md:text-[9px] font-black opacity-60 uppercase tracking-[0.2em] mt-1 text-center border-t border-slate-200 pt-1">{tipo}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nº Documento</p>
            <p className="text-base md:text-lg font-black text-slate-900 tabular-nums"># {docId}</p>
            <div className="pt-1">
              <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase">Data de Emissão</p>
              <p className="font-black text-slate-700 text-[10px] md:text-xs">
                {dataEmissao.toLocaleDateString('pt-MZ', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 md:p-12 pt-6 md:pt-8 flex-grow">
        {/* CLIENTE E INFOS */}
        <div className="grid grid-cols-12 gap-6 md:gap-8 mb-8 md:mb-10">
          <div className="col-span-7 border-l-4 border-slate-900 pl-4 md:pl-6 py-1">
             <h3 className="text-[8px] md:text-[9px] font-black uppercase text-slate-400 mb-2 tracking-widest">Facturar a:</h3>
             <p className="text-base md:text-lg font-black text-slate-900 uppercase leading-none mb-1">
                {venda.clienteNome || "Consumidor Final"}
             </p>
             <p className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                NUIT: {venda.clienteNuit || "--- --- ---"}
             </p>
             {venda.clienteEndereco && (
                <p className="text-[8px] md:text-[9px] font-medium text-slate-400 uppercase mt-1 italic">{venda.clienteEndereco}</p>
             )}
          </div>
          <div className="col-span-5 grid grid-cols-2 gap-2 md:gap-4 border border-slate-100 p-3 md:p-4 rounded-lg bg-slate-50/50">
             <div>
                <p className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase mb-1">Moeda</p>
                <p className="text-xs md:text-sm font-black text-slate-900">{moeda}</p>
             </div>
             <div>
                <p className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase mb-1">Pagamento</p>
                <p className="text-xs md:text-sm font-black text-slate-900 uppercase italic md:text-[10px]">{venda.metodo || "Numerário"}</p>
             </div>
          </div>
        </div>

        {/* TABELA DE ITENS */}
        <div className="mb-8 md:mb-10">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-slate-900 text-[9px] md:text-[10px] font-black uppercase tracking-wider text-slate-900">
                <th className="py-2 md:py-3 px-2 text-left">Descrição</th>
                <th className="py-2 md:py-3 px-2 text-center w-12 md:w-20">Qtd</th>
                <th className="py-2 md:py-3 px-2 text-right w-24 md:w-32">P. Unitário</th>
                <th className="py-2 md:py-3 px-2 text-right w-24 md:w-32">Total Item</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {itensVenda.map((item, idx) => (
                <tr key={idx} className="text-[10px] md:text-[11px] font-bold text-slate-700" style={{ pageBreakInside: 'avoid' }}>
                  <td className="py-3 md:py-4 px-2 uppercase text-slate-900 font-black">{item.nome || "Item sem nome"}</td>
                  <td className="py-3 md:py-4 px-2 text-center tabular-nums">{item.qtd || 1}</td>
                  <td className="py-3 md:py-4 px-2 text-right tabular-nums">{Number(item.preco || 0).toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}</td>
                  <td className="py-3 md:py-4 px-2 text-right font-black text-slate-900 tabular-nums">
                      { (Number(item.qtd || 1) * Number(item.preco || 0)).toLocaleString('pt-MZ', { minimumFractionDigits: 2 }) }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* RESUMO */}
        <div className="flex justify-end pt-4" style={{ pageBreakInside: 'avoid' }}>
          <div className="w-full max-w-[240px] md:max-w-[280px] space-y-2">
            <div className="flex justify-between text-[9px] md:text-[10px] font-bold text-slate-500 uppercase px-2">
              <span>Subtotal</span>
              <span className="tabular-nums">{Number(venda.subtotal || venda.total || 0).toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}</span>
            </div>
            {Number(venda.imposto) > 0 && (
                <div className="flex justify-between text-[9px] md:text-[10px] font-bold text-slate-500 uppercase px-2">
                <span>IVA (16%)</span>
                <span className="tabular-nums">{Number(venda.imposto).toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="bg-slate-900 text-white p-3 md:p-4 rounded-sm flex justify-between items-center mt-4">
              <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest">Total Geral</span>
              <div className="text-right leading-none">
                <span className="text-lg md:text-xl font-black tabular-nums">{Number(venda.total || 0).toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}</span>
                <span className="ml-1 text-[9px] md:text-[10px] font-bold opacity-70 uppercase">{moeda}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RODAPÉ */}
      <div className="p-8 md:p-12 pt-0 mt-auto" style={{ pageBreakInside: 'avoid' }}>
        <div className="grid grid-cols-2 gap-8 md:gap-16 text-center mb-8 md:mb-12">
          <div>
            <div className="h-[1px] bg-slate-300 w-full mb-2"></div>
            <p className="text-[7px] md:text-[8px] font-black uppercase text-slate-400 tracking-widest">Assinatura e Carimbo (Autorizada)</p>
          </div>
          <div>
            <div className="h-[1px] bg-slate-300 w-full mb-2"></div>
            <p className="text-[7px] md:text-[8px] font-black uppercase text-slate-400 tracking-widest">Conformidade do Cliente</p>
          </div>
        </div>

        <div className="flex justify-between items-end pt-4 md:pt-6 border-t border-slate-100 opacity-40">
          <div className="space-y-1">
             <p className="text-[7px] md:text-[8px] font-black uppercase tracking-[0.3em] text-slate-900">
               {configLoja.mensagemRecibo || "Obrigado por escolher os nossos serviços!"}
             </p>
             <p className="text-[6px] md:text-[7px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1">
               <ShieldCheck size={8}/> Software Certificado • VendaJá PRO V1.0
             </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-sm overflow-y-auto print:bg-white print:static print:overflow-visible flex flex-col">
      
      {/* BOTÕES DE AÇÃO - ESCONDIDOS NA IMPRESSÃO */}
      <div className="sticky top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 flex justify-center gap-4 print:hidden z-[10001]">
        <button 
          onClick={() => window.print()}
          className="bg-slate-900 text-white px-8 py-3 rounded-full font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all cursor-pointer"
        >
          <Printer size={16}/> Re-imprimir
        </button>
        <button 
          onClick={fechar}
          className="bg-white text-slate-900 border border-slate-200 px-8 py-3 rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all cursor-pointer"
        >
          Sair
        </button>
      </div>

      {/* ÁREA DE IMPRESSÃO */}
      <div className="print-container py-10 print:py-0 w-full flex flex-col items-center">
        <DocumentoPagina tipo="Original" />
        
        <div className="w-full max-w-[210mm] border-t-2 border-dashed border-slate-300 my-8 print:hidden relative">
            <span className="absolute left-1/2 -top-3 -translate-x-1/2 bg-slate-200 text-slate-500 px-4 py-1 rounded-full text-[8px] font-black uppercase text-center">Corte de Duplicado</span>
        </div>

        <DocumentoPagina tipo="Duplicado (Contabilidade)" />
      </div>

      {/* MAGIA DO CSS PARA RESOLVER OS CORTES */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;900&display=swap');
        
        .documento-a4 {
          width: 210mm;
          min-height: 297mm;
          font-family: 'Inter', sans-serif;
        }

        @media print {
          body * { visibility: hidden; }
          .print-container, .print-container * { visibility: visible; }
          
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0 !important;
            padding: 0 !important;
          }

          .documento-a4 {
            width: 100% !important;
            max-width: 100% !important;
            /* Em vez de 297mm, deixamos espaço para as margens reais da impressora (275mm) */
            min-height: 275mm !important; 
            height: auto !important; 
            page-break-after: always !important;
            margin: 0 !important;
            /* Box-sizing previne que paddings aumentem o tamanho final */
            box-sizing: border-box !important; 
          }

          .documento-a4:last-of-type {
            page-break-after: auto !important;
          }

          /* AQUI ESTÁ O SEGREDO: Damos 10mm de margem para a impressora não "comer" as bordas */
          @page { 
            size: A4 portrait; 
            margin: 10mm; 
          }
        }
      `}} />
    </div>
  );
};

export default ReciboA4;