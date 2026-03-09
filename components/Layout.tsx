
import React, { useState } from 'react';
import { UserRole, MembershipGrade, User } from '../types';
import { 
  LayoutDashboard, 
  Rocket, 
  Magnet,
  Users, 
  Bot, 
  Settings, 
  UserCircle, 
  ShieldCheck, 
  LogOut, 
  Bell,
  ChevronRight,
  Menu,
  X,
  Sparkles,
  Crown,
  Wrench
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user?: User | null;
  onLogout: () => void;
}

const Logo: React.FC = () => (
  <div className="flex items-center justify-center">
    <div className="relative w-full max-w-[240px] aspect-[2.5/1]">
      <img 
        src="https://blogfiles.pstatic.net/MjAyNjAyMTlfOTkg/MDAxNzcxNDY0NTUwMjE5.jn56Q6DZtJzqmSb1T2D60-xgn9u-bQzu8zHwdzGs4Log.wea8trdiYs3uLwWRPibnOteE87D5kgbZJnr5nYWmgXcg.PNG/SMARTINCOME.png?type=w1" 
        alt="Smart Income Logo" 
        className="w-full h-full object-contain drop-shadow-lg"
        referrerPolicy="no-referrer"
      />
    </div>
  </div>
);

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, user, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const userRole = user?.role;
  
  const navItems = [
    { id: 'introduction', label: 'Smart Income 소개', icon: Sparkles },
    { id: 'dashboard', label: '대시보드', icon: LayoutDashboard },
    { id: 'marketing', label: 'AI 수익형 콘텐츠 생성', icon: Rocket },
    { id: 'ai-hub', label: 'AI 보험설계 솔루션', icon: Bot },
    { id: 'secret-room', label: 'Golden System', icon: Crown },
    { id: 'lead-collection', label: '가망고객 수집', icon: Magnet },
    { id: 'crm', label: '가망고객 관리(CRM)', icon: Users },
    { id: 'useful-tools', label: '유용한 기능', icon: Wrench },
    { id: 'settings', label: '설정', icon: Settings },
  ];

  const adminNavItems = userRole === UserRole.ADMIN ? [
    { id: 'member-management', label: '회원 관리', icon: UserCircle },
    { id: 'admin', label: '시스템 관리', icon: ShieldCheck }
  ] : [];

  const allItems = [...navItems, ...adminNavItems];

  const getGradeBadge = (grade?: MembershipGrade) => {
    switch (grade) {
      case MembershipGrade.SILVER: return <span className="text-[9px] bg-slate-200/20 text-slate-200 px-2 py-0.5 rounded-full font-bold border border-white/10">SILVER</span>;
      case MembershipGrade.GOLD: return <span className="text-[9px] bg-amber-400/20 text-amber-400 px-2 py-0.5 rounded-full font-bold border border-amber-400/20">GOLD</span>;
      case MembershipGrade.DIAMOND: return <span className="text-[9px] bg-cyan-400/20 text-cyan-400 px-2 py-0.5 rounded-full font-bold border border-cyan-400/20">DIAMOND</span>;
      case MembershipGrade.PLATINUM: return <span className="text-[9px] bg-indigo-400/20 text-indigo-400 px-2 py-0.5 rounded-full font-bold border border-indigo-400/20">PLATINUM</span>;
      default: return null;
    }
  };

  const handleLogoutClick = () => {
    onLogout();
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-primary/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 w-72 bg-primary text-white flex flex-col z-40 shadow-[10px_0_40px_rgba(0,0,0,0.1)] transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-8 pb-10 flex items-center justify-between">
          <Logo />
          <button 
            className="lg:hidden p-2 text-white/60 hover:text-white"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="flex-1 px-4 space-y-6 overflow-y-auto">
          {/* Service Tools Group */}
          <div>
            <div className="px-4 mb-4 flex items-center gap-2">
              <div className="w-1 h-3 bg-accent rounded-full"></div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">서비스 도구</p>
            </div>
            <div className="space-y-1.5">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3.5 text-sm font-semibold rounded-2xl transition-all duration-300 group ${
                    activeTab === item.id
                      ? 'bg-accent text-primary shadow-lg shadow-accent/40 ring-1 ring-white/20'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center">
                    <item.icon className={`mr-3.5 w-5 h-5 transition-transform duration-300 ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                    {item.label}
                  </div>
                  {activeTab === item.id && <ChevronRight className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>

          {/* Admin Group */}
          {adminNavItems.length > 0 && (
            <div className="pt-6 border-t border-white/5">
              <div className="px-4 mb-4 flex items-center gap-2">
                <div className="w-1 h-3 bg-slate-400 rounded-full"></div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">관리 설정</p>
              </div>
              <div className="space-y-1.5">
                {adminNavItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3.5 text-sm font-semibold rounded-2xl transition-all duration-300 group ${
                      activeTab === item.id
                        ? 'bg-accent text-primary shadow-lg shadow-accent/40 ring-1 ring-white/20'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center">
                      <item.icon className={`mr-3.5 w-5 h-5 transition-transform duration-300 ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                      {item.label}
                    </div>
                    {activeTab === item.id && <ChevronRight className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </nav>

        <div className="p-6 mt-auto">
          <div className="bg-white/5 rounded-[2.5rem] p-6 border border-white/10 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-accent/10 rounded-full blur-2xl transition-all duration-500 group-hover:scale-150"></div>
            <div className="relative z-10 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center font-bold text-xl text-primary shadow-inner">
                  {userRole === UserRole.ADMIN ? 'A' : (user?.name?.[0] || 'P')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-bold truncate">{user?.name || (userRole === UserRole.ADMIN ? '관리자' : '파트너')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {userRole === UserRole.PARTNER && getGradeBadge(user?.grade)}
                    <p className="text-[9px] text-white/40 font-medium tracking-wider uppercase">
                      {userRole === UserRole.ADMIN ? 'SYSTEM ADMIN' : 'INCOME PARTNER'}
                    </p>
                  </div>
                </div>
              </div>
              <button 
                onClick={handleLogoutClick}
                className="w-full flex items-center justify-center gap-2 py-4 bg-red-500 hover:bg-red-600 text-white font-black rounded-2xl text-xs transition-all duration-300 shadow-xl shadow-red-500/20 group/logout border border-white/10"
              >
                <LogOut className="w-4 h-4 group-hover/logout:rotate-12 transition-transform" />
                시스템 로그아웃
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 text-primary hover:bg-slate-100 rounded-xl transition-colors"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden sm:block w-1 h-6 bg-accent rounded-full"></div>
            <h2 className="text-xl lg:text-2xl font-bold text-primary tracking-tight">
              {[...navItems, ...adminNavItems].find(n => n.id === activeTab)?.label}
            </h2>
          </div>
          <div className="flex items-center gap-3 lg:gap-6">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full border border-accent/20">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
              <span className="text-[11px] font-bold text-accent-dark uppercase tracking-widest">System Online</span>
            </div>
            <div className="hidden md:block h-8 w-px bg-slate-200"></div>
            <button 
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 font-bold rounded-xl transition-all border border-slate-200 hover:border-red-100 group"
              title="로그아웃"
            >
              <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              <span className="text-xs hidden sm:inline">로그아웃</span>
            </button>
            <button className="relative p-2.5 text-slate-400 hover:text-primary transition-colors group">
              <Bell className="w-6 h-6 group-hover:rotate-12 transition-transform" />
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
            </button>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 bg-background/50">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
