import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { 
  Users, UserPlus, Trash2, Shield, 
  UserCircle, Mail, Phone, Loader2, X, AlertCircle, Lock
} from 'lucide-react';

const Equipa = ({ usuario, avisar }) => {
  const [membros, setMembros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const [novoMembro, setNovoMembro] = useState({
    nome: '',
    email: '',
    telemovel: '',
    password: '', 
    role: 'caixa'
  });

  // 1. Carregar membros ligados a esta loja
  useEffect(() => {
    const targetLojaId = usuario?.lojaId || usuario?.uid;
    if (!targetLojaId) return;

    const q = query(
      collection(db, "usuarios"),
      where("lojaId", "==", targetLojaId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({
        id: doc.id, // O ID aqui será o email ou o UID do admin
        ...doc.data()
      }));
      // Filtra para não mostrar o próprio usuário logado na lista da equipa
      setMembros(lista.filter(m => m.email !== usuario.email));
      setCarregando(false);
    }, (error) => {
      console.error(error);
      avisar("ERRO AO CARREGAR EQUIPA", "erro");
    });

    return () => unsubscribe();
  }, [usuario, avisar]);

  // 2. Função para Adicionar Membro (USANDO EMAIL COMO ID)
  const adicionarMembro = async (e) => {
    e.preventDefault();
    setSalvando(true);

    try {
      const meuLojaId = usuario?.lojaId || usuario?.uid;
      const emailId = novoMembro.email.toLowerCase().trim(); // O ID será o email

      // Verificar se este email já existe para evitar sobreposição
      const docExistente = await getDoc(doc(db, "usuarios", emailId));
      if (docExistente.exists()) {
        avisar("ESTE E-MAIL JÁ ESTÁ REGISTADO NO SISTEMA.", "erro");
        setSalvando(false);
        return;
      }

      // Verificação de Limite de Plano
      const lojaRef = doc(db, "usuarios", meuLojaId);
      const lojaSnap = await getDoc(lojaRef);
      const dadosLoja = lojaSnap.data();

      const limiteMaximo = dadosLoja?.maxUsers || 1;
      const totalNoSistema = membros.length + 1;

      if (totalNoSistema >= limiteMaximo) {
        avisar(`BLOQUEADO: O teu limite é de ${limiteMaximo} utilizador(es).`, "erro");
        setSalvando(false);
        return;
      }

      const idFunc = `FUNC_${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      
      const dadosFuncionario = {
        uid: idFunc, // UID interno para referência
        nome: novoMembro.nome || '',
        email: emailId,
        telemovel: novoMembro.telemovel || '',
        password: novoMembro.password || idFunc,
        role: novoMembro.role || 'caixa',
        lojaId: meuLojaId || '',
        nomeLoja: usuario.nomeLoja || 'Minha Loja',
        status: 'ativo',
        adicionadoPor: usuario.nome || 'Admin',
        createdAt: new Date().toISOString()
      };

      // GRAVAÇÃO CRUCIAL: Usamos emailId (o email) como a chave do documento
      await setDoc(doc(db, "usuarios", emailId), dadosFuncionario);
      
      setMostrarModal(false);
      setNovoMembro({ nome: '', email: '', telemovel: '', password: '', role: 'caixa' });
      avisar("FUNCIONÁRIO ADICIONADO!", "sucesso");

    } catch (error) {
      console.error("Erro ao criar acesso:", error);
      avisar("ERRO AO CRIAR ACESSO", "erro");
    } finally {
      setSalvando(false);
    }
  };

  const removerMembro = async (id, nome) => {
    if (window.confirm(`Remover acesso de ${nome}?`)) {
      try {
        await deleteDoc(doc(db, "usuarios", id));
        avisar("ACESSO REMOVIDO", "sucesso");
      } catch (error) {
        avisar("ERRO AO REMOVER", "erro");
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 italic uppercase tracking-tighter">Gestão de Equipa</h2>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-widest mt-1">
            Controlo de Acessos: <span className="text-blue-600">{usuario.nomeLoja || 'Loja Local'}</span>
          </p>
        </div>
        
        <button 
          onClick={() => setMostrarModal(true)}
          className="bg-slate-900 text-white px-8 py-4 rounded-[2rem] font-black flex items-center justify-center gap-3 hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 active:scale-95 group"
        >
          <UserPlus size={20} className="group-hover:rotate-12 transition-transform" /> 
          <span className="uppercase tracking-widest text-xs">Adicionar Funcionário</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {carregando ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4 text-slate-400">
            <Loader2 className="animate-spin" size={32} />
            <p className="font-black text-[10px] uppercase tracking-[0.3em]">Validando Equipa...</p>
          </div>
        ) : membros.length === 0 ? (
          <div className="col-span-full bg-white p-20 rounded-[3rem] text-center border border-slate-100 flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                <Users size={32} />
            </div>
            <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Apenas tu (Dono) tens acesso no momento.</p>
          </div>
        ) : (
          membros.map(membro => (
            <div key={membro.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6">
                <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-xl tracking-widest ${
                  membro.role === 'admin' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  {membro.role}
                </span>
              </div>

              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mb-6">
                <UserCircle size={32} />
              </div>
              
              <div className="space-y-1">
                <h3 className="font-black text-slate-900 uppercase text-lg italic tracking-tight">{membro.nome}</h3>
                <p className="text-xs font-bold text-slate-400 truncate">{membro.email}</p>
                <div className="mt-4 flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-dashed border-slate-200">
                  <Lock size={12} className="text-slate-400" />
                  <span className="text-[10px] font-mono font-bold text-slate-600">Senha: {membro.password}</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-50">
                <button 
                  onClick={() => removerMembro(membro.id, membro.nome)}
                  className="w-full py-4 rounded-2xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest"
                >
                  <Trash2 size={14} /> Revogar Acesso
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL ADICIONAR */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden">
            <div className="p-10 pb-6 flex justify-between items-center">
              <h2 className="text-2xl font-black text-slate-900 italic uppercase tracking-tighter">Novo Acesso</h2>
              <button onClick={() => setMostrarModal(false)} className="text-slate-400 hover:text-red-500"><X size={24}/></button>
            </div>

            <form onSubmit={adicionarMembro} className="p-10 pt-0 space-y-5">
              <input 
                required 
                placeholder="Nome do Funcionário"
                className="w-full bg-slate-50 p-5 rounded-2xl font-bold outline-none focus:bg-white border-2 border-transparent focus:border-blue-500 transition-all text-slate-900" 
                value={novoMembro.nome} 
                onChange={e => setNovoMembro({...novoMembro, nome: e.target.value})} 
              />

              <input 
                required 
                type="email" 
                placeholder="E-mail de Login"
                className="w-full bg-slate-50 p-5 rounded-2xl font-bold outline-none focus:bg-white border-2 border-transparent focus:border-blue-500 transition-all text-slate-900" 
                value={novoMembro.email} 
                onChange={e => setNovoMembro({...novoMembro, email: e.target.value})} 
              />

              <div className="relative">
                <input 
                  required 
                  type="text"
                  placeholder="Definir Senha de Acesso"
                  className="w-full bg-slate-50 p-5 rounded-2xl font-bold outline-none focus:bg-white border-2 border-transparent focus:border-blue-500 transition-all pr-12 text-slate-900" 
                  value={novoMembro.password} 
                  onChange={e => setNovoMembro({...novoMembro, password: e.target.value})} 
                />
                <Lock className="absolute right-5 top-5 text-slate-300" size={20} />
              </div>

              <input 
                placeholder="Telemóvel (Opcional)"
                className="w-full bg-slate-50 p-5 rounded-2xl font-bold outline-none focus:bg-white border-2 border-transparent focus:border-blue-500 transition-all text-slate-900" 
                value={novoMembro.telemovel} 
                onChange={e => setNovoMembro({...novoMembro, telemovel: e.target.value})} 
              />

              <select 
                className="w-full bg-slate-50 p-5 rounded-2xl font-bold outline-none text-slate-900"
                value={novoMembro.role} 
                onChange={e => setNovoMembro({...novoMembro, role: e.target.value})}
              >
                <option value="caixa">Acesso: Apenas Vendas (Caixa)</option>
                <option value="admin">Acesso: Gestor (Admin)</option>
              </select>

              <button 
                type="submit"
                disabled={salvando} 
                className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black mt-4 flex items-center justify-center gap-3 hover:bg-blue-600 transition-all disabled:opacity-50"
              >
                {salvando ? <Loader2 className="animate-spin" size={18} /> : "CRIAR CREDENCIAIS"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Equipa;