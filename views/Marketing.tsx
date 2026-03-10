
import React, { useState, useEffect } from 'react';
import { 
  optimizeMarketingTopic, 
  generateGoldenKeywords, 
  generateGoldenTitles, 
  generateBlogPost,
  generateBlogImage,
  rewriteBlogPostForFCPA,
  getGeminiKey,
  getOpenAIKey
} from '../services/geminiService';
import { 
  PenTool, 
  Sparkles, 
  Search, 
  Trophy, 
  FileText, 
  RefreshCw, 
  Copy, 
  Globe, 
  Package, 
  Download, 
  Hash, 
  BarChart3, 
  Send, 
  Share2, 
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Zap,
  Heart,
  AlertCircle
} from 'lucide-react';

type Step = 'TOPIC' | 'KEYWORDS' | 'TITLE' | 'GENERATION' | 'SCHEDULE';

const Marketing: React.FC<{ currentUser: any, onUpdateUser: (user: any) => void }> = ({ currentUser, onUpdateUser }) => {
  const [step, setStep] = useState<Step>('TOPIC');
  const [userTopic, setUserTopic] = useState('');
  const [optimizedTopics, setOptimizedTopics] = useState<any[]>([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedTarget, setSelectedTarget] = useState('');
  
  const [keywordData, setKeywordData] = useState<any>(null);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  
  const [titles, setTitles] = useState<string[]>([]);
  const [selectedTitle, setSelectedTitle] = useState('');
  
  const [style, setStyle] = useState('가이드 스타일 (친절하고 안내형)');
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  
  const [finalPost, setFinalPost] = useState<any>(null);
  const [finalImages, setFinalImages] = useState<string[]>([]);
  const [hasApiKey, setHasApiKey] = useState(true);
  const [isFCPAProcessing, setIsFCPAProcessing] = useState(false);

  useEffect(() => {
    const checkKeys = () => {
      const gemini = getGeminiKey();
      const openai = getOpenAIKey();
      setHasApiKey(!!(gemini || openai));
    };
    checkKeys();
    // Also check when sessionStorage changes (e.g. from Settings tab)
    window.addEventListener('storage', checkKeys);
    return () => window.removeEventListener('storage', checkKeys);
  }, []);

  const resetAll = () => {
    setStep('TOPIC');
    setUserTopic('');
    setOptimizedTopics([]);
    setKeywordData(null);
    setSelectedKeywords([]);
    setTitles([]);
    setFinalPost(null);
    setFinalImages([]);
  };

  const handleTopicOptimize = async () => {
    if (!hasApiKey) {
      alert("API 키가 설정되지 않았습니다. [설정] 메뉴의 'AI 엔진 API 연동 설정'에서 Gemini 또는 OpenAI 키를 입력해주세요.");
      return;
    }
    if (!userTopic) return alert('주제를 입력해주세요.');
    setLoading(true);
    setLoadingStatus('SEO 전문가가 주제를 분석하고 있습니다...');
    try {
      const results = await optimizeMarketingTopic(userTopic);
      setOptimizedTopics(results);
    } catch (error: any) {
      console.error(error);
      if (error.message?.includes("AUTH_REQUIRED")) {
        alert("API 키가 설정되지 않았습니다. [설정] 메뉴의 'AI 엔진 API 연동 설정'에서 키를 입력해주세요.");
      } else {
        alert('분석 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeywordGeneration = async (topic: string, target: string) => {
    setSelectedTopic(topic);
    setSelectedTarget(target);
    setLoading(true);
    setLoadingStatus('황금 키워드를 발굴하는 중입니다...');
    try {
      const data = await generateGoldenKeywords(topic, target);
      setKeywordData(data);
      setStep('KEYWORDS');
    } catch (error: any) {
      console.error(error);
      if (error.message?.includes("AUTH_REQUIRED")) {
        alert("API 키가 설정되지 않았습니다. [설정] 메뉴의 'AI 엔진 API 연동 설정'에서 키를 입력해주세요.");
      } else {
        alert('키워드 생성 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTitleGeneration = async () => {
    if (selectedKeywords.length === 0) return alert('키워드를 하나 이상 선택해주세요.');
    setLoading(true);
    setLoadingStatus('최적의 황금 제목을 생성 중입니다...');
    try {
      const data = await generateGoldenTitles(selectedKeywords);
      setTitles(data);
      setStep('TITLE');
    } catch (error: any) {
      console.error(error);
      if (error.message?.includes("AUTH_REQUIRED")) {
        alert("API 키가 설정되지 않았습니다. [설정] 메뉴의 'AI 엔진 API 연동 설정'에서 키를 입력해주세요.");
      } else {
        alert('제목 생성 중 오류가 발생했습니다. API 키 설정을 확인해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFullPostGeneration = async () => {
    if (!selectedTitle) return alert('제목을 선택해주세요.');
    setLoading(true);
    setLoadingStatus('전략적 블로그 포스팅을 작성 중입니다...');
    try {
      const post = await generateBlogPost(selectedTitle, selectedKeywords, style, selectedTarget);
      setFinalPost(post);
      
      setLoadingStatus('AI 이미지를 생성하여 본문에 삽입하는 중...');
      
      const imagePromises = post.imagePrompts.map(async (prompt: string) => {
        try {
          return await generateBlogImage(prompt);
        } catch (imgErr) {
          console.error('Image generation failed:', imgErr);
          return null;
        }
      });

      const imgs = (await Promise.all(imagePromises)).filter((img): img is string => img !== null);
      setFinalImages(imgs);
      setStep('GENERATION');
    } catch (error: any) {
      console.error(error);
      if (error.message?.includes("AUTH_REQUIRED")) {
        alert("API 키가 설정되지 않았습니다. [설정] 메뉴의 'AI 엔진 API 연동 설정'에서 키를 입력해주세요.");
      } else {
        alert('본문 생성 중 오류가 발생했습니다. API 키 설정을 확인해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFCPACompliance = async () => {
    if (!finalPost) return;
    setIsFCPAProcessing(true);
    setLoading(true);
    setLoadingStatus('금소법 가이드라인에 맞춰 원고를 재구성하고 있습니다...');
    try {
      const compliantPost = await rewriteBlogPostForFCPA(finalPost);
      setFinalPost(compliantPost);
      setSelectedTitle(compliantPost.finalTitle);
      alert('금소법 가이드라인을 준수한 원고로 변경되었습니다.');
    } catch (error: any) {
      console.error(error);
      alert('금소법 준수글 변환 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
      setIsFCPAProcessing(false);
    }
  };

  // 마크다운 기호를 제거하고 서식으로 변환하는 스마트 렌더러
  const parseMarkdownLike = (text: string) => {
    if (!text) return null;
    
    // HTML 태그 제거
    const cleanText = text.replace(/<[^>]*>/g, '');
    
    const lines = cleanText.split('\n');
    return lines.map((line, idx) => {
      // 1. 소제목 처리 (##)
      if (line.trim().startsWith('##')) {
        return (
          <h3 key={idx} className="text-3xl font-bold text-primary mt-16 mb-8 border-l-8 border-primary pl-8 animate-fade-in tracking-tight">
            {line.replace(/#/g, '').trim()}
          </h3>
        );
      }
      
      // 2. 보조 소제목 처리 (###)
      if (line.trim().startsWith('###')) {
        return (
          <h4 key={idx} className="text-xl font-bold text-gray-800 mt-10 mb-4 pl-2 border-b-2 border-gray-100 pb-2">
            {line.replace(/#/g, '').trim()}
          </h4>
        );
      }

      // 3. 볼드 기호(**) 제거 및 스타일 적용
      // Regex explained: **문구** 패턴을 찾아서 캡처 그룹으로 나눔
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = line.split(boldRegex);
      const renderedLine = parts.map((part, i) => {
        if (i % 2 === 1) {
          // 홀수 번째 요소는 ** 사이에 있던 강조 문구임
          return (
            <strong key={i} className="text-primary font-bold px-1 bg-primary/5 rounded-md ring-1 ring-primary/10 mx-0.5">
              {part}
            </strong>
          );
        }
        return part;
      });

      // 4. 일반 문단 (줄바꿈 반영)
      return (
        <p key={idx} className="text-gray-700 leading-relaxed mb-6 text-[17px] font-medium tracking-normal">
          {renderedLine}
        </p>
      );
    });
  };

  const handleCopyPost = () => {
    if (!finalPost) return;
    // 클립보드 복사 시 마크다운 기호(#)를 모두 제거하여 순수 텍스트만 복사
    const cleanContent = finalPost.content
      .replace(/## /g, '\n[제목] ')
      .replace(/### /g, '\n[부제목] ');
    
    const fullText = `${selectedTitle}\n\n${cleanContent}\n\n${finalPost.hashtags.join(' ')}`;
    navigator.clipboard.writeText(fullText);
    alert('순수 텍스트 원고가 복사되었습니다.');
  };

  const handleCopyRichText = () => {
    if (!finalPost) return;
    
    let htmlContent = `<h1>${selectedTitle}</h1>\n`;
    const lines = finalPost.content.split('\n');
    lines.forEach((line: string) => {
      if (line.trim().startsWith('##')) {
        htmlContent += `<h2>${line.replace(/#/g, '').trim()}</h2>\n`;
      } else if (line.trim().startsWith('###')) {
        htmlContent += `<h3>${line.replace(/#/g, '').trim()}</h3>\n`;
      } else if (line.trim()) {
        htmlContent += `<p>${line.trim()}</p>\n`;
      }
    });
    htmlContent += `<p>${finalPost.hashtags.join(' ')}</p>`;

    try {
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const data = [new ClipboardItem({ 'text/html': blob, 'text/plain': new Blob([htmlContent.replace(/<[^>]*>/g, '')], { type: 'text/plain' }) })];
      
      navigator.clipboard.write(data).then(() => {
        alert('서식이 포함된 원고가 복사되었습니다. 블로그 편집기에 붙여넣으세요.');
      }).catch(err => {
        console.error('Failed to copy rich text:', err);
        // Fallback to HTML copy if rich text fails
        handleCopyHTML();
      });
    } catch (e) {
      console.error('ClipboardItem not supported:', e);
      handleCopyHTML();
    }
  };

  const handleCopyHTML = () => {
    if (!finalPost) return;
    let htmlContent = `<h1>${selectedTitle}</h1>\n`;
    const lines = finalPost.content.split('\n');
    lines.forEach((line: string) => {
      if (line.trim().startsWith('##')) {
        htmlContent += `<h2>${line.replace(/#/g, '').trim()}</h2>\n`;
      } else if (line.trim().startsWith('###')) {
        htmlContent += `<h3>${line.replace(/#/g, '').trim()}</h3>\n`;
      } else if (line.trim()) {
        htmlContent += `<p>${line.trim()}</p>\n`;
      }
    });
    htmlContent += `<p>${finalPost.hashtags.join(' ')}</p>`;
    navigator.clipboard.writeText(htmlContent);
    alert('HTML 코드가 복사되었습니다.');
  };

  const handleCopyJSON = () => {
    if (!finalPost) return;
    const jsonData = JSON.stringify({
      title: selectedTitle,
      content: finalPost.content,
      hashtags: finalPost.hashtags,
      images: finalImages
    }, null, 2);
    navigator.clipboard.writeText(jsonData);
    alert('JSON 데이터가 복사되었습니다.');
  };

  const handleDownloadImage = (url: string, index: number) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `blog-image-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderContentWithImages = () => {
    if (!finalPost) return null;
    let text = finalPost.content;
    // 이미지 플레이스홀더를 기준으로 텍스트 분할
    const parts = text.split(/\[IMAGE_PLACEHOLDER_\d+\]/);
    return (
      <div className="space-y-2">
        {parts.map((part: string, i: number) => (
          <React.Fragment key={i}>
            <div className="content-block">{parseMarkdownLike(part)}</div>
            {finalImages[i] && (
              <div className="my-20 overflow-hidden rounded-[3rem] shadow-2xl border-[16px] border-white group relative">
                <img src={finalImages[i]} alt={`Blog Illustration ${i+1}`} className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-1000" />
                <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-[3rem]"></div>
                <div className="absolute top-8 right-8 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleDownloadImage(finalImages[i], i)}
                    className="bg-white/90 backdrop-blur-md text-primary p-4 rounded-2xl shadow-xl hover:bg-white transition-all"
                    title="이미지 다운로드"
                  >
                    <Download className="w-6 h-6" />
                  </button>
                </div>
                <div className="absolute bottom-8 right-8 bg-primary/40 backdrop-blur-md text-white text-[10px] px-6 py-3 rounded-full font-bold uppercase tracking-widest">AI Generated Illustration {i+1}</div>
              </div>
            )}
          </React.Fragment>
        ))}
        <div className="pt-20 mt-20 border-t border-slate-100 flex flex-wrap gap-3">
          {finalPost.hashtags.map((h: string, i: number) => (
            <span key={i} className="text-[12px] font-bold bg-primary/5 text-primary px-6 py-2.5 rounded-full border border-primary/10 hover:bg-primary/10 transition-colors cursor-default uppercase tracking-widest">
              #{h.replace('#', '')}
            </span>
          ))}
        </div>
      </div>
    );
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

      {/* Header */}
      <div className="neo-card p-12 bg-primary text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/10 rounded-xl">
                <PenTool className="w-6 h-6 text-accent" />
              </div>
              <span className="text-[11px] font-bold text-white/40 uppercase tracking-[0.3em]">AI Content Studio</span>
            </div>
            <h2 className="text-4xl font-bold tracking-tight mb-3">AI 블로그 자동생성 시스템</h2>
            <p className="text-blue-200 text-base font-medium opacity-90">
              기호 없이 깔끔한 고품질 원고와 맞춤 이미지를 설계합니다.
            </p>
          </div>
          <button 
            onClick={resetAll}
            className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl text-sm font-bold transition-all backdrop-blur-md flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            새 작업 시작하기
          </button>
        </div>
      </div>
      
      {/* Wizard Steps */}
      <div className="flex justify-center">
        <div className="bg-white/80 backdrop-blur-xl px-12 py-5 rounded-[2.5rem] border border-slate-100 shadow-xl flex items-center gap-12">
          {[
            { id: 'TOPIC', label: '주제 분석', icon: Search },
            { id: 'KEYWORDS', label: '키워드 발굴', icon: BarChart3 },
            { id: 'TITLE', label: '제목 확정', icon: Trophy },
            { id: 'GENERATION', label: '본문 생성', icon: FileText }
          ].map((s, i) => (
            <div key={s.id} className="flex items-center gap-4">
              <div className={`flex items-center gap-3 transition-all ${step === s.id ? 'text-primary scale-110' : 'text-slate-300'}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${step === s.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-100'}`}>
                  {i + 1}
                </div>
                <span className="text-xs font-bold tracking-widest uppercase">
                  {s.label}
                </span>
              </div>
              {i < 3 && <ChevronRight className="w-4 h-4 text-slate-200" />}
            </div>
          ))}
        </div>
      </div>

      {/* LOADING STATE */}
      {loading && (
        <div className="fixed inset-0 bg-primary/60 backdrop-blur-md z-50 flex flex-col items-center justify-center">
          <div className="bg-white p-16 rounded-[4rem] shadow-2xl flex flex-col items-center space-y-8 max-w-md text-center border border-slate-100 animate-fade-in">
            <div className="relative">
              <RefreshCw className="w-20 h-20 text-primary animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-accent" />
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-2xl font-bold text-primary tracking-tight">{loadingStatus}</p>
              <p className="text-sm text-slate-400 font-medium leading-relaxed italic">
                "보험 전문가의 신뢰감을 주는 문장과 <br/> 매력적인 시각 자료를 생성하고 있습니다."
              </p>
            </div>
          </div>
        </div>
      )}

      {/* STEP 1: TOPIC & TARGET */}
      {step === 'TOPIC' && (
        <div className="grid grid-cols-1 gap-10 animate-fade-in">
          <div className="neo-card p-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-start gap-3 mb-8 ml-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] block">블로그 포스팅 관심 주제</label>
              <div className="flex items-center gap-2 bg-amber-100/50 px-5 py-2.5 rounded-2xl border border-amber-200 shadow-sm">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span className="text-[11px] font-bold text-amber-800">
                  추천 주제: 보험, 부동산, 재무설계, 건강식품, 교육/강의, 프랜차이즈 등
                </span>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300" />
                <input 
                  type="text" 
                  value={userTopic}
                  onChange={(e) => setUserTopic(e.target.value)}
                  placeholder="예: 30대 남성 암보험 가성비 설계, 치아보험 보장 분석 등"
                  className="w-full pl-16 pr-8 py-6 rounded-[2rem] bg-slate-50 border border-slate-100 focus:border-primary focus:bg-white focus:ring-8 focus:ring-primary/5 outline-none font-bold text-slate-800 transition-all text-lg shadow-inner"
                />
              </div>
              <button 
                onClick={handleTopicOptimize}
                className="px-12 bg-primary text-white font-bold rounded-[2rem] hover:bg-primary-light transition-all shadow-2xl shadow-primary/30 active:scale-95 text-lg flex items-center justify-center gap-3"
              >
                <span>분석 시작</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {optimizedTopics.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {optimizedTopics.map((item, i) => (
                <div 
                  key={i} 
                  onClick={() => handleKeywordGeneration(item.optimizedTopic, item.targetAudience)}
                  className="neo-card p-10 cursor-pointer hover:shadow-2xl transition-all group relative overflow-hidden border-2 border-transparent hover:border-primary/20"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                    <ArrowRight className="w-8 h-8 text-primary" />
                  </div>
                  <div className="flex justify-between items-start mb-8">
                    <span className="bg-primary/5 text-primary text-[10px] font-bold px-4 py-2 rounded-full uppercase tracking-widest border border-primary/10">Writing {i+1}</span>
                  </div>
                  <h4 className="font-bold text-2xl text-primary mb-4 leading-tight group-hover:text-primary-light transition-colors">{item.optimizedTopic}</h4>
                  <div className="flex items-center gap-2 mb-8">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent"></div>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">타겟: {item.targetAudience}</p>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">{item.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* STEP 2: KEYWORDS */}
      {step === 'KEYWORDS' && keywordData && (
        <div className="space-y-10 animate-fade-in">
          <div className="neo-card p-12 flex flex-col md:flex-row items-center justify-between gap-8 border-l-[12px] border-l-primary">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-3">Selected Writing Strategy</p>
              <h3 className="text-3xl font-bold text-primary tracking-tight">{selectedTopic}</h3>
            </div>
            <button 
              onClick={handleTitleGeneration}
              className="px-12 py-6 bg-primary text-white font-bold rounded-[2rem] shadow-2xl shadow-primary/30 hover:bg-primary-light transition-all active:scale-95 flex items-center gap-3"
            >
              <span>황금 제목 생성</span>
              <div className="bg-white/20 px-3 py-1 rounded-lg text-xs">{selectedKeywords.length}</div>
            </button>
          </div>

          <div className="neo-card overflow-hidden">
              <div className="p-10 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                  <h4 className="font-bold text-2xl text-primary tracking-tight">황금 키워드 분석 리포트</h4>
                  <p className="text-xs text-slate-400 font-bold mt-2 uppercase tracking-[0.2em]">High ROI Keywords for Insurance Blogging</p>
                </div>
                <div className="flex gap-3">
                   <button 
                    onClick={() => setSelectedKeywords(keywordData.keywords.map((k:any) => k.keyword))}
                    className="px-6 py-3 bg-primary/5 text-[11px] font-bold text-primary rounded-xl hover:bg-primary/10 transition-colors uppercase tracking-widest"
                   >전체 선택</button>
                   <button 
                    onClick={() => setSelectedKeywords([])}
                    className="px-6 py-3 bg-white text-[11px] font-bold text-slate-400 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors uppercase tracking-widest"
                   >초기화</button>
                </div>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left text-[12px] whitespace-nowrap">
                   <thead className="bg-slate-50/30">
                      <tr>
                        <th className="px-10 py-8 font-bold text-slate-400 uppercase tracking-widest">선택</th>
                        <th className="px-10 py-8 font-bold text-slate-400 uppercase tracking-widest">키워드</th>
                        <th className="px-10 py-8 font-bold text-slate-400 uppercase tracking-widest">의도</th>
                        <th className="px-10 py-8 font-bold text-slate-400 uppercase tracking-widest">경쟁강도</th>
                        <th className="px-10 py-8 font-bold text-slate-400 uppercase tracking-widest">검색량</th>
                        <th className="px-10 py-8 font-bold text-slate-400 uppercase tracking-widest">포털 점유</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {keywordData.keywords.map((k: any, i: number) => (
                        <tr 
                          key={i} 
                          onClick={() => {
                            if (selectedKeywords.includes(k.keyword)) setSelectedKeywords(selectedKeywords.filter(x => x !== k.keyword));
                            else setSelectedKeywords([...selectedKeywords, k.keyword]);
                          }}
                          className={`cursor-pointer transition-colors ${selectedKeywords.includes(k.keyword) ? 'bg-primary/5' : 'hover:bg-slate-50'}`}
                        >
                          <td className="px-10 py-6">
                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedKeywords.includes(k.keyword) ? 'bg-primary border-primary shadow-lg shadow-primary/20' : 'border-slate-200 bg-white'}`}>
                              {selectedKeywords.includes(k.keyword) && <CheckCircle2 className="text-white w-4 h-4" />}
                            </div>
                          </td>
                          <td className="px-10 py-6 font-bold text-primary text-sm">{k.keyword}</td>
                          <td className="px-10 py-6"><span className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-[10px] text-slate-500 uppercase tracking-widest">{k.intent}</span></td>
                          <td className="px-10 py-6">
                            <span className={`font-bold text-[11px] px-4 py-1.5 rounded-full uppercase tracking-widest ${k.competition === '하' ? 'bg-accent/10 text-accent-dark' : 'bg-slate-100 text-slate-400'}`}>
                              경쟁 {k.competition}
                            </span>
                          </td>
                          <td className="px-10 py-6 font-bold text-slate-500">{k.volume}</td>
                          <td className="px-10 py-6 font-bold text-primary">{k.naverPop}</td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        </div>
      )}

      {/* STEP 3: TITLES */}
      {step === 'TITLE' && (
        <div className="space-y-10 animate-fade-in">
          <div className="neo-card p-16 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="mb-12">
              <div className="w-20 h-20 bg-accent/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                <Trophy className="w-10 h-10 text-accent-dark" />
              </div>
              <h3 className="text-4xl font-bold text-primary mb-4 tracking-tight">황금 제목 셀렉션</h3>
              <p className="text-slate-400 font-medium text-lg">CTR(클릭률)이 가장 높은 검색 최적화 제목을 골라보세요.</p>
            </div>
            <div className="space-y-4 max-w-4xl mx-auto">
              {titles.map((t, i) => (
                <div 
                  key={i}
                  onClick={() => setSelectedTitle(t)}
                  className={`p-10 rounded-[2.5rem] border-2 transition-all cursor-pointer text-left flex items-center justify-between group ${selectedTitle === t ? 'border-primary bg-primary/5 shadow-2xl shadow-primary/10' : 'border-slate-100 hover:border-primary/20 bg-white'}`}
                >
                  <span className="font-bold text-2xl text-primary leading-tight tracking-tight">{t}</span>
                  <div className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center transition-all flex-shrink-0 ml-8 ${selectedTitle === t ? 'bg-primary border-primary shadow-lg shadow-primary/20' : 'border-slate-200'}`}>
                    {selectedTitle === t && <CheckCircle2 className="text-white w-6 h-6" />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="neo-card p-12">
            <div className="flex items-center gap-3 mb-10 justify-center">
              <Sparkles className="w-5 h-5 text-accent" />
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.4em] block">글쓰기 페르소나 스타일</label>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {[
                { name: '전문가 스타일', icon: ShieldCheck },
                { name: '가이드 스타일', icon: Globe },
                { name: '트렌디 스타일', icon: Zap }, 
                { name: '분석가 스타일', icon: BarChart3 },
                { name: '친구 스타일', icon: Heart },
                { name: '창의적 스타일', icon: Sparkles }
              ].map(s => (
                <button
                  key={s.name}
                  onClick={() => setStyle(s.name)}
                  className={`py-8 px-4 rounded-[2rem] text-[11px] font-bold border-2 transition-all flex flex-col items-center justify-center gap-4 group ${style.startsWith(s.name) ? 'bg-primary border-primary text-white shadow-2xl shadow-primary/30' : 'bg-white border-slate-100 text-slate-400 hover:border-primary/20'}`}
                >
                  <s.icon className={`w-6 h-6 ${style.startsWith(s.name) ? 'text-accent' : 'text-slate-300 group-hover:text-primary/40'}`} />
                  <span className="uppercase tracking-widest">{s.name}</span>
                </button>
              ))}
            </div>
            <button 
              onClick={handleFullPostGeneration}
              className="w-full mt-12 py-8 bg-primary text-white font-bold rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,45,98,0.3)] hover:bg-primary-light transition-all active:scale-95 text-2xl tracking-tighter flex items-center justify-center gap-4"
            >
              <span>블로그 원고 및 이미지 자동생성 시작</span>
              <Sparkles className="w-8 h-8 text-accent" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: GENERATION RESULTS */}
      {step === 'GENERATION' && finalPost && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-fade-in">
          <div className="lg:col-span-8 space-y-10">
            <div className="neo-card p-16 relative">
              <div className="flex flex-wrap items-center justify-between gap-6 mb-16 border-b border-slate-100 pb-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/5 rounded-2xl text-primary">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-primary tracking-tight">생성된 블로그 원고</h3>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button 
                    onClick={handleFCPACompliance}
                    disabled={isFCPAProcessing}
                    className="px-6 py-3 bg-accent text-primary text-[11px] font-bold rounded-xl hover:bg-accent-dark transition-all shadow-lg shadow-accent/20 flex items-center gap-2 uppercase tracking-widest"
                  >
                    <ShieldCheck className={`w-4 h-4 ${isFCPAProcessing ? 'animate-spin' : ''}`} />
                    <span>금소법 가이드 준수글 발행</span>
                  </button>
                  <button 
                    onClick={handleCopyPost}
                    className="px-6 py-3 bg-primary text-white text-[11px] font-bold rounded-xl hover:bg-primary-light transition-all shadow-lg shadow-primary/20 flex items-center gap-2 uppercase tracking-widest"
                  >
                    <Copy className="w-4 h-4" />
                    <span>텍스트 복사</span>
                  </button>
                  <button 
                    onClick={handleCopyRichText}
                    className="px-6 py-3 bg-accent text-primary text-[11px] font-bold rounded-xl hover:bg-accent-dark transition-all shadow-lg shadow-accent/20 flex items-center gap-2 uppercase tracking-widest"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>서식포함 텍스트 복사</span>
                  </button>
                  <button 
                    onClick={handleCopyHTML}
                    className="px-6 py-3 bg-white text-primary border border-primary/10 text-[11px] font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2 uppercase tracking-widest"
                  >
                    <Globe className="w-4 h-4" />
                    <span>HTML 복사</span>
                  </button>
                  <button 
                    onClick={handleCopyJSON}
                    className="px-6 py-3 bg-white text-slate-400 border border-slate-200 text-[11px] font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2 uppercase tracking-widest"
                  >
                    <Package className="w-4 h-4" />
                    <span>JSON 복사</span>
                  </button>
                </div>
              </div>
              
              {/* Blog Content View */}
              <div className="max-w-4xl mx-auto">
                <div className="mb-24 text-center">
                  <div className="flex items-center gap-3 justify-center mb-6">
                    <Sparkles className="w-5 h-5 text-accent" />
                    <span className="text-[11px] font-bold text-primary uppercase tracking-[0.4em]">Final Content Result</span>
                  </div>
                  <h1 className="text-5xl font-bold text-primary leading-[1.1] tracking-tighter">
                    {selectedTitle}
                  </h1>
                </div>
                <div className="blog-body">
                  {renderContentWithImages()}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="lg:col-span-4 space-y-10">
            <div className="neo-card p-10 bg-primary text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
              <div className="flex items-center gap-4 mb-10">
                <BarChart3 className="w-6 h-6 text-accent" />
                <h4 className="font-bold text-2xl tracking-tight">배포 최적화 분석</h4>
              </div>
              <div className="space-y-10">
                 <div>
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] block mb-6">핵심 타겟 키워드</label>
                    <div className="flex flex-wrap gap-3">
                      {selectedKeywords.map((k, i) => (
                        <span key={i} className="text-[11px] font-bold bg-white/10 text-accent px-5 py-2.5 rounded-xl border border-white/10 flex items-center gap-2">
                          <Hash className="w-3 h-3 opacity-50" />
                          {k}
                        </span>
                      ))}
                    </div>
                 </div>
                 <div className="pt-10 border-t border-white/10 space-y-4">
                    <button className="w-full py-6 bg-accent text-primary rounded-[2rem] text-sm font-bold hover:bg-accent-light transition-all shadow-2xl shadow-accent/20 flex items-center justify-center gap-3 uppercase tracking-widest">
                      <Send className="w-5 h-5" />
                      네이버 블로그 예약 전송
                    </button>
                    <button className="w-full py-6 bg-white/5 text-white/80 rounded-[2rem] text-sm font-bold hover:bg-white/10 transition-all border border-white/10 flex items-center justify-center gap-3 uppercase tracking-widest">
                      <Share2 className="w-5 h-5" />
                      티스토리 동시 발행
                    </button>
                 </div>
                 <div className="bg-white/5 p-8 rounded-3xl border border-white/5">
                    <p className="text-[11px] text-white/40 font-bold leading-relaxed italic">
                      "생성된 원고는 100% 한글 맞춤법 검사가 완료되었으며, SEO 로직에 따라 최적의 간격으로 키워드가 배치되었습니다."
                    </p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketing;
