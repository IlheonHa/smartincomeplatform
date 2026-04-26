
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CheckCircle2, Zap, ShieldCheck, MessageCircle, Sparkles, ArrowRight, ChevronRight } from 'lucide-react';
import { LeadStatus } from '../types';
import { supabase } from '../src/lib/supabase';

const toCamelCase = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  
  const camelObj: any = {};
  for (const key in obj) {
    const camelKey = key.replace(/([-_][a-z])/g, group =>
      group.toUpperCase().replace('-', '').replace('_', '')
    );
    const value = obj[key];
    
    camelObj[camelKey] = (typeof value === 'object' && value !== null && !(value instanceof Date))
      ? toCamelCase(value)
      : value;
  }
  return camelObj;
};

const PublicFormView: React.FC = () => {
  const [formConfig, setFormConfig] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);

  useEffect(() => {
    const loadForm = async () => {
      const path = window.location.pathname;
      const match = path.match(/\/form\/([^\/\?]+)/);
      const formId = match ? match[1] : null;

      if (formId) {
        console.log(`[Form] Attempting to load form ${formId} from Supabase`);
        
        try {
          const { data: config, error: formError } = await supabase
            .from('form_configs')
            .select('*')
            .eq('id', formId)
            .single();

          if (config && !formError) {
            console.log('[Form] Successfully loaded from Supabase');
            const camelConfig = toCamelCase(config);
            
            // Fetch owner email for notifications
            const ownerId = camelConfig.userId || camelConfig.user_id;
            if (ownerId) {
              try {
                const { data: userData } = await supabase
                  .from('users')
                  .select('login_id')
                  .eq('id', ownerId)
                  .single();
                if (userData) {
                  camelConfig.ownerEmail = userData.login_id;
                }
              } catch (e) {
                console.warn('[Form] Failed to fetch owner email', e);
              }
            }

            setFormConfig(camelConfig);
            document.title = `${camelConfig.name} - 상담 신청`;
            setError(null);
            return;
          } else if (formError) {
            console.warn(`[Form] Supabase error:`, formError);
          }
        } catch (e) {
          console.error('[Form] Error fetching from Supabase', e);
        }

        // Fallback for demo ID
        if (formId === '1zw4fq6') {
          const config = {
            id: '1zw4fq6',
            name: '기본 상담 신청서 (샘플)',
            fields: [
              { id: '1', label: '성함', type: 'text', required: true },
              { id: '2', label: '연락처', type: 'tel', required: true },
              { id: '3', label: '문의내용', type: 'text', required: false },
            ],
            url: `${window.location.origin}/form/1zw4fq6`,
            updatedAt: new Date().toLocaleString()
          };
          setFormConfig(config);
          document.title = `${config.name} - 상담 신청`;
          setError(null);
        } else {
          setError(`등록된 폼 정보가 없습니다. (ID: ${formId})\n관리자 화면에서 폼을 생성한 후 [폼 설정 저장 및 URL 생성] 버튼을 눌러 저장했는지 확인해주세요.`);
        }
      } else {
        setError('유효하지 않은 접근 경로입니다.');
      }
    };

    loadForm();
    
    // Listen for storage changes in case the form is saved in another tab
    window.addEventListener('storage', loadForm);
    return () => {
      window.removeEventListener('storage', loadForm);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formConfig) return;

    // Validation
    const missingFields = formConfig.fields.filter((f: any) => f.required && !formData[f.id]);
    if (missingFields.length > 0) {
      alert(`${missingFields[0].label} 항목을 입력해주세요.`);
      return;
    }

    const isPrivacyRequired = formConfig.theme?.requirePrivacy !== undefined 
      ? formConfig.theme.requirePrivacy 
      : (formConfig.requirePrivacy !== undefined ? formConfig.requirePrivacy : true);

    if (isPrivacyRequired && !privacyAgreed) {
      alert('개인정보 수집 및 이용에 동의해주세요.');
      return;
    }

    setIsSubmitting(true);

    // Submit to Supabase
    try {
      const mappedData = formConfig.fields.reduce((acc: any, field: any) => ({
        ...acc,
        [field.label]: formData[field.id] || ''
      }), {});

      const leadId = 'l_' + Math.random().toString(36).substring(2, 11);
      const leadPayload = {
        id: leadId,
        user_id: formConfig.user_id || formConfig.userId || 'admin-1',
        name: formData[formConfig.fields.find((f: any) => f.label.includes('성함') || f.label.includes('이름'))?.id || ''] || '익명 고객',
        phone: formData[formConfig.fields.find((f: any) => f.label.includes('연락처') || f.label.includes('전화'))?.id || ''] || '010-0000-0000',
        email: formData[formConfig.fields.find((f: any) => f.label.includes('이메일') || f.label.includes('Email'))?.id || ''] || '',
        status: LeadStatus.NEW,
        priority: 'MEDIUM',
        source: `프리미엄 홈페이지: ${formConfig.name}`,
        form_id: formConfig.id,
        notes: formConfig.fields.map((f: any) => `${f.label}: ${formData[f.id] || ''}`).join('\n'),
        form_data: mappedData,
        created_at: new Date().toISOString()
      };

      const { error: submitError } = await supabase.from('leads').insert(leadPayload);
      if (submitError) throw submitError;

      // Send Email Notification
      try {
        const ownerId = formConfig.user_id || formConfig.userId;
        const ownerEmail = formConfig.ownerEmail;
        
        console.log(`[Form] Triggering email notification. OwnerEmail: ${ownerEmail}, OwnerId: ${ownerId}`);
        
        const emailPayload = {
          to: ownerEmail,
          userId: ownerId,
          subject: `📩 [${formConfig.name}] 새 상담 신청이 들어왔습니다`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #333;">새 상담 신청 알림</h2>
              <p style="color: #666;">'${formConfig.name}'을 통해 새로운 상담 신청이 접수되었습니다.</p>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; color: #888; width: 100px;">신청자명</td>
                  <td style="padding: 10px 0; font-weight: bold;">${leadPayload.name}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #888;">연락처</td>
                  <td style="padding: 10px 0; font-weight: bold;">${leadPayload.phone}</td>
                </tr>
                ${leadPayload.email ? `
                <tr>
                  <td style="padding: 10px 0; color: #888;">이메일</td>
                  <td style="padding: 10px 0; font-weight: bold;">${leadPayload.email}</td>
                </tr>
                ` : ''}
              </table>
              <div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px;">
                <p style="margin: 0 0 10px 0; color: #888; font-size: 12px; text-transform: uppercase;">상세 문의 내용</p>
                <p style="margin: 0; white-space: pre-wrap;">${leadPayload.notes}</p>
              </div>
              <div style="margin-top: 30px; text-align: center;">
                <a href="${window.location.origin}/crm" style="display: inline-block; padding: 12px 24px; background-color: #111; color: #fff; text-decoration: none; border-radius: 5px; font-weight: bold;">CRM에서 확인하기</a>
              </div>
            </div>
          `
        };

        const response = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emailPayload)
        });
        
        const result = await response.json();
        if (response.ok) {
          console.log('[Form] Email notification sent successfully:', result);
        } else {
          console.error('[Form] Email notification failed:', result);
        }
      } catch (emailErr) {
        console.error('Error sending email notification:', emailErr);
      }

      setIsSubmitting(false);
      setIsSuccess(true);
    } catch (e: any) {
      console.error('[Form] Error submitting lead to Supabase', e);
      alert('상담 신청 중 오류가 발생했습니다: ' + (e.message || '알 수 없는 오류'));
      setIsSubmitting(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="neo-card p-12 text-center space-y-6 max-w-md w-full">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
            <ShieldCheck className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">접근 오류</h2>
          <p className="text-slate-500 font-medium leading-relaxed px-4">{error}</p>
          <div className="space-y-3">
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20"
            >
              다시 시도하기
            </button>
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl"
            >
              홈으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!formConfig) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Zap className="w-12 h-12 text-primary animate-pulse" />
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading Form...</p>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <motion.div 
          key="success"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="neo-card p-12 text-center space-y-8 max-w-md w-full bg-white shadow-2xl"
        >
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-slate-900">신청 완료!</h2>
            <p className="text-slate-500 font-medium leading-relaxed">
              상담 신청이 정상적으로 접수되었습니다.<br />
              담당자가 확인 후 곧 연락드리겠습니다.
            </p>
          </div>
          <div className="pt-4 border-t border-slate-50">
            <div className="flex items-center justify-center gap-2 text-slate-300">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Secure Consultation System</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (formConfig.theme?.style === 'PREMIUM') {
    const { hero, intro, story, portfolio, reviews, footer } = formConfig.theme;

    return (
      <div className="min-h-screen bg-white text-[#111111] font-sans selection:bg-[#C9A96E]/30">
        {/* Hero Section */}
        <section className="relative h-screen flex items-center justify-center overflow-hidden">
          <img src={hero.backgroundImage} alt="Hero" className="absolute inset-0 w-full h-full object-cover" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>
          <div className="relative z-10 max-w-4xl px-8 text-center space-y-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white/80 text-[10px] font-black uppercase tracking-[0.3em]"
            >
              <Sparkles className="w-3 h-3 text-[#C9A96E]" />
              AI Powered Insurance Planning
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl lg:text-7xl font-black text-white leading-[1.1] tracking-tight"
            >
              {hero.headline}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl lg:text-2xl text-white/70 font-medium max-w-2xl mx-auto"
            >
              {hero.subheadline}
            </motion.p>
            <motion.button 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
              className="group px-12 py-6 bg-[#C9A96E] text-white font-black text-lg rounded-full shadow-2xl shadow-[#C9A96E]/30 hover:scale-105 transition-all flex items-center gap-3 mx-auto"
            >
              {hero.cta}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </div>
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center p-1">
              <div className="w-1 h-2 bg-white/50 rounded-full"></div>
            </div>
          </div>
        </section>

        {/* Intro Section */}
        <section className="py-32 px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-[4/5] rounded-[4rem] overflow-hidden shadow-2xl">
                <img src={intro.profileImage} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="absolute -bottom-12 -right-12 p-10 bg-white rounded-[3rem] shadow-2xl border border-slate-50 max-w-[300px]">
                <div className="w-12 h-1 bg-[#C9A96E] mb-6"></div>
                <p className="text-lg font-bold text-slate-800 leading-relaxed italic">"{intro.philosophy}"</p>
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-10"
            >
              <div className="space-y-4">
                <p className="text-[#C9A96E] font-black text-sm uppercase tracking-[0.4em]">{intro.title}</p>
                <h2 className="text-5xl lg:text-6xl font-black tracking-tight">{intro.name}</h2>
              </div>
              <p className="text-2xl font-bold text-slate-800 leading-relaxed">{intro.greeting}</p>
              <p className="text-slate-500 leading-relaxed text-lg">{intro.description}</p>
              <div className="grid grid-cols-2 gap-4">
                {intro.specialties.map((s: string, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="w-2 h-2 rounded-full bg-[#C9A96E]"></div>
                    <span className="text-sm font-bold text-slate-700">{s}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-32 bg-slate-50">
          <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1 space-y-10"
            >
              <h2 className="text-4xl lg:text-5xl font-black tracking-tight">{story.title}</h2>
              <p className="text-xl text-slate-600 leading-relaxed whitespace-pre-line">{story.content}</p>
              <button className="flex items-center gap-2 text-[#C9A96E] font-black uppercase tracking-widest text-sm hover:gap-4 transition-all">
                Learn More About Our Tech <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2"
            >
              <div className="aspect-video rounded-[3rem] overflow-hidden shadow-2xl">
                <img src={story.image} alt="Story" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Portfolio Section */}
        <section className="py-32 px-8 max-w-7xl mx-auto space-y-20">
          <div className="text-center space-y-4">
            <p className="text-[#C9A96E] font-black text-sm uppercase tracking-[0.4em]">Success Stories</p>
            <h2 className="text-5xl font-black tracking-tight">최근 컨설팅 사례</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {portfolio.map((item: any, idx: number) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group cursor-pointer"
              >
                <div className="aspect-[4/3] rounded-[3rem] overflow-hidden mb-8 relative shadow-xl">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" referrerPolicy="no-referrer" />
                  <div className="absolute top-6 left-6 px-4 py-2 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-black text-[#C9A96E] uppercase tracking-widest">
                    {item.category}
                  </div>
                </div>
                <h4 className="text-2xl font-black mb-3 group-hover:text-[#C9A96E] transition-colors">{item.title}</h4>
                <p className="text-slate-500 font-medium leading-relaxed">{item.summary}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Reviews Section */}
        <section className="py-32 bg-[#111111] text-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-8 space-y-20">
            <div className="text-center space-y-4">
              <p className="text-[#C9A96E] font-black text-sm uppercase tracking-[0.4em]">Testimonials</p>
              <h2 className="text-5xl font-black tracking-tight">고객들의 신뢰</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {reviews.map((review: any, idx: number) => (
                <motion.div 
                  key={review.id}
                  initial={{ opacity: 0, x: idx % 2 === 0 ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="p-12 bg-white/5 rounded-[4rem] border border-white/10 space-y-8 relative group hover:bg-white/10 transition-all"
                >
                  <div className="flex gap-1">
                    {[...Array(review.rating)].map((_, i) => (
                      <Sparkles key={i} className="w-5 h-5 text-[#C9A96E]" />
                    ))}
                  </div>
                  <p className="text-2xl font-medium leading-relaxed italic text-white/90">"{review.text}"</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-1 bg-[#C9A96E]"></div>
                    <p className="text-sm font-black text-[#C9A96E] uppercase tracking-[0.2em]">{review.name}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Form Section */}
        <section id="contact" className="py-32 px-8 max-w-5xl mx-auto space-y-20">
          <div className="text-center space-y-6">
            <p className="text-[#C9A96E] font-black text-sm uppercase tracking-[0.4em]">Get in Touch</p>
            <h2 className="text-5xl lg:text-6xl font-black tracking-tight">무료 상담 신청</h2>
            <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto">
              당신의 소중한 자산과 미래, 데이터 기반의 스마트한 설계로 지켜드리겠습니다.
            </p>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-[4rem] p-16 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] border border-slate-50 space-y-12"
          >
            <form onSubmit={handleSubmit} className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {formConfig.fields.map((field: any) => (
                  <div key={field.id} className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{field.label}</label>
                    <input 
                      required={field.required}
                      type={field.type}
                      value={formData[field.id] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                      placeholder={`${field.label}을(를) 입력하세요`}
                      className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-[#C9A96E]/10 focus:border-[#C9A96E]/20 transition-all text-lg font-medium"
                    />
                  </div>
                ))}
              </div>

                <div className="space-y-6">
                {(() => {
                  const isPrivacyRequired = formConfig.theme?.requirePrivacy !== undefined 
                    ? formConfig.theme.requirePrivacy 
                    : (formConfig.requirePrivacy !== undefined ? formConfig.requirePrivacy : true);
                  
                  return isPrivacyRequired && (
                    <div className="space-y-4">
                      <div className="flex items-start gap-4 p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                        <input 
                          type="checkbox" 
                          required 
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
                  );
                })()}

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-8 bg-[#111111] text-white font-black text-xl rounded-full shadow-2xl shadow-black/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Zap className="w-6 h-6 animate-spin" />
                      <span>신청 처리 중...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-6 h-6" />
                      <span>스마트 상담 신청하기</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="py-24 bg-slate-50 border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-8">
            <div className="flex flex-col lg:flex-row justify-between gap-20">
              <div className="space-y-8 max-w-md">
                <h3 className="text-3xl font-black tracking-tight">{footer.brandName}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">
                  인공지능 분석과 전문가의 통찰력이 결합된 차세대 보험 컨설팅 시스템. 
                  우리는 당신의 내일을 더 스마트하게 설계합니다.
                </p>
                <div className="flex gap-4">
                  {['Blog', 'Insta', 'Kakao'].map((sns) => (
                    <div key={sns} className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-400 hover:text-[#C9A96E] hover:border-[#C9A96E] transition-all cursor-pointer shadow-sm">
                      {sns}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                <div className="space-y-6">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Contact Info</p>
                  <div className="space-y-4 text-base font-bold text-slate-700">
                    <p className="flex items-center gap-3">
                      <span className="text-[#C9A96E]">T.</span> {footer.contact}
                    </p>
                    <p className="flex items-center gap-3">
                      <span className="text-[#C9A96E]">E.</span> {footer.email}
                    </p>
                    <p className="flex items-center gap-3">
                      <span className="text-[#C9A96E]">A.</span> {footer.address}
                    </p>
                  </div>
                </div>
                <div className="space-y-6">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Quick Links</p>
                  <div className="space-y-4 text-base font-bold text-slate-700">
                    <p className="cursor-pointer hover:text-[#C9A96E] transition-colors">About Us</p>
                    <p className="cursor-pointer hover:text-[#C9A96E] transition-colors">Services</p>
                    <p className="cursor-pointer hover:text-[#C9A96E] transition-colors">Privacy Policy</p>
                  </div>
                </div>
              </div>
            </div>

            {footer.compliance && (
              <div className="mt-16 pt-8 border-t border-slate-200">
                <div className="text-[10px] text-slate-400 leading-relaxed whitespace-pre-wrap font-medium">
                  {footer.compliance}
                </div>
              </div>
            )}
            
            <div className="mt-24 pt-12 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">
                © 2024 {footer.brandName}. ALL RIGHTS RESERVED.
              </p>
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em]">
                Powered by Smart Insure Lab OS
              </p>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6 flex flex-col items-center">
      <AnimatePresence mode="wait">
        <motion.div 
          key="form"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg space-y-8"
        >
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 text-primary rounded-full">
              <MessageCircle className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Official Consultation Form</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">{formConfig.name}</h1>
            <p className="text-slate-500 font-medium">아래 정보를 입력해 주시면 전문 상담원이 연락드립니다.</p>
          </div>

          <form onSubmit={handleSubmit} className="neo-card p-10 bg-white shadow-2xl space-y-8 border-none">
            <div className="space-y-6">
              {formConfig.fields.map((field: any) => (
                <div key={field.id} className="space-y-2">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{field.label}</label>
                    {field.required && <span className="text-[9px] font-bold text-red-400 uppercase">필수</span>}
                  </div>
                  <input 
                    required={field.required}
                    type={field.type}
                    value={formData[field.id] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                    placeholder={`${field.label}을(를) 입력하세요`}
                    className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all text-base font-medium"
                  />
                </div>
              ))}
            </div>

            <div className="space-y-4 pt-4">
              {(() => {
                const isPrivacyRequired = formConfig.theme?.requirePrivacy !== undefined 
                  ? formConfig.theme.requirePrivacy 
                  : (formConfig.requirePrivacy !== undefined ? formConfig.requirePrivacy : true);
                
                return isPrivacyRequired && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <input 
                        type="checkbox" 
                        required 
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
                );
              })()}

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full py-6 bg-primary text-white font-black text-lg rounded-[2rem] shadow-2xl shadow-primary/30 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Zap className="w-6 h-6 animate-spin" />
                    <span>처리 중...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-6 h-6" />
                    <span>상담 신청하기</span>
                  </>
                )}
              </button>
            </div>
          </form>
          
          {formConfig.theme?.footer?.compliance && (
            <div className="mt-8 p-8 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
              <div className="text-[10px] text-slate-400 leading-relaxed whitespace-pre-wrap font-medium">
                {formConfig.theme.footer.compliance}
              </div>
            </div>
          )}

          <div className="text-center">
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em]">Powered by Smart Insure Lab OS</p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default PublicFormView;
