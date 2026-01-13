import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase'; 
import { collection, getDocs, doc, updateDoc, getDoc } from "firebase/firestore";
import { 
  Loader2, Search, ShieldCheck, KeyRound, Eye, EyeOff, TrendingUp, 
  ShoppingBag, Store, Users, AlertCircle, CheckCircle2, DollarSign, Activity, Globe
} from 'lucide-react';

const SuperAdmin = () => {
  const [validado, setValidado] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erroValidacao, setErroValidacao] = useState('');
  const [clientes, setClientes] = useState([]);
  const [faturamentos, setFaturamentos] = useState({});
  const [busca, setBusca] = useState('');
  
  const [metricas, setMetricas] = useState({ totalLojas: 0, faturamentoGlobal: 0, totalVendas: 0, lojasAtivas: 0 });
  const [verCampos, setVerCampos] = useState({ pin: false, p1: false, p2: false, p3: false });
  const [desafios, setDesafios] = useState({ pin: '', pergunta1: '', pergunta2: '', pergunta3: '' });

  useEffect(() => {
    const user = auth.currentUser;
    if (!user || user.email !== "naironcossa.dev@gmail.com") {
      setErroValidacao("ACESSO RESTRITO: IDENTIDADE NÃO AUTORIZADA.");
    }
  }, []);

  useEffect(() => {
    if (validado) buscarDadosMestres();
  }, [validado]);

  const verificarDesafios = async (e) => {
    e.preventDefault();
    setCarregando(true);
    setErroValidacao('');

    try {
      const docSnap = await getDoc(doc(db, "master_config", "security_keys"));

      if (docSnap.exists()) {
        const keys = docSnap.data();
        const check = (val, target) => val.trim().toLowerCase() === target.toLowerCase();

        if (desafios.pin === keys.pin && 
            check(desafios.pergunta1, keys.p1) && 
            check(desafios.pergunta2, keys.p2) && 
            check(desafios.pergunta3, keys.p3)) {
          setValidado(true);
        } else {
          setErroValidacao('CHAVES DE ACESSO INVÁLIDAS.');
        }
      } else {
        setErroValidacao('ERRO CRÍTICO: CHAVES NÃO CONFIGURADAS.');
      }
    } catch (error) {
      setErroValidacao('ERRO DE COMUNICAÇÃO COM O NÚCLEO.');
    } finally {
      setCarregando(false);
    }
  };

  const buscarDadosMestres = async () => {
    try {
      setCarregando(true);
      const [snapUsers, snapVendas] = await Promise.all([
        getDocs(collection(db, "usuarios")),
        getDocs(collection(db, "vendas"))
      ]);

      const listaUsers = snapUsers.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const resumoFinanceiro = {};
      let globalMoney = 0;
      let globalSales = 0;

      snapVendas.docs.forEach(vendaDoc => {
        const venda = vendaDoc.data();
        const valor = Number(venda.total || 0);
        if (venda.lojaId) {
          if (!resumoFinanceiro[venda.lojaId]) resumoFinanceiro[venda.lojaId] = { total: 0, qtdVendas: 0 };
          resumoFinanceiro[venda.lojaId].total += valor;
          resumoFinanceiro[venda.lojaId].qtdVendas += 1;
          globalMoney += valor;
          globalSales += 1;
        }
      });

      setFaturamentos(resumoFinanceiro);
      setClientes(listaUsers.sort((a, b) => (b.criadoEm?.seconds || 0) - (a.criadoEm?.seconds || 0)));
      setMetricas({
        totalLojas: listaUsers.length,
        lojasAtivas: listaUsers.filter(u => u.status === 'ativo').length,
        faturamentoGlobal: globalMoney,
        totalVendas: globalSales
      });
    } catch (error) {
      console.error("Master Fetch Error:", error);
    } finally {
      setCarregando(false);
    }
  };

  const alterarStatus = async (uid, statusAtual) => {
    const novoStatus = statusAtual === 'ativo' ? 'suspenso' : 'ativo';
    if (!window.confirm(`CONFIRMAR ${novoStatus.toUpperCase()} DESTA UNIDADE?`)) return;
    try {
      await updateDoc(doc(db, "usuarios", uid), { status: novoStatus });
      setClientes(clientes.map(c => c.id === uid ? { ...c, status: novoStatus } : c));
      setMetricas(prev => ({
        ...prev,
        lojasAtivas: novoStatus === 'ativo' ? prev.lojasAtivas + 1 : prev.lojasAtivas - 1
      }));
    } catch (error) { alert("FALHA NA OPERAÇÃO."); }
  };

  if (!validado) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 font-sans">
        <form onSubmit={verificarDesafios} className="bg-slate-900 p-10 rounded-[3.5rem] shadow-[0_0_50px_rgba(30,64,175,0.2)] max-w-md w-full border border-slate-800 space-y-5 animate-in zoom-in duration-500">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-600 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-blue-900/50 border-4 border-slate-900">
              <KeyRound size={32} />
            </div>
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">HQ Master Access</h2>
            <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Nairon Cossa Dev . Inc</p>
          </div>

          {['pin', 'p1', 'p2', 'p3'].map((campo) => (
            <div key={campo} className="relative group">
              <input 
                type={verCampos[campo] ? "text" : "password"} 
                required 
                placeholder={campo === 'pin' ? "MASTER SECURITY PIN" : campo === 'p1' ? "FIRST PET NAME" : campo === 'p2' ? "SECRET DESTINATION" : "MASTER CODE"}
                className="w-full bg-slate-850 bg-slate-800/50 p-5 pr-14 rounded-2xl outline-none border border-slate-700 focus:border-blue-500 text-white font-bold text-xs transition-all placeholder:text-slate-600"
                value={desafios[campo === 'p1' ? 'pergunta1' : campo === 'p2' ? 'pergunta2' : campo === 'p3' ? 'pergunta3' : 'pin']}
                onChange={e => setDesafios({...desafios, [campo === 'p1' ? 'pergunta1' : campo === 'p2' ? 'pergunta2' : campo === 'p3' ? 'pergunta3' : 'pin']: e.target.value})}
              />
              <button type="button" onClick={() => setVerCampos(prev => ({...prev, [campo]: !prev[campo]}))} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-blue-400 transition-colors">
                {verCampos[campo] ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          ))}

          <button type="submit" disabled={carregando} className="w-full bg-blue-600 text-white p-6 rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] hover:bg-blue-500 transition-all shadow-xl active:scale-95 disabled:opacity-50">
            {carregando ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Desbloquear HQ"}
          </button>
          
          {erroValidacao && (
            <div className="bg-red-500/10 p-4 rounded-2xl border border-red-500/20 animate-in shake">
               <p className="text-red-500 text-[9px] font-black text-center uppercase tracking-widest">{erroValidacao}</p>
            </div>
          )}
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-12 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between mb-12 gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center text-white shadow-2xl relative">
              <ShieldCheck size={32} />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-4 border-white"></div>
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">VendaJá <span className="text-blue-600">HQ</span></h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="bg-slate-900 text-white text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-widest">SuperAdmin Mode</span>
                <span className="text-slate-400 text-[9px] font-bold uppercase flex items-center gap-1"><Globe size={10}/> Monitorização em Tempo Real</span>
              </div>
            </div>
          </div>

          <div className="relative group flex-1 max-w-md">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              className="bg-white shadow-2xl shadow-slate-200/50 p-5 pl-14 rounded-[2rem] w-full font-bold outline-none border-none text-sm focus:ring-4 ring-blue-50 transition-all"
              placeholder="Localizar loja, e-mail ou ID..." 
              value={busca} 
              onChange={(e) => setBusca(e.target.value)} 
            />
          </div>
        </header>

        {/* DASHBOARD METRICS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Unidades Registadas', val: metricas.totalLojas, icon: <Store />, color: 'text-slate-900' },
            { label: 'Lojas em Operação', val: metricas.lojasAtivas, icon: <Activity />, color: 'text-emerald-600' },
            { label: 'Volume Global (MT)', val: metricas.faturamentoGlobal.toLocaleString(), icon: <DollarSign />, color: 'text-blue-600' },
            { label: 'Vendas Processadas', val: metricas.totalVendas, icon: <ShoppingBag />, color: 'text-orange-600' }
          ].map((m, i) => (
            <div key={i} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all group">
              <div className={`w-12 h-12 rounded-2xl bg-slate-50 ${m.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                {m.icon}
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{m.label}</p>
              <p className={`text-3xl font-black ${m.color} tracking-tight`}>{m.val}</p>
            </div>
          ))}
        </div>

        {/* CLIENTS TABLE */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-8 mb-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Gestão de Unidades</h3>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{clientes.length} Lojas</span>
          </div>

          {carregando ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={48} /></div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {clientes.filter(c => 
                c.nomeLoja?.toLowerCase().includes(busca.toLowerCase()) || 
                c.email?.toLowerCase().includes(busca.toLowerCase())
              ).map((cliente) => {
                const fin = faturamentos[cliente.lojaId] || { total: 0, qtdVendas: 0 };
                const isAtivo = cliente.status === 'ativo';

                return (
                  <div key={cliente.id} className="bg-white border border-slate-100 rounded-[3rem] p-6 pr-10 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-8 hover:border-blue-200 transition-all group relative overflow-hidden">
                    <div className={`absolute left-0 top-0 bottom-0 w-2 ${isAtivo ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    
                    <div className="flex items-center gap-6 flex-1 w-full">
                      <div className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center text-white shadow-xl ${isAtivo ? 'bg-emerald-500 shadow-emerald-100' : 'bg-red-500 shadow-red-100'}`}>
                        <Store size={28} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-black text-slate-900 uppercase italic text-lg tracking-tighter">{cliente.nomeLoja || 'Sem Nome'}</h3>
                          {!isAtivo && <span className="bg-red-50 text-red-600 text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-tighter border border-red-100">Unidade Suspensa</span>}
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cliente.email} • ID: <span className="text-slate-600">{cliente.lojaId}</span></p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 w-full lg:w-auto lg:min-w-[320px]">
                      <div className="text-center lg:text-left">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1 justify-center lg:justify-start"><TrendingUp size={12} /> Receita</p>
                        <p className="text-xl font-black text-slate-900">{fin.total.toLocaleString()} <span className="text-xs opacity-40">MT</span></p>
                      </div>
                      <div className="text-center lg:text-left border-l border-slate-100 pl-6">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1 justify-center lg:justify-start"><ShoppingBag size={12} /> Vendas</p>
                        <p className="text-xl font-black text-slate-900">{fin.qtdVendas}</p>
                      </div>
                    </div>

                    <div className="flex gap-3 w-full lg:w-auto">
                      <button 
                        onClick={() => alterarStatus(cliente.id, cliente.status)}
                        className={`flex-1 lg:w-40 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 ${
                          isAtivo 
                          ? 'bg-white text-red-500 border border-red-100 hover:bg-red-500 hover:text-white' 
                          : 'bg-emerald-500 text-white hover:bg-emerald-600'
                        }`}
                      >
                        {isAtivo ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                        {isAtivo ? 'Suspender' : 'Reativar'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdmin;