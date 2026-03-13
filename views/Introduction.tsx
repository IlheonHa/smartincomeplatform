
import React from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Target, 
  Zap, 
  Shield, 
  Globe, 
  Cpu, 
  BarChart3, 
  ArrowRight,
  CheckCircle2,
  Rocket,
  Bot,
  Crown,
  Magnet,
  Users,
  TrendingUp,
  Award,
  Layers,
  MousePointer2,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

interface IntroductionProps {
  onNavigate?: (tab: string) => void;
}

const Introduction: React.FC<IntroductionProps> = ({ onNavigate }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const coreModules = [
    {
      icon: Rocket,
      title: "AI 수익형 콘텐츠 생성",
      tabId: "marketing",
      desc: "블로그, 숏폼, SNS 포스팅까지. AI가 당신의 목소리를 학습하여 고효율 수익형 콘텐츠를 무한 생성합니다.",
      tags: ["Blog", "Short-form", "SEO"],
      color: "from-blue-500 to-indigo-600"
    },
    {
      icon: Bot,
      title: "AI 보험설계 솔루션",
      tabId: "ai-hub",
      desc: "복잡한 약관과 설계를 AI가 단 몇 초 만에 분석합니다. 고객에게 가장 최적화된 제안서를 자동으로 완성하세요.",
      tags: ["Analysis", "Proposal", "Automation"],
      color: "from-emerald-500 to-teal-600"
    },
    {
      icon: Crown,
      title: "Golden System",
      tabId: "secret-room",
      desc: "Smart Income만의 독점 자동화 엔진. 황금 키워드 발굴부터 고수익 포스팅 생성까지 시스템이 스스로 작동합니다.",
      tags: ["Secret", "Exclusive", "24/7"],
      color: "from-amber-500 to-orange-600"
    },
    {
      icon: Magnet,
      title: "스마트 가망고객 수집",
      tabId: "lead-collection",
      desc: "고전환 랜딩페이지와 폼을 통해 양질의 DB를 확보합니다. 타겟팅된 고객만이 당신의 CRM으로 유입됩니다.",
      tags: ["Lead Gen", "Landing Page", "DB"],
      color: "from-purple-500 to-pink-600"
    }
  ];

  const benefits = [
    { title: "시간적 자유", desc: "반복적인 업무는 AI에게 맡기고, 당신은 더 중요한 결정에 집중하세요." },
    { title: "무한한 확장성", desc: "혼자서 처리할 수 없던 업무량을 시스템을 통해 수십 배로 키울 수 있습니다." },
    { title: "전문가급 퀄리티", desc: "AI의 방대한 데이터를 기반으로 초보자도 전문가 수준의 성과를 냅니다." },
    { title: "지속 가능한 수익", desc: "일회성 수익이 아닌, 시스템이 만들어내는 안정적인 파이프라인을 구축합니다." }
  ];

  return (
    <div className="space-y-32 pb-32">
      {/* Hero Section: Immersive & Bold */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden rounded-[4rem] bg-[#002D62]">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-1/2 -right-1/4 w-[1000px] h-[1000px] bg-gradient-to-br from-accent/20 to-transparent rounded-full blur-3xl"
          />
          <motion.div 
            animate={{ 
              scale: [1.2, 1, 1.2],
              rotate: [0, -90, 0],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-1/2 -left-1/4 w-[800px] h-[800px] bg-gradient-to-tr from-blue-400/20 to-transparent rounded-full blur-3xl"
          />
        </div>

        <div className="relative z-10 container mx-auto px-8 text-center max-w-5xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-white/5 border border-white/10 mb-12 backdrop-blur-md">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-accent">Smart Income AI Revolution</span>
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-black text-white mb-10 leading-[1.1] tracking-tight">
              노동이 아닌 <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-white">AI 시스템으로</span> <br/>
              수익을 자동화하세요.
            </h1>
            
            <p className="text-xl lg:text-2xl text-blue-100/70 font-medium mb-16 leading-relaxed max-w-3xl mx-auto">
              Smart Income은 단순한 도구가 아닙니다. <br/>
              AI가 당신을 대신해 수익 모델을 발굴하고, 고효율 시스템을 <br/>
              <span className="text-white font-bold">24시간 자동으로 가동하는 AI N잡 플랫폼</span>입니다.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button 
                onClick={() => onNavigate?.('dashboard')}
                className="group relative px-10 py-5 bg-accent text-primary font-black rounded-[2rem] overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-accent/20"
              >
                <span className="relative z-10 flex items-center gap-2 text-lg">
                  시스템 시작하기 <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </button>
            </div>
          </motion.div>
        </div>

        {/* Floating Stats */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-12 text-white/40 font-black text-[10px] tracking-[0.3em] uppercase">
          <div className="flex items-center gap-2"><div className="w-1 h-1 bg-accent rounded-full" /> AI Optimized</div>
          <div className="flex items-center gap-2"><div className="w-1 h-1 bg-accent rounded-full" /> 24/7 Automated</div>
          <div className="flex items-center gap-2"><div className="w-1 h-1 bg-accent rounded-full" /> Scalable Growth</div>
        </div>
      </section>

      {/* Vision Section: Why Smart Income? */}
      <section className="container mx-auto px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <div className="space-y-10">
            <div className="space-y-4">
              <h3 className="text-accent-dark font-black text-sm uppercase tracking-widest">The Vision</h3>
              <h2 className="text-4xl lg:text-5xl font-black text-primary leading-tight tracking-tight">
                왜 모두가 <br/>
                Smart Income에 <br/>
                열광할까요?
              </h2>
            </div>
            <p className="text-lg text-gray-500 font-medium leading-relaxed">
              기존의 N잡은 결국 당신의 '시간'을 '노동'에 쏟는 또 다른 직업이었습니다. <br/>
              Smart Income은 AI 기술을 통해 이 공식을 파괴합니다. <br/>
              우리는 당신이 잠든 시간에도 시스템이 스스로 수익을 만들어내는 자동화 파이프라인을 제공합니다.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center gap-2 text-accent-dark">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-black text-sm">{benefit.title}</span>
                  </div>
                  <p className="text-xs text-gray-400 font-medium leading-relaxed">{benefit.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="aspect-[4/5] rounded-[4rem] overflow-hidden shadow-2xl relative group">
              <img 
                src="https://picsum.photos/seed/future/800/1000" 
                alt="Future Vision" 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent" />
              <div className="absolute top-10 right-10 p-6 bg-white/90 backdrop-blur-md rounded-3xl border border-white/20 shadow-xl animate-bounce-slow">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-primary">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-black text-primary">ROI +340%</span>
                </div>
                <p className="text-[10px] text-gray-400 font-bold">System Efficiency</p>
              </div>
            </div>
            {/* Decorative Grid */}
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-accent/10 rounded-full blur-3xl -z-10" />
          </div>
        </div>
      </section>

      {/* Core Modules: The Engine */}
      <section className="bg-gray-50 rounded-[5rem] py-32 px-8">
        <div className="container mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-24 space-y-6">
            <h2 className="text-4xl lg:text-5xl font-black text-primary tracking-tight">강력한 4대 핵심 모듈</h2>
            <p className="text-lg text-gray-500 font-medium">
              각 분야의 최고 전문가들이 설계한 AI 엔진이 <br/>
              당신의 비즈니스를 24시간 쉬지 않고 가동시킵니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {coreModules.map((module, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -10 }}
                className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-blue-100 transition-all group relative overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${module.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
                
                <div className="flex items-start justify-between mb-10">
                  <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${module.color} flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform`}>
                    <module.icon className="w-10 h-10" />
                  </div>
                  <div className="flex gap-2">
                    {module.tags.map((tag, tIdx) => (
                      <span key={tIdx} className="px-3 py-1 bg-gray-50 text-[9px] font-black text-gray-400 rounded-full uppercase tracking-widest border border-gray-100">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <h3 className="text-2xl font-black text-primary mb-4">{module.title}</h3>
                <p className="text-gray-500 font-medium leading-relaxed mb-8">
                  {module.desc}
                </p>
                
                <button 
                  onClick={() => onNavigate?.(module.tabId)}
                  className="flex items-center gap-2 text-sm font-black text-accent-dark group/btn"
                >
                  자세히 보기 <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Golden System: The Secret Sauce */}
      <section className="container mx-auto px-8 overflow-hidden">
        <div className="bg-[#002D62] rounded-[4rem] p-12 lg:p-24 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 border border-accent/30">
                <Crown className="w-4 h-4 text-accent" />
                <span className="text-[10px] font-black uppercase tracking-widest text-accent">Exclusive Secret Room</span>
              </div>
              <h2 className="text-4xl lg:text-6xl font-black text-white leading-tight tracking-tight">
                오직 VIP에게만 <br/>
                공개되는 <br/>
                <span className="text-accent">Golden System</span>
              </h2>
              <p className="text-xl text-blue-100/70 font-medium leading-relaxed">
                단순한 마케팅을 넘어선 '수익의 공식'을 제공합니다. <br/>
                가망고객이 스스로 찾아오게 만드는 심리 설계와 <br/>
                AI 자동 응대 시스템의 결합을 경험하세요.
              </p>
              <ul className="space-y-4">
                {["심리 타겟팅 콘텐츠 설계", "24시간 무인 상담 챗봇", "고전환 자동화 퍼널", "실시간 수익 트래킹"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-white font-bold">
                    <div className="w-5 h-5 bg-accent rounded-full flex items-center justify-center text-primary">
                      <CheckCircle2 className="w-3 h-3" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="aspect-square bg-white/5 rounded-[3rem] border border-white/10 backdrop-blur-sm p-12 flex flex-col justify-center items-center text-center space-y-8 group">
                <div className="w-32 h-32 bg-accent rounded-full flex items-center justify-center text-primary shadow-[0_0_50px_rgba(242,125,38,0.3)] group-hover:scale-110 transition-transform duration-500">
                  <ShieldCheck className="w-16 h-16" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-2xl font-black text-white">보안 등급: 최고 수준</h4>
                  <p className="text-blue-200/60 font-medium">다이아몬드 등급 이상 파트너 전용 시스템</p>
                </div>
                <div className="w-full h-px bg-white/10" />
                <div className="flex gap-8">
                  <div className="text-center">
                    <p className="text-[10px] font-black text-accent uppercase mb-1">Status</p>
                    <p className="text-white font-bold">Encrypted</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-accent uppercase mb-1">Access</p>
                    <p className="text-white font-bold">Restricted</p>
                  </div>
                </div>
              </div>
              {/* Decorative Glow */}
              <div className="absolute -inset-10 bg-accent/20 blur-[100px] -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap: The Future */}
      <section className="container mx-auto px-8">
        <div className="text-center max-w-3xl mx-auto mb-24 space-y-6">
          <h2 className="text-4xl lg:text-5xl font-black text-primary tracking-tight">우리의 미래</h2>
          <p className="text-lg text-gray-500 font-medium">Smart Income은 멈추지 않습니다. 파트너와 함께 성장하는 미래를 설계합니다.</p>
        </div>

        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 hidden lg:block" />
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 relative z-10">
            {[
              { year: "2024 Q1", title: "AI 엔진 고도화", desc: "생성형 AI 모델의 한국어 최적화 및 수익형 데이터 학습 완료" },
              { year: "2024 Q3", title: "Golden System 출시", desc: "무인 상담 및 자동화 퍼널 시스템의 파트너십 베타 오픈" },
              { year: "2025 Q1", title: "시스템 자동화", desc: "가망고객 수집 자동화 인프라 구축" },
              { year: "2026 Vision", title: "사업대상 확대", desc: "보험영업회 다양한 수익파이프라인인프라 구축" }
            ].map((step, idx) => (
              <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6 relative group">
                <div className="absolute -top-4 left-8 px-4 py-2 bg-primary text-white text-[10px] font-black rounded-full group-hover:bg-accent group-hover:text-primary transition-colors">
                  {step.year}
                </div>
                <div className="pt-4">
                  <h4 className="text-xl font-black text-primary mb-3">{step.title}</h4>
                  <p className="text-sm text-gray-400 font-medium leading-relaxed">{step.desc}</p>
                </div>
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 group-hover:bg-accent/10 group-hover:text-accent transition-all">
                  <Award className="w-6 h-6" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA: Final Call */}
      <section className="container mx-auto px-8">
        <div className="bg-gradient-to-br from-accent to-orange-600 rounded-[4rem] p-12 lg:p-24 text-center space-y-12 relative overflow-hidden group">
          <motion.div 
            animate={{ 
              rotate: [0, 360],
            }}
            transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
            className="absolute -top-1/2 -left-1/4 w-[800px] h-[800px] bg-white/10 rounded-full blur-3xl pointer-events-none"
          />
          
          <div className="relative z-10 space-y-8">
            <h2 className="text-5xl lg:text-7xl font-black text-primary leading-tight tracking-tight">
              당신의 수익 지도를 <br/>
              다시 그리세요.
            </h2>
            <p className="text-xl lg:text-2xl text-primary/70 font-bold max-w-2xl mx-auto leading-relaxed">
              지금 이 순간에도 Smart Income의 시스템은 <br/>
              누군가에게 새로운 기회를 만들어주고 있습니다. <br/>
              <span className="text-white">그 주인공이 당신이 될 차례입니다.</span>
            </p>
            <div className="pt-8">
              <button 
                onClick={() => window.open('https://smartnjob.netlify.app/', '_blank')}
                className="px-16 py-6 bg-primary text-white font-black rounded-[2.5rem] text-xl hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-black/20 flex items-center gap-3 mx-auto group"
              >
                무료 파트너십 상담 신청 <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Micro-info */}
      <footer className="container mx-auto px-8 text-center">
        <div className="pt-20 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <img 
                src="https://blogfiles.pstatic.net/MjAyNjAyMTlfOTkg/MDAxNzcxNDY0NTUwMjE5.jn56Q6DZtJzqmSb1T2D60-xgn9u-bQzu8zHwdzGs4Log.wea8trdiYs3uLwWRPibnOteE87D5kgbZJnr5nYWmgXcg.PNG/SMARTINCOME.png?type=w1" 
                alt="Logo" 
                className="w-6 h-6 object-contain invert"
                referrerPolicy="no-referrer"
              />
            </div>
            <p className="text-xs font-black text-gray-400 tracking-widest uppercase">Smart Income Ecosystem © 2026</p>
          </div>
          <div className="flex gap-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-primary transition-colors">Partner Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Introduction;
