
import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Crown, Sparkles, Zap, Target, BookOpen } from 'lucide-react';
import { User, MembershipGrade, UserRole } from '../types';

interface SecretRoomProps {
  user: User;
}

const SecretRoom: React.FC<SecretRoomProps> = ({ user }) => {
  const isEligible = user.role === UserRole.ADMIN || 
                    (user.grade === MembershipGrade.DIAMOND || user.grade === MembershipGrade.PLATINUM);

  if (!isEligible) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <Lock className="w-12 h-12 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">접근 권한이 없습니다</h2>
        <p className="text-slate-500 max-w-md mb-8">
          Golden System은 <span className="text-amber-600 font-bold">DIAMOND 등급 이상</span> 회원님들만 입장이 가능합니다. 등급 업그레이드 후 상위 1%의 비법을 확인하세요.
        </p>
        <button className="px-8 py-4 bg-[#002D62] text-white rounded-2xl font-bold shadow-lg hover:bg-blue-900 transition-all">
          등급 업그레이드 문의하기
        </button>
      </div>
    );
  }

  const tools = [
    {
      id: 'golden-keyword-writing',
      title: '황금키워드 기반 글쓰기',
      description: '검색량이 많고 경쟁이 적은 황금 키워드를 자동으로 발굴하여 고수익 포스팅을 생성합니다.',
      url: 'https://ais-dev-sjdz3n5o3655tuevoyphpj-21475979035.asia-east1.run.app',
      icon: Sparkles,
      color: 'bg-amber-50 text-amber-600 border-amber-100',
      tag: 'HOT'
    },
    {
      id: 'detailed-writing',
      title: '세부적선택 글작성',
      description: '타겟 고객의 니즈를 정밀하게 분석하여 전환율을 극대화하는 맞춤형 콘텐츠를 제작합니다.',
      url: 'https://ais-dev-crgiqavbprpftktdma62ct-21475979035.asia-east1.run.app',
      icon: Target,
      color: 'bg-blue-50 text-blue-600 border-blue-100',
      tag: 'PREMIUM'
    },
    {
      id: 'expert-writing',
      title: '전문적 글작성',
      description: '보험, 금융 등 전문 지식이 필요한 분야에서 신뢰도 높은 고퀄리티 칼럼을 생성합니다.',
      url: 'https://ais-dev-mozfnfunyiqyxygqhx54wn-21475979035.asia-east1.run.app',
      icon: BookOpen,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      tag: 'EXPERT'
    }
  ];

  const handleToolClick = (tool: any) => {
    if (tool.url) {
      window.open(tool.url, '_blank');
    } else if (tool.id === 'golden-keyword-writing') {
      if ((window as any).setActiveTab) {
        (window as any).setActiveTab('golden-keyword-writing');
      }
    }
  };

  return (
    <div className="space-y-10 pb-20">
      <header className="relative overflow-hidden bg-[#002D62] rounded-[3rem] p-12 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/10 rounded-full -ml-32 -mb-32 blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
              <Crown className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] font-black uppercase tracking-widest">Exclusive Insight Area</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
              Golden System: <br />
              <span className="text-amber-400">상위 1% 전문가</span>의 수익 자동화 비법
            </h1>
            <p className="text-blue-100/80 max-w-xl text-lg font-medium leading-relaxed">
              일반 파트너들에게는 공개되지 않는 고효율 수익화 도구들입니다. <br />
              검증된 알고리즘과 AI 기술로 당신의 수익을 10배 이상 가속화하세요.
            </p>
          </div>
          
          <div className="hidden lg:block">
            <div className="w-48 h-48 bg-gradient-to-br from-amber-400 to-amber-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl rotate-3">
              <Lock className="w-24 h-24 text-white/90" />
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {tools.map((tool, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group relative bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 opacity-5 rounded-full -mr-16 -mt-16 transition-all duration-500 group-hover:scale-150 ${tool.color.split(' ')[0]}`}></div>
            
            <div className="relative z-10 space-y-6">
              <div className="flex justify-between items-start">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border ${tool.color}`}>
                  <tool.icon className="w-8 h-8" />
                </div>
                <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${tool.color}`}>
                  {tool.tag}
                </span>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary transition-colors">{tool.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {tool.description}
                </p>
              </div>
              
              <button 
                onClick={() => handleToolClick(tool)}
                className="flex items-center justify-center w-full py-4 bg-slate-50 text-slate-900 font-bold rounded-2xl group-hover:bg-primary group-hover:text-white transition-all duration-300"
              >
                도구 실행하기
                <Zap className="w-4 h-4 ml-2" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-slate-50 rounded-[3rem] p-12 border border-slate-100">
        <div className="flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-6">
            <h3 className="text-2xl font-bold text-slate-900">Golden System 활용 가이드</h3>
            <div className="space-y-4">
              {[
                '황금 키워드 도구로 매일 3개 이상의 포스팅을 생성하세요.',
                '타겟 고객의 유입 경로에 맞춰 세부적 선택 글작성을 활용하세요.',
                '전문적 글작성으로 권위자(Authority) 이미지를 구축하여 전환율을 높이세요.'
              ].map((text, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-primary font-bold text-xs shadow-sm flex-shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-slate-600 text-sm font-medium">{text}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="w-full md:w-72 aspect-video md:aspect-square bg-slate-200 rounded-[2rem] flex items-center justify-center text-slate-400 font-bold text-sm italic">
            Tutorial Video
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecretRoom;
