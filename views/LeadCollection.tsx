import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toPng } from 'html-to-image';
import { 
  Magnet, 
  Layout, 
  FormInput, 
  Share2, 
  MousePointer2, 
  Zap, 
  Target,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Globe,
  MessageSquare,
  ArrowLeft,
  Wand2,
  Eye,
  Settings2,
  Send,
  Edit3,
  CheckCircle2,
  Copy,
  Plus,
  Trash2,
  Smartphone,
  ShieldCheck,
  Clock,
  Save,
  Upload,
  Check,
  History,
  ExternalLink,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  X,
  AlertCircle,
  BarChart3,
  UserCheck,
  Link,
  ClipboardList,
  Image as ImageIcon,
  QrCode
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { QRCodeCanvas } from 'qrcode.react';
import { User, UserRole, Lead, LeadStatus } from '../types';
import { supabase } from '../src/lib/supabase';
import { 
  getGeminiKey, 
  getOpenAIKey, 
  generateLandingPageContent 
} from '../services/geminiService';

// --- Sub-Components for Tools ---

const LandingPageGenerator: React.FC<{ 
  onSave: (page: any) => Promise<void>;
  initialData: any;
  savedPages: any[];
}> = ({ onSave, initialData, savedPages }) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const [industry, setIndustry] = useState(initialData?.industry || '보험');
  const [requirements, setRequirements] = useState(initialData?.requirements || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>(initialData || null);
  const [isSavingImage, setIsSavingImage] = useState(false);
  const [isSavingData, setIsSavingData] = useState(false);

  const handleSaveImage = async () => {
    if (!previewRef.current) return;
    setIsSavingImage(true);
    try {
      const dataUrl = await toPng(previewRef.current, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      });
      const link = document.createElement('a');
      link.download = `landing-page-${industry}-${new Date().getTime()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('이미지 저장 실패:', err);
      alert('이미지 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSavingImage(false);
    }
  };

  const handleSaveData = async () => {
    if (!generatedContent) return;
    setIsSavingData(true);
    try {
      await onSave({ 
        ...generatedContent, 
        industry, 
        requirements, 
        createdAt: new Date().toLocaleString() 
      });
      alert('랜딩페이지가 저장되었습니다.');
    } catch (err) {
      console.error('데이터 저장 실패:', err);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSavingData(false);
    }
  };

  // Check if current content is already saved
  const isAlreadySaved = generatedContent && savedPages.some(p => {
    const content = p.content || p;
    return content.headline === generatedContent.headline && 
           content.industry === industry;
  });

  // Update state if initialData changes (when loading from history)
  React.useEffect(() => {
    if (initialData) {
      setIndustry(initialData.industry);
      setRequirements(initialData.requirements || '');
      setGeneratedContent(initialData);
    }
  }, [initialData]);

  const industries = ['보험', '부동산', '재무설계', '건강식품', '교육/강의', '프랜차이즈', 'PG(payment gateway)'];

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const content = await generateLandingPageContent(industry, requirements);
      setGeneratedContent(content);
    } catch (error: any) {
      console.error(error);
      if (error.message?.includes("AUTH_REQUIRED")) {
        alert("API 키가 설정되지 않았습니다. [설정] 메뉴의 'AI 엔진 API 연동 설정'에서 Gemini 또는 OpenAI 키를 입력해주세요.");
      } else {
        alert('생성 중 오류가 발생했습니다.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const updateContent = (field: string, value: any) => {
    setGeneratedContent((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const updateBenefit = (index: number, value: string) => {
    const newBenefits = [...(generatedContent.benefits || [])];
    newBenefits[index] = value;
    updateContent('benefits', newBenefits);
  };

  const addBenefit = () => {
    const newBenefits = [...(generatedContent.benefits || []), '새로운 혜택을 입력하세요'];
    updateContent('benefits', newBenefits);
  };

  const removeBenefit = (index: number) => {
    const newBenefits = (generatedContent.benefits || []).filter((_: any, i: number) => i !== index);
    updateContent('benefits', newBenefits);
  };

  const updateTrustPoint = (index: number, value: string) => {
    const newTrustPoints = [...(generatedContent.trustPoints || [])];
    newTrustPoints[index] = value;
    updateContent('trustPoints', newTrustPoints);
  };

  const addTrustPoint = () => {
    const newTrustPoints = [...(generatedContent.trustPoints || []), '신뢰 포인트'];
    updateContent('trustPoints', newTrustPoints);
  };

  const removeTrustPoint = (index: number) => {
    const newTrustPoints = (generatedContent.trustPoints || []).filter((_: any, i: number) => i !== index);
    updateContent('trustPoints', newTrustPoints);
  };

  return (
    <div className="space-y-12">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-primary">AI 랜딩페이지 생성기</h2>
          <div className="flex gap-2">
            {industries.map(ind => (
              <button 
                key={ind}
                onClick={() => setIndustry(ind)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${industry === ind ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
              >
                {ind}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="neo-card p-8 space-y-6">
          <div className="space-y-4">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">업종 키워드</label>
            <input 
              type="text" 
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary/10"
              placeholder="예: 암보험 전문, 상가 분양 등"
            />
          </div>
          <div className="space-y-4">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">추가 요구사항 (선택)</label>
            <textarea 
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary/10 h-24 resize-none text-sm font-medium"
              placeholder="예: 20대 타겟, 신뢰감 있는 톤, 파격 혜택 강조 등"
            />
          </div>
          <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-4 bg-primary text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-primary-light transition-all disabled:opacity-50"
          >
            {isGenerating ? <Zap className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            AI 콘텐츠 생성하기
          </button>

          {generatedContent && (
            <div className="space-y-6 pt-6 border-t border-slate-100">
              <div className="flex flex-col gap-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase">콘텐츠 관리</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={handleSaveData}
                    disabled={isAlreadySaved || isSavingData}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[10px] font-bold transition-all ${isAlreadySaved ? 'bg-emerald-50 text-emerald-500' : 'bg-primary text-white hover:bg-primary-light'} disabled:opacity-50`}
                  >
                    {isSavingData ? <Clock className="w-3 h-3 animate-spin" /> : (isAlreadySaved ? <CheckCircle2 className="w-3 h-3" /> : <Save className="w-3 h-3" />)}
                    {isAlreadySaved ? '저장됨' : (isSavingData ? '저장 중...' : '현재 페이지 저장')}
                  </button>
                  <button 
                    onClick={handleSaveImage}
                    disabled={isSavingImage}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[10px] font-bold bg-slate-900 text-white hover:bg-black transition-all disabled:opacity-50"
                  >
                    {isSavingImage ? <Clock className="w-3 h-3 animate-spin" /> : <ImageIcon className="w-3 h-3" />}
                    {isSavingImage ? '이미지 생성 중...' : '이미지로 저장'}
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">헤드라인</label>
                  <Edit3 className="w-3 h-3 text-slate-300" />
                </div>
                <textarea 
                  value={generatedContent.headline}
                  onChange={(e) => updateContent('headline', e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-primary/10 resize-none h-20"
                />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">서브 헤드라인</label>
                  <Edit3 className="w-3 h-3 text-slate-300" />
                </div>
                <textarea 
                  value={generatedContent.subheadline}
                  onChange={(e) => updateContent('subheadline', e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-600 focus:ring-2 focus:ring-primary/10 resize-none h-24"
                />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">핵심 혜택</label>
                  <button onClick={addBenefit} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
                    <Plus className="w-3 h-3 text-primary" />
                  </button>
                </div>
                <div className="space-y-2">
                  {generatedContent.benefits?.map((b: string, i: number) => (
                    <div key={i} className="flex gap-2 group">
                      <div className="flex-1 relative">
                        <input 
                          type="text"
                          value={b}
                          onChange={(e) => updateBenefit(i, e.target.value)}
                          className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-600 focus:ring-2 focus:ring-primary/10"
                        />
                        <CheckCircle2 className="w-3 h-3 text-accent absolute left-3 top-1/2 -translate-y-1/2" />
                      </div>
                      <button 
                        onClick={() => removeBenefit(i)}
                        className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">CTA 버튼 문구</label>
                  <Edit3 className="w-3 h-3 text-slate-300" />
                </div>
                <input 
                  type="text"
                  value={generatedContent.cta}
                  onChange={(e) => updateContent('cta', e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-primary/10"
                />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">신뢰 포인트</label>
                  <button onClick={addTrustPoint} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
                    <Plus className="w-3 h-3 text-primary" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {generatedContent.trustPoints?.map((t: string, i: number) => (
                    <div key={i} className="flex gap-1 group">
                      <div className="flex-1 relative">
                        <input 
                          type="text"
                          value={t}
                          onChange={(e) => updateTrustPoint(i, e.target.value)}
                          className="w-full pl-7 pr-2 py-2 bg-slate-50 border border-slate-100 rounded-lg text-[10px] text-slate-600 focus:ring-2 focus:ring-primary/10"
                        />
                        <ShieldCheck className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
                      </div>
                      <button 
                        onClick={() => removeTrustPoint(i)}
                        className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <X className="w-2 h-2" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="neo-card p-0 overflow-hidden border-none bg-slate-900 min-h-[500px] flex flex-col">
          <div className="bg-slate-800 p-4 flex items-center gap-2 border-b border-slate-700">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
            </div>
            <div className="flex-1 mx-4 bg-slate-700 rounded-lg h-6 flex items-center px-3">
              <p className="text-[10px] text-slate-400 font-mono">https://smart-income.ai/preview</p>
            </div>
          </div>
          <div className="flex-1 bg-white p-12 overflow-y-auto">
            {generatedContent ? (
              <div ref={previewRef} className="max-w-xl mx-auto space-y-12 text-center p-8 bg-white">
                <div className="space-y-6">
                  <h1 className="text-4xl font-black text-slate-900 leading-tight">{generatedContent.headline}</h1>
                  <p className="text-lg text-slate-500 font-medium">{generatedContent.subheadline}</p>
                </div>
                <div className="grid grid-cols-1 gap-4 text-left">
                  {generatedContent.benefits?.map((b: string, i: number) => (
                    <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">{i+1}</div>
                      <p className="font-bold text-slate-700">{b}</p>
                    </div>
                  ))}
                </div>
                <button className="w-full py-6 bg-accent text-primary font-black rounded-[2rem] text-xl shadow-xl shadow-accent/20">
                  {generatedContent.cta}
                </button>
                <div className="flex justify-center gap-8 pt-8 border-t border-slate-100">
                  {generatedContent.trustPoints?.map((t: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <ShieldCheck className="w-4 h-4" /> {t}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4">
                <Eye className="w-12 h-12 opacity-20" />
                <p className="text-sm font-bold">콘텐츠를 생성하면 미리보기가 표시됩니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Internal History Section for the Tool */}
      {savedPages.length > 0 && (
        <div className="pt-12 border-t border-slate-100 space-y-6">
          <div className="flex items-center gap-3">
            <History className="w-5 h-5 text-slate-400" />
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">최근 저장된 랜딩페이지</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {savedPages.slice(0, 4).map((page) => {
              const content = page.content || page;
              const displayIndustry = content.industry || '기타';
              const displayHeadline = page.title || content.headline;
              const displayDate = page.createdAt ? page.createdAt.split('T')[0] : (content.createdAt ? content.createdAt.split(',')[0] : '-');

              return (
                <div 
                  key={page.id}
                  onClick={() => {
                    setIndustry(displayIndustry);
                    setRequirements(content.requirements || '');
                    setGeneratedContent(content);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="p-4 bg-white rounded-2xl border border-slate-100 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-slate-50 text-slate-400 uppercase tracking-widest">
                      {displayIndustry}
                    </span>
                    <ExternalLink className="w-3 h-3 text-slate-200 group-hover:text-primary transition-colors" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{displayHeadline}</h4>
                  <p className="text-[10px] text-slate-400 mt-1">{displayDate}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const SmartFormBuilder: React.FC<{ 
  currentUser: User;
  onSaveConfig: (config: any) => Promise<void>;
  onSubmitResponse: (response: any) => void;
  savedFormConfigs: any[];
  onDeleteFormConfig: (id: string) => Promise<void>;
  initialConfig?: any;
  onReset?: () => void;
}> = ({ currentUser, onSaveConfig, onSubmitResponse, savedFormConfigs, onDeleteFormConfig, initialConfig, onReset }) => {
  const [formName, setFormName] = useState('기본 상담 신청서');
  const [formStyle, setFormStyle] = useState<'SIMPLE' | 'PREMIUM'>('PREMIUM');
  const [fields, setFields] = useState([
    { id: '1', label: '성함', type: 'text', required: true },
    { id: '2', label: '연락처', type: 'tel', required: true },
    { id: '3', label: '문의내용', type: 'text', required: false },
  ]);

  // Premium Page State
  const [hero, setHero] = useState({
    headline: 'AI가 분석하고 전문가가 설계하는 스마트한 보험',
    subheadline: '복잡한 보험도 데이터 기반 분석과 맞춤 설계로 더 명확하고 더 합리적으로.',
    cta: '상담 문의하기',
    backgroundImage: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=1920'
  });

  const [intro, setIntro] = useState({
    profileImage: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=800',
    name: currentUser.name,
    title: '스마트 보험 전문 설계사',
    greeting: '안녕하세요, 데이터로 증명하고 진심으로 설계하는 전문가입니다.',
    description: '단순히 보험을 판매하는 것이 아니라, 고객님의 인생 전반을 아우르는 리스크 매니지먼트를 지향합니다. AI 분석을 통한 객관적인 진단과 10년 이상의 실무 경험을 결합하여 최적의 솔루션을 제안해 드립니다.',
    specialties: ['보험 리뉴얼', '보장 분석', '맞춤 설계', '가족 보장', '사업자 보험'],
    philosophy: '보험은 지출이 아니라 미래를 위한 가장 똑똑한 전략이어야 합니다.'
  });

  const [story, setStory] = useState({
    title: '왜 스마트 보험설계인가?',
    content: '보험 시장은 정보의 비대칭이 심한 곳입니다. 우리는 AI 기술을 활용하여 고객이 알기 어려운 보장의 중복과 누락을 투명하게 분석합니다. 기술은 도구일 뿐, 마지막 완성은 고객의 삶을 깊이 이해하는 전문가의 손길에서 이루어집니다.',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200'
  });

  const [portfolio, setPortfolio] = useState([
    { id: '1', title: '4인 가족 보험 리뉴얼', summary: '기존 보험료 30% 절감 및 보장 범위 2배 확대', category: '가족', image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=800' },
    { id: '2', title: '사업자 리스크 컨설팅', summary: '화재 및 배상책임 보험 최적화 설계', category: '사업자', image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=800' },
    { id: '3', title: '1인 가구 맞춤 보장', summary: '가성비 중심의 실손 및 암보험 재구성', category: '개인', image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800' }
  ]);

  const [reviews, setReviews] = useState([
    { id: '1', name: '김*현 고객님', text: 'AI 분석 보고서를 보고 제 보험이 얼마나 엉망이었는지 알게 됐어요. 덕분에 정말 필요한 보장만 챙겼습니다.', rating: 5 },
    { id: '2', name: '이*우 고객님', text: '설계사님이 너무 전문적이시고, 강요 없이 데이터로 설명해주셔서 신뢰가 갔습니다.', rating: 5 }
  ]);

  const [footer, setFooter] = useState({
    brandName: '스마트 보험설계',
    contact: currentUser.phone,
    email: currentUser.loginId.includes('@') ? currentUser.loginId : currentUser.loginId + '@gmail.com',
    address: '서울특별시 강남구 테헤란로 123, 스마트빌딩 15층',
    sns: { blog: '#', instagram: '#', kakao: '#' },
    compliance: `광고 심의 및 법적 고지 (Compliance) 
본 홈페이지는 보험상품 안내를 위한 광고입니다.

(보험대리점) ○○보험대리점 (협회등록번호: XXXXX)
(보험설계사) 보험설계사 ○○○ (협회등록번호: XXXXX)

본 광고는 「보험업법」 및 관련 법령에서 정한 광고심의 기준을 준수하였으며,
유효기간은 심의일로부터 1년입니다.
(심의필번호: XXXXX / 심의일: YYYY.MM.DD)

보험계약자는 기존 보험계약을 해지하고 새로운 보험계약을 체결하는 경우,
다음과 같은 불이익이 발생할 수 있습니다.

질병 이력, 연령 증가 등으로 가입이 거절되거나 보험료가 인상될 수 있습니다.
가입 상품에 따라 새로운 면책기간 적용 및 보장 제한 등 기타 불이익이 발생할 수 있습니다.`
  });

  const [previewData, setPreviewData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [currentFormId, setCurrentFormId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [requirePrivacy, setRequirePrivacy] = useState(true);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);

  // Load initial config if provided
  useEffect(() => {
    if (initialConfig) {
      setFormName(initialConfig.name);
      setFields(initialConfig.fields || []);
      
      const theme = initialConfig.theme || {};
      setFormStyle(theme.style || 'SIMPLE');
      if (theme.hero) setHero(theme.hero);
      if (theme.intro) setIntro(theme.intro);
      if (theme.story) setStory(theme.story);
      if (theme.portfolio) setPortfolio(theme.portfolio);
      if (theme.reviews) setReviews(theme.reviews);
      if (theme.footer) setFooter(theme.footer);
      
      // Handle requirePrivacy from both top-level (legacy) and theme (new)
      const reqPriv = theme.requirePrivacy !== undefined 
        ? theme.requirePrivacy 
        : (initialConfig.requirePrivacy !== undefined ? initialConfig.requirePrivacy : true);
      setRequirePrivacy(reqPriv);
      setCurrentFormId(initialConfig.id);
      setGeneratedUrl(initialConfig.url);
      setIsEditing(true);
    }
  }, [initialConfig]);

  const handleImageUpload = async (file: File, folder: string) => {
    try {
      // 0. Ensure bucket exists
      try {
        const { data: buckets } = await supabase.storage.listBuckets();
        const exists = buckets?.some(b => b.id === 'form-assets');
        if (!exists) {
          await supabase.storage.createBucket('form-assets', { public: true });
        }
      } catch (bucketErr) {
        console.warn('[LeadCollection] Bucket check/create failed, proceeding anyway:', bucketErr);
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const userId = currentUser?.id || 'anonymous';
      const filePath = `${userId}/${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('form-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('form-assets')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err: any) {
      console.error('Image upload failed:', err);
      alert(`이미지 업로드에 실패했습니다: ${err.message || '알 수 없는 오류'}`);
      return null;
    }
  };

  const addField = () => {
    setFields([...fields, { id: Date.now().toString(), label: '새 항목', type: 'text', required: false }]);
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const resetBuilder = () => {
    setFormName('기본 상담 신청서');
    setFields([
      { id: '1', label: '성함', type: 'text', required: true },
      { id: '2', label: '연락처', type: 'tel', required: true },
      { id: '3', label: '문의내용', type: 'text', required: false },
    ]);
    setGeneratedUrl(null);
    setCurrentFormId(null);
    setIsEditing(false);
    setPreviewData({});
    if (onReset) onReset();
  };

  const handleSaveConfig = () => {
    if (!formName.trim()) {
      alert('폼 이름을 입력해주세요.');
      return;
    }
    setIsSaving(true);
    
    // Simulate a slight delay for "AI Optimization" feel
    setTimeout(async () => {
      const formId = isEditing && currentFormId ? currentFormId : Math.random().toString(36).substring(2, 9);
      // More robust URL generation that includes environment prefixes
      const path = window.location.pathname;
      const basePath = path.startsWith('/ais-') ? `/${path.split('/')[1]}` : '';
      const publicUrl = `${window.location.origin}${basePath}/form/${formId}`;
      const config = { 
        id: formId,
        userId: currentUser.id,
        name: formName,
        fields, 
        theme: {
          style: formStyle,
          requirePrivacy,
          hero,
          intro,
          story,
          portfolio,
          reviews,
          footer
        },
        url: publicUrl,
        updatedAt: new Date().toISOString() 
      };
      
      try {
        await onSaveConfig(config);
        setGeneratedUrl(publicUrl);
        setCurrentFormId(formId);
        setIsEditing(true); // Now we are editing this saved form
      } catch (err) {
        console.error('Failed to save form config:', err);
        alert('폼 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
      } finally {
        setIsSaving(false);
      }
      
      // Scroll to the generated URL section
      setTimeout(() => {
        const urlSection = document.getElementById('generated-url-section');
        if (urlSection) {
          urlSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }, 1200);
  };

  const handleSubmit = () => {
    const missingFields = fields.filter(f => f.required && !previewData[f.id]);
    if (missingFields.length > 0) {
      alert(`${missingFields[0].label} 항목을 입력해주세요.`);
      return;
    }

    if (requirePrivacy && !privacyAgreed) {
      alert('개인정보 수집 및 이용에 동의해주세요.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const response = {
        id: Date.now(),
        formId: currentFormId,
        formData: fields.reduce((acc, field) => ({
          ...acc,
          [field.label]: previewData[field.id] || ''
        }), {}),
        submittedAt: new Date().toLocaleString(),
        quality: Math.floor(Math.random() * 40) + 60 // Simulated quality score
      };
      onSubmitResponse(response);
      setIsSubmitting(false);
      setShowSuccess(true);
      setPreviewData({});
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1000);
  };

  const [activeSettingsTab, setActiveSettingsTab] = useState<'BASIC' | 'HERO' | 'INTRO' | 'STORY' | 'PORTFOLIO' | 'REVIEWS' | 'FOOTER' | 'COMPLIANCE'>('BASIC');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-5 neo-card p-8 space-y-8 max-h-[85vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              {isEditing ? '프리미엄 홈페이지 수정' : '프리미엄 홈페이지 제작'}
            </h3>
            <p className="text-xs text-slate-400 font-medium tracking-wide">폼의 스타일과 내용을 구성하세요.</p>
          </div>
          <div className="flex items-center gap-2">
            {isEditing && (
              <button 
                onClick={resetBuilder}
                className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all"
                title="새 폼 만들기"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Style Selector */}
        <div className="flex p-1 bg-slate-100 rounded-2xl">
          <button 
            onClick={() => setFormStyle('PREMIUM')}
            className={`flex-1 py-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 ${formStyle === 'PREMIUM' ? 'bg-gradient-to-r from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-200 scale-[1.02]' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Sparkles className={`w-3 h-3 ${formStyle === 'PREMIUM' ? 'text-white animate-pulse' : 'text-slate-300'}`} />
            프리미엄 홈페이지
          </button>
          <button 
            onClick={() => setFormStyle('SIMPLE')}
            className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${formStyle === 'SIMPLE' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            기본 폼
          </button>
        </div>

        {formStyle === 'PREMIUM' ? (
          <div className="flex gap-1 overflow-x-auto pb-2 custom-scrollbar">
            {['BASIC', 'HERO', 'INTRO', 'STORY', 'PORTFOLIO', 'REVIEWS', 'FOOTER', 'COMPLIANCE'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveSettingsTab(tab as any)}
                className={`px-2.5 py-1.5 rounded-full text-[10px] font-black whitespace-nowrap transition-all ${activeSettingsTab === tab ? 'bg-primary text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
              >
                {tab === 'BASIC' ? '기본/필드' : 
                 tab === 'HERO' ? '히어로' : 
                 tab === 'INTRO' ? '설계사소개' : 
                 tab === 'STORY' ? '브랜드스토리' : 
                 tab === 'PORTFOLIO' ? '포트폴리오' : 
                 tab === 'REVIEWS' ? '리뷰' : 
                 tab === 'FOOTER' ? '푸터' : '심의/법적고지'}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex gap-1 overflow-x-auto pb-2 custom-scrollbar">
            {['BASIC', 'COMPLIANCE'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveSettingsTab(tab as any)}
                className={`px-2.5 py-1.5 rounded-full text-[10px] font-black whitespace-nowrap transition-all ${activeSettingsTab === tab ? 'bg-primary text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
              >
                {tab === 'BASIC' ? '기본/필드' : '심의/법적고지'}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-6">
          {activeSettingsTab === 'BASIC' && (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">폼 이름 (구분용)</label>
                  <input 
                    type="text" 
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 font-bold text-slate-700"
                    placeholder="예: 3월 암보험 상담 신청서"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">필드 구성</label>
                  <button onClick={addField} className="p-1.5 bg-primary/5 text-primary rounded-lg hover:bg-primary hover:text-white transition-all">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                {fields.map((field, idx) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={field.id} 
                    className="p-4 bg-white rounded-2xl border border-slate-100 flex items-center gap-4 group hover:border-primary/20 transition-all"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-xs font-bold text-slate-400 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                      {idx + 1}
                    </div>
                    <input 
                      type="text" 
                      value={field.label}
                      onChange={(e) => {
                        const newFields = [...fields];
                        newFields[idx].label = e.target.value;
                        setFields(newFields);
                      }}
                      className="flex-1 bg-transparent border-none outline-none font-bold text-slate-700 text-sm"
                    />
                    <select 
                      value={field.type}
                      onChange={(e) => {
                        const newFields = [...fields];
                        newFields[idx].type = e.target.value;
                        setFields(newFields);
                      }}
                      className="bg-slate-50 px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-500 outline-none border border-transparent focus:border-primary/20 transition-all"
                    >
                      <option value="text">텍스트</option>
                      <option value="tel">연락처</option>
                      <option value="number">숫자</option>
                      <option value="email">이메일</option>
                    </select>
                    <button onClick={() => removeField(field.id)} className="p-2 text-slate-200 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-700">개인정보 수집 동의 (필수)</p>
                    <p className="text-[10px] text-slate-400 font-medium">폼 하단에 동의 체크박스를 추가합니다.</p>
                  </div>
                  <button 
                    onClick={() => setRequirePrivacy(!requirePrivacy)}
                    className={`w-12 h-6 rounded-full p-1 transition-all ${requirePrivacy ? 'bg-primary' : 'bg-slate-200'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-all ${requirePrivacy ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            </>
          )}

          {formStyle === 'PREMIUM' && activeSettingsTab === 'HERO' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">메인 헤드라인</label>
                <textarea 
                  value={hero.headline}
                  onChange={(e) => setHero({ ...hero, headline: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 font-bold text-slate-700 h-24 resize-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">서브 헤드라인</label>
                <textarea 
                  value={hero.subheadline}
                  onChange={(e) => setHero({ ...hero, subheadline: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 font-medium text-slate-600 h-24 resize-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">버튼 문구</label>
                <input 
                  type="text" 
                  value={hero.cta}
                  onChange={(e) => setHero({ ...hero, cta: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 font-bold text-slate-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">배경 이미지</label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl bg-slate-100 overflow-hidden border border-slate-200">
                    <img src={hero.backgroundImage} alt="Hero" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <input 
                    type="file" 
                    id="hero-bg-upload" 
                    className="hidden" 
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = await handleImageUpload(file, 'hero');
                        if (url) setHero({ ...hero, backgroundImage: url });
                      }
                    }}
                  />
                  <label htmlFor="hero-bg-upload" className="px-4 py-2 bg-slate-900 text-white text-[10px] font-bold rounded-lg cursor-pointer hover:bg-black transition-all">
                    이미지 변경
                  </label>
                </div>
              </div>
            </div>
          )}

          {formStyle === 'PREMIUM' && activeSettingsTab === 'INTRO' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 shadow-sm">
                    <img src={intro.profileImage} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <input 
                    type="file" 
                    id="profile-upload" 
                    className="hidden" 
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = await handleImageUpload(file, 'intro');
                        if (url) setIntro({ ...intro, profileImage: url });
                      }
                    }}
                  />
                  <label htmlFor="profile-upload" className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-all">
                    <Upload className="w-4 h-4" />
                  </label>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">이름</label>
                    <input 
                      type="text" 
                      value={intro.name}
                      onChange={(e) => setIntro({ ...intro, name: e.target.value })}
                      className="w-full p-2 bg-slate-50 border-b border-slate-200 outline-none font-bold text-slate-700 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">직함/역할</label>
                    <input 
                      type="text" 
                      value={intro.title}
                      onChange={(e) => setIntro({ ...intro, title: e.target.value })}
                      className="w-full p-2 bg-slate-50 border-b border-slate-200 outline-none font-bold text-slate-700 text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">한 줄 인사말</label>
                <input 
                  type="text" 
                  value={intro.greeting}
                  onChange={(e) => setIntro({ ...intro, greeting: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 font-bold text-slate-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">상세 소개</label>
                <textarea 
                  value={intro.description}
                  onChange={(e) => setIntro({ ...intro, description: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 font-medium text-slate-600 h-32 resize-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">상담 철학</label>
                <input 
                  type="text" 
                  value={intro.philosophy}
                  onChange={(e) => setIntro({ ...intro, philosophy: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 font-bold text-slate-700"
                />
              </div>
            </div>
          )}

          {formStyle === 'PREMIUM' && activeSettingsTab === 'STORY' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">스토리 제목</label>
                <input 
                  type="text" 
                  value={story.title}
                  onChange={(e) => setStory({ ...story, title: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 font-bold text-slate-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">스토리 내용</label>
                <textarea 
                  value={story.content}
                  onChange={(e) => setStory({ ...story, content: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 font-medium text-slate-600 h-40 resize-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">스토리 이미지</label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl bg-slate-100 overflow-hidden border border-slate-200">
                    <img src={story.image} alt="Story" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <input 
                    type="file" 
                    id="story-upload" 
                    className="hidden" 
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = await handleImageUpload(file, 'story');
                        if (url) setStory({ ...story, image: url });
                      }
                    }}
                  />
                  <label htmlFor="story-upload" className="px-4 py-2 bg-slate-900 text-white text-[10px] font-bold rounded-lg cursor-pointer hover:bg-black transition-all">
                    이미지 변경
                  </label>
                </div>
              </div>
            </div>
          )}

          {formStyle === 'PREMIUM' && activeSettingsTab === 'PORTFOLIO' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">포트폴리오 리스트</label>
                <button 
                  onClick={() => setPortfolio([...portfolio, { id: Date.now().toString(), title: '새 사례', summary: '설명', category: '기타', image: 'https://images.unsplash.com/photo-1454165833767-027ffea9e77b?auto=format&fit=crop&q=80&w=800' }])}
                  className="p-1.5 bg-primary/5 text-primary rounded-lg hover:bg-primary hover:text-white transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-4">
                {portfolio.map((item, idx) => (
                  <div key={item.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-300">CASE {idx + 1}</span>
                      <button onClick={() => setPortfolio(portfolio.filter(p => p.id !== item.id))} className="text-slate-300 hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="relative group">
                        <img src={item.image} alt="Case" className="w-full aspect-square object-cover rounded-xl" referrerPolicy="no-referrer" />
                        <input 
                          type="file" 
                          id={`port-upload-${item.id}`} 
                          className="hidden" 
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const url = await handleImageUpload(file, 'portfolio');
                              if (url) {
                                setPortfolio(prev => prev.map((p, i) => i === idx ? { ...p, image: url } : p));
                              }
                            }
                          }}
                        />
                        <label htmlFor={`port-upload-${item.id}`} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-xl cursor-pointer transition-all">
                          <Upload className="w-4 h-4 text-white" />
                        </label>
                      </div>
                      <div className="col-span-2 space-y-2">
                        <input 
                          type="text" 
                          value={item.title}
                          onChange={(e) => {
                            setPortfolio(prev => prev.map((p, i) => i === idx ? { ...p, title: e.target.value } : p));
                          }}
                          className="w-full p-2 bg-white border border-slate-100 rounded-lg text-xs font-bold"
                          placeholder="제목"
                        />
                        <input 
                          type="text" 
                          value={item.category}
                          onChange={(e) => {
                            setPortfolio(prev => prev.map((p, i) => i === idx ? { ...p, category: e.target.value } : p));
                          }}
                          className="w-full p-2 bg-white border border-slate-100 rounded-lg text-[10px] font-bold text-primary"
                          placeholder="카테고리"
                        />
                        <textarea 
                          value={item.summary}
                          onChange={(e) => {
                            setPortfolio(prev => prev.map((p, i) => i === idx ? { ...p, summary: e.target.value } : p));
                          }}
                          className="w-full p-2 bg-white border border-slate-100 rounded-lg text-[10px] h-16 resize-none"
                          placeholder="요약 설명"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {formStyle === 'PREMIUM' && activeSettingsTab === 'REVIEWS' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">고객 리뷰</label>
                <button 
                  onClick={() => setReviews([...reviews, { id: Date.now().toString(), name: '신규 고객', text: '리뷰 내용을 입력하세요.', rating: 5 }])}
                  className="p-1.5 bg-primary/5 text-primary rounded-lg hover:bg-primary hover:text-white transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-4">
                {reviews.map((review, idx) => (
                  <div key={review.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <input 
                        type="text" 
                        value={review.name}
                        onChange={(e) => {
                          setReviews(prev => prev.map((r, i) => i === idx ? { ...r, name: e.target.value } : r));
                        }}
                        className="bg-transparent border-none outline-none font-bold text-slate-700 text-xs"
                      />
                      <button onClick={() => setReviews(reviews.filter(r => r.id !== review.id))} className="text-slate-300 hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <textarea 
                      value={review.text}
                      onChange={(e) => {
                        setReviews(prev => prev.map((r, i) => i === idx ? { ...r, text: e.target.value } : r));
                      }}
                      className="w-full p-3 bg-white border border-slate-100 rounded-xl text-[10px] h-20 resize-none font-medium text-slate-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {formStyle === 'PREMIUM' && activeSettingsTab === 'FOOTER' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">브랜드명</label>
                <input 
                  type="text" 
                  value={footer.brandName}
                  onChange={(e) => setFooter({ ...footer, brandName: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 font-bold text-slate-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">연락처</label>
                <input 
                  type="text" 
                  value={footer.contact}
                  onChange={(e) => setFooter({ ...footer, contact: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 font-bold text-slate-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">이메일</label>
                <input 
                  type="text" 
                  value={footer.email}
                  onChange={(e) => setFooter({ ...footer, email: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 font-bold text-slate-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">주소</label>
                <input 
                  type="text" 
                  value={footer.address}
                  onChange={(e) => setFooter({ ...footer, address: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 font-bold text-slate-700"
                />
              </div>
            </div>
          )}

          {activeSettingsTab === 'COMPLIANCE' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">광고 심의 및 법적 고지 (Compliance)</label>
                <textarea 
                  rows={15}
                  value={footer.compliance || ''}
                  onChange={(e) => setFooter({ ...footer, compliance: e.target.value })}
                  placeholder="보험업법에 따른 필수 고지 사항을 입력하세요."
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 text-[10px] font-medium text-slate-600 leading-relaxed resize-none"
                />
                <p className="text-[9px] text-slate-400 leading-relaxed px-1">
                  * 보험업법 및 광고심의 기준에 따른 필수 항목(대리점명, 등록번호, 심의필 등)을 입력해주세요.
                </p>
              </div>
            </div>
          )}
        </div>

        <button 
          onClick={handleSaveConfig}
          disabled={isSaving}
          className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-lg shadow-slate-200 flex items-center justify-center gap-2 hover:bg-black transition-all disabled:opacity-50"
        >
          {isSaving ? <Zap className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isEditing ? '폼 설정 업데이트' : '폼 설정 저장 및 URL 생성'}
        </button>

        {generatedUrl && (
          <motion.div 
            id="generated-url-section"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-4 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
              <p className="text-xs font-bold text-emerald-700">배포용 URL이 생성되었습니다!</p>
            </div>
            <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-emerald-100">
              <p className="flex-1 text-[10px] font-mono text-emerald-600 truncate">{generatedUrl}</p>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(generatedUrl);
                  alert('URL이 복사되었습니다.');
                }}
                className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </div>

      <div className="lg:col-span-7 neo-card p-0 bg-slate-50 border-none flex flex-col items-center justify-start relative overflow-hidden h-[85vh]">
        <div className="w-full bg-slate-800 p-3 flex items-center gap-2 border-b border-slate-700 shrink-0">
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          </div>
          <div className="flex-1 mx-4 bg-slate-700 rounded-lg h-5 flex items-center px-3">
            <p className="text-[8px] text-slate-400 font-mono">https://smart-income.ai/form/{currentFormId || 'preview'}</p>
          </div>
        </div>

        <div className="flex-1 w-full overflow-y-auto custom-scrollbar bg-white">
          {formStyle === 'SIMPLE' ? (
            <div className="min-h-full flex flex-col items-center justify-center p-12">
              <AnimatePresence>
                {showSuccess && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute inset-0 z-20 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8"
                  >
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                      <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h4 className="text-2xl font-bold text-slate-900 mb-2">신청이 완료되었습니다!</h4>
                    <p className="text-slate-500 font-medium">관리자가 확인 후 곧 연락드리겠습니다.</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="w-full max-w-sm bg-white rounded-[2.5rem] p-10 shadow-2xl space-y-8 relative z-10 border border-slate-100">
                <div className="text-center space-y-2">
                  <h4 className="text-xl font-bold text-slate-900 tracking-tight">상담 신청하기</h4>
                  <p className="text-xs text-slate-400 font-medium tracking-wide">정보를 남겨주시면 곧 연락드리겠습니다.</p>
                </div>
                <div className="space-y-5">
                  {fields.map(field => (
                    <div key={field.id} className="space-y-2">
                      <div className="flex justify-between items-center ml-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{field.label}</label>
                        {field.required && <span className="text-[8px] font-bold text-red-400 uppercase">필수</span>}
                      </div>
                      <input 
                        type={field.type}
                        value={previewData[field.id] || ''}
                        onChange={(e) => setPreviewData({ ...previewData, [field.id]: e.target.value })}
                        placeholder={`${field.label}을(를) 입력하세요`}
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all text-sm font-medium"
                      />
                    </div>
                  ))}
                </div>

                {requirePrivacy && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <input 
                        type="checkbox" 
                        checked={privacyAgreed}
                        onChange={(e) => setPrivacyAgreed(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary" 
                      />
                      <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                        개인정보 수집 및 이용에 동의합니다. 수집된 정보는 상담 목적으로만 사용되며, 관련 법령에 따라 안전하게 보호됩니다.
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                      <div className="text-[9px] text-slate-400 leading-relaxed whitespace-pre-wrap font-medium">
                        [개인정보 수집 및 이용 동의]
귀하는 개인정보 수집 및 이용 동의를 거부할 권리가 있습니다.
다만, 동의 거부 시 원활한 상담 서비스 제공이 제한될 수 있습니다.
■ 수집하는 개인정보 항목 성함, 연락처
■ 수집 및 이용 목적 보험 보장분석 및 상담 서비스 제공
■ 보유 및 이용기간 상담 종료 후 1년 이내 또는 이용자 요청 시 즉시 파기

[개인정보 수집 및 이용 안내]
① 개인정보의 수집 · 이용 목적 보험 상담, 보험상품 안내, 계약 체결 및 유지관리
② 수집하는 개인정보 항목 성명, 연락처, 상담내용 등
③ 개인정보 보유 및 이용 기간 수집 · 이용 목적 달성 시까지 또는 관련 법령에 따른 보관기간까지
④ 거부 권리 안내 개인정보 수집 및 이용에 대한 동의를 거부할 권리가 있으며, 동의를 거부할 경우 상담 및 서비스 이용에 제한이 있을 수 있습니다.
                      </div>
                    </div>
                  </div>
                )}

                <button 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full py-5 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <Zap className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  신청 완료
                </button>
              </div>

              {footer.compliance && (
                <div className="w-full max-w-sm mt-8 px-4 pb-12">
                  <div className="text-[9px] text-slate-400 leading-relaxed whitespace-pre-wrap font-medium text-left">
                    {footer.compliance}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="min-h-full bg-white text-[#111111] font-sans">
              {/* Hero Section */}
              <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
                <img src={hero.backgroundImage} alt="Hero" className="absolute inset-0 w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"></div>
                <div className="relative z-10 max-w-2xl px-8 text-center space-y-8">
                  <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight"
                  >
                    {hero.headline}
                  </motion.h1>
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-lg text-white/80 font-medium"
                  >
                    {hero.subheadline}
                  </motion.p>
                  <motion.button 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="px-10 py-5 bg-[#C9A96E] text-white font-black rounded-full shadow-2xl shadow-[#C9A96E]/20 hover:scale-105 transition-all"
                  >
                    {hero.cta}
                  </motion.button>
                </div>
              </section>

              {/* Intro Section */}
              <section className="py-24 px-12 max-w-6xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                  <div className="relative">
                    <div className="aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl">
                      <img src={intro.profileImage} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="absolute -bottom-8 -right-8 p-8 bg-white rounded-[2rem] shadow-xl border border-slate-50 max-w-[240px]">
                      <p className="text-[#C9A96E] font-black text-xs uppercase tracking-widest mb-2">Philosophy</p>
                      <p className="text-sm font-bold text-slate-700 leading-relaxed italic">"{intro.philosophy}"</p>
                    </div>
                  </div>
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <p className="text-[#C9A96E] font-black text-sm uppercase tracking-[0.3em]">{intro.title}</p>
                      <h2 className="text-4xl font-black tracking-tight">{intro.name}</h2>
                    </div>
                    <p className="text-xl font-bold text-slate-800 leading-relaxed">{intro.greeting}</p>
                    <p className="text-slate-500 leading-relaxed text-base">{intro.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {intro.specialties.map((s, i) => (
                        <span key={i} className="px-4 py-2 bg-slate-50 text-slate-500 text-xs font-bold rounded-full border border-slate-100">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* Story Section */}
              <section className="py-24 bg-slate-50">
                <div className="max-w-6xl mx-auto px-12 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                  <div className="order-2 md:order-1 space-y-8">
                    <h2 className="text-3xl font-black tracking-tight">{story.title}</h2>
                    <p className="text-lg text-slate-600 leading-relaxed whitespace-pre-line">{story.content}</p>
                  </div>
                  <div className="order-1 md:order-2">
                    <div className="aspect-video rounded-[2rem] overflow-hidden shadow-xl">
                      <img src={story.image} alt="Story" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  </div>
                </div>
              </section>

              {/* Portfolio Section */}
              <section className="py-24 px-12 max-w-6xl mx-auto space-y-16">
                <div className="text-center space-y-4">
                  <p className="text-[#C9A96E] font-black text-sm uppercase tracking-[0.3em]">Cases</p>
                  <h2 className="text-4xl font-black tracking-tight">최근 컨설팅 사례</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {portfolio.map((item) => (
                    <div key={item.id} className="group cursor-pointer">
                      <div className="aspect-[4/3] rounded-[2rem] overflow-hidden mb-6 relative shadow-lg">
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                        <div className="absolute top-4 left-4 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-black text-[#C9A96E] uppercase tracking-widest">
                          {item.category}
                        </div>
                      </div>
                      <h4 className="text-xl font-bold mb-2 group-hover:text-[#C9A96E] transition-colors">{item.title}</h4>
                      <p className="text-sm text-slate-500 line-clamp-2">{item.summary}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Reviews Section */}
              <section className="py-24 bg-[#111111] text-white">
                <div className="max-w-6xl mx-auto px-12 space-y-16">
                  <div className="text-center space-y-4">
                    <p className="text-[#C9A96E] font-black text-sm uppercase tracking-[0.3em]">Testimonials</p>
                    <h2 className="text-4xl font-black tracking-tight">고객들의 신뢰</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {reviews.map((review) => (
                      <div key={review.id} className="p-10 bg-white/5 rounded-[2rem] border border-white/10 space-y-6">
                        <div className="flex gap-1">
                          {[...Array(review.rating)].map((_, i) => (
                            <Sparkles key={i} className="w-4 h-4 text-[#C9A96E]" />
                          ))}
                        </div>
                        <p className="text-lg font-medium leading-relaxed italic text-white/90">"{review.text}"</p>
                        <p className="text-sm font-black text-[#C9A96E] uppercase tracking-widest">{review.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Form Section */}
              <section id="contact" className="py-24 px-12 max-w-4xl mx-auto space-y-16">
                <div className="text-center space-y-4">
                  <p className="text-[#C9A96E] font-black text-sm uppercase tracking-[0.3em]">Contact</p>
                  <h2 className="text-4xl font-black tracking-tight">무료 상담 신청</h2>
                  <p className="text-slate-500 font-medium">데이터 기반의 스마트한 설계를 지금 경험해보세요.</p>
                </div>
                <div className="bg-white rounded-[3rem] p-12 shadow-2xl border border-slate-50 space-y-8">
                  <div className="space-y-6">
                    {fields.map(field => (
                      <div key={field.id} className="space-y-3">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{field.label}</label>
                        <input 
                          type={field.type}
                          placeholder={`${field.label}을(를) 입력하세요`}
                          className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-[#C9A96E]/10 focus:border-[#C9A96E]/20 transition-all text-base font-medium"
                        />
                      </div>
                    ))}
                  </div>

                  {requirePrivacy && (
                    <div className="space-y-4">
                      <div className="flex items-start gap-4 p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                        <input 
                          type="checkbox" 
                          checked={privacyAgreed}
                          onChange={(e) => setPrivacyAgreed(e.target.checked)}
                          className="mt-1.5 w-5 h-5 rounded border-slate-300 text-[#C9A96E] focus:ring-[#C9A96E]" 
                        />
                        <p className="text-sm text-slate-500 leading-relaxed font-medium">
                          개인정보 수집 및 이용에 동의합니다. 수집된 정보는 상담 목적으로만 사용되며, 관련 법령에 따라 안전하게 보호됩니다.
                        </p>
                      </div>
                      <div className="p-6 bg-slate-50/50 rounded-[1.5rem] border border-slate-100/50">
                        <div className="text-[11px] text-slate-400 leading-relaxed whitespace-pre-wrap font-medium">
                          [개인정보 수집 및 이용 동의]
귀하는 개인정보 수집 및 이용 동의를 거부할 권리가 있습니다.
다만, 동의 거부 시 원활한 상담 서비스 제공이 제한될 수 있습니다.
■ 수집하는 개인정보 항목 성함, 연락처
■ 수집 및 이용 목적 보험 보장분석 및 상담 서비스 제공
■ 보유 및 이용기간 상담 종료 후 1년 이내 또는 이용자 요청 시 즉시 파기

[개인정보 수집 및 이용 안내]
① 개인정보의 수집 · 이용 목적 보험 상담, 보험상품 안내, 계약 체결 및 유지관리
② 수집하는 개인정보 항목 성명, 연락처, 상담내용 등
③ 개인정보 보유 및 이용 기간 수집 · 이용 목적 달성 시까지 또는 관련 법령에 따른 보관기간까지
④ 거부 권리 안내 개인정보 수집 및 이용에 대한 동의를 거부할 권리가 있으며, 동의를 거부할 경우 상담 및 서비스 이용에 제한이 있을 수 있습니다.
                        </div>
                      </div>
                    </div>
                  )}

                  <button className="w-full py-6 bg-[#111111] text-white font-black text-lg rounded-[2rem] shadow-2xl shadow-black/20 hover:scale-[1.02] active:scale-95 transition-all">
                    상담 신청하기
                  </button>
                </div>
              </section>

              {/* Footer */}
              <footer className="py-16 bg-slate-50 border-t border-slate-100">
                <div className="max-w-6xl mx-auto px-12 flex flex-col md:flex-row justify-between gap-12">
                  <div className="space-y-6">
                    <h3 className="text-2xl font-black tracking-tight">{footer.brandName}</h3>
                    <div className="space-y-2 text-sm font-medium text-slate-500">
                      <p>연락처: {footer.contact}</p>
                      <p>이메일: {footer.email}</p>
                      <p>주소: {footer.address}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    {/* SNS Icons Placeholder */}
                    <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary transition-colors cursor-pointer">B</div>
                    <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary transition-colors cursor-pointer">I</div>
                    <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary transition-colors cursor-pointer">K</div>
                  </div>
                </div>

                {footer.compliance && (
                  <div className="max-w-6xl mx-auto px-12 mt-12 pt-8 border-t border-slate-100">
                    <div className="text-[10px] text-slate-400 leading-relaxed whitespace-pre-wrap font-medium">
                      {footer.compliance}
                    </div>
                  </div>
                )}

                <div className="max-w-6xl mx-auto px-12 mt-16 pt-8 border-t border-slate-100 text-center">
                  <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em]">© 2024 {footer.brandName}. ALL RIGHTS RESERVED.</p>
                </div>
              </footer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const LeadDetailModal: React.FC<{ lead: any; onClose: () => void; onGoToCRM: () => void }> = ({ lead, onClose, onGoToCRM }) => {
  if (!lead) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'CONTACTED': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'ANALYSIS': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'PROPOSAL': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'CONTRACTED': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'LOST': return 'bg-slate-50 text-slate-600 border-slate-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'NEW': return '신규 유입';
      case 'CONTACTED': return '최초 상담';
      case 'ANALYSIS': return '보장 분석';
      case 'PROPOSAL': return '제안 발송';
      case 'CONTRACTED': return '계약 완료';
      case 'LOST': return '종료';
      default: return '신규 유입';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden"
      >
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">고객 상세 정보</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lead.source}</p>
                <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${getStatusColor(lead.status || 'NEW')}`}>
                  {getStatusLabel(lead.status || 'NEW')}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        
        <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">수집 일시</p>
              <p className="text-sm font-bold text-slate-700">{lead.submittedAt || lead.createdAt}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">품질 점수</p>
              <div className="flex items-center gap-2">
                <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${lead.quality || 85}%` }}></div>
                </div>
                <span className="text-sm font-bold text-slate-700">{lead.quality || 85}%</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-50 space-y-4">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <ClipboardList className="w-3.5 h-3.5 text-primary" />
              입력 데이터
            </h4>
            <div className="grid grid-cols-1 gap-4">
              {lead.formData ? Object.entries(lead.formData).map(([key, val]: [string, any]) => (
                <div key={key} className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{key}</p>
                  <p className="text-sm font-bold text-slate-700">{val || '-'}</p>
                </div>
              )) : (
                <>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">성명</p>
                    <p className="text-sm font-bold text-slate-700">{lead.name}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">연락처</p>
                    <p className="text-sm font-bold text-slate-700">{lead.phone}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50/50 border-t border-slate-50 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 bg-white text-slate-600 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-50 transition-all"
          >
            닫기
          </button>
          <button 
            onClick={onGoToCRM}
            className="flex-1 py-3 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
          >
            <Target className="w-3.5 h-3.5" />
            <span>CRM에서 관리하기</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const QRCodeModal: React.FC<{
  url: string;
  name: string;
  onClose: () => void;
}> = ({ url, name, onClose }) => {
  const qrRef = useRef<HTMLDivElement>(null);

  const downloadQRCode = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;
    
    const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
    let downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `QR_${name}.png`;
    downloadLink.click();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden p-8 space-y-8"
      >
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-900">QR 코드 생성</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        
        <div className="flex flex-col items-center justify-center space-y-4">
          <div ref={qrRef} className="p-6 bg-white rounded-[2rem] border-4 border-slate-50 shadow-inner">
            <QRCodeCanvas 
              value={url} 
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-slate-800">{name}</p>
            <p className="text-[10px] text-slate-400 mt-1 truncate max-w-[250px]">{url}</p>
          </div>
        </div>

        <div className="space-y-3">
          <button 
            onClick={downloadQRCode}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-black transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>QR 코드 이미지 저장</span>
          </button>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(url);
              alert('URL이 복사되었습니다.');
            }}
            className="w-full py-4 bg-slate-50 text-slate-600 rounded-2xl text-sm font-bold border border-slate-100 hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
          >
            <Copy className="w-4 h-4" />
            <span>URL 복사하기</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// --- Main Component ---

const LeadCollection: React.FC<{
  currentUser: User;
  leads: any[];
  onAddLead: (lead: Partial<Lead>) => void;
  onDeleteLead: (id: string) => void;
  onDeleteLeads: (ids: string[]) => void;
  setActiveTab: (tab: string) => void;
  savedFormConfigs: any[];
  onSaveFormConfig: (config: any) => Promise<void>;
  onDeleteFormConfig: (id: string) => Promise<void>;
  savedLandingPages: any[];
  onSaveLandingPage: (page: any) => Promise<void>;
  onDeleteLandingPage: (id: string) => Promise<void>;
}> = ({ 
  currentUser,
  leads: allLeads, 
  onAddLead,
  onDeleteLead, 
  onDeleteLeads,
  setActiveTab,
  savedFormConfigs: allFormConfigs, 
  onSaveFormConfig,
  onDeleteFormConfig,
  savedLandingPages,
  onSaveLandingPage,
  onDeleteLandingPage
}) => {
  // Filter data by user
  const isAdmin = currentUser.role === UserRole.ADMIN;
  const savedFormConfigs = isAdmin ? allFormConfigs : allFormConfigs.filter(f => f.userId === currentUser.id);
  
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [editingPage, setEditingPage] = useState<any>(null);
  const [editingForm, setEditingForm] = useState<any>(null);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [leadSearchTerm, setLeadSearchTerm] = useState('');
  const [leadFilterSource, setLeadFilterSource] = useState<string | null>(null);
  const [qrCodeData, setQrCodeData] = useState<{ url: string; name: string } | null>(null);

  const userLeads = isAdmin ? allLeads : allLeads.filter(l => l.userId === currentUser.id);
  const leads = userLeads.filter(l => {
      const matchesSearch = l.name.toLowerCase().includes(leadSearchTerm.toLowerCase()) || 
                           l.phone.includes(leadSearchTerm);
      const matchesSource = leadFilterSource ? l.source === leadFilterSource : true;
      return matchesSearch && matchesSource;
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'CONTACTED': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'ANALYSIS': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'PROPOSAL': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'CONTRACTED': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'LOST': return 'bg-slate-50 text-slate-600 border-slate-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'NEW': return '신규 유입';
      case 'CONTACTED': return '최초 상담';
      case 'ANALYSIS': return '보장 분석';
      case 'PROPOSAL': return '제안 발송';
      case 'CONTRACTED': return '계약 완료';
      case 'LOST': return '종료';
      default: return '신규 유입';
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedLeadIds.size === leads.length) {
      setSelectedLeadIds(new Set());
    } else {
      setSelectedLeadIds(new Set(leads.map(l => l.id)));
    }
  };

  const handleToggleSelectLead = (id: string) => {
    const newSelected = new Set(selectedLeadIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedLeadIds(newSelected);
  };

  const handleDownloadExcel = () => {
    const leadsToDownload = selectedLeadIds.size > 0 
      ? leads.filter(l => selectedLeadIds.has(l.id))
      : leads;

    if (leadsToDownload.length === 0) {
      alert('다운로드할 데이터가 없습니다.');
      return;
    }

    const data = leadsToDownload.map((l, idx) => {
      const baseData: Record<string, any> = {
        'No': leadsToDownload.length - idx,
        '폼 이름': l.source?.replace('프리미엄 홈페이지: ', '') || '기본 폼',
        '수집 일시': l.submittedAt || l.createdAt,
        '성명': l.name,
        '연락처': l.phone,
        '품질 점수': `${l.quality || 85}%`
      };

      // Add dynamic form data fields
      if (l.data) {
        Object.entries(l.data).forEach(([key, val]) => {
          baseData[key] = val;
        });
      }

      return baseData;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "가망고객_DB");
    
    XLSX.writeFile(workbook, `가망고객_수집데이터_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleBulkDelete = () => {
    if (selectedLeadIds.size === 0) return;
    
    if (window.confirm(`선택한 ${selectedLeadIds.size}건의 데이터를 정말 삭제하시겠습니까?`)) {
      onDeleteLeads(Array.from(selectedLeadIds));
      setSelectedLeadIds(new Set());
    }
  };

  const handleSaveLandingPage = async (page: any) => {
    // Prevent duplicate saves of the exact same content
    const exists = savedLandingPages.some(p => {
      const content = p.content || p;
      return content.headline === page.headline && content.industry === page.industry;
    });
    
    if (exists) {
      alert('이미 저장된 랜딩페이지입니다.');
      return;
    }
    
    try {
      // Map to DB schema
      const dbPage = {
        id: Date.now().toString(),
        title: page.headline,
        content: page,
        createdAt: new Date().toISOString()
      };
      await onSaveLandingPage(dbPage);
    } catch (err) {
      console.error('Failed to save landing page:', err);
      throw err; // Propagate to LandingPageGenerator
    }
  };

  const handleDeleteSavedPage = async (id: string) => {
    await onDeleteLandingPage(id);
  };

  const handleLoadPage = (page: any) => {
    setEditingPage(page);
    setActiveTool('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveFormConfig = async (config: any) => {
    await onSaveFormConfig(config);
    alert('폼 설정이 저장되었습니다. 이제 배포용 URL을 통해 고객 상담을 수집할 수 있습니다.');
  };

  const handleSubmitFormResponse = (response: any) => {
    // Map the form response to a Lead object
    const name = response.formData['성함'] || response.formData['성명'] || '무명 고객';
    const phone = response.formData['연락처'] || response.formData['전화번호'] || '010-0000-0000';
    const email = response.formData['이메일'] || '';
    
    const newLead: Partial<Lead> = {
      userId: currentUser.id,
      name,
      phone,
      email,
      status: LeadStatus.NEW,
      priority: 'MEDIUM',
      source: '프리미엄 홈페이지: ' + (savedFormConfigs.find(f => f.id === response.formId)?.name || '기본 폼'),
      formId: response.formId,
      formData: response.formData,
      submittedAt: response.submittedAt
    };
    
    onAddLead(newLead);
  };

  const tools = [
    {
      id: 'form',
      title: '프리미엄 홈페이지',
      description: '나만의 프리미엄 홈페이지를 보유해 보세요\n고객의 심리를 자극해 DB수집을 자동으로 할 수 있습니다.',
      icon: FormInput,
      color: 'text-accent',
      bg: 'bg-accent/10',
      tag: 'NEW',
      component: <SmartFormBuilder 
        currentUser={currentUser}
        onSaveConfig={handleSaveFormConfig} 
        onSubmitResponse={handleSubmitFormResponse} 
        savedFormConfigs={savedFormConfigs}
        onDeleteFormConfig={onDeleteFormConfig}
        initialConfig={editingForm}
        onReset={() => setEditingForm(null)}
      />
    },
    {
      id: 'landing',
      title: 'AI 랜딩페이지 생성',
      description: '업종별 최적화된 고전환 랜딩페이지를 AI가 1분 만에 제작합니다.',
      icon: Globe,
      color: 'text-blue-500',
      bg: 'bg-blue-50',
      tag: 'HOT',
      component: <LandingPageGenerator onSave={handleSaveLandingPage} initialData={editingPage} savedPages={savedLandingPages} />
    }
  ];

  if (activeTool) {
    const tool = tools.find(t => t.id === activeTool);
    return (
      <div className="space-y-8 animate-fade-in pb-20">
        <button 
          onClick={() => {
            setActiveTool(null);
            setEditingPage(null);
          }}
          className="flex items-center gap-2 text-slate-400 hover:text-primary transition-colors font-bold text-sm group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>목록으로 돌아가기</span>
        </button>
        
        <div className="flex items-center gap-6">
          <div className={`w-16 h-16 rounded-2xl ${tool?.bg} flex items-center justify-center shadow-inner`}>
            {tool && <tool.icon className={`w-8 h-8 ${tool.color}`} />}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{tool?.title}</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">{tool?.description}</p>
          </div>
        </div>

        <div className="pt-4">
          {tool?.component}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-[3rem] bg-primary p-12 lg:p-16 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>
        
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/10 mb-8">
            <Magnet className="w-4 h-4 text-accent" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Lead Collection Engine</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold mb-6 tracking-tight leading-tight">
            가망고객 수집의 <span className="text-accent underline underline-offset-8 decoration-4">모든 도구</span>를 한곳에
          </h1>
          <p className="text-lg text-blue-100/80 font-medium leading-relaxed mb-10">
            복잡한 코딩이나 디자인 없이도 AI가 당신의 비즈니스에 최적화된 가망고객 수집 시스템을 구축해 드립니다. 
            지금 바로 고전환 도구들을 활용해 보세요.
          </p>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => setActiveTool('form')}
              className="px-8 py-4 bg-accent text-primary font-bold rounded-2xl hover:bg-white transition-all shadow-xl shadow-accent/20 flex items-center gap-3 group"
            >
              <span>수집 시스템 시작하기</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {tools.map((tool, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => setActiveTool(tool.id)}
            className="neo-card p-10 group hover:shadow-2xl transition-all cursor-pointer border-none relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
              <ArrowUpRight className="w-6 h-6 text-slate-200" />
            </div>
            
            <div className="flex items-start gap-8">
              <div className={`w-20 h-20 rounded-[2rem] ${tool.bg} flex items-center justify-center shadow-inner shrink-0 group-hover:scale-110 transition-transform duration-500`}>
                <tool.icon className={`w-10 h-10 ${tool.color}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{tool.title}</h3>
                  <span className={`text-[9px] font-black px-2.5 py-1 rounded-full ${tool.bg} ${tool.color} border border-current/10`}>
                    {tool.tag}
                  </span>
                </div>
                <p className="text-slate-500 font-medium leading-relaxed mb-8 text-base">
                  {tool.description}
                </p>
                <div className="flex items-center text-primary font-bold text-sm gap-2 group/btn">
                  <span>도구 실행하기</span>
                  <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Saved Form Configs Section */}
      {savedFormConfigs.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <ClipboardList className="w-5 h-5 text-slate-400" />
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">등록된 상담 신청폼 목록</h3>
              <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {savedFormConfigs.length}
              </span>
            </div>
            <button 
              onClick={() => setActiveTool('form')}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              새 폼 만들기
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedFormConfigs.map((config) => {
              const formLeads = userLeads.filter(l => 
                (l.formId === config.id && l.userId === config.userId) || 
                (l.source === `프리미엄 홈페이지: ${config.name}` && l.userId === config.userId)
              );
              return (
                <motion.div 
                  key={config.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="neo-card p-6 border-none group relative overflow-hidden bg-white hover:shadow-xl transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-bold uppercase tracking-widest">
                      Active Form
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => {
                          setLeadFilterSource(`프리미엄 홈페이지: ${config.name}`);
                          // Scroll to leads section
                          setTimeout(() => {
                            const leadsSection = document.getElementById('leads-management-section');
                            if (leadsSection) {
                              leadsSection.scrollIntoView({ behavior: 'smooth' });
                            }
                          }, 100);
                        }}
                        className="p-2 text-slate-300 hover:text-primary transition-colors"
                        title="신청 현황 보기"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onDeleteFormConfig(config.id)}
                        className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h4 className="font-bold text-slate-900 mb-2 line-clamp-1">{config.name}</h4>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {config.fields?.length || 0} Fields
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-lg">
                      수집된 DB: {formLeads.length}건
                    </span>
                  </div>
                  <div className="space-y-3 pt-4 border-t border-slate-50">
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => {
                          setEditingForm(config);
                          setActiveTool('form');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="py-2.5 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-bold hover:bg-slate-100 transition-all flex items-center justify-center gap-2 border border-slate-100"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>수정하기</span>
                      </button>
                      <button 
                        onClick={() => window.open(config.url, '_blank')}
                        className="py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-bold hover:bg-black transition-all flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>미리보기</span>
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Link className="w-3 h-3 text-slate-300 shrink-0" />
                        <span className="text-[9px] font-mono text-slate-400 truncate">{config.url}</span>
                      </div>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(config.url);
                          alert('URL이 복사되었습니다.');
                        }}
                        className="p-1.5 text-slate-400 hover:text-primary transition-colors"
                        title="URL 복사"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => setQrCodeData({ url: config.url, name: config.name })}
                        className="p-1.5 text-slate-400 hover:text-primary transition-colors"
                        title="QR 코드 보기"
                      >
                        <QrCode className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Saved Landing Pages Section */}
      {savedLandingPages.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-4">
            <History className="w-5 h-5 text-slate-400" />
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">저장된 랜딩페이지</h3>
            <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {savedLandingPages.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedLandingPages.map((page) => {
              const content = page.content || page;
              const displayIndustry = content.industry || '기타';
              const displayHeadline = page.title || content.headline;
              const displaySubheadline = content.subheadline || '';
              const displayDate = page.createdAt ? page.createdAt.split('T')[0] : (content.createdAt ? content.createdAt.split(',')[0] : '-');

              return (
                <motion.div 
                  key={page.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="neo-card p-6 border-none group relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className={`px-3 py-1 rounded-full bg-primary/5 text-primary text-[9px] font-bold uppercase tracking-widest`}>
                      {displayIndustry}
                    </div>
                    <button 
                      onClick={() => handleDeleteSavedPage(page.id)}
                      className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h4 className="font-bold text-slate-900 mb-2 line-clamp-1">{displayHeadline}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-6 font-medium">{displaySubheadline}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{displayDate}</span>
                    <button 
                      onClick={() => handleLoadPage(content)}
                      className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-widest hover:underline"
                    >
                      <span>상세보기</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Form Responses Section */}
      {allLeads.length > 0 && (
        <div id="leads-management-section" className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">가망고객 DB 관리</h3>
              </div>
              <p className="text-sm text-slate-400 font-medium ml-13">실시간으로 수집된 진성 고객 리스트입니다.</p>
            </div>
            <div className="flex items-center gap-3">
              {leadFilterSource && (
                <button 
                  onClick={() => setLeadFilterSource(null)}
                  className="flex items-center gap-2 px-3 py-2 bg-primary/10 text-primary rounded-xl text-[10px] font-bold border border-primary/20"
                >
                  <span>필터: {leadFilterSource.replace('프리미엄 홈페이지: ', '')}</span>
                  <X className="w-3 h-3" />
                </button>
              )}
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm">
                <Search className="w-4 h-4 text-slate-300" />
                <input 
                  type="text" 
                  placeholder="고객명 검색..." 
                  value={leadSearchTerm}
                  onChange={(e) => setLeadSearchTerm(e.target.value)}
                  className="text-xs font-bold text-slate-600 outline-none bg-transparent w-32" 
                />
              </div>
              <button className="p-2.5 bg-white text-slate-400 rounded-xl border border-slate-100 hover:text-primary transition-colors shadow-sm">
                <Filter className="w-4 h-4" />
              </button>
              {selectedLeadIds.size > 0 && (
                <>
                  <button 
                    onClick={() => {
                      setSelectedLeadIds(new Set());
                      setActiveTab('crm');
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary/5 text-primary rounded-xl text-xs font-bold hover:bg-primary/10 transition-all border border-primary/10 shadow-sm"
                  >
                    <Target className="w-4 h-4" />
                    <span>{selectedLeadIds.size}건 CRM에서 관리</span>
                  </button>
                  <button 
                    onClick={handleBulkDelete}
                    className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-500 rounded-xl text-xs font-bold hover:bg-red-100 transition-all border border-red-100"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{selectedLeadIds.size}건 삭제</span>
                  </button>
                </>
              )}
              <button 
                onClick={handleDownloadExcel}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all shadow-lg shadow-slate-200"
              >
                <Download className="w-4 h-4" />
                <span>{selectedLeadIds.size > 0 ? `${selectedLeadIds.size}건 다운로드` : '전체 다운로드'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 px-4">
            {[
              { label: '누적 수집', value: leads.length, icon: UserCheck, color: 'text-blue-500', bg: 'bg-blue-50' },
              { label: '오늘 수집', value: leads.filter(r => r.submittedAt?.includes(new Date().toLocaleDateString())).length || 0, icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' },
              { label: '평균 품질', value: '88%', icon: BarChart3, color: 'text-emerald-500', bg: 'bg-emerald-50' },
              { label: '미확인', value: leads.length, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' }
            ].map((stat, i) => (
              <div key={i} className="neo-card p-6 border-none flex items-center gap-5">
                <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="neo-card p-0 overflow-hidden border-none shadow-2xl mx-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="p-6 w-12">
                      <div 
                        onClick={handleToggleSelectAll}
                        className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer ${
                          selectedLeadIds.size === leads.length && leads.length > 0
                            ? 'bg-primary border-primary' 
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        {selectedLeadIds.size === leads.length && leads.length > 0 && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </th>
                    <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">No.</th>
                    <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">폼 이름</th>
                    <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">수집 일시</th>
                    <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">성명</th>
                    <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">연락처</th>
                    <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">CRM 상태</th>
                    <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">관리</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="popLayout">
                    {leads.map((res, idx) => (
                      <motion.tr 
                        key={res.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`border-b border-slate-50 hover:bg-slate-50/30 transition-colors group cursor-pointer ${
                          selectedLeadIds.has(res.id) ? 'bg-primary/5' : ''
                        }`}
                        onClick={() => setSelectedLead(res)}
                      >
                        <td className="p-6" onClick={(e) => e.stopPropagation()}>
                          <div 
                            onClick={() => handleToggleSelectLead(res.id)}
                            className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer ${
                              selectedLeadIds.has(res.id) 
                                ? 'bg-primary border-primary' 
                                : 'border-slate-200 bg-white group-hover:border-primary/50'
                            }`}
                          >
                            {selectedLeadIds.has(res.id) && <Check className="w-3 h-3 text-white" />}
                          </div>
                        </td>
                        <td className="p-6">
                          <span className="text-xs font-bold text-slate-300">#{leads.length - idx}</span>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
                            <span className="text-xs font-bold text-slate-700">{res.source?.replace('프리미엄 홈페이지: ', '') || '기본 폼'}</span>
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-700">
                              {res.submittedAt ? res.submittedAt.split(' ').slice(0, 3).join(' ') : res.createdAt}
                            </p>
                            <p className="text-[10px] font-medium text-slate-400">
                              {res.submittedAt ? res.submittedAt.split(' ').slice(3).join(' ') : ''}
                            </p>
                          </div>
                        </td>
                        <td className="p-6">
                          <span className="text-xs font-bold text-slate-700">{res.name}</span>
                        </td>
                        <td className="p-6">
                          <span className="text-xs font-bold text-slate-700">{res.phone}</span>
                        </td>
                        <td className="p-6">
                          <span className={`px-2 py-1 rounded-full border text-[9px] font-bold ${getStatusColor(res.status || 'NEW')}`}>
                            {getStatusLabel(res.status || 'NEW')}
                          </span>
                        </td>
                        <td className="p-6 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLead(res);
                              }}
                              className="p-2 text-slate-400 hover:text-primary transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteLead(res.id);
                              }}
                              className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Stats Section */}
      <div className="neo-card p-12 border-none bg-gradient-to-br from-slate-50 to-white">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h4 className="text-xl font-bold text-slate-900">평균 수집률 3.5배 향상</h4>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              기존 방식 대비 AI 최적화 도구를 사용했을 때 가망고객 수집 효율이 평균 350% 향상되었습니다.
            </p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center">
              <Target className="w-6 h-6 text-accent" />
            </div>
            <h4 className="text-xl font-bold text-slate-900">정밀한 타겟팅 시스템</h4>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              단순 유입이 아닌, 실제 계약 가능성이 높은 진성 고객만을 선별하여 수집하는 스마트 필터링을 제공합니다.
            </p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-blue-500" />
            </div>
            <h4 className="text-xl font-bold text-slate-900">실시간 알림 및 연동</h4>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              고객 유입 즉시 관리자에게 알림을 보내고 CRM 시스템에 자동으로 등록되어 즉각적인 대응이 가능합니다.
            </p>
          </div>
        </div>
      </div>

      {/* Lead Detail Modal */}
      <AnimatePresence>
        {selectedLead && (
          <LeadDetailModal 
            lead={selectedLead} 
            onClose={() => setSelectedLead(null)} 
            onGoToCRM={() => {
              setSelectedLead(null);
              setActiveTab('crm');
            }}
          />
        )}
      </AnimatePresence>

      {/* QR Code Modal */}
      <AnimatePresence>
        {qrCodeData && (
          <QRCodeModal 
            url={qrCodeData.url}
            name={qrCodeData.name}
            onClose={() => setQrCodeData(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const ArrowUpRight: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <line x1="7" y1="17" x2="17" y2="7"></line>
    <polyline points="7 7 17 7 17 17"></polyline>
  </svg>
);

export default LeadCollection;
