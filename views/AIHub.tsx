
import React, { useState, useEffect } from 'react';
import { designInsurancePlan, getGeminiKey, getOpenAIKey } from '../services/geminiService';
import { 
  BrainCircuit, 
  Sparkles, 
  ShieldCheck, 
  RefreshCw, 
  Copy, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  Target, 
  TrendingUp,
  FileText,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

const AIHub: React.FC<{ currentUser: any, onUpdateUser: (user: any) => void }> = ({ currentUser, onUpdateUser }) => {
  const [data, setData] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [hasApiKey, setHasApiKey] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkKeys = () => {
      const gemini = getGeminiKey();
      const openai = getOpenAIKey();
      setHasApiKey(!!(gemini || openai));
    };
    checkKeys();
    window.addEventListener('storage', checkKeys);
    return () => window.removeEventListener('storage', checkKeys);
  }, []);

  const handleAnalyze = async () => {
    console.log("AIHub: handleAnalyze triggered");
    setError(null);
    
    if (!hasApiKey) {
      console.warn("AIHub: No API key configured");
      setError("API 키가 설정되지 않았습니다. [설정] 메뉴에서 Gemini 또는 OpenAI 키를 입력해주세요.");
      return;
    }
    if (!data || data.length < 10) {
      console.warn("AIHub: Insufficient data length", data?.length);
      setError('분석을 위해 최소 10자 이상의 정보를 입력해주세요.');
      return;
    }
    
    console.log("AIHub: Setting loading state to true");
    setLoading(true);
    try {
      console.log("AIHub: Calling designInsurancePlan service...");
      const design = await designInsurancePlan(data);
      console.log("AIHub: Service call successful, setting result");
      setResult(design);
    } catch (err: any) {
      console.error("AIHub: Error during analysis:", err);
      if (err.message?.includes("AUTH_REQUIRED")) {
        setError("API 키가 설정되지 않았습니다. [설정] 메뉴에서 키를 입력해주세요.");
      } else {
        setError(`분석 중 오류가 발생했습니다: ${err.message || '알 수 없는 오류'}`);
      }
    } finally {
      console.log("AIHub: Setting loading state to false");
      setLoading(false);
    }
  };

  const copyReport = () => {
    if (result?.report_markdown) {
      // Strip HTML tags when copying to clipboard as well
      const cleanText = result.report_markdown.replace(/<[^>]*>/g, '');
      navigator.clipboard.writeText(cleanText);
      alert('마크다운 리포트가 클립보드에 복사되었습니다.');
    }
  };

  // 마크다운 기호를 제거하고 서식으로 변환하는 스마트 렌더러
  const parseMarkdownLike = (text: string) => {
    if (!text) return null;
    
    // 1. HTML 태그 제거 (<h1> 등)
    const cleanText = text.replace(/<[^>]*>/g, '');
    
    const lines = cleanText.split('\n');
    return lines.map((line, idx) => {
      const trimmedLine = line.trim();
      
      // 1. 소제목 처리 (##)
      if (trimmedLine.startsWith('##')) {
        return (
          <h3 key={idx} className="text-3xl font-bold text-primary mt-16 mb-8 border-l-8 border-primary pl-8 animate-fade-in tracking-tight">
            {trimmedLine.replace(/#/g, '').trim()}
          </h3>
        );
      }
      
      // 2. 보조 소제목 처리 (###)
      if (trimmedLine.startsWith('###')) {
        return (
          <h4 key={idx} className="text-xl font-bold text-gray-800 mt-10 mb-4 pl-2 border-b-2 border-gray-100 pb-2">
            {trimmedLine.replace(/#/g, '').trim()}
          </h4>
        );
      }

      // 3. 볼드 기호(**) 제거 및 스타일 적용
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = line.split(boldRegex);
      const renderedLine = parts.map((part, i) => {
        if (i % 2 === 1) {
          return (
            <strong key={i} className="text-primary font-bold px-1 bg-primary/5 rounded-md ring-1 ring-primary/10 mx-0.5">
              {part}
            </strong>
          );
        }
        return part;
      });

      // 4. 일반 문단 (줄바꿈 반영)
      // 빈 줄은 간격으로 처리
      if (trimmedLine === '') {
        return <div key={idx} className="h-4" />;
      }

      return (
        <p key={idx} className="text-gray-700 leading-relaxed mb-4 text-[17px] font-medium tracking-normal">
          {renderedLine}
        </p>
      );
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-32 animate-fade-in">
      {!hasApiKey && (
        <div className="bg-red-50 border-2 border-red-100 p-6 rounded-[2rem] flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-2xl text-red-600">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-red-800 font-bold text-lg tracking-tight">AI API 키 설정이 필요합니다</p>
              <p className="text-red-600/80 text-sm font-medium">서비스 이용을 위해 [설정] 메뉴에서 Gemini 또는 OpenAI API 키를 입력해주세요.</p>
            </div>
          </div>
          <div className="hidden md:block">
            <span className="text-[10px] font-black text-red-300 uppercase tracking-widest">Action Required</span>
          </div>
        </div>
      )}

      {/* Input Section */}
      <div className="neo-card p-12 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-all duration-700"></div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/5 rounded-xl text-primary">
                  <BrainCircuit className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-black text-primary uppercase tracking-[0.3em]">Next-Gen AI Engine</span>
              </div>
              <h2 className="text-4xl font-black text-primary tracking-tight">지능형 보험 설계 엔진</h2>
              <p className="text-sm text-slate-400 mt-2 font-medium">15년 경력 베테랑 AI 컨설턴트가 최적의 보장 포트폴리오를 제안합니다.</p>
            </div>
            <div className="bg-accent/10 px-6 py-3 rounded-2xl border border-accent/20 flex items-center gap-3">
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
              <span className="text-[11px] font-black text-accent-dark uppercase tracking-widest">Secure AI Processing</span>
            </div>
          </div>
          
            <div className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center gap-3 text-red-700 animate-shake">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="text-sm font-bold">{error}</p>
                </div>
              )}
              <div className="relative">
              <textarea
                value={data}
                onChange={(e) => setData(e.target.value)}
                placeholder="고객 정보를 입력하세요. (나이, 성별, 직업, 월 소득, 기존 보험 현황, 희망 보장 등)&#10;개인 식별 정보(주민번호 등)는 마스킹 처리하여 입력해 주세요."
                className="w-full h-80 p-10 bg-slate-50/50 border border-slate-100 rounded-[3rem] focus:ring-8 focus:ring-primary/5 focus:bg-white focus:border-primary outline-none text-lg transition-all resize-none shadow-inner font-bold text-slate-700 leading-relaxed placeholder:text-slate-300"
              ></textarea>
              <div className="absolute top-8 right-10 flex gap-2">
                 <span className="bg-white/80 backdrop-blur-sm px-4 py-1.5 rounded-full text-[10px] font-black text-slate-400 border border-slate-100 shadow-sm uppercase tracking-widest">Pro Mode Active</span>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <button
                onClick={handleAnalyze}
                disabled={loading}
                className={`flex-[2] py-6 bg-primary text-white font-black rounded-[2rem] hover:bg-primary-light shadow-2xl shadow-primary/30 transition-all flex items-center justify-center gap-4 group ${loading ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-6 h-6 animate-spin" />
                    <span className="tracking-widest uppercase text-sm">데이터 정밀 분석 및 시뮬레이션 중...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                    <span className="tracking-widest uppercase text-sm">맞춤형 3대 안 설계 생성하기</span>
                  </>
                )}
              </button>
              <button 
                onClick={() => setData('')}
                className="flex-1 py-6 bg-slate-100 text-slate-400 font-black rounded-[2rem] hover:bg-slate-200 hover:text-slate-600 transition-all text-sm tracking-widest uppercase border border-slate-200/50"
              >
                초기화
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-fade-in">
          {/* Dashboard Summary */}
          <div className="lg:col-span-4 space-y-8">
            <div className="neo-card p-10 bg-primary text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
               <div className="flex items-center gap-3 mb-8">
                 <Target className="w-5 h-5 text-accent" />
                 <h3 className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em]">고객 프로필 요약</h3>
               </div>
               <div className="space-y-6">
                  <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
                    <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-1">생애 주기</p>
                    <p className="text-xl font-black">{result.profile_summary.life_cycle}</p>
                  </div>
                  <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
                    <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-1">위험 성향</p>
                    <p className="text-xl font-black">{result.profile_summary.risk_appetite}</p>
                  </div>
                  <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
                    <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-1">우선 목표</p>
                    <p className="text-xl font-black">{result.profile_summary.priority_goal}</p>
                  </div>
               </div>
            </div>

            <div className="neo-card p-10">
               <div className="flex items-center gap-3 mb-8">
                 <AlertTriangle className="w-5 h-5 text-red-500" />
                 <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Top 5 집중 리스크</h3>
               </div>
               <div className="space-y-3">
                  {result.risk_priority_top5.map((risk: string, i: number) => (
                    <div key={i} className="flex items-center p-4 bg-red-500/5 rounded-2xl border border-red-500/10 group hover:bg-red-500/10 transition-colors">
                      <span className="w-8 h-8 bg-red-500 text-white rounded-xl flex items-center justify-center text-xs font-black mr-4 shadow-lg shadow-red-500/20 group-hover:scale-110 transition-transform">{i+1}</span>
                      <span className="text-sm font-black text-red-900/80">{risk}</span>
                    </div>
                  ))}
               </div>
            </div>

            <div className="neo-card p-10 bg-accent text-primary">
               <div className="flex items-center gap-3 mb-8">
                 <Zap className="w-5 h-5 text-primary" />
                 <h3 className="text-[11px] font-black text-primary/40 uppercase tracking-[0.3em]">Action Items</h3>
               </div>
               <ul className="space-y-4">
                  {result.action_items?.map((item: string, i: number) => (
                    <li key={i} className="text-sm font-black flex items-start gap-3 group">
                      <CheckCircle2 className="w-5 h-5 text-primary/60 mt-0.5 group-hover:scale-110 transition-transform" />
                      <span className="opacity-90 leading-relaxed">{item}</span>
                    </li>
                  ))}
               </ul>
            </div>
          </div>

          {/* 3 Plans Comparison */}
          <div className="lg:col-span-8 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { id: 'A', name: 'A안 (보수형)', data: result.plans.A_conservative, color: 'blue', icon: ShieldCheck },
                { id: 'B', name: 'B안 (균형형)', data: result.plans.B_balanced, color: 'accent', icon: TrendingUp },
                { id: 'C', name: 'C안 (강화형)', data: result.plans.C_enhanced, color: 'amber', icon: Zap }
              ].map((plan) => (
                <div key={plan.id} className={`neo-card p-8 flex flex-col relative overflow-hidden group ${plan.id === 'B' ? 'ring-2 ring-accent border-accent/20' : ''}`}>
                   {plan.id === 'B' && (
                     <div className="absolute top-0 right-0 bg-accent text-primary text-[9px] font-black px-4 py-1.5 rounded-bl-2xl uppercase tracking-[0.2em] shadow-lg">Best Choice</div>
                   )}
                   <div className="flex items-center gap-3 mb-6">
                     <div className={`p-2 rounded-xl bg-${plan.color === 'accent' ? 'primary/5' : plan.color + '-500/5'} text-${plan.color === 'accent' ? 'primary' : plan.color + '-500'}`}>
                       <plan.icon className="w-5 h-5" />
                     </div>
                     <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">{plan.name}</h4>
                   </div>
                   <div className="mb-8">
                      <p className="text-3xl font-black text-primary tracking-tighter">₩{plan.data.monthly_premium}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">예상 월 보험료</p>
                   </div>
                   <div className="flex-1 space-y-3 mb-8">
                      {plan.data.key_coverages.map((cov: string, idx: number) => (
                        <div key={idx} className="text-[11px] font-bold text-slate-600 flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full bg-${plan.color === 'accent' ? 'accent' : plan.color + '-500'}`}></div>
                          {cov}
                        </div>
                      ))}
                   </div>
                   <div className="pt-6 border-t border-slate-100">
                     <p className="text-[10px] text-slate-400 leading-relaxed font-medium italic">
                       {plan.data.reason}
                     </p>
                   </div>
                </div>
              ))}
            </div>

            {/* Markdown Report Render */}
            <div className="neo-card p-12 relative">
               <div className="flex items-center justify-between mb-12 border-b border-slate-100 pb-8">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-100 rounded-2xl text-primary">
                      <FileText className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-black text-primary tracking-tight">전문 컨설팅 리포트</h3>
                  </div>
                  <button 
                    onClick={copyReport}
                    className="flex items-center gap-2 text-[10px] font-black bg-primary text-white px-6 py-3 rounded-2xl hover:bg-primary-light transition-all shadow-lg shadow-primary/20 group"
                  >
                    <Copy className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>리포트 복사하기</span>
                  </button>
               </div>
               <div className="prose prose-slate max-w-none text-slate-700 font-bold leading-loose h-[800px] overflow-y-auto pr-8 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                  {parseMarkdownLike(result.report_markdown)}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="neo-card p-10 bg-slate-50 border-slate-200/60 flex flex-col md:flex-row items-center justify-between gap-8 opacity-80">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-white rounded-3xl shadow-sm border border-slate-200/50">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <div>
            <p className="text-xs font-black text-primary uppercase tracking-widest mb-1">Legal Disclaimer</p>
            <p className="text-[11px] font-bold text-slate-400 leading-relaxed max-w-2xl">
              본 설계안은 AI에 의해 생성된 가이드라인이며, 법적 효력이 없습니다. 가입 전 반드시 실제 약관과 상품설명서를 확인하고 설계사와 상담하시기 바랍니다.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200/50 shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Smart Income AI Engine v4.0</span>
        </div>
      </div>
    </div>
  );
};

export default AIHub;
