
import React, { useState, useEffect } from 'react';
import { supabase } from '../src/lib/supabase';

interface LoginProps {
  onLogin: (id: string, pw: string) => Promise<{ success: boolean; message?: string }>;
  onGoToSignup: () => void;
}

const Logo: React.FC = () => (
  <div className="flex flex-col items-center gap-4">
    <div className="relative w-72 h-32">
      <img 
        src="https://blogfiles.pstatic.net/MjAyNjAyMTlfOTkg/MDAxNzcxNDY0NTUwMjE5.jn56Q6DZtJzqmSb1T2D60-xgn9u-bQzu8zHwdzGs4Log.wea8trdiYs3uLwWRPibnOteE87D5kgbZJnr5nYWmgXcg.PNG/SMARTINCOME.png?type=w1" 
        alt="Smart Income Logo" 
        className="w-full h-full object-contain drop-shadow-2xl"
        referrerPolicy="no-referrer"
      />
    </div>
    <p className="text-[11px] text-white/40 font-bold uppercase tracking-[0.4em] mt-3">Income Automation Platform</p>
  </div>
);

const Login: React.FC<LoginProps> = ({ onLogin, onGoToSignup }) => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    // Create a timeout promise (increased to 60s)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('로그인 요청 시간이 초과되었습니다. 서버 응답이 지연되고 있으니 잠시 후 다시 시도해 주세요.')), 60000)
    );

    try {
      // Race the login against the timeout
      const result = await Promise.race([
        onLogin(id, password),
        timeoutPromise
      ]) as { success: boolean; message?: string };

      if (!result.success) {
        setError(result.message || '아이디가 존재하지 않거나 비활성화된 계정입니다.');
      }
    } catch (err: any) {
      console.error('Login submit error:', err);
      setError(err.message || '로그인 처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-500 rounded-full blur-[150px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-accent rounded-full blur-[150px] animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="mb-12 animate-fade-in">
          <Logo />
        </div>

        <div className="bg-white/95 backdrop-blur-2xl rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.3)] overflow-hidden border border-white/20 animate-fade-in" style={{animationDelay: '0.2s'}}>
          <div className="p-12 space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-primary tracking-tight">Welcome Back</h2>
              <p className="text-sm text-slate-400 font-medium mt-1">플랫폼 접속을 위해 로그인해 주세요.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 text-red-600 text-xs font-bold rounded-2xl border border-red-100 text-center animate-bounce">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Account ID</label>
                <input
                  type="text"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all text-sm font-semibold"
                  placeholder="아이디를 입력하세요"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all text-sm font-semibold"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-5 bg-primary text-white font-bold rounded-2xl shadow-2xl shadow-primary/30 transition-all active:scale-95 mt-4 text-sm tracking-widest uppercase ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-light'}`}
              >
                {isSubmitting ? '접속 중...' : '플랫폼 접속하기'}
              </button>
            </form>

            <div className="pt-8 border-t border-slate-100 flex flex-col items-center gap-4">
              <button 
                onClick={() => {
                  sessionStorage.clear();
                  window.location.reload();
                }} 
                className="text-[10px] text-slate-300 hover:text-slate-500 transition-colors uppercase tracking-widest mb-2"
              >
                로그인 세션 초기화
              </button>
              <button onClick={onGoToSignup} className="text-xs text-slate-400 font-bold hover:text-accent transition-colors uppercase tracking-widest">
                파트너 가입 신청하기
              </button>
              <span className="text-[10px] text-slate-300 font-bold tracking-widest uppercase">© 2024 Smart Income Platform</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
