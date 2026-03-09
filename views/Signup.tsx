
import React, { useState } from 'react';
import { User } from '../types';

interface SignupProps {
  onSignupSuccess: (userData: Partial<User>) => Promise<{ success: boolean; message?: string }>;
  onGoToLogin: () => void;
}

const Signup: React.FC<SignupProps> = ({ onSignupSuccess, onGoToLogin }) => {
  const [formData, setFormData] = useState({
    loginId: '',
    password: '',
    name: '',
    phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const isAdminEmail = formData.loginId.toLowerCase() === 'hih@sciencecenter.or.kr' || formData.loginId.toLowerCase() === 'admin';
    if (!formData.loginId.toLowerCase().endsWith('@gmail.com') && !isAdminEmail) {
      setError('아이디는 반드시 gmail 계정(@gmail.com)이어야 합니다.');
      return;
    }

    setIsSubmitting(true);
    const result = await onSignupSuccess(formData);
    setIsSubmitting(false);

    if (result.success) {
      alert(result.message || '회원가입이 완료되었습니다! 로그인 해주세요.');
      onGoToLogin();
    } else {
      setError(result.message || '회원가입 중 오류가 발생했습니다.');
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
        <div className="bg-white/95 backdrop-blur-2xl rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.3)] overflow-hidden border border-white/20 animate-fade-in">
          <div className="bg-gradient-to-br from-primary to-primary-dark p-10 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative z-10 flex flex-col items-center gap-4 mb-4">
              <div className="w-20 h-20">
                <img 
                  src="https://blogfiles.pstatic.net/MjAyNjAyMTlfOTkg/MDAxNzcxNDY0NTUwMjE5.jn56Q6DZtJzqmSb1T2D60-xgn9u-bQzu8zHwdzGs4Log.wea8trdiYs3uLwWRPibnOteE87D5kgbZJnr5nYWmgXcg.PNG/SMARTINCOME.png?type=w1" 
                  alt="Smart Income Logo" 
                  className="w-full h-full object-contain drop-shadow-xl"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Join Smart Income</h1>
            </div>
            <p className="text-accent text-[10px] font-bold uppercase tracking-[0.2em] mt-2 relative z-10">Start Your Automation Journey</p>
          </div>

          <form onSubmit={handleSubmit} className="p-10 space-y-5">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 text-xs font-bold rounded-2xl border border-red-100 text-center animate-bounce">
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Account ID (Gmail Only)</label>
              <input
                type="email"
                name="loginId"
                value={formData.loginId}
                onChange={handleChange}
                className="w-full px-6 py-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all text-sm font-semibold"
                placeholder="example@gmail.com"
                required
              />
              <p className="text-[10px] text-slate-400 font-medium ml-2">
                * 반드시 <span className="text-primary font-bold">@gmail.com</span> 계정으로 가입해주세요.
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-6 py-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all text-sm font-semibold"
                placeholder="성함"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-6 py-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all text-sm font-semibold"
                placeholder="010-0000-0000"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-6 py-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all text-sm font-semibold"
                placeholder="비밀번호"
                required
              />
            </div>
            <div className="pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-5 bg-primary text-white font-bold rounded-2xl shadow-2xl shadow-primary/30 transition-all active:scale-95 text-sm tracking-widest uppercase ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-light'}`}
              >
                {isSubmitting ? '처리 중...' : '회원가입 완료'}
              </button>
            </div>
            <button
              type="button"
              onClick={onGoToLogin}
              className="w-full text-xs text-slate-400 font-bold hover:text-primary transition-colors uppercase tracking-widest"
            >
              이미 계정이 있으신가요?
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
