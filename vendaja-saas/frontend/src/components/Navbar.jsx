import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  LogOut, 
  Store,
  Wifi,
  WifiOff,
  Settings,
  Clock,
  Menu, // New Icon
  X     // New Icon
} from 'lucide-react';

const Navbar = ({ usuario, fazerLogout, isOnline }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const isActive = (path) => location.pathname === path;
  
  // Helper to close menu when a link is clicked
  const closeMenu = () => setIsMobileMenuOpen(false);

  // Lógica para mostrar funcionalidades restritas
  const isPremium = usuario?.plano === 'premium' || usuario?.role === 'superadmin' || usuario?.email === "naironcossa.dev@gmail.com";

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

          {/* DESKTOP NAV LINKS (Hidden on Mobile) */}
          <div className="hidden md:flex items-center gap-1">
            {usuario.role === 'admin' && (
              <Link to="/" className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${isActive('/') ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                <LayoutDashboard size={18} /> Painel
              </Link>
            )}
            
            <Link to="/caixa" className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${isActive('/caixa') ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>
              <ShoppingCart size={18} /> Vender
            </Link>

            {/* LINK DE FIADOS */}
            <Link to="/fiados" className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${isActive('/fiados') ? 'bg-amber-100 text-amber-700' : 'text-slate-500 hover:bg-slate-50'}`}>
              <Clock size={18} /> Fiados
            </Link>
            
            <Link to="/inventario" className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${isActive('/inventario') ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>
              <Package size={18} /> Stock
            </Link>

            {/* LINK: DEFINIÇÕES (Admin) */}
            {usuario.role === 'admin' && (
              <Link to="/definicoes" className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${isActive('/definicoes') ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                <Settings size={18} /> Definições
              </Link>
            )}
          </div>
        </div>

        {/* RIGHT SIDE ACTIONS */}
        <div className="flex items-center gap-4">
          
          {/* USER INFO (Hidden on very small screens) */}
          <div className="hidden sm:flex flex-col items-end border-r border-slate-100 pr-6">
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.15em] mb-1">
              {usuario.plano === 'premium' ? '👑 Premium' : (usuario.tipoNegocio || 'Plano Básico')}
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

          {/* MOBILE MENU TOGGLE BUTTON (Visible only on Mobile) */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* MOBILE MENU DROPDOWN */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 shadow-xl absolute top-20 left-0 w-full p-4 flex flex-col gap-2 animate-in slide-in-from-top-2">
          {usuario.role === 'admin' && (
            <Link 
              to="/" 
              onClick={closeMenu}
              className={`flex items-center gap-3 px-5 py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${isActive('/') ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <LayoutDashboard size={20} /> Painel
            </Link>
          )}
          
          <Link 
            to="/caixa" 
            onClick={closeMenu}
            className={`flex items-center gap-3 px-5 py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${isActive('/caixa') ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <ShoppingCart size={20} /> Vender
          </Link>

          <Link 
            to="/fiados" 
            onClick={closeMenu}
            className={`flex items-center gap-3 px-5 py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${isActive('/fiados') ? 'bg-amber-100 text-amber-700' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Clock size={20} /> Fiados
          </Link>
          
          <Link 
            to="/inventario" 
            onClick={closeMenu}
            className={`flex items-center gap-3 px-5 py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${isActive('/inventario') ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Package size={20} /> Stock
          </Link>

          {usuario.role === 'admin' && (
            <Link 
              to="/definicoes" 
              onClick={closeMenu}
              className={`flex items-center gap-3 px-5 py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${isActive('/definicoes') ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <Settings size={20} /> Definições
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;