
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  Save, 
  RefreshCw, 
  Check, 
  Copy, 
  Download, 
  Image as ImageIcon, 
  Type as TypeIcon, 
  FileText, 
  Code, 
  Hash,
  Search,
  Target,
  PenTool,
  ArrowRight,
  RotateCcw,
  Table as TableIcon,
  User,
  MessageSquare,
  Zap
} from 'lucide-react';
import Markdown from 'react-markdown';
import { 
  getGoldenCategoryRecommendations, 
  getGoldenTopicRecommendations, 
  getGoldenPersonaRecommendations, 
  getGoldenKeywordRecommendations, 
  getGoldenTitleRecommendations, 
  generateGoldenBlogPost,
  generateBlogImage
} from '../services/geminiService';
import { GoldenKeywordState, KeywordRecommendation } from '../types';

const STORAGE_KEY = 'golden_keyword_writing_state';

const TONE_STYLES = [
  { id: 'expert', label: '전문가 스타일', description: '신뢰감 있고 깊이 있는 분석 중심' },
  { id: 'guide', label: '가이드 스타일', description: '친절하고 상세한 정보 전달 중심' },
  { id: 'trendy', label: '트렌디 스타일', description: '최신 유행과 감각적인 표현 중심' },
  { id: 'analyst', label: '분석가 스타일', description: '데이터와 팩트 기반의 논리적 구성' },
  { id: 'friend', label: '친구 스타일', description: '편안하고 공감 가는 대화체 중심' },
  { id: 'creative', label: '창의적 스타일', description: '독창적이고 흥미로운 스토리텔링' },
];

const INITIAL_STATE: GoldenKeywordState = {
  category: '',
  topic: '',
  persona: '',
  keywordRecommendations: [],
  selectedKeywords: [],
  editedKeywords: [],
  longtailKeywordRecommendations: [],
  selectedLongtailKeywords: [],
  editedLongtailKeywords: [],
  titleRecommendations: [],
  selectedTitle: '',
  editedTitle: '',
  toneStyle: 'expert',
  generatedPost: null,
  editedPost: null,
  htmlVersion: '',
  markdownVersion: '',
  imageAssets: [],
  currentStep: 1,
  savedDraft: false,
  finalConfirmed: false,
  isAutoGenerating: false,
};

