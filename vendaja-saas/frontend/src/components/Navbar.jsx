import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  LogOut, 
  Store,
  Wifi,
  WifiOff,
  Settings // Importação necessária
} from 'lucide-react';

const Navbar = ({ usuario, fazerLogout, isOnline }) => {
  const location = useLocation();
  
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
        
        <div className="flex items-center gap-10">
          {/* LOGO */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-100">
              <Store size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tighter uppercase italic leading-none">VendaJá</h1>
              <div className="flex items-center gap-1 mt-1">
                {isOnline ? <Wifi size={10} className="text-emerald-500" /> : <WifiOff size={10} className="text-orange-500" />}
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  {isOnline ? 'Cloud Sync' : 'Offline Mode'}
                </span>
              </div>
            </div>
          </div>

          {/* LINKS DE NAVEGAÇÃO */}
          <div className="hidden md:flex items-center gap-1">
            {usuario.role === 'admin' && (
              <Link to="/" className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${isActive('/') ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                <LayoutDashboard size={18} /> Painel
              </Link>
            )}
            
            <Link to="/caixa" className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${isActive('/caixa') ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>
              <ShoppingCart size={18} /> Vender
            </Link>
            
            <Link to="/inventario" className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${isActive('/inventario') ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>
              <Package size={18} /> Stock
            </Link>

            {/* NOVO LINK: DEFINIÇÕES (Apenas visível para Admin) */}
            {usuario.role === 'admin' && (
              <Link to="/definicoes" className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${isActive('/definicoes') ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                <Settings size={18} /> Definições
              </Link>
            )}
          </div>
        </div>

        {/* USER & LOGOUT */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end border-r border-slate-100 pr-6">
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.15em] mb-1">
              {usuario.tipoNegocio || 'Empresa'}
            </span>
            <span className="text-sm font-black text-slate-800">
              {usuario.nome}
            </span>
          </div>
          
          <button 
            onClick={fazerLogout}
            className="flex items-center gap-3 text-slate-400 hover:text-red-500 font-black transition-all group p-2 hover:bg-red-50 rounded-xl"
            title="Sair do Sistema"
          >
            <span className="text-[10px] uppercase tracking-widest hidden lg:block">Sair</span>
            <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>
    </nav>
  );
};

export default Navbar;