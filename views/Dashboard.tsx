
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Zap, 
  Wallet, 
  ArrowUpRight, 
  Activity, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Plus,
  Search,
  Lock,
  Eye,
  ArrowRight,
  Megaphone,
  Bell,
  BrainCircuit,
  MapPin,
  Calendar as CalendarIcon
} from 'lucide-react';

import { DashboardData, User, UserRole, Lead, AppNotification, LeadStatus, CalendarEvent } from '../types';

interface DashboardProps {
  data: DashboardData;
  users: User[];
  currentUser: User;
  leads: Lead[];
  notifications: AppNotification[];
  calendarEvents: CalendarEvent[];
}

const Dashboard: React.FC<DashboardProps> = ({ data, users, currentUser, leads, notifications, calendarEvents }) => {
  const [expandedNotif, setExpandedNotif] = useState<string | null>(null);
  const isAdmin = currentUser.role === UserRole.ADMIN;

  // Filter notifications for current user
  const myNotifications = notifications.filter(n => 
    !n.targetUserId || n.targetUserId === currentUser.id
  ).slice(0, 5);
  
  // Calculate stats based on real data from CRM leads
  const stats = useMemo(() => {
    const relevantLeads = isAdmin ? leads : leads.filter(l => l.userId === currentUser.id);
    
    const totalLeadsCount = relevantLeads.length;
    const activeConsultationsCount = relevantLeads.filter(l => 
      l.status === LeadStatus.NEW || 
      l.status === LeadStatus.CONTACTED || 
      l.status === LeadStatus.ANALYSIS || 
      l.status === LeadStatus.PROPOSAL
    ).length;

    return [
      { 
        label: '가망고객', 
        value: totalLeadsCount.toLocaleString(), 
        trend: data.stats.totalLeadsTrend, 
        icon: Users, 
        color: 'bg-emerald-500/10 text-emerald-600',
        description: '시스템을 통해 수집된 잠재 고객'
      },
      { 
        label: '활성상담', 
        value: activeConsultationsCount.toString(), 
        trend: data.stats.activeConsultationsTrend, 
        icon: Zap, 
        color: 'bg-indigo-500/10 text-indigo-600',
        description: '현재 진행 중인 전문 상담 건수'
      },
    ];
  }, [leads, isAdmin, currentUser, data.stats]);

  const activePartners = users.filter(u => u.role === UserRole.PARTNER && u.isActive).length;
  const totalSubscriptionRevenue = users.reduce((acc, curr) => acc + (curr.monthlyFee || 0), 0);

  // Dynamic Chart Data Calculation based on CRM Leads
  const dynamicChartData = useMemo(() => {
    const relevantLeads = isAdmin ? leads : leads.filter(l => l.userId === currentUser.id);
    const now = new Date();
    const daysToLookBack = 7;
    
    const dataMap: { [key: string]: { leads: number; active: number } } = {};
    
    // Initialize map with dates
    for (let i = daysToLookBack - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      dataMap[dateStr] = { leads: 0, active: 0 };
    }

    // Populate with actual lead data
    relevantLeads.forEach(lead => {
      if (dataMap[lead.createdAt]) {
        dataMap[lead.createdAt].leads += 1;
        if (
          lead.status === LeadStatus.CONTACTED || 
          lead.status === LeadStatus.ANALYSIS || 
          lead.status === LeadStatus.PROPOSAL
        ) {
          dataMap[lead.createdAt].active += 1;
        }
      }
    });

    return Object.entries(dataMap).map(([date, values]) => {
      const d = new Date(date);
      const label = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
      
      return {
        name: label,
        leads: values.leads,
        active: values.active
      };
    });
  }, [leads, isAdmin, currentUser.id]);

  return (
    <div className="space-y-8 pb-12">
      {/* Live Ticker - Social Proof */}
      <div className="bg-primary/5 border-y border-primary/10 py-3 overflow-hidden whitespace-nowrap relative">
        <div className="flex items-center gap-8 animate-marquee">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center gap-12">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
                <span className="text-[11px] font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                  <Megaphone className="w-3 h-3" />
                  실시간 수익화 현황
                </span>
              </div>
              <span className="text-xs font-bold text-slate-500">오늘 최다 고객 수집: <span className="text-primary">A님(보험)</span></span>
              <span className="text-xs font-bold text-slate-500">최근 1시간 내 AI 포스팅 생성 <span className="text-accent-dark">124건</span></span>
              <span className="text-xs font-bold text-slate-500">신규 파트너 <span className="text-primary">B님</span> 수익화 시스템 가동 시작</span>
              <span className="text-xs font-bold text-slate-500">실시간 상담 전환 성공: <span className="text-accent-dark">C님(운전자보험)</span></span>
            </div>
          ))}
        </div>
        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee {
            display: flex;
            width: max-content;
            animation: marquee 30s linear infinite;
          }
        `}</style>
      </div>

      {/* Quick Actions - Premium Redesign */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            label: 'AI 콘텐츠 생성', 
            sub: '블로그/SNS 자동 포스팅', 
            icon: Sparkles, 
            color: 'bg-primary', 
            tab: 'marketing',
            tag: 'Popular'
          },
          { 
            label: 'AI 보험설계', 
            sub: '맞춤형 3대 안 자동 생성', 
            icon: BrainCircuit, 
            color: 'bg-blue-600', 
            tab: 'ai-hub',
            tag: 'AI Engine'
          },
          { 
            label: '가망고객 수집', 
            sub: '실시간 DB 수집 시스템', 
            icon: TrendingUp, 
            color: 'bg-emerald-600', 
            tab: 'lead-collection',
            tag: 'Growth'
          },
          { 
            label: '가망고객 확인', 
            sub: '수집된 DB 통합 관리', 
            icon: Users, 
            color: 'bg-indigo-600', 
            tab: 'crm',
            tag: 'CRM'
          }
        ].map((action, i) => (
          <button 
            key={i}
            onClick={() => (window as any).setActiveTab?.(action.tab)}
            className="neo-card p-8 flex flex-col items-start gap-6 hover:translate-y-[-8px] hover:shadow-[0_30px_60px_rgba(0,0,0,0.1)] transition-all duration-500 group relative overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 ${action.color}/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700`}></div>
            <div className="flex items-center justify-between w-full">
              <div className={`w-14 h-14 rounded-2xl ${action.color} text-white flex items-center justify-center shadow-xl shadow-slate-200 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                <action.icon className="w-7 h-7" />
              </div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">{action.tag}</span>
            </div>
            <div className="text-left space-y-1">
              <p className="text-lg font-black text-slate-900 tracking-tight">{action.label}</p>
              <p className="text-xs font-bold text-slate-400 leading-relaxed">{action.sub}</p>
            </div>
            <div className="w-full pt-6 border-t border-slate-50 flex items-center justify-between group-hover:border-slate-100 transition-colors">
              <span className="text-[10px] font-black text-primary uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Launch Tool</span>
              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* System Integration Banner */}
      <div className="neo-card p-8 bg-gradient-to-br from-primary to-primary-dark text-white relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:bg-accent/20 transition-all duration-700"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center text-3xl shadow-inner border border-white/10">
              {isAdmin ? <ShieldCheck className="w-8 h-8 text-accent" /> : <Sparkles className="w-8 h-8 text-accent" />}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <p className="text-[11px] font-bold text-white/40 uppercase tracking-[0.3em]">
                  {isAdmin ? 'System Intelligence Center' : 'Personal Performance Hub'}
                </p>
                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></div>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">
                {isAdmin ? (
                  <>
                    현재 활성 파트너 <span className="text-accent">{activePartners}명</span> 분석 중
                  </>
                ) : (
                  <>
                    {currentUser.name}님, <span className="text-accent">Smart Income</span>에 오신 것을 환영합니다
                  </>
                )}
              </h1>
              <p className="text-sm text-white/60 font-medium mt-1">
                {isAdmin ? (
                  <>총 구독 매출액: <span className="text-white font-bold">₩{totalSubscriptionRevenue.toLocaleString()}</span> | 시스템 가동률 99.9%</>
                ) : (
                  <>현재 등급: <span className="text-white font-bold">{currentUser.grade || 'SILVER'}</span> | 다음 정산일까지 12일 남았습니다</>
                )}
              </p>
            </div>
          </div>
          <button 
            onClick={() => (window as any).setActiveTab?.('useful-tools')}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-2xl text-sm font-bold transition-all border border-white/10 flex items-center gap-2 group/btn"
          >
            유용한 기능 바로가기
            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Notifications Section */}
        <div className="neo-card overflow-hidden h-fit">
          <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-bold text-primary tracking-tight">스마트인컴 알림</h3>
            </div>
            <button className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest">전체 알림 보기</button>
          </div>
          <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto custom-scrollbar">
            {myNotifications.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs font-medium">
                새로운 알림이 없습니다.
              </div>
            ) : (
              myNotifications.map((notif) => (
                <div key={notif.id} className="border-b border-slate-50 last:border-none">
                  <button 
                    onClick={() => setExpandedNotif(expandedNotif === notif.id ? null : notif.id)}
                    className="w-full px-8 py-5 flex items-center justify-between hover:bg-slate-50 transition-all duration-300 group text-left"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-2.5 rounded-xl bg-slate-100 transition-transform group-hover:scale-110 ${
                        notif.type === 'ERROR' ? 'text-red-500' :
                        notif.type === 'WARNING' ? 'text-amber-500' :
                        notif.type === 'SUCCESS' ? 'text-accent' : 'text-primary'
                      }`}>
                        {notif.type === 'ERROR' ? <AlertCircle className="w-5 h-5" /> : 
                         notif.type === 'WARNING' ? <AlertCircle className="w-5 h-5" /> : 
                         notif.type === 'SUCCESS' ? <CheckCircle2 className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-primary truncate">{notif.title}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                          {notif.targetUserId ? '개별 알림' : '전체 공지'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </span>
                      <ChevronRight className={`w-4 h-4 text-slate-200 group-hover:text-primary transition-all ${expandedNotif === notif.id ? 'rotate-90 text-primary' : ''}`} />
                    </div>
                  </button>
                  {expandedNotif === notif.id && (
                    <div className="px-8 pb-6 pt-0 animate-fade-in">
                      <div className="ml-14 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{notif.message}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Calendar Events Section */}
      <div className="neo-card overflow-hidden h-fit">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <CalendarIcon className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-primary tracking-tight">나의 일정 관리</h3>
          </div>
          <button 
            onClick={() => (window as any).setActiveTab?.('useful-tools')}
            className="text-[10px] font-bold text-indigo-600 hover:underline uppercase tracking-widest"
          >
            전체 일정 보기
          </button>
        </div>
        <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto custom-scrollbar">
          {calendarEvents.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs font-medium">
              등록된 일정이 없습니다.
            </div>
          ) : (
            calendarEvents
              .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
              .map((event) => (
                <div key={event.id} className="px-8 py-5 flex items-center justify-between hover:bg-slate-50 transition-all duration-300 group">
                  <div className="flex items-center space-x-4 min-w-0">
                    <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 transition-transform group-hover:scale-110">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-primary truncate">{event.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{event.date}</span>
                        <span className="text-[10px] font-bold text-slate-400">{event.time}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    {event.location && (
                      <div className="hidden sm:flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-300" />
                        <span className="text-[10px] font-bold text-slate-400 truncate max-w-[100px]">{event.location}</span>
                      </div>
                    )}
                    <button 
                      onClick={() => (window as any).setActiveTab?.('useful-tools')}
                      className="p-2 hover:bg-indigo-100 rounded-lg text-indigo-400 hover:text-indigo-600 transition-all"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {stats.map((stat, i) => (
          <div key={i} className="neo-card p-10 group relative overflow-hidden border-none bg-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] hover:shadow-[0_40px_80px_rgba(0,0,0,0.08)] transition-all duration-500">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:bg-slate-100 transition-colors duration-500"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-[2rem] ${stat.color} shadow-inner group-hover:rotate-6 transition-transform duration-500`}>
                    <stat.icon className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                    <p className="text-xs font-bold text-slate-300">{(stat as any).description}</p>
                  </div>
                </div>
                <div className="flex items-baseline gap-4">
                  <h3 className="text-6xl font-black text-slate-900 tracking-tighter leading-none">{stat.value}</h3>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 text-[11px] font-black rounded-full border border-emerald-100">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {stat.trend}
                  </div>
                </div>
              </div>
              <div className="hidden lg:block opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                <stat.icon className="w-32 h-32" />
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Real-time Data Sync</span>
              <button className="flex items-center gap-2 text-xs font-black text-primary hover:gap-3 transition-all">
                상세보기 <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 neo-card p-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-bold text-primary tracking-tight">
                {isAdmin ? '주간 가망고객 유입추이' : '나의 주간 가망고객 유입추이'}
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-1">
                지난 7일간의 데이터 분석 결과입니다.
              </p>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dynamicChartData}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={isAdmin ? "#8BC34A" : "#002D62"} stopOpacity={1} />
                    <stop offset="100%" stopColor={isAdmin ? "#8BC34A" : "#002D62"} stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 600}}
                  dy={10}
                  interval={0}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}}
                />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', padding: '12px'}}
                />
                <Bar dataKey="leads" fill="url(#barGradient)" radius={[8, 8, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="neo-card p-8 bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-accent/10 transition-all duration-700"></div>
          <div className="relative z-10 flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-black text-white tracking-tight">활성상담 트렌드</h3>
              <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-widest">Consultation Conversion</p>
            </div>
            <div className="p-3 bg-white/10 rounded-2xl border border-white/10">
              <Zap className="w-5 h-5 text-accent" />
            </div>
          </div>
          <div className="h-64 mb-8">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dynamicChartData}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F27D26" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#F27D26" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis hide dataKey="name" />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff', fontSize: '12px', fontWeight: 'bold'}}
                  itemStyle={{color: '#F27D26'}}
                />
                <Area 
                  type="monotone" 
                  dataKey="active" 
                  stroke="#F27D26" 
                  strokeWidth={4} 
                  fill="url(#areaGradient)" 
                  dot={{r: 4, fill: '#F27D26', strokeWidth: 2, stroke: '#0f172a'}}
                  activeDot={{r: 8, strokeWidth: 0}}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between p-5 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
                <span className="text-xs font-bold text-slate-400">실시간 상담 전환율</span>
              </div>
              <span className="text-sm font-black text-accent">24.8%</span>
            </div>
            <button 
              onClick={() => (window as any).setActiveTab?.('crm')}
              className="w-full py-5 bg-accent text-primary font-black rounded-3xl hover:bg-accent-dark transition-all flex items-center justify-center gap-3 shadow-xl shadow-accent/20 group/btn"
            >
              상담 관리 바로가기
              <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-2 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
      </div>

      {/* Secret Room - Exclusive Insight Area */}
      <div className="relative mt-12">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background z-10"></div>
        <div className="neo-card p-12 border-2 border-primary/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -mr-48 -mt-48"></div>
          
          <div className="relative z-20 max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-full border border-primary/10 mb-8">
              <Lock className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-bold text-primary uppercase tracking-[0.3em]">Exclusive Insight Area</span>
            </div>
            
            <h2 className="text-4xl font-bold text-primary tracking-tight mb-6">
              Golden System: 상위 1% 전문가의 <span className="text-accent-dark underline decoration-accent/30 underline-offset-8">수익 자동화 비법</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 text-left">
              <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 blur-[4px] select-none">
                <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Secret Method #01</p>
                <p className="text-lg font-bold text-primary leading-tight">AI를 활용한 고효율 DB 추출 및 <br/> 가망고객 필터링 알고리즘...</p>
              </div>
              <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 blur-[4px] select-none">
                <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Secret Method #02</p>
                <p className="text-lg font-bold text-primary leading-tight">월 5,000만원 이상 수익 설계사들의 <br/> 블로그 키워드 배치 전략...</p>
              </div>
            </div>

            <button 
              onClick={() => (window as any).setActiveTab?.('secret-room')}
              className="px-12 py-6 bg-primary text-white font-bold rounded-[2rem] shadow-2xl shadow-primary/30 hover:bg-primary-light transition-all active:scale-95 flex items-center gap-3 mx-auto group"
            >
              <Eye className="w-6 h-6 text-accent" />
              <span>Golden System 입장하기</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <p className="text-sm text-slate-400 font-medium mt-8">
              * 이 영역은 <span className="text-primary font-bold">DIAMOND 등급</span> 이상의 파트너에게만 공개됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
