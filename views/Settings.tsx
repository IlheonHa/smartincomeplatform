
import React, { useState, useEffect } from 'react';
import { User, SystemSettings, UserRole, MembershipGrade } from '../types';
import { 
  Save, 
  User as UserIcon, 
  Shield, 
  Phone, 
  Key, 
  Lock,
  LogOut, 
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface SettingsProps {
  onLogout?: () => void;
  user?: User | null;
  onUpdateUser?: (updatedUser: User) => void;
  systemSettings: SystemSettings;
  setSystemSettings: (settings: SystemSettings) => Promise<any>;
}

const Settings: React.FC<SettingsProps> = ({ onLogout, user, onUpdateUser, systemSettings, setSystemSettings }) => {
  const [showGuide, setShowGuide] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [passwords, setPasswords] = useState({ new: '', confirm: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [testStatus, setTestStatus] = useState<{ type: 'success' | 'error' | 'loading' | null, message: string }>({ type: null, message: '' });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        phone: user.phone,
        grade: user.grade,
        apiKeys: user.apiKeys || {}
      });
    }
  }, [user]);

  const isAdmin = user?.role === UserRole.ADMIN;

  const handleInputChange = (field: keyof User, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleApiKeyChange = (provider: 'gemini' | 'openai' | 'resend', value: string) => {
    setFormData(prev => ({
      ...prev,
      apiKeys: {
        ...(prev.apiKeys || {}),
        [provider]: value
      }
    }));
  };

  const handleSave = () => {
    if (!user || !onUpdateUser) return;
    
    setErrorMessage('');
    
    // Password validation
    if (passwords.new || passwords.confirm) {
      if (passwords.new !== passwords.confirm) {
        setErrorMessage('새 비밀번호가 일치하지 않습니다.');
        return;
      }
      if (passwords.new.length < 4) {
        setErrorMessage('비밀번호는 최소 4자 이상이어야 합니다.');
        return;
      }
    }

    setIsSaving(true);
    const updatedUser: User = {
      ...user,
      ...formData as User,
      apiKeys: formData.apiKeys
    };

    // Update password if provided
    if (passwords.new) {
      updatedUser.password = passwords.new;
    }
    
    onUpdateUser(updatedUser);
    
    setSaveMessage('회원 정보가 성공적으로 저장되었습니다.');
    setPasswords({ new: '', confirm: '' });
    
    setTimeout(() => {
      setSaveMessage('');
      setIsSaving(false);
    }, 3000);
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl space-y-8 pb-20">
      {/* User Profile Section */}
      <section className="neo-card overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserIcon className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-primary tracking-tight">회원 정보 설정</h3>
          </div>
          <div className="flex flex-col items-end gap-1">
            {saveMessage && (
              <div className="flex items-center gap-2 text-emerald-600 animate-fade-in">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs font-bold">{saveMessage}</span>
              </div>
            )}
            {errorMessage && (
              <div className="flex items-center gap-2 text-rose-600 animate-fade-in">
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs font-bold">{errorMessage}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <UserIcon className="w-3 h-3" /> 성함
              </label>
              <input 
                type="text" 
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-primary/5 outline-none transition-all text-sm font-bold text-slate-700"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Phone className="w-3 h-3" /> 연락처
              </label>
              <input 
                type="tel" 
                value={formData.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-primary/5 outline-none transition-all text-sm font-bold text-slate-700"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Shield className="w-3 h-3" /> 회원 등급
              </label>
              {isAdmin ? (
                <select 
                  value={formData.grade || MembershipGrade.SILVER}
                  onChange={(e) => handleInputChange('grade', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-primary/5 outline-none transition-all text-sm font-bold text-slate-700 bg-white"
                >
                  {Object.values(MembershipGrade).map(grade => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>
              ) : (
                <div className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 text-sm font-bold text-slate-500">
                  {user.grade || 'SILVER'}
                </div>
              )}
              {!isAdmin && <p className="text-[10px] text-slate-400 font-medium">* 등급 변경은 관리자에게 문의해주세요.</p>}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Shield className="w-3 h-3" /> 시스템 테스트
              </label>
              <button
                disabled={testStatus.type === 'loading'}
                onClick={async () => {
                  try {
                    setTestStatus({ type: 'loading', message: '테스트 메일을 발송 중입니다...' });
                    console.log('[Settings] Test email button clicked');
                    const emailAddress = user?.loginId || 'ilheonha@gmail.com';
                    const userResendKey = formData.apiKeys?.resend || user?.apiKeys?.resend;
                    console.log(`[Settings] Attempting to send test email to: ${emailAddress}`);
                    
                    const res = await fetch(`/api/test-email?email=${encodeURIComponent(emailAddress)}&apiKey=${encodeURIComponent(userResendKey || '')}`);
                    
                    if (!res.ok) {
                      const errorText = await res.text();
                      console.error('[Settings] Test email API error status:', res.status, errorText);
                      setTestStatus({ 
                        type: 'error', 
                        message: `발송 실패 (서버 응답 오류): ${res.status}. 원인: ${errorText.substring(0, 50)}...` 
                      });
                      return;
                    }

                    const data = await res.json();
                    console.log('[Settings] Test email API response:', data);
                    
                    if (data.success) {
                      setTestStatus({ 
                        type: 'success', 
                        message: `테스트 메일이 ${emailAddress}로 발송되었습니다. 스팸함도 꼭 확인해주세요!` 
                      });
                    } else {
                      const errorMsg = data.result?.message || data.error || JSON.stringify(data.result);
                      setTestStatus({ type: 'error', message: `발송 실패: ${errorMsg}` });
                    }
                  } catch (err: any) {
                    console.error('[Settings] Test email fetch error:', err);
                    setTestStatus({ type: 'error', message: `네트워크 오류 또는 시스템 에러: ${err.message}` });
                  }
                }}
                className="w-full px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Sparkles className={`w-4 h-4 ${testStatus.type === 'loading' ? 'animate-spin' : 'text-primary'}`} /> 
                {testStatus.type === 'loading' ? '발송 중...' : '테스트 알림 발송'}
              </button>

              {testStatus.type && (
                <div className={`p-3 rounded-xl flex items-start gap-2 animate-in fade-in slide-in-from-top-1 ${
                  testStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 
                  testStatus.type === 'loading' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                  'bg-red-50 text-red-700 border border-red-100'
                }`}>
                  {testStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> : 
                   testStatus.type === 'loading' ? <Sparkles className="w-4 h-4 mt-0.5 shrink-0 animate-pulse" /> :
                   <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
                  <p className="text-[11px] font-medium leading-relaxed">{testStatus.message}</p>
                </div>
              )}

              <p className="text-[10px] text-slate-400 mt-1">* 현재 로그인된 이메일(${user?.loginId || 'ilheonha@gmail.com'})로 테스트 메일을 보냅니다.</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Key className="w-3 h-3" /> 아이디
              </label>
              <div className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 text-sm font-bold text-slate-500">
                {user.loginId}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Lock className="w-3 h-3" /> 새 비밀번호
                </label>
                <input 
                  type="password" 
                  value={passwords.new}
                  onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                  placeholder="변경 시에만 입력"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-primary/5 outline-none transition-all text-sm font-bold text-slate-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Lock className="w-3 h-3" /> 비밀번호 확인
                </label>
                <input 
                  type="password" 
                  value={passwords.confirm}
                  onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                  placeholder="비밀번호 재입력"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-primary/5 outline-none transition-all text-sm font-bold text-slate-700"
                />
              </div>
            </div>

            <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10">
              <h4 className="text-xs font-black text-primary uppercase tracking-widest mb-3">계정 요약</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500">가입일</span>
                  <span className="text-[10px] font-black text-slate-700">{new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500">계정 상태</span>
                  <span className={`text-[10px] font-black ${user.isActive ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {user.isActive ? '활성' : '비활성'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? '저장 중...' : '정보 저장하기'}
              </button>
              <button 
                onClick={onLogout}
                className="px-6 py-4 border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 font-black rounded-2xl transition-all flex items-center justify-center gap-2"
                title="로그아웃"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* API Keys Section */}
      <section className="neo-card overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-primary tracking-tight">AI 엔진 API 연동 설정</h3>
          </div>
          <button 
            onClick={() => setShowGuide(!showGuide)}
            className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl hover:bg-indigo-100 transition-all border border-indigo-100 uppercase tracking-widest"
          >
            API 가이드 {showGuide ? '닫기' : '보기'}
          </button>
        </div>

        <div className="p-8 space-y-8">
          {showGuide && (
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-8 space-y-8 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-indigo-900 flex items-center gap-2 uppercase tracking-widest">
                    <span className="w-6 h-6 bg-indigo-600 text-white rounded-xl flex items-center justify-center text-[10px]">01</span>
                    Gemini API 발급 (무료)
                  </h4>
                  <ol className="text-xs text-indigo-800/70 space-y-2 list-decimal ml-4 font-medium leading-relaxed">
                    <li><a href="https://ai.google.dev/aistudio" target="_blank" rel="noopener noreferrer" className="font-bold underline text-indigo-600">Google AI Studio</a> 접속</li>
                    <li>구글 계정 로그인</li>
                    <li><b>'Get API key'</b> 클릭</li>
                    <li><b>'Create API key in new project'</b> 클릭</li>
                    <li>생성된 키를 복사하여 아래 입력란에 붙여넣으세요.</li>
                  </ol>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-black text-indigo-900 flex items-center gap-2 uppercase tracking-widest">
                    <span className="w-6 h-6 bg-indigo-600 text-white rounded-xl flex items-center justify-center text-[10px]">02</span>
                    OpenAI API 발급 (유료)
                  </h4>
                  <ol className="text-xs text-indigo-800/70 space-y-2 list-decimal ml-4 font-medium leading-relaxed">
                    <li><a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="font-bold underline text-indigo-600">OpenAI Dashboard</a> 접속</li>
                    <li><b>'Create new secret key'</b> 클릭</li>
                    <li>키 이름 설정 및 생성</li>
                    <li>생성된 키(sk-...)를 복사하여 아래 입력란에 붙여넣으세요.</li>
                    <li>* $5 이상의 크레딧 충전이 필요할 수 있습니다.</li>
                  </ol>
                </div>
              </div>
              <div className="pt-6 border-t border-indigo-100">
                <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">
                  ※ API 키는 브라우저에만 저장되며, 서버로 전송되지 않아 안전합니다.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                ✨ Gemini API Key (Google AI Studio)
              </label>
              <input 
                type="text" 
                value={formData.apiKeys?.gemini || ''}
                onChange={(e) => handleApiKeyChange('gemini', e.target.value)}
                placeholder="Google AI Studio 키 입력"
                className="w-full px-4 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm font-mono font-bold text-indigo-600"
              />
              <p className="text-[10px] text-slate-400 font-medium">Google의 최신 AI 모델을 무료로 활용합니다.</p>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                🤖 OpenAI API Key
              </label>
              <input 
                type="text" 
                value={formData.apiKeys?.openai || ''}
                onChange={(e) => handleApiKeyChange('openai', e.target.value)}
                placeholder="OpenAI Secret Key 입력"
                className="w-full px-4 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm font-mono font-bold text-indigo-600"
              />
              <p className="text-[10px] text-slate-400 font-medium">GPT-4o 등 고성능 모델을 병행 사용할 수 있습니다.</p>
            </div>

            <div className="space-y-3 md:col-span-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                📧 Resend API Key (알림 발송용)
              </label>
              <input 
                type="text" 
                value={formData.apiKeys?.resend || ''}
                onChange={(e) => handleApiKeyChange('resend', e.target.value)}
                placeholder="re_..."
                className="w-full px-4 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm font-mono font-bold text-indigo-600"
              />
              <p className="text-[10px] text-slate-400 font-medium">* 메일 발송을 위해 <a href="https://resend.com" target="_blank" className="text-indigo-600 underline">resend.com</a>에서 발급받은 API 키를 입력하세요. 도메인 인증 전에는 본인 이메일로만 발송 가능합니다.</p>
            </div>
          </div>
          
          <div className="pt-4">
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? '저장 중...' : 'API 설정 저장하기'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Settings;
