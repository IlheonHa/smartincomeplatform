
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CheckCircle2, Zap, ShieldCheck, MessageCircle } from 'lucide-react';
import { LeadStatus } from '../types';
import { supabase } from '../src/lib/supabase';

const PublicFormView: React.FC = () => {
  const [formConfig, setFormConfig] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
            setFormConfig(config);
            document.title = `${config.name} - 상담 신청`;
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
        source: `스마트폼: ${formConfig.name}`,
        notes: formConfig.fields.map((f: any) => `${f.label}: ${formData[f.id] || ''}`).join('\n'),
        form_data: mappedData,
        created_at: new Date().toISOString()
      };

      const { error: submitError } = await supabase.from('leads').insert(leadPayload);
      if (submitError) throw submitError;

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

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6 flex flex-col items-center">
      <AnimatePresence mode="wait">
        {isSuccess ? (
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
        ) : (
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
                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <input type="checkbox" required className="mt-1 w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary" />
                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                    개인정보 수집 및 이용에 동의합니다. 수집된 정보는 상담 목적으로만 사용되며, 관련 법령에 따라 안전하게 보호됩니다.
                  </p>
                </div>

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

            <div className="text-center">
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em]">Powered by Smart Insure Lab OS</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PublicFormView;
