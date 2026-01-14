import React from 'react';
import { Printer, X, CheckCircle, Store, Hash } from 'lucide-react'; // Adicionei Hash icon

const Recibo = ({ venda, configLoja, fechar, nomeSistema = "VENDA JÁ PRO" }) => {
  
  const imprimir = () => {
    window.print();
  };

  const logoExibir = venda.configRecibo?.logo || configLoja.logoUrl || configLoja.logo;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4 overflow-y-auto font-sans">
      
      {/* BOTÕES DE ACÇÃO */}
      <div className="absolute top-6 right-6 flex gap-3 print:hidden">
        <button 
          onClick={imprimir}
          className="bg-blue-600 text-white p-4 rounded-2xl shadow-xl hover:bg-blue-700 transition-all flex items-center gap-2 font-black uppercase text-[10px] tracking-widest"
        >
          <Printer size={18} /> Imprimir Recibo
        </button>
        <button 
          onClick={fechar}
          className="bg-white text-slate-900 p-4 rounded-2xl shadow-xl hover:bg-slate-100 transition-all border border-slate-200"
        >
          <X size={18} />
        </button>
      </div>

      {/* ÁREA DO RECIBO */}
      <div className="bg-white w-full max-w-[380px] p-8 shadow-2xl rounded-[2.5rem] print:shadow-none print:rounded-none print:p-0 print:m-0" id="recibo-content">
        
        {/* CABEÇALHO */}
        <div className="text-center space-y-2 mb-6 border-b-2 border-dashed border-slate-100 pb-6">
          {logoExibir ? (
            <img 
              src={logoExibir} 
              alt="Logo" 
              className="h-16 mx-auto mb-3 object-contain rounded-lg" 
            />
          ) : (
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400">
               <Store size={24} />
            </div>
          )}

          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 leading-tight">
            {venda.lojaNome || configLoja.nome || "A MINHA LOJA"}
          </h2>
          
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-tight">
              {venda.configRecibo?.endereco || configLoja.endereco || "Moçambique"}
            </p>
            <p className="text-[10px] font-black text-slate-500">
              TEL: {venda.configRecibo?.telefone || configLoja.telefone || "--- --- ---"}
            </p>
            {(venda.configRecibo?.nuit || configLoja.nuit) && (
              <p className="text-[9px] font-black text-slate-800 bg-slate-100 inline-block px-2 py-0.5 rounded mt-1">
                NUIT: {venda.configRecibo?.nuit || configLoja.nuit}
              </p>
            )}
          </div>
        </div>

        {/* INFO DA VENDA */}
        <div className="space-y-1.5 mb-6 text-[11px] font-bold text-slate-600 uppercase">
          <div className="flex justify-between">
            <span>Doc: Venda a Dinheiro</span>
            <span className="text-slate-900">ID: #{venda.id?.slice(-6).toUpperCase()}</span>
          </div>
          <div className="flex justify-between">
            <span>Data: {new Date(venda.data).toLocaleDateString()}</span>
            <span>Hora: {new Date(venda.data).toLocaleTimeString()}</span>
          </div>
          <div className="flex justify-between border-t border-slate-50 pt-1.5 mt-1.5 text-slate-900">
            <span>Vendedor: {venda.vendedorNome || 'Sistema'}</span>
            <span className="bg-blue-50 px-1.5 rounded text-blue-700">Ref: {venda.infoAdicional || 'BALCÃO'}</span>
          </div>
        </div>

        {/* TABELA DE ITENS */}
        <table className="w-full mb-6">
          <thead>
            <tr className="text-[9px] font-black text-slate-400 uppercase border-b border-slate-100">
              <th className="text-left py-2">Item</th>
              <th className="text-center py-2">Qtd</th>
              <th className="text-right py-2">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 border-b border-slate-100">
            {venda.itens.map((item, idx) => (
              <tr key={idx} className="text-[11px] font-bold text-slate-800">
                <td className="py-3 uppercase leading-tight pr-2">{item.nome}</td>
                <td className="py-3 text-center">{item.qtd}</td>
                <td className="py-3 text-right">{(item.preco * item.qtd).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* TOTAIS E PAGAMENTO - AQUI ESTÁ O UPDATE PARA O TEU PROBLEMA */}
        <div className="space-y-2 border-t-2 border-slate-900 pt-4 mb-8">
          <div className="flex justify-between items-end">
            <span className="text-sm font-black uppercase italic text-slate-900">Total Pago</span>
            <span className="text-2xl font-black text-slate-900 tracking-tighter tabular-nums">
              {venda.total.toFixed(2)} <small className="text-[10px] uppercase font-bold text-slate-400">{configLoja.moeda || 'MT'}</small>
            </span>
          </div>
          
          <div className="flex justify-between text-[10px] font-black text-blue-600 uppercase pt-2">
            <span>Forma de Pagamento:</span>
            <span className="bg-blue-50 px-2 py-0.5 rounded">{venda.metodo}</span>
          </div>

          {/* NOVO: MOSTRA A REFERÊNCIA DO SMS SE EXISTIR (RESOLVE O TEU PROBLEMA) */}
          {venda.referencia && (
            <div className="flex justify-between text-[10px] font-black text-red-600 uppercase border-y border-dashed border-red-100 py-2 my-1">
              <span className="flex items-center gap-1"><Hash size={10}/> Ref. Transação:</span>
              <span className="font-mono">{venda.referencia}</span>
            </div>
          )}

          {venda.troco > 0 && (
            <div className="flex justify-between text-[10px] font-black text-emerald-600 uppercase pt-1">
              <span>Troco:</span>
              <span>{venda.troco.toFixed(2)} {configLoja.moeda || 'MT'}</span>
            </div>
          )}
        </div>

        {/* RODAPÉ */}
        <div className="text-center space-y-6">
          <div className="flex flex-col items-center gap-1.5">
             <CheckCircle size={22} className="text-emerald-500 mb-1" />
             <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Obrigado pela preferência!</p>
             <p className="text-[9px] font-medium text-slate-400 italic">
                {venda.configRecibo?.mensagem || configLoja.mensagemRecibo || "Volte sempre!"}
             </p>
          </div>
          
          <div className="pt-6 border-t border-dashed border-slate-100 flex flex-col items-center gap-2">
            <div className="flex items-center gap-1.5 opacity-80">
                <div className="w-5 h-5 bg-slate-950 rounded-lg flex items-center justify-center text-white font-bold text-[8px]">VJ</div>
                <span className="text-[10px] font-black italic text-slate-900 uppercase tracking-tighter">VendaJá <span className="text-blue-600">Pro</span></span>
            </div>
            <p className="text-[7px] font-black text-slate-300 uppercase tracking-[0.4em]">
                Software de Gestão Moçambicano
            </p>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; }
          #recibo-content, #recibo-content * { visibility: visible; }
          #recibo-content { 
            position: fixed; 
            left: 0;
            top: 0; 
            width: 100%;
            height: auto;
            padding: 0;
            margin: 0;
            box-shadow: none !important;
          }
          @page { size: 80mm auto; margin: 0; }
        }
      `}} />
    </div>
  );
};

export default Recibo;