const GoldenKeywordWriting: React.FC = () => {
  const [state, setState] = useState<GoldenKeywordState>(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [recommendations, setRecommendations] = useState<any>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Load state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState(parsed);
      } catch (e) {
        console.error("Failed to load state:", e);
      }
    }
  }, []);

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const updateState = (updates: Partial<GoldenKeywordState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const handleSave = () => {
    setSaveStatus('saving');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  };

  const nextStep = () => updateState({ currentStep: state.currentStep + 1 });
  const prevStep = () => updateState({ currentStep: state.currentStep - 1 });

  const handleRecommend = async () => {
    setIsLoading(true);
    try {
      let result;
      switch (state.currentStep) {
        case 1:
          result = await getGoldenCategoryRecommendations(state.category);
          setRecommendations(result);
          break;
        case 2:
          result = await getGoldenTopicRecommendations(state.category, state.topic);
          setRecommendations(result);
          break;
        case 3:
          result = await getGoldenPersonaRecommendations(state.category, state.topic);
          setRecommendations(result);
          break;
        case 4:
          result = await getGoldenKeywordRecommendations(state.category, state.topic, state.persona);
          updateState({ 
            keywordRecommendations: result.keywords, 
            longtailKeywordRecommendations: result.longtailKeywords 
          });
          break;
        case 5:
          result = await getGoldenTitleRecommendations([...state.selectedKeywords, ...state.selectedLongtailKeywords]);
          setRecommendations(result);
          break;
      }
    } catch (e: any) {
      alert(e.message || "추천을 가져오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoGenerate = async () => {
    let currentCategory = state.category;
    if (!currentCategory) {
      const defaultCategories = ['재테크', '건강', '육아', '여행', 'IT', '라이프스타일', '자기계발', '보험', '부동산'];
      currentCategory = defaultCategories[Math.floor(Math.random() * defaultCategories.length)];
      updateState({ category: currentCategory });
    }

    updateState({ isAutoGenerating: true });
    setIsLoading(true);
    try {
      // Step 2: Topic Analysis
      updateState({ currentStep: 2 });
      const topics = await getGoldenTopicRecommendations(currentCategory, state.topic || '랜덤');
      const topic = topics[0];
      updateState({ topic });
      
      setIsLoading(false);
      await new Promise(r => setTimeout(r, 2000));

      // Step 3: Persona
      setIsLoading(true);
      updateState({ currentStep: 3 });
      const personas = await getGoldenPersonaRecommendations(currentCategory, topic);
      const persona = personas[0];
      updateState({ persona });
      
      setIsLoading(false);
      await new Promise(r => setTimeout(r, 2000));

      // Step 4: Keywords
      setIsLoading(true);
      updateState({ currentStep: 4 });
      const keywordResult = await getGoldenKeywordRecommendations(currentCategory, topic, persona);
      const selectedKeywords = keywordResult.keywords.slice(0, 5).map(k => k.keyword);
      const selectedLongtail = keywordResult.longtailKeywords.slice(0, 3);
      updateState({ 
        keywordRecommendations: keywordResult.keywords,
        longtailKeywordRecommendations: keywordResult.longtailKeywords,
        selectedKeywords,
        selectedLongtailKeywords: selectedLongtail
      });
      
      setIsLoading(false);
      await new Promise(r => setTimeout(r, 2000));

      // Step 5: Title
      setIsLoading(true);
      updateState({ currentStep: 5 });
      const titles = await getGoldenTitleRecommendations([...selectedKeywords, ...selectedLongtail]);
      const title = titles[0];
      updateState({ selectedTitle: title, editedTitle: title });
      
      setIsLoading(false);
      await new Promise(r => setTimeout(r, 2000));

      // Step 6: Tone
      setIsLoading(true);
      updateState({ currentStep: 6 });
      
      setIsLoading(false);
      await new Promise(r => setTimeout(r, 2000));

      // Step 7: Generate Post
      setIsLoading(true);
      setLoadingStatus('전략적 블로그 포스팅을 작성 중입니다...');
      
      // Ensure the message is visible for at least 2 seconds
      await new Promise(r => setTimeout(r, 2000));
      
      const result = await generateGoldenBlogPost({
        category: currentCategory,
        topic: topic,
        persona: persona,
        keywords: [...selectedKeywords, ...selectedLongtail],
        title: title,
        toneStyle: state.toneStyle
      });

      if (!result || !result.content) {
        throw new Error("본문 생성에 실패했습니다. 다시 시도해주세요.");
      }

      updateState({
        generatedPost: {
          title: result.title,
          content: result.content,
          hashtags: result.hashtags
        },
        editedPost: {
          title: result.title,
          content: result.content
        },
        currentStep: 7
      });

      setLoadingStatus('AI 이미지를 생성하여 본문에 삽입하는 중...');

      // Background image generation
      try {
        const images = await Promise.all(
          result.imagePrompts.slice(0, 3).map((prompt: string) => 
            generateBlogImage(prompt).catch(() => null)
          )
        );
        const validImages = images.filter(img => img !== null) as string[];
        updateState({ imageAssets: validImages });
      } catch (imgErr) {
        console.error("Batch image generation failed:", imgErr);
      }

    } catch (e: any) {
      console.error("Auto Generate Error:", e);
      alert(e.message || "자동 생성 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
      setLoadingStatus('');
      updateState({ isAutoGenerating: false });
    }
  };

  const handleGeneratePost = async () => {
    setIsLoading(true);
    setLoadingStatus('전략적 블로그 포스팅을 작성 중입니다...');
    
    // Ensure the message is visible for at least 2 seconds
    await new Promise(r => setTimeout(r, 2000));
    
    try {
      const result = await generateGoldenBlogPost({
        category: state.category,
        topic: state.topic,
        persona: state.persona,
        keywords: [...state.selectedKeywords, ...state.selectedLongtailKeywords],
        title: state.editedTitle || state.selectedTitle,
        toneStyle: state.toneStyle
      });

      if (!result || !result.content) {
        throw new Error("본문 생성에 실패했습니다. 다시 시도해주세요.");
      }

      updateState({
        generatedPost: {
          title: result.title,
          content: result.content,
          hashtags: result.hashtags
        },
        editedPost: {
          title: result.title,
          content: result.content
        },
        currentStep: 7
      });

      setLoadingStatus('AI 이미지를 생성하여 본문에 삽입하는 중...');

      // Generate images in background or after post is ready
      // We don't want to block the post display if images fail
      try {
        const images = await Promise.all(
          result.imagePrompts.slice(0, 3).map((prompt: string) => 
            generateBlogImage(prompt).catch(err => {
              console.error("Image generation failed for prompt:", prompt, err);
              return null;
            })
          )
        );
        const validImages = images.filter(img => img !== null) as string[];
        updateState({ imageAssets: validImages });
      } catch (imgErr) {
        console.error("Batch image generation failed:", imgErr);
      }

    } catch (e: any) {
      console.error("Generate Post Error:", e);
      alert(e.message || "글 생성 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
      setLoadingStatus('');
    }
  };

  const handleRegenerateImage = async (index: number) => {
    if (!state.generatedPost || !state.generatedPost.content) return;
    
    setIsLoading(true);
    try {
      // Use a generic prompt based on the post if we don't have the original prompts handy
      // Or just use the topic/title
      const prompt = `Blog image for: ${state.editedPost?.title || state.topic}. Part ${index + 1}`;
      const newImage = await generateBlogImage(prompt);
      if (newImage) {
        const newAssets = [...state.imageAssets];
        newAssets[index] = newImage;
        updateState({ imageAssets: newAssets });
      }
    } catch (e) {
      alert("이미지 재생성에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    alert(`${type} 복사되었습니다.`);
  };

  const handleCopyRichText = () => {
    if (!state.editedPost) return;
    
    let htmlContent = `<h1>${state.editedPost.title}</h1>\n`;
    const lines = state.editedPost.content.split('\n');
    lines.forEach((line: string) => {
      if (line.trim().startsWith('##')) {
        htmlContent += `<h2>${line.replace(/#/g, '').trim()}</h2>\n`;
      } else if (line.trim().startsWith('###')) {
        htmlContent += `<h3>${line.replace(/#/g, '').trim()}</h3>\n`;
      } else if (line.trim()) {
        htmlContent += `<p>${line.trim()}</p>\n`;
      }
    });
    if (state.generatedPost?.hashtags) {
      htmlContent += `<p>${state.generatedPost.hashtags.join(' ')}</p>`;
    }

    try {
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const data = [new ClipboardItem({ 'text/html': blob, 'text/plain': new Blob([htmlContent.replace(/<[^>]*>/g, '')], { type: 'text/plain' }) })];
      
      navigator.clipboard.write(data).then(() => {
        alert('서식이 포함된 원고가 복사되었습니다. 블로그 편집기에 붙여넣으세요.');
      }).catch(err => {
        console.error('Failed to copy rich text:', err);
        copyToClipboard(htmlContent, 'HTML 코드가');
      });
    } catch (e) {
      console.error('ClipboardItem not supported:', e);
      // Fallback to plain text copy or HTML
      const html = `<h1>${state.editedPost.title}</h1>\n${state.editedPost.content.split('\n').map(p => p.trim() ? `<p>${p}</p>` : '<br/>').join('')}`;
      copyToClipboard(html, 'HTML 코드가');
    }
  };

  const downloadImage = (url: string, index: number) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `blog-image-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-12 px-4 overflow-x-auto pb-4">
      {[1, 2, 3, 4, 5, 6, 7].map((step) => (
        <div key={step} className="flex items-center">
          <div className={`flex flex-col items-center gap-2 min-w-[80px]`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
              state.currentStep === step 
                ? 'bg-accent text-primary shadow-lg scale-110' 
                : state.currentStep > step 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-slate-100 text-slate-400'
            }`}>
              {state.currentStep > step ? <Check className="w-5 h-5" /> : step}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-tighter ${
              state.currentStep === step ? 'text-primary' : 'text-slate-400'
            }`}>
              {['카테고리', '주제', '페르소나', '키워드', '제목', '말투', '글 생성'][step - 1]}
            </span>
          </div>
          {step < 7 && (
            <div className={`w-full h-px min-w-[20px] mx-2 ${
              state.currentStep > step ? 'bg-emerald-500' : 'bg-slate-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderStepContent = () => {
    switch (state.currentStep) {
      case 1:
        return (
          <div className="space-y-8">
            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Search className="w-4 h-4 text-accent" />
                블로그 카테고리 입력
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="text"
                  value={state.category}
                  onChange={(e) => updateState({ category: e.target.value })}
                  placeholder="예: 재테크, 건강, 육아, 여행 등"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-accent outline-none transition-all"
                />
                <div className="flex gap-3">
                  <button 
                    onClick={handleRecommend}
                    disabled={!state.category || isLoading}
                    className="flex-1 sm:flex-none px-8 py-4 bg-primary text-white font-bold rounded-2xl hover:bg-blue-900 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    추천받기
                  </button>
                  <button 
                    onClick={handleAutoGenerate}
                    disabled={isLoading || state.isAutoGenerating}
                    className="flex-1 sm:flex-none px-8 py-4 bg-accent text-primary font-bold rounded-2xl hover:bg-yellow-500 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent/20"
                  >
                    {(isLoading || state.isAutoGenerating) ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    랜덤 자동 생성
                  </button>
                </div>
              </div>
            </div>

            {recommendations && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
                {recommendations.map((rec: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => updateState({ category: rec })}
                    className={`p-6 rounded-[2rem] border text-left transition-all duration-300 ${
                      state.category === rec 
                        ? 'bg-accent/10 border-accent shadow-lg' 
                        : 'bg-white border-slate-100 hover:border-accent/50 hover:shadow-md'
                    }`}
                  >
                    <p className="font-bold text-slate-900">{rec}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">
            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <PenTool className="w-4 h-4 text-accent" />
                블로그 주제 입력
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="text"
                  value={state.topic}
                  onChange={(e) => updateState({ topic: e.target.value })}
                  placeholder="예: 사회초년생을 위한 청년도약계좌 가입 가이드 (또는 '랜덤' 입력)"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-accent outline-none transition-all"
                />
                <div className="flex gap-3">
                  <button 
                    onClick={handleRecommend}
                    disabled={!state.topic || isLoading}
                    className="flex-1 sm:flex-none px-8 py-4 bg-primary text-white font-bold rounded-2xl hover:bg-blue-900 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    추천받기
                  </button>
                  <button 
                    onClick={handleAutoGenerate}
                    disabled={isLoading || state.isAutoGenerating}
                    className="flex-1 sm:flex-none px-8 py-4 bg-accent text-primary font-bold rounded-2xl hover:bg-yellow-500 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent/20"
                  >
                    {(isLoading || state.isAutoGenerating) ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    랜덤 자동 생성
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 italic px-2">
                * '랜덤' 또는 'random' 입력 시 현재 트렌드에 맞는 주제를 추천합니다.
              </p>
            </div>

            {recommendations && (
              <div className="grid grid-cols-1 gap-4 animate-fade-in">
                {recommendations.map((rec: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => updateState({ topic: rec })}
                    className={`p-6 rounded-[2rem] border text-left transition-all duration-300 ${
                      state.topic === rec 
                        ? 'bg-accent/10 border-accent shadow-lg' 
                        : 'bg-white border-slate-100 hover:border-accent/50 hover:shadow-md'
                    }`}
                  >
                    <p className="font-bold text-slate-900">{rec}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Target className="w-4 h-4 text-accent" />
                타깃 독자(페르소나) 입력
              </label>
              <div className="flex gap-3">
                <input 
                  type="text"
                  value={state.persona}
                  onChange={(e) => updateState({ persona: e.target.value })}
                  placeholder="예: 30대 내 집 마련을 꿈꾸는 무주택 직장인"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-accent outline-none transition-all"
                />
                <button 
                  onClick={handleRecommend}
                  disabled={!state.persona || isLoading}
                  className="px-8 py-4 bg-primary text-white font-bold rounded-2xl hover:bg-blue-900 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  추천받기
                </button>
              </div>
            </div>

            {recommendations && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                {recommendations.map((rec: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => updateState({ persona: rec })}
                    className={`p-6 rounded-[2rem] border text-left transition-all duration-300 ${
                      state.persona === rec 
                        ? 'bg-accent/10 border-accent shadow-lg' 
                        : 'bg-white border-slate-100 hover:border-accent/50 hover:shadow-md'
                    }`}
                  >
                    <p className="font-bold text-slate-900">{rec}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-10">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-accent" />
                황금 키워드 분석 결과
              </h3>
              <button 
                onClick={handleRecommend}
                disabled={isLoading}
                className="text-xs font-bold text-primary hover:text-accent flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                키워드 다시 분석하기
              </button>
            </div>

            {state.keywordRecommendations.length > 0 ? (
              <div className="space-y-8 animate-fade-in">
                {/* Keyword Metadata Table */}
                <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">선택</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">키워드</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">유형</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">경쟁강도</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">검색량</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">수익성</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">네이버 인기도</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {state.keywordRecommendations.map((kw, i) => (
                          <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                            <td className="px-6 py-4">
                              <input 
                                type="checkbox"
                                checked={state.selectedKeywords.includes(kw.keyword)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    updateState({ selectedKeywords: [...state.selectedKeywords, kw.keyword] });
                                  } else {
                                    updateState({ selectedKeywords: state.selectedKeywords.filter(k => k !== kw.keyword) });
                                  }
                                }}
                                className="w-4 h-4 rounded border-slate-300 text-accent focus:ring-accent"
                              />
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-900">{kw.keyword}</td>
                            <td className="px-6 py-4 text-xs text-slate-500">{kw.type}</td>
                            <td className="px-6 py-4">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                kw.competition === '하' ? 'bg-emerald-50 text-emerald-600' : 
                                kw.competition === '중' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                              }`}>
                                {kw.competition}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-600">{kw.searchVolume}</td>
                            <td className="px-6 py-4 text-xs text-slate-600 font-medium">{kw.profitability}</td>
                            <td className="px-6 py-4">
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className="bg-emerald-400 h-full" 
                                  style={{ width: `${kw.naverPopularity}%` }}
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Longtail Keywords */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-accent" />
                    롱테일 키워드 추천
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {state.longtailKeywordRecommendations.map((kw, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          if (state.selectedLongtailKeywords.includes(kw)) {
                            updateState({ selectedLongtailKeywords: state.selectedLongtailKeywords.filter(k => k !== kw) });
                          } else {
                            updateState({ selectedLongtailKeywords: [...state.selectedLongtailKeywords, kw] });
                          }
                        }}
                        className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                          state.selectedLongtailKeywords.includes(kw)
                            ? 'bg-primary text-white border-primary shadow-md'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-primary'
                        }`}
                      >
                        {kw}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                <Search className="w-12 h-12 text-slate-300 mb-4" />
                <p className="text-slate-400 font-medium">분석된 키워드가 없습니다. 추천받기 버튼을 눌러주세요.</p>
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-8">
            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <TypeIcon className="w-4 h-4 text-accent" />
                황금 제목 추천 및 수정
              </label>
              <div className="flex gap-3">
                <input 
                  type="text"
                  value={state.editedTitle || state.selectedTitle}
                  onChange={(e) => updateState({ editedTitle: e.target.value })}
                  placeholder="추천된 제목을 선택하거나 직접 입력하세요"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-accent outline-none transition-all font-bold"
                />
                <button 
                  onClick={handleRecommend}
                  disabled={isLoading}
                  className="px-8 py-4 bg-primary text-white font-bold rounded-2xl hover:bg-blue-900 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  다시 추천받기
                </button>
              </div>
            </div>

            {recommendations && (
              <div className="grid grid-cols-1 gap-4 animate-fade-in">
                {recommendations.map((rec: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => updateState({ selectedTitle: rec, editedTitle: '' })}
                    className={`p-6 rounded-[2rem] border text-left transition-all duration-300 ${
                      (state.selectedTitle === rec && !state.editedTitle)
                        ? 'bg-accent/10 border-accent shadow-lg' 
                        : 'bg-white border-slate-100 hover:border-accent/50 hover:shadow-md'
                    }`}
                  >
                    <p className="font-bold text-slate-900">{rec}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        );

      case 6:
        return (
          <div className="space-y-8">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-accent" />
              말투 스타일 선택
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {TONE_STYLES.map((tone) => (
                <button
                  key={tone.id}
                  onClick={() => updateState({ toneStyle: tone.id })}
                  className={`p-8 rounded-[2.5rem] border text-left transition-all duration-300 group relative overflow-hidden ${
                    state.toneStyle === tone.id 
                      ? 'bg-primary text-white border-primary shadow-2xl scale-[1.02]' 
                      : 'bg-white border-slate-100 hover:border-primary/50 hover:shadow-xl'
                  }`}
                >
                  <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-3xl transition-all duration-500 ${
                    state.toneStyle === tone.id ? 'bg-white/10' : 'bg-primary/5 group-hover:bg-primary/10'
                  }`}></div>
                  <div className="relative z-10 space-y-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
                      state.toneStyle === tone.id ? 'bg-white/20' : 'bg-slate-50 group-hover:bg-primary/10'
                    }`}>
                      <PenTool className={`w-6 h-6 ${state.toneStyle === tone.id ? 'text-white' : 'text-primary'}`} />
                    </div>
                    <p className="font-black text-lg">{tone.label}</p>
                    <p className={`text-xs leading-relaxed ${state.toneStyle === tone.id ? 'text-white/70' : 'text-slate-400'}`}>
                      {tone.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-10">
            {state.generatedPost ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-fade-in">
                {/* Editor Area */}
                <div className="lg:col-span-2 space-y-8">
                  <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden">
                    <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                      <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">블로그 편집기</h4>
                      <div className="flex gap-2">
                        <button 
                          onClick={handleGeneratePost}
                          disabled={isLoading}
                          className="flex items-center gap-1 px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 hover:text-primary hover:border-primary transition-all"
                        >
                          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                          다시 생성
                        </button>
                        <button 
                          onClick={() => copyToClipboard(state.editedPost?.title || '', '제목이')}
                          className="p-2 text-slate-400 hover:text-primary transition-colors"
                          title="제목 복사"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="p-10 space-y-8">
                      <input 
                        type="text"
                        value={state.editedPost?.title}
                        onChange={(e) => updateState({ editedPost: { ...state.editedPost!, title: e.target.value } })}
                        className="w-full text-3xl font-black text-slate-900 border-none focus:ring-0 p-0 placeholder-slate-200"
                        placeholder="제목을 입력하세요"
                      />
                      <div className="w-full h-px bg-slate-100"></div>
                      <textarea 
                        value={state.editedPost?.content}
                        onChange={(e) => updateState({ editedPost: { ...state.editedPost!, content: e.target.value } })}
                        className="w-full min-h-[600px] text-slate-700 leading-relaxed border-none focus:ring-0 p-0 resize-none placeholder-slate-200"
                        placeholder="본문 내용을 입력하세요"
                      />
                    </div>
                  </div>

                  {/* Image Assets */}
                  <div className="space-y-6">
                    <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-accent" />
                      생성된 이미지 에셋
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {state.imageAssets.map((img, i) => (
                        <div key={i} className="group relative aspect-video rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm">
                          <img src={img} alt={`Generated ${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <button 
                              onClick={() => handleRegenerateImage(i)}
                              disabled={isLoading}
                              className="p-3 bg-white text-primary rounded-full hover:bg-emerald-500 hover:text-white transition-all"
                              title="이미지 재생성"
                            >
                              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                            </button>
                            <button 
                              onClick={() => downloadImage(img, i)}
                              className="p-3 bg-white text-primary rounded-full hover:bg-accent hover:text-white transition-all"
                              title="이미지 저장"
                            >
                              <Download className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sidebar / Export Area */}
                <div className="space-y-8">
                  <div className="bg-primary text-white rounded-[3rem] p-8 shadow-2xl space-y-8 sticky top-24">
                    <div className="space-y-2">
                      <h4 className="text-amber-400 font-black text-xs uppercase tracking-widest">Export Options</h4>
                      <p className="text-xl font-bold">발행 및 내보내기</p>
                    </div>

                    <div className="space-y-3">
                      <button 
                        onClick={() => copyToClipboard(state.editedPost?.content || '', '본문 텍스트가')}
                        className="w-full flex items-center justify-between p-5 bg-white/10 hover:bg-white/20 rounded-2xl transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-accent" />
                          <span className="text-sm font-bold">본문 복사 (텍스트)</span>
                        </div>
                        <Copy className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>

                      <button 
                        onClick={handleCopyRichText}
                        className="w-full flex items-center justify-between p-5 bg-accent/20 hover:bg-accent/30 rounded-2xl transition-all group border border-accent/20"
                      >
                        <div className="flex items-center gap-3 text-primary">
                          <Sparkles className="w-5 h-5" />
                          <span className="text-sm font-bold">서식포함 텍스트 복사</span>
                        </div>
                        <Copy className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>

                      <button 
                        onClick={() => {
                          const html = `<div style="font-family: sans-serif; line-height: 1.8; color: #333;">
                            <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 20px;">${state.editedPost?.title}</h1>
                            ${state.editedPost?.content.split('\n').map(p => p.trim() ? `<p style="margin-bottom: 15px;">${p}</p>` : '<br/>').join('')}
                          </div>`;
                          copyToClipboard(html, 'HTML 코드가');
                        }}
                        className="w-full flex items-center justify-between p-5 bg-white/10 hover:bg-white/20 rounded-2xl transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <Code className="w-5 h-5 text-emerald-400" />
                          <span className="text-sm font-bold">본문 복사 (HTML)</span>
                        </div>
                        <Copy className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>

                      <button 
                        onClick={() => {
                          const md = `# ${state.editedPost?.title}\n\n${state.editedPost?.content}`;
                          copyToClipboard(md, '마크다운이');
                        }}
                        className="w-full flex items-center justify-between p-5 bg-white/10 hover:bg-white/20 rounded-2xl transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <Hash className="w-5 h-5 text-blue-400" />
                          <span className="text-sm font-bold">본문 복사 (마크다운)</span>
                        </div>
                        <Copy className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    </div>

                    <div className="pt-6 border-t border-white/10 space-y-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/40">최종 확인 상태</span>
                        <span className={state.finalConfirmed ? 'text-emerald-400' : 'text-amber-400'}>
                          {state.finalConfirmed ? '확정됨' : '대기 중'}
                        </span>
                      </div>
                      <button 
                        onClick={() => updateState({ finalConfirmed: true })}
                        className={`w-full py-5 rounded-2xl font-black text-sm transition-all shadow-xl ${
                          state.finalConfirmed 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-accent text-primary hover:scale-[1.02]'
                        }`}
                      >
                        {state.finalConfirmed ? '최종 확정 완료' : '글 최종 확정하기'}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => updateState({ currentStep: 4 })}
                        className="py-3 bg-white/5 hover:bg-white/10 text-white/60 text-[10px] font-bold rounded-xl transition-all flex flex-col items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        황금키워드 돌아가기
                      </button>
                      <button 
                        onClick={() => updateState({ currentStep: 5 })}
                        className="py-3 bg-white/5 hover:bg-white/10 text-white/60 text-[10px] font-bold rounded-xl transition-all flex flex-col items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        제목 단계 돌아가기
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 bg-slate-50 rounded-[4rem] border border-dashed border-slate-200">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-inner mb-8">
                  <Sparkles className="w-12 h-12 text-accent" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">고품질 블로그 글을 생성할 준비가 되었습니다</h3>
                <p className="text-slate-500 mb-10 max-w-md text-center">
                  확정된 키워드와 제목을 바탕으로 검색 최적화된 본문을 생성합니다. <br />
                  이미지 에셋도 함께 생성되니 잠시만 기다려주세요.
                </p>
                <button 
                  onClick={handleGeneratePost}
                  disabled={isLoading}
                  className="px-12 py-6 bg-primary text-white font-black rounded-[2rem] hover:bg-blue-900 shadow-2xl shadow-primary/20 transition-all flex items-center gap-3 text-lg"
                >
                  {isLoading ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6 text-accent" />}
                  글 생성하기
                </button>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-20">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 border border-accent/20 rounded-full">
            <Sparkles className="w-3 h-3 text-accent" />
            <span className="text-[10px] font-black text-accent-dark uppercase tracking-widest">AI Automation Engine</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">황금키워드 기반 글쓰기</h1>
          <p className="text-slate-500 font-medium">상위 1% 노출을 위한 검색 최적화 블로그 자동화 시스템</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleSave}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${
              saveStatus === 'saved' 
                ? 'bg-emerald-500 text-white' 
                : 'bg-white text-slate-600 border border-slate-200 hover:border-primary'
            }`}
          >
            {saveStatus === 'saving' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saveStatus === 'saved' ? '저장 완료' : '임시 저장'}
          </button>
          <button 
            onClick={() => {
              if (confirm('모든 데이터를 초기화하고 처음부터 다시 시작하시겠습니까?')) {
                setState(INITIAL_STATE);
                localStorage.removeItem(STORAGE_KEY);
              }
            }}
            className="p-3 bg-white text-slate-400 border border-slate-200 rounded-2xl hover:text-red-500 hover:border-red-200 transition-all"
            title="초기화"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Main Content */}
      <div className="bg-white/50 backdrop-blur-sm rounded-[3rem] border border-white p-8 md:p-12 shadow-sm min-h-[500px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={state.currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* LOADING STATE */}
      {isLoading && loadingStatus && (
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
                "전문가의 신뢰감을 주는 문장과 <br/> 매력적인 시각 자료를 생성하고 있습니다."
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="mt-12 flex items-center justify-between">
        <button
          onClick={prevStep}
          disabled={state.currentStep === 1 || isLoading}
          className="flex items-center gap-2 px-8 py-4 text-slate-400 font-bold hover:text-primary disabled:opacity-0 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
          이전 단계
        </button>

        {state.currentStep < 7 && (
          <button
            onClick={nextStep}
            disabled={
              isLoading ||
              (state.currentStep === 1 && !state.category) ||
              (state.currentStep === 2 && !state.topic) ||
              (state.currentStep === 3 && !state.persona) ||
              (state.currentStep === 4 && state.selectedKeywords.length === 0) ||
              (state.currentStep === 5 && !state.selectedTitle && !state.editedTitle)
            }
            className="flex items-center gap-2 px-10 py-5 bg-primary text-white font-black rounded-2xl hover:bg-blue-900 shadow-xl shadow-primary/20 disabled:opacity-50 transition-all"
          >
            다음 단계
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default GoldenKeywordWriting;
