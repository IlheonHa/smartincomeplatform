
import React, { useState } from 'react';
import { DashboardData, ChartDataPoint, SystemSettings, User, UserRole, AppNotification } from '../types';
import { Send, Trash2, Users as UsersIcon, User as UserIcon, Bell, Activity, Upload, Package, FileArchive, Download } from 'lucide-react';
import { supabase } from '../src/lib/supabase';

interface AdminProps {
  dashboardData: DashboardData;
  setDashboardData: (data: DashboardData) => void;
  systemSettings: SystemSettings;
  setSystemSettings: (settings: SystemSettings) => Promise<any>;
  users: User[];
  onUpdateUser: (user: User) => void;
  notifications: AppNotification[];
  onAddNotification: (notif: Partial<AppNotification>) => void;
  onDeleteNotification: (id: string) => void;
  onDeleteNotifications: (ids: string[]) => void;
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
  onDeleteNotifications,
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
  const [selectedNotifs, setSelectedNotifs] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

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

  const handleBatchDeleteNotifs = () => {
    if (selectedNotifs.length === 0) return;
    if (confirm(`선택한 ${selectedNotifs.length}개의 알림을 삭제하시겠습니까?`)) {
      onDeleteNotifications(selectedNotifs);
      setSelectedNotifs([]);
    }
  };

  const toggleNotifSelection = (id: string) => {
    setSelectedNotifs(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleAllNotifs = () => {
    if (selectedNotifs.length === notifications.length) {
      setSelectedNotifs([]);
    } else {
      setSelectedNotifs(notifications.map(n => n.id));
    }
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

  const handleDownload = async (url: string, filename: string) => {
    if (!url) return;

    if (url.startsWith('data:')) {
      try {
        const parts = url.split(',');
        const contentType = parts[0].split(':')[1].split(';')[0];
        const byteCharacters = atob(parts[1]);
        const byteArrays = [];
        
        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
          const slice = byteCharacters.slice(offset, offset + 512);
          const byteNumbers = new Array(slice.length);
          for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          byteArrays.push(byteArray);
        }
        
        const blob = new Blob(byteArrays, { type: contentType });
        const blobUrl = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      } catch (e) {
        console.error('Data URL download failed:', e);
        window.open(url, '_blank');
      }
    } else if (url.includes('supabase.co') && url.includes('/storage/v1/object/')) {
      // For Supabase Storage URLs, use the SDK's download method for maximum reliability
      try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        // URL format: .../storage/v1/object/public/tools/filename.zip
        // pathParts: ["", "storage", "v1", "object", "public", "tools", "filename.zip"]
        const bucket = pathParts[5];
        const path = pathParts.slice(6).join('/');

        if (!bucket || !path) throw new Error('Invalid Supabase URL format');

        const { data, error } = await supabase.storage.from(bucket).download(path);
        if (error) throw error;

        const blobUrl = URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      } catch (e) {
        console.error('SDK download failed, falling back to direct link:', e);
        // Fallback to direct link with download parameter
        const downloadUrl = url.includes('?') ? `${url}&download=${filename}` : `${url}?download=${filename}`;
        window.open(downloadUrl, '_blank');
      }
    } else {
      // For other external URLs
      try {
        const response = await fetch(url, { mode: 'cors' });
        if (!response.ok) throw new Error('Network response was not ok');
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      } catch (e) {
        console.error('External URL download failed:', e);
        window.open(url, '_blank');
      }
    }
  };

  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.zip')) {
        alert('ZIP 파일만 업로드 가능합니다.');
        return;
      }

      // Limit size to 50MB
      if (file.size > 50 * 1024 * 1024) {
        alert('파일 크기가 너무 큽니다. 50MB 이하의 ZIP 파일만 업로드 가능합니다.');
        return;
      }
      
