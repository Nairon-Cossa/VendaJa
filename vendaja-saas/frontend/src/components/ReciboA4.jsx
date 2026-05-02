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
      }, 800); 
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
    <div className="documento-a4 flex flex-col bg-white mx-auto print:shadow-none box-border">
      
      {/* HEADER CORPORATIVO */}
      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
        <div className="flex gap-4 items-center">
          {configLoja.logoUrl || configLoja.logo ? (
            <img 
              src={configLoja.logoUrl || configLoja.logo} 
              alt="Logo" 
              className="h-16 w-16 object-contain grayscale" 
            />
          ) : (
            <div className="h-14 w-14 bg-slate-100 flex items-center justify-center text-slate-400 rounded">
               <Building2 size={28} />
            </div>
          )}
          <div className="space-y-0.5">
            <h1 className="text-xl font-black uppercase tracking-tight text-slate-900 leading-none">
              {configLoja.nomeEmpresa || configLoja.nome || "EMPRESA NÃO CONFIGURADA"}
            </h1>
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider space-y-0.5">
              <p className="text-slate-800 font-black">NUIT: {configLoja.nuit || "--- --- ---"}</p>
              <p className="flex items-center gap-1"><Globe size={10}/> {configLoja.endereco || "Endereço Indisponível"}</p>
              <p className="flex items-center gap-1"><Phone size={10}/> {configLoja.telefone || "Contacto Indisponível"}</p>
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="inline-block border-2 border-slate-900 px-3 py-1.5 mb-2">
            <h2 className="text-lg font-black uppercase tracking-widest leading-none">
                {venda.tipoDocumento || "Factura"}
            </h2>
            <p className="text-[8px] font-black opacity-60 uppercase tracking-[0.2em] mt-1 text-center border-t border-slate-200 pt-1">{tipo}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Nº Documento</p>
            <p className="text-base font-black text-slate-900 tabular-nums leading-none"># {docId}</p>
            <div className="pt-1">
              <p className="text-[8px] font-bold text-slate-400 uppercase leading-none">Data de Emissão</p>
              <p className="font-black text-slate-700 text-[10px] leading-none">
                {dataEmissao.toLocaleDateString('pt-MZ', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-grow">
        {/* CLIENTE E INFOS */}
        <div className="grid grid-cols-12 gap-6 mb-6">
          <div className="col-span-7 border-l-4 border-slate-900 pl-4 py-0.5">
             <h3 className="text-[8px] font-black uppercase text-slate-400 mb-1 tracking-widest">Facturar a:</h3>
             <p className="text-base font-black text-slate-900 uppercase leading-none mb-1">
                {venda.clienteNome || "Consumidor Final"}
             </p>
             <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                NUIT: {venda.clienteNuit || "--- --- ---"}
             </p>
             {venda.clienteEndereco && (
                <p className="text-[8px] font-medium text-slate-400 uppercase mt-1 italic">{venda.clienteEndereco}</p>
             )}
          </div>
          <div className="col-span-5 grid grid-cols-2 gap-2 border border-slate-100 p-3 rounded-lg bg-slate-50/50">
             <div>
                <p className="text-[7px] font-black text-slate-400 uppercase mb-0.5">Moeda</p>
                <p className="text-xs font-black text-slate-900">{moeda}</p>
             </div>
             <div>
                <p className="text-[7px] font-black text-slate-400 uppercase mb-0.5">Pagamento</p>
                <p className="text-xs font-black text-slate-900 uppercase italic text-[9px] leading-none">{venda.metodo || "Numerário"}</p>
             </div>
          </div>
        </div>

        {/* TABELA DE ITENS */}
        <div className="mb-6">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-slate-900 text-[9px] font-black uppercase tracking-wider text-slate-900">
                <th className="py-2 px-1 text-left">Descrição</th>
                <th className="py-2 px-1 text-center w-12">Qtd</th>
                <th className="py-2 px-1 text-right w-24">P. Unitário</th>
                <th className="py-2 px-1 text-right w-24">Total Item</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {itensVenda.map((item, idx) => (
                <tr key={idx} className="text-[10px] font-bold text-slate-700">
                  <td className="py-2.5 px-1 uppercase text-slate-900 font-black">{item.nome || "Item sem nome"}</td>
                  <td className="py-2.5 px-1 text-center tabular-nums">{item.qtd || 1}</td>
                  <td className="py-2.5 px-1 text-right tabular-nums">{Number(item.preco || 0).toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}</td>
                  <td className="py-2.5 px-1 text-right font-black text-slate-900 tabular-nums">
                      { (Number(item.qtd || 1) * Number(item.preco || 0)).toLocaleString('pt-MZ', { minimumFractionDigits: 2 }) }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* RESUMO */}
        <div className="flex justify-end pt-2 border-t border-slate-50">
          <div className="w-full max-w-[240px] space-y-1">
            <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase px-2">
              <span>Subtotal</span>
              <span className="tabular-nums">{Number(venda.subtotal || venda.total || 0).toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}</span>
            </div>
            {Number(venda.imposto) > 0 && (
                <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase px-2">
                <span>IVA (16%)</span>
                <span className="tabular-nums">{Number(venda.imposto).toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="bg-slate-900 text-white p-3 rounded-sm flex justify-between items-center mt-2">
              <span className="text-[10px] font-black uppercase tracking-widest">Total Geral</span>
              <div className="text-right leading-none">
                <span className="text-lg font-black tabular-nums">{Number(venda.total || 0).toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}</span>
                <span className="ml-1 text-[9px] font-bold opacity-70 uppercase">{moeda}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RODAPÉ */}
      <div className="pt-4 mt-auto">
        <div className="grid grid-cols-2 gap-12 text-center mb-6">
          <div>
            <div className="h-[1px] bg-slate-300 w-full mb-1"></div>
            <p className="text-[7px] font-black uppercase text-slate-400 tracking-widest">Assinatura e Carimbo (Autorizada)</p>
          </div>
          <div>
            <div className="h-[1px] bg-slate-300 w-full mb-1"></div>
            <p className="text-[7px] font-black uppercase text-slate-400 tracking-widest">Conformidade do Cliente</p>
          </div>
        </div>

        <div className="flex justify-between items-end pt-3 border-t border-slate-100 opacity-40">
          <div className="space-y-0.5">
             <p className="text-[7px] font-black uppercase tracking-[0.3em] text-slate-900">
               {configLoja.mensagemRecibo || "Obrigado por escolher os nossos serviços!"}
             </p>
             <p className="text-[6px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1">
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

      {/* ÁREA DE IMPRESSÃO - Comportamento em bloco rígido para impressão */}
      <div className="print-container py-10 print:py-0 w-full flex flex-col items-center print:block">
        <DocumentoPagina tipo="Original" />
        
        <div className="w-full max-w-[210mm] border-t-2 border-dashed border-slate-300 my-8 print:hidden relative">
            <span className="absolute left-1/2 -top-3 -translate-x-1/2 bg-slate-200 text-slate-500 px-4 py-1 rounded-full text-[8px] font-black uppercase text-center">Corte de Duplicado</span>
        </div>

        <DocumentoPagina tipo="Duplicado (Contabilidade)" />
      </div>

      {/* ESTILOS CSS ULTRARÍGIDOS PARA A4 PERFEITO */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;900&display=swap');
        
        .documento-a4 {
          width: 210mm;
          height: 296mm;
          max-height: 296mm;
          padding: 15mm;
          font-family: 'Inter', sans-serif;
          box-sizing: border-box;
          overflow: hidden;
          background-color: white;
        }

        @media print {
          html, body {
            width: 210mm;
            height: 297mm;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            background-color: white;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          /* Esconde tudo, exceto o recibo */
          body * { 
            visibility: hidden; 
          }

          .fixed, .print-container, .print-container * { 
            visibility: visible; 
          }
          
          /* Remove overlays na impressão e força fluxo do topo */
          .fixed {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            height: auto !important;
            background: white !important;
            overflow: visible !important;
          }

          .print-container {
            display: block !important;
            width: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .documento-a4 {
            display: flex !important;
            flex-direction: column !important;
            width: 210mm !important;
            height: 296mm !important; /* Altura exata da página A4 menos 1mm de segurança */
            max-height: 296mm !important;
            padding: 15mm !important; 
            margin: 0 !important;
            box-sizing: border-box !important;
            page-break-after: always !important;
            page-break-inside: avoid !important;
            overflow: hidden !important;
            background-color: white !important;
          }

          /* Remove a quebra no último item para evitar página em branco no final */
          .documento-a4:last-of-type {
            page-break-after: avoid !important;
          }

          @page { 
            size: A4 portrait; 
            margin: 0 !important; 
          }
        }
      `}} />
    </div>
  );
};

export default ReciboA4;