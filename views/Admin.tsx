
import React, { useState } from 'react';
import { DashboardData, ChartDataPoint, SystemSettings, User, UserRole, AppNotification } from '../types';
import { Send, Trash2, Users as UsersIcon, User as UserIcon, Bell, Activity } from 'lucide-react';

interface AdminProps {
  dashboardData: DashboardData;
  setDashboardData: (data: DashboardData) => void;
  systemSettings: SystemSettings;
  setSystemSettings: (settings: SystemSettings) => void;
  users: User[];
  onUpdateUser: (user: User) => void;
  notifications: AppNotification[];
  onAddNotification: (notif: Partial<AppNotification>) => void;
  onDeleteNotification: (id: string) => void;
  onResetDatabase: () => void;
  onRefresh: () => void;
}

const Admin: React.FC<AdminProps> = ({ 
  dashboardData, 
  setDashboardData, 
  systemSettings, 
  setSystemSettings, 
  users, 
  onUpdateUser,
  notifications,
  onAddNotification,
  onDeleteNotification,
  onResetDatabase,
  onRefresh
}) => {
  const [editStats, setEditStats] = useState(dashboardData.stats);
  const [editChart, setEditChart] = useState(dashboardData.chartData);
  
  // Notification form state
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifType, setNotifType] = useState<'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR'>('INFO');
  const [notifTarget, setNotifTarget] = useState<'ALL' | string>('ALL');

  // Sync local state when props change
  React.useEffect(() => {
    setEditStats(dashboardData.stats);
  }, [dashboardData.stats]);

  React.useEffect(() => {
    setEditChart(dashboardData.chartData);
  }, [dashboardData.chartData]);

  const partners = users.filter(u => u.role === UserRole.PARTNER);

  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) return;

    const targetUser = notifTarget === 'ALL' ? undefined : users.find(u => u.id === notifTarget);
    
    onAddNotification({
      title: notifTitle,
      message: notifMessage,
      type: notifType,
      targetUserId: notifTarget === 'ALL' ? undefined : notifTarget,
      targetUserName: targetUser?.name
    });

    setNotifTitle('');
    setNotifMessage('');
    alert('알림이 전송되었습니다.');
  };

  const handleUpdateMemberPerformance = (userId: string, field: keyof User, value: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      const numValue = parseInt(value) || 0;
      onUpdateUser({ ...user, [field]: numValue } as User);
    }
  };

  const handleSaveDashboard = () => {
    setDashboardData({
      stats: editStats,
      chartData: editChart
    });
    alert('대시보드 데이터가 성공적으로 저장되었습니다.');
  };

  const handleToggleSetting = (key: keyof SystemSettings) => {
    setSystemSettings({
      ...systemSettings,
      [key]: !systemSettings[key]
    });
  };

  const handleNumberSettingChange = (key: keyof SystemSettings, value: string) => {
    const num = parseInt(value) || 0;
    setSystemSettings({
      ...systemSettings,
      [key]: num
    });
  };

  const handleChartChange = (index: number, field: keyof ChartDataPoint, value: any) => {
    const newChart = [...editChart];
    newChart[index] = { ...newChart[index], [field]: value };
    setEditChart(newChart);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">서버 상태</h4>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-[#002D62]">Stable</span>
            <div className="flex items-center text-green-500 font-bold text-sm">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
              99.9% Uptime
            </div>
          </div>
          <div className="mt-4 w-full bg-gray-100 h-1 rounded-full overflow-hidden">
            <div className="bg-[#002D62] h-full w-[92%]"></div>
          </div>
          <p className="text-[10px] text-gray-400 mt-2">CPU Usage: 12% | RAM: 4.2GB / 16GB</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">API 호출량 (오늘)</h4>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-[#002D62]">4,821</span>
            <span className="text-xs font-bold text-blue-400">Quota: 10,000</span>
          </div>
          <div className="mt-4 w-full bg-gray-100 h-1 rounded-full overflow-hidden">
            <div className="bg-[#002D62] h-full w-[48%]"></div>
          </div>
          <p className="text-[10px] text-gray-400 mt-2">Gemini 3 Flash: 3.2k | Pro: 1.6k</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">보안 탐지</h4>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-[#002D62]">0</span>
            <span className="text-xs font-bold text-green-500">Secure</span>
          </div>
          <div className="mt-4 flex space-x-1">
            {[1,1,1,1,1,1,1,0,1,1,1,1].map((v, i) => (
              <div key={i} className={`flex-1 h-4 rounded-sm ${v ? 'bg-blue-100' : 'bg-red-200'}`}></div>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-2">Last Scan: 5 mins ago</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50/50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#002D62]" />
            <h3 className="font-bold text-gray-800">스마트인컴 알림 관리</h3>
          </div>
          <button 
            onClick={onRefresh}
            className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-[10px] font-bold rounded-lg hover:bg-gray-50 transition-all flex items-center gap-2"
          >
            <Activity className="w-3 h-3" />
            데이터 새로고침
          </button>
        </div>
        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Notification Form */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-gray-700 flex items-center">
              <span className="w-1 h-4 bg-[#002D62] rounded-full mr-2"></span>
              새 알림 전송
            </h4>
            <form onSubmit={handleSendNotification} className="space-y-4 bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">알림 유형</label>
                  <select 
                    value={notifType}
                    onChange={(e) => setNotifType(e.target.value as any)}
                    className="w-full p-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="INFO">정보 (INFO)</option>
                    <option value="SUCCESS">성공 (SUCCESS)</option>
                    <option value="WARNING">경고 (WARNING)</option>
                    <option value="ERROR">오류 (ERROR)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">수신 대상</label>
                  <select 
                    value={notifTarget}
                    onChange={(e) => setNotifTarget(e.target.value)}
                    className="w-full p-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="ALL">전체 회원</option>
                    {partners.map(u => (
                      <option key={u.id} value={u.id}>{u.name} (@{u.loginId})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">알림 제목</label>
                <input 
                  type="text"
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  placeholder="알림 제목을 입력하세요..."
                  className="w-full p-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">메시지 내용</label>
                <textarea 
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  placeholder="회원들에게 전달할 메시지 내용을 입력하세요..."
                  className="w-full p-3 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                />
              </div>
              <button 
                type="submit"
                className="w-full py-3 bg-[#002D62] text-white text-xs font-bold rounded-xl hover:bg-[#001A3A] transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                알림 전송하기
              </button>
            </form>
          </div>

          {/* Notification History */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-gray-700 flex items-center">
              <span className="w-1 h-4 bg-amber-500 rounded-full mr-2"></span>
              최근 전송 이력
            </h4>
            <div className="border rounded-2xl overflow-hidden max-h-[350px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-12 text-center text-gray-400 text-xs">
                  전송된 알림이 없습니다.
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="p-4 hover:bg-gray-50 group transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                              notif.type === 'ERROR' ? 'bg-red-100 text-red-700' :
                              notif.type === 'WARNING' ? 'bg-amber-100 text-amber-700' :
                              notif.type === 'SUCCESS' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {notif.type}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                              {notif.targetUserId ? (
                                <><UserIcon className="w-3 h-3" /> {notif.targetUserName || '개별 회원'}</>
                              ) : (
                                <><UsersIcon className="w-3 h-3" /> 전체 회원</>
                              )}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-gray-700 leading-relaxed">{notif.title}</p>
                          <p className="text-[9px] text-gray-400 font-mono">{new Date(notif.createdAt).toLocaleString()}</p>
                        </div>
                        <button 
                          onClick={() => onDeleteNotification(notif.id)}
                          className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50/50 flex justify-between items-center">
          <h3 className="font-bold text-gray-800">대시보드 데이터 관리</h3>
          <button 
            onClick={handleSaveDashboard}
            className="px-4 py-2 bg-[#002D62] text-white text-xs font-bold rounded-lg hover:bg-[#001A3A] transition-colors"
          >
            변경사항 저장
          </button>
        </div>
        <div className="p-6 space-y-8">
          {/* Stats Editing - Now Derived from Members */}
          <div>
            <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
              <span className="w-1 h-4 bg-[#002D62] rounded-full mr-2"></span>
              회원별 실적 데이터 입력 (대시보드 자동 연동)
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 font-bold">파트너명</th>
                    <th className="px-4 py-3 font-bold">콘텐츠 생성</th>
                    <th className="px-4 py-3 font-bold">보험설계</th>
                    <th className="px-4 py-3 font-bold">Golden System</th>
                    <th className="px-4 py-3 font-bold">가망고객</th>
                    <th className="px-4 py-3 font-bold">활성상담</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {partners.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{u.name} <span className="text-[10px] text-gray-400 font-normal">@{u.loginId}</span></td>
                      <td className="px-4 py-3">
                        <input 
                          type="number" 
                          value={u.contentGenCount || 0}
                          onChange={(e) => handleUpdateMemberPerformance(u.id, 'contentGenCount', e.target.value)}
                          className="w-full p-1.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input 
                          type="number" 
                          value={u.insuranceDesignCount || 0}
                          onChange={(e) => handleUpdateMemberPerformance(u.id, 'insuranceDesignCount', e.target.value)}
                          className="w-full p-1.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input 
                          type="number" 
                          value={u.goldenSystemCount || 0}
                          onChange={(e) => handleUpdateMemberPerformance(u.id, 'goldenSystemCount', e.target.value)}
                          className="w-full p-1.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input 
                          type="number" 
                          value={u.leadsCount || 0}
                          onChange={(e) => handleUpdateMemberPerformance(u.id, 'leadsCount', e.target.value)}
                          className="w-full p-1.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input 
                          type="number" 
                          value={u.activeConsultationsCount || 0}
                          onChange={(e) => handleUpdateMemberPerformance(u.id, 'activeConsultationsCount', e.target.value)}
                          className="w-full p-1.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-[10px] text-gray-400 italic">* 위 표에서 입력한 데이터의 합계가 대시보드의 주요 지표에 실시간으로 반영됩니다.</p>
          </div>

          {/* Trend Editing */}
          <div>
            <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
              <span className="w-1 h-4 bg-[#002D62] rounded-full mr-2"></span>
              지표 추세(Trend) 설정
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { label: '콘텐츠 추세', key: 'contentGenTrend' },
                { label: '설계 추세', key: 'insuranceDesignTrend' },
                { label: '골든 추세', key: 'goldenSystemTrend' },
                { label: '고객 추세', key: 'totalLeadsTrend' },
                { label: '상담 추세', key: 'activeConsultationsTrend' },
              ].map((item) => (
                <div key={item.key} className="space-y-2">
                  <label className="text-xs font-medium text-gray-500">{item.label}</label>
                  <input 
                    type="text" 
                    value={(editStats as any)[item.key]} 
                    onChange={(e) => setEditStats({ ...editStats, [item.key]: e.target.value })}
                    className="w-full p-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                    placeholder="추세 (예: +12%)"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Chart Data Editing */}
          <div>
            <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
              <span className="w-1 h-4 bg-indigo-500 rounded-full mr-2"></span>
              주간 차트 데이터 설정
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-2 font-bold">요일</th>
                    <th className="px-4 py-2 font-bold">고객 수</th>
                    <th className="px-4 py-2 font-bold">수익 (₩)</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {editChart.map((point, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2 font-medium">{point.name}</td>
                      <td className="px-4 py-2">
                        <input 
                          type="number" 
                          value={point.leads} 
                          onChange={(e) => handleChartChange(idx, 'leads', parseInt(e.target.value) || 0)}
                          className="w-20 p-1 border rounded outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input 
                          type="number" 
                          value={point.revenue} 
                          onChange={(e) => handleChartChange(idx, 'revenue', parseInt(e.target.value) || 0)}
                          className="w-32 p-1 border rounded outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#002D62] p-8 rounded-2xl text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-xl font-bold mb-2">글로벌 시스템 설정 (회원/대시보드 연동)</h3>
          <p className="text-blue-200 text-sm mb-6">플랫폼 전체의 핵심 파라미터 및 연동 설정을 관리합니다.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-4 bg-[#001A3A]/50 rounded-xl border border-blue-900">
              <p className="text-xs font-bold text-blue-300 uppercase mb-2">기본 월 구독료 (신규 가입)</p>
              <div className="flex items-center space-x-2">
                <span className="text-blue-400 font-bold">₩</span>
                <input 
                  type="number" 
                  value={systemSettings.defaultMonthlyFee}
                  onChange={(e) => handleNumberSettingChange('defaultMonthlyFee', e.target.value)}
                  className="bg-[#001A3A] border-none rounded text-sm w-full outline-none p-2"
                />
              </div>
            </div>
            
            <div className="p-4 bg-[#001A3A]/50 rounded-xl border border-blue-900 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-blue-300 uppercase">대시보드 실시간 연동</p>
                <p className="text-[10px] text-blue-400">회원 매출액을 대시보드에 반영</p>
              </div>
              <div 
                onClick={() => handleToggleSetting('syncDashboardWithMemberFees')}
                className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${systemSettings.syncDashboardWithMemberFees ? 'bg-[#8BC34A]' : 'bg-blue-900'}`}
              >
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${systemSettings.syncDashboardWithMemberFees ? 'right-1' : 'left-1'}`}></div>
              </div>
            </div>

            <div className="p-4 bg-[#001A3A]/50 rounded-xl border border-blue-900 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-blue-300 uppercase">신규 가입 즉시 승인</p>
                <p className="text-[10px] text-blue-400">가입 시 즉시 ACTIVE 상태 부여</p>
              </div>
              <div 
                onClick={() => handleToggleSetting('autoApproveNewMembers')}
                className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${systemSettings.autoApproveNewMembers ? 'bg-[#8BC34A]' : 'bg-blue-900'}`}
              >
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${systemSettings.autoApproveNewMembers ? 'right-1' : 'left-1'}`}></div>
              </div>
            </div>

            <div className="p-4 bg-[#001A3A]/50 rounded-xl border border-blue-900 flex items-center justify-between">
              <p className="text-xs font-bold text-blue-300 uppercase">점검 모드 (Maintenance)</p>
              <div 
                onClick={() => handleToggleSetting('maintenanceMode')}
                className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${systemSettings.maintenanceMode ? 'bg-red-500' : 'bg-blue-900'}`}
              >
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${systemSettings.maintenanceMode ? 'right-1' : 'left-1'}`}></div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-blue-900 rounded-full blur-3xl opacity-50"></div>
      </div>
      <div className="bg-red-50 p-8 rounded-2xl border border-red-100 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-lg font-bold text-red-900 flex items-center justify-center md:justify-start gap-2">
              <Trash2 className="w-5 h-5" />
              시스템 데이터 초기화
            </h3>
            <p className="text-sm text-red-600">
              관리자 계정을 제외한 모든 데이터(가망고객, 일정, 알림, 일반 회원 등)를 삭제하고 시스템을 초기 상태로 리셋합니다.
            </p>
          </div>
          <button 
            onClick={onResetDatabase}
            className="px-8 py-4 bg-red-600 text-white font-black rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-200 active:scale-95"
          >
            전체 데이터 리셋 실행
          </button>
        </div>
      </div>
    </div>
  );
};

export default Admin;