      setIsUploading(true);
      try {
        // 0. Ensure bucket exists (check first, then try to create)
        try {
          const { data: buckets } = await supabase.storage.listBuckets();
          const exists = buckets?.some(b => b.id === 'tools');
          if (!exists) {
            await supabase.storage.createBucket('tools', { public: true });
          }
        } catch (bucketErr) {
          console.warn('[Admin] Bucket check/create failed, proceeding anyway:', bucketErr);
        }

        // 1. Upload file to Supabase Storage
        const timestamp = Date.now();
        const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const fileName = `tool_${timestamp}_${cleanName}`;
        
        const { data, error } = await supabase.storage
          .from('tools')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: true,
            contentType: 'application/zip'
          });

        if (error) {
          console.error('Supabase Storage Error:', error);
          throw new Error(error.message || '파일 업로드 중 오류가 발생했습니다.');
        }

        // 2. Get Public URL
        const { data: { publicUrl } } = supabase.storage
          .from('tools')
          .getPublicUrl(fileName);

        if (!publicUrl) {
          throw new Error('공개 URL을 생성할 수 없습니다.');
        }

        // 3. Update System Settings with the new URL
        const result = await setSystemSettings({
          ...systemSettings,
          naverNeighborAutoUrl: publicUrl
        });
        
        if (result?.success) {
          alert('Naver Blog 자동이웃신청 도구가 성공적으로 업로드되었습니다.');
        } else {
          console.error('Database Update Error:', result?.error);
          alert('업로드에 성공했으나 설정 저장에 실패했습니다. 관리자에게 문의하세요.');
        }
      } catch (err: any) {
        console.error('Upload process error:', err);
        alert(`업로드 중 오류가 발생했습니다: ${err.message || '알 수 없는 오류'}\n\nSupabase Storage 설정(버킷 생성 및 권한)을 확인해주세요.`);
      } finally {
        setIsUploading(false);
        e.target.value = '';
      }
    }
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
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-gray-700 flex items-center">
                <span className="w-1 h-4 bg-amber-500 rounded-full mr-2"></span>
                최근 전송 이력
              </h4>
              <div className="flex items-center gap-2">
                {selectedNotifs.length > 0 && (
                  <button 
                    onClick={handleBatchDeleteNotifs}
                    className="px-3 py-1.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-lg border border-red-100 hover:bg-red-100 transition-all flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    {selectedNotifs.length}개 일괄 삭제
                  </button>
                )}
                <button 
                  onClick={toggleAllNotifs}
                  className="px-3 py-1.5 bg-gray-50 text-gray-600 text-[10px] font-bold rounded-lg border border-gray-100 hover:bg-gray-100 transition-all"
                >
                  {selectedNotifs.length === notifications.length && notifications.length > 0 ? '선택 해제' : '전체 선택'}
                </button>
              </div>
            </div>
            <div className="border rounded-2xl overflow-hidden max-h-[350px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-12 text-center text-gray-400 text-xs">
                  전송된 알림이 없습니다.
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notif) => (
                    <div key={notif.id} className={`p-4 hover:bg-gray-50 group transition-colors ${selectedNotifs.includes(notif.id) ? 'bg-blue-50/50' : ''}`}>
                      <div className="flex items-start gap-4">
                        <input 
                          type="checkbox"
                          checked={selectedNotifs.includes(notif.id)}
                          onChange={() => toggleNotifSelection(notif.id)}
                          className="mt-1 w-4 h-4 rounded border-gray-300 text-[#002D62] focus:ring-[#002D62]"
                        />
                        <div className="flex-1 space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                              notif.type === 'ERROR' ? 'bg-red-100 text-red-700' :
                              notif.type === 'WARNING' ? 'bg-amber-100 text-amber-700' :
                              notif.type === 'SUCCESS' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {notif.type}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1 truncate">
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
                          className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
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
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-[#002D62]" />
            <h3 className="font-bold text-gray-800">Golden System 도구 관리</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-16 h-16 bg-white rounded-2xl border flex items-center justify-center shadow-sm">
                <FileArchive className="w-8 h-8 text-green-500" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h4 className="text-sm font-bold text-gray-800">Naver Blog 자동이웃신청 (ZIP)</h4>
                <p className="text-[10px] text-gray-400 mt-1">
                  현재 파일: {systemSettings.naverNeighborAutoUrl ? (systemSettings.naverNeighborAutoUrl.startsWith('data:') ? '사용자 업로드 파일' : systemSettings.naverNeighborAutoUrl.split('/').pop()) : '기본 파일'}
                </p>
              </div>
              <div className="flex flex-wrap justify-center md:justify-end gap-3">
                {systemSettings.naverNeighborAutoUrl && (
                  <button 
                    onClick={() => handleDownload(
                      systemSettings.naverNeighborAutoUrl!, 
                      'naver_neighbor_auto_current.zip'
                    )}
                    className="px-6 py-3 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    현재 파일 확인
                  </button>
                )}
                <label className={`px-6 py-3 ${isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#002D62] hover:bg-[#001A3A] cursor-pointer'} text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2`}>
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      업로드 중...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      새 파일 업로드
                    </>
                  )}
                  <input 
                    type="file" 
                    accept=".zip" 
                    onChange={handleZipUpload} 
                    className="hidden" 
                    disabled={isUploading}
                  />
                </label>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <p className="text-[10px] text-gray-400 leading-relaxed">
                * 업로드된 파일은 Golden System 메뉴에서 DIAMOND 등급 이상 회원들에게 즉시 배포됩니다.<br />
                * ZIP 형식의 파일만 지원하며, 대용량 파일의 경우 업로드 시간이 소요될 수 있습니다.
              </p>
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
