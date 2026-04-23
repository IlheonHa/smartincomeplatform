
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { 
  Search, 
  BarChart3, 
  TrendingUp, 
  Target, 
  Layers, 
  Table as TableIcon, 
  Award, 
  Combine, 
  Type,
  Zap,
  RefreshCw,
  Copy,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Info,
  Check,
  AlertCircle,
  Crown,
  Download
} from 'lucide-react';
import { analyzeGoldenKeywords } from '../services/geminiService';

interface KeywordMetadata {
  keyword: string;
  category: string;
  type: string;
  intent: string;
  competition: string;
  searchVolume: string;
  seasonality: string;
  profitability: string;
  age: string;
  google: string;
  naver: string;
  daum: string;
}

interface Top5Recommendation {
  keyword: string;
  reason: string;
  revenuePotential: string;
}

interface Top3Combination {
  combination: string;
}

interface AnalysisResult {
  keywords: KeywordMetadata[];
  top5: Top5Recommendation[];
  top3Combinations: Top3Combination[];
  blogTitles: string[];
}

const KeywordAnalysis: React.FC<{ currentUser: any, onUpdateUser: (user: any) => void }> = ({ currentUser, onUpdateUser }) => {
  const [topic, setTopic] = useState('');
  const [age, setAge] = useState('전연령');
  const [purpose, setPurpose] = useState('혼합');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!topic.trim()) {
      alert('주제를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setResult(null);
    try {
      const data = await analyzeGoldenKeywords({
        topic: topic === '랜덤' ? '랜덤 트렌드 키워드' : topic,
        age,
        purpose
      });
      setResult(data);
    } catch (error: any) {
      console.error('Analysis failed:', error);
      alert(error.message || '분석 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(id);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const handleRandom = () => {
    setTopic('랜덤');
    // If I want it to trigger immediately:
    // setTimeout(() => handleAnalyze(), 100);
  };

  const handleExportExcel = () => {
    if (!result) return;
    
    try {
      const exportData = result.keywords.map(k => ({
        '키워드': k.keyword,
        '카테고리': k.category,
        '유형': k.type,
        '검색 의도': k.intent,
        '경쟁 강도': k.competition,
        '검색량': k.searchVolume,
        '계절성': k.seasonality,
        '수익성': k.profitability,
        '연령 적합성': k.age,
        'Google 인기': k.google,
        '네이버 인기': k.naver,
        'DAUM 인기': k.daum
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "황금키워드목록");
      
      const fileName = `황금키워드_분석_${topic.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Excel export failed:', error);
      alert('엑셀 파일 생성 중 오류가 발생했습니다.');
    }
  };

  const ages = ['전연령', '10대', '20대', '30대', '40대', '50대', '60대 이상'];
  const purposes = [
    { id: '정보형', label: '정보형', desc: '유용한 지식 전달 중심' },
    { id: '수익형', label: '수익형', desc: '상품 판매 및 수익 전환 중심' },
    { id: '혼합', label: '혼합', desc: '정보 전달과 수익 창출의 균형' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
      {/* Header section */}
      <section className="text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-100 text-amber-600 font-bold text-xs uppercase tracking-widest"
        >
          <Crown className="w-3.5 h-3.5" />
          Golden System
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl font-black text-slate-900 tracking-tight"
        >
          황금 키워드 분석
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-slate-500 max-w-2xl mx-auto font-medium"
        >
          단순한 키워드 나열이 아닌, 수익 가능성이 높은 상위 1%의 황금 키워드를 발굴합니다.
          경쟁은 낮고 전환율은 높은 최적의 조합을 확인하세요.
        </motion.p>
      </section>

      {/* Input section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="neo-card p-8 space-y-8 h-full flex flex-col justify-between">
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" />
                    분석 주제
                  </label>
                  <button 
                    onClick={handleRandom}
                    className="text-[10px] font-bold text-primary bg-primary/5 px-2.5 py-1 rounded-full hover:bg-primary/10 transition-colors flex items-center gap-1.5"
                  >
                    <Zap className="w-3 h-3 saturate-200" />
                    트렌드 랜덤 추천
                  </button>
                </div>
                <div className="relative">
                  <input 
                    type="text" 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="분석하고 싶은 주제를 입력하세요 (예: 비갱신 암보험, 제주도 맛집 투어)"
                    className="w-full p-5 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 text-slate-800 font-bold placeholder:text-slate-300 transition-all shadow-inner"
                  />
                  <Search className="absolute right-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-200" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    타겟 연령대
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ages.map((a) => (
                      <button 
                        key={a}
                        onClick={() => setAge(a)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                          age === a 
                          ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                          : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    수익 목적
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {purposes.map((p) => (
                      <button 
                        key={p.id}
                        onClick={() => setPurpose(p.id)}
                        className={`p-3 rounded-xl border transition-all text-left ${
                          purpose === p.id 
                          ? 'bg-primary border-primary shadow-lg shadow-primary/20' 
                          : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <p className={`text-[10px] font-black uppercase mb-0.5 ${purpose === p.id ? 'text-white/60' : 'text-slate-300'}`}>{p.id}</p>
                        <p className={`text-[11px] font-bold ${purpose === p.id ? 'text-white' : 'text-slate-700'}`}>{p.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={handleAnalyze}
              disabled={isLoading || !topic.trim()}
              className="w-full py-5 bg-primary text-white font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-primary-light transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-primary/20 mt-8 group"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>황금 키워드 분석 중...</span>
                </>
              ) : (
                <>
                  <BarChart3 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>황금 키워드 분석 시작하기</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="neo-card p-8 bg-slate-900 border-none relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl"></div>
          <div className="relative z-10 space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center shadow-lg">
              <Info className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-white">분석 가이드</h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-6 h-6 rounded-lg bg-white/10 shrink-0 flex items-center justify-center text-[10px] font-bold text-white">1</div>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  <span className="text-white">구체적인 주제</span>일수록 더욱 정교한 롱테일 키워드와 수익 모델이 도출됩니다.
                </p>
              </div>
              <div className="flex gap-4">
                <div className="w-6 h-6 rounded-lg bg-white/10 shrink-0 flex items-center justify-center text-[10px] font-bold text-white">2</div>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  <span className="text-white">랜덤 기능</span>은 최근 1개월 내 급상승 키워드와 트렌드를 반영하여 새로운 기회를 제공합니다.
                </p>
              </div>
              <div className="flex gap-4">
                <div className="w-6 h-6 rounded-lg bg-white/10 shrink-0 flex items-center justify-center text-[10px] font-bold text-white">3</div>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  수출된 결과는 <span className="text-accent underline decoration-accent/20 underline-offset-4">엑셀 파일</span>로 다운로드하여 관리 히스토리에 보관할 수 있습니다.
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">분석 정교도</p>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(i => <div key={i} className="w-1 h-3 rounded-full bg-accent saturate-200"></div>)}
                </div>
              </div>
              <p className="text-[10px] text-slate-500 font-medium line-clamp-2 italic">
                AI Deep Analysis Engine: V3.5 Activated
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Results Display */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-12"
          >
            {/* 1. Meta-data Table */}
            <section className="space-y-6">
              <div className="flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/5 flex items-center justify-center">
                    <TableIcon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight">키워드 상세 메타데이터</h3>
                </div>
                <button 
                  onClick={handleExportExcel}
                  className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all flex items-center gap-2 shadow-lg shadow-slate-200"
                >
                  <Download className="w-4 h-4" />
                  엑셀로 저장하기
                </button>
              </div>

              <div className="neo-card overflow-hidden border-none shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">키워드</th>
                        <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">카테고리</th>
                        <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">유형</th>
                        <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">검색 의도</th>
                        <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">경쟁</th>
                        <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">검색량</th>
                        <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center text-primary font-black saturate-200">수익성</th>
                        <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Google</th>
                        <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">네이버</th>
                        <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">DAUM</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {(result.keywords || []).map((k, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="p-5">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-slate-900">{k.keyword || '-'}</span>
                              <button onClick={() => handleCopy(k.keyword || '', `kw-${idx}`)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                {copyStatus === `kw-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
                              </button>
                            </div>
                          </td>
                          <td className="p-5"><span className="text-[11px] font-bold text-slate-500">{k.category || '-'}</span></td>
                          <td className="p-5 text-center"><span className="text-[10px] font-bold text-slate-400">{k.type || '-'}</span></td>
                          <td className="p-5 text-center"><span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">{k.intent || '-'}</span></td>
                          <td className="p-5 text-center">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${
                              k.competition === '하' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 
                              k.competition === '중' ? 'text-amber-600 bg-amber-50 border-amber-100' : 'text-red-600 bg-red-50 border-red-100'
                            }`}>
                              {k.competition || '미상'}
                            </span>
                          </td>
                          <td className="p-5 text-center"><span className="text-[10px] font-bold text-slate-500">{k.searchVolume || '-'}</span></td>
                          <td className="p-5 text-center">
                            <span className={`text-[10px] font-black ${
                              (k.profitability || '').includes('높음') ? 'text-primary' : 'text-slate-400'
                            }`}>
                              {k.profitability || '-'}
                            </span>
                          </td>
                          <td className="p-5 text-center px-10">
                            <div className="h-1.5 w-full max-w-[40px] mx-auto bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-400" style={{ width: (k.google || '').includes('높음') ? '80%' : (k.google || '').includes('중간') ? '50%' : '20%' }}></div>
                            </div>
                          </td>
                          <td className="p-5 text-center px-10">
                            <div className="h-1.5 w-full max-w-[40px] mx-auto bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-400" style={{ width: (k.naver || '').includes('높음') ? '90%' : (k.naver || '').includes('중간') ? '60%' : '30%' }}></div>
                            </div>
                          </td>
                          <td className="p-5 text-center px-10">
                            <div className="h-1.5 w-full max-w-[40px] mx-auto bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-sky-400" style={{ width: (k.daum || '').includes('높음') ? '70%' : (k.daum || '').includes('중간') ? '40%' : '15%' }}></div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* 2. Top 5 Recommendations */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-1 flex flex-col justify-center space-y-4 px-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center">
                  <Award className="w-6 h-6 text-amber-500" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 leading-tight">상위 추천<br />TOP 5</h3>
                <p className="text-xs text-slate-400 font-medium">수익화 가능성이 가장 높은 최적의 키워드입니다.</p>
              </div>
              {(result.top5 || []).map((t, idx) => (
                <div key={idx} className="neo-card p-6 border-none relative overflow-hidden group">
                  <div className="absolute -right-2 -bottom-2 opacity-5 text-slate-900 italic font-black text-6xl group-hover:scale-125 transition-transform">{idx + 1}</div>
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">RECOMMENDED</span>
                      <button onClick={() => handleCopy(t.keyword || '', `top5-${idx}`)}>
                        {copyStatus === `top5-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
                      </button>
                    </div>
                    <h4 className="text-lg font-black text-slate-900 border-l-4 border-amber-400 pl-3">{t.keyword || '-'}</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">추천 이유</p>
                        <p className="text-[11px] text-slate-600 leading-relaxed font-medium">{t.reason || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">수익 가능성</p>
                        <p className="text-[11px] text-emerald-600 leading-relaxed font-bold">{t.revenuePotential || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </section>

            {/* 3. Combinations & Titles */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Top 3 Combinations */}
              <section className="space-y-8">
                <div className="flex items-center gap-3 px-4">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
                    <Combine className="w-5 h-5 text-indigo-500" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">최상위 키워드 조합 (TOP 3)</h3>
                </div>
                <div className="space-y-4">
                  {(result.top3Combinations || []).map((c, idx) => (
                    <motion.div 
                      key={idx}
                      whileHover={{ x: 10 }}
                      className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group cursor-pointer"
                      onClick={() => handleCopy(c.combination || '', `comb-${idx}`)}
                    >
                      <div className="space-y-2">
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">COMBINATION #{idx + 1}</span>
                        <p className="text-sm font-black text-slate-700 tracking-tight">{c.combination || '-'}</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                        {copyStatus === `comb-${idx}` ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-300" />}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* Blog Title Keywords */}
              <section className="space-y-8">
                <div className="flex items-center gap-3 px-4">
                  <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center">
                    <Type className="w-5 h-5 text-rose-500" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">블로그 제목용 핵심 키워드</h3>
                </div>
                <div className="neo-card p-8 border-none bg-slate-50 flex flex-wrap gap-2">
                  {(result.blogTitles || []).map((t, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleCopy(t || '', `title-${idx}`)}
                      className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-bold text-[11px] rounded-xl hover:border-primary hover:text-primary transition-all flex items-center gap-2 group"
                    >
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">#</span>
                      {t || '-'}
                      {copyStatus === `title-${idx}` ? <Check className="w-3 h-3 text-emerald-500" /> : <ChevronRight className="w-3 h-3 text-slate-200" />}
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty / Loading State */}
      {!result && !isLoading && (
        <section className="flex flex-col items-center justify-center py-20 text-center space-y-6">
          <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center opacity-50 relative overflow-hidden">
            <div className="absolute inset-0 bg-slate-200/20 animate-pulse"></div>
            <BarChart3 className="w-10 h-10 text-slate-200" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-300">현재 분석 데이터가 없습니다</h3>
            <p className="text-slate-200 text-sm font-medium">분석하고 싶은 주제를 입력하여 황금 키워드 발굴을 시작하세요.</p>
          </div>
        </section>
      )}

      {isLoading && (
        <section className="py-20 flex flex-col items-center justify-center space-y-8">
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 border-4 border-primary/10 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-4 bg-primary/5 rounded-full flex items-center justify-center">
              <RefreshCw className="w-8 h-8 text-primary animate-pulse" />
            </div>
          </div>
          <div className="text-center space-y-3">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-3">
              황금 키워드 알고리즘 가동 중
              <span className="inline-block w-2 h-2 bg-accent rounded-full animate-ping saturate-200"></span>
            </h3>
            <p className="text-slate-400 text-sm font-medium animate-pulse">
              네이버, 구글, 다음 검색 엔진의 실시간 트래픽 데이터를 바탕으로 수익성을 계산하고 있습니다...
            </p>
          </div>
        </section>
      )}
    </div>
  );
};

export default KeywordAnalysis;
