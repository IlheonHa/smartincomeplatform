
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { toPng } from 'html-to-image';
import { 
  Calendar as CalendarIcon, 
  Contact2, 
  ShieldAlert, 
  TrendingUp, 
  Activity, 
  Calculator,
  ChevronRight,
  Search,
  Download,
  Printer,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  ShieldCheck,
  MessageCircle,
  Globe,
  Instagram,
  Quote,
  Hash,
  Upload,
  UserCircle2,
  Award,
  Plus,
  Trash2,
  X,
  AlignLeft,
  StickyNote,
  Edit3,
  CheckSquare,
  Square,
  MoreVertical
} from 'lucide-react';
import { analyzeKeyword, analyzeDiseaseCode, getFinancialLawGuide, generateBusinessCardSlogan, generateInsuranceAgeTip, getGeminiKey, getOpenAIKey } from '../services/geminiService';
import { CalendarEvent } from '../types';

const UsefulTools: React.FC<{ 
  currentUser: any, 
  onUpdateUser: (user: any) => void,
  calendarEvents: CalendarEvent[],
  onAddEvent: (event: Partial<CalendarEvent>) => Promise<void>,
  onUpdateEvent: (event: CalendarEvent) => Promise<void>,
  onDeleteEvent: (id: string) => Promise<void>,
  onDeleteEvents: (ids: string[]) => Promise<void>
}> = ({ currentUser, onUpdateUser, calendarEvents, onAddEvent, onUpdateEvent, onDeleteEvent, onDeleteEvents }) => {
  const [activeTool, setActiveTool] = useState('calendar');

  const tools = [
    { id: 'calendar', label: '일정관리', icon: CalendarIcon, color: 'bg-indigo-600' },
    { id: 'business-card', label: '명함제작', icon: Contact2, color: 'bg-emerald-500' },
    { id: 'financial-law', label: '금소법 가이드', icon: ShieldAlert, color: 'bg-amber-500' },
    { id: 'keyword-analysis', label: '키워드 분석', icon: TrendingUp, color: 'bg-indigo-500' },
    { id: 'disease-code', label: '질병코드분석', icon: Activity, color: 'bg-rose-500' },
    { id: 'insurance-age', label: '보험나이계산기', icon: Calculator, color: 'bg-slate-700' },
  ];

  const renderToolContent = () => {
    switch (activeTool) {
      case 'calendar': return (
        <CalendarTool 
          currentUser={currentUser} 
          events={calendarEvents} 
          onAddEvent={onAddEvent}
          onUpdateEvent={onUpdateEvent}
          onDeleteEvent={onDeleteEvent}
          onDeleteEvents={onDeleteEvents}
        />
      );
      case 'business-card': return <BusinessCardTool />;
      case 'financial-law': return <FinancialLawTool />;
      case 'keyword-analysis': return <KeywordAnalysisTool currentUser={currentUser} onUpdateUser={onUpdateUser} />;
      case 'disease-code': return <DiseaseCodeTool currentUser={currentUser} onUpdateUser={onUpdateUser} />;
      case 'insurance-age': return <InsuranceAgeTool />;
      default: return null;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-3">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all duration-300 ${
              activeTool === tool.id 
                ? `${tool.color} text-white shadow-lg scale-105` 
                : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'
            }`}
          >
            <tool.icon className="w-4 h-4" />
            <span className="text-sm">{tool.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden min-h-[600px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTool}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-8 lg:p-12"
          >
            {renderToolContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

// --- Sub-Components for each tool ---

const CalendarTool: React.FC<{ 
  currentUser: any,
  events: CalendarEvent[],
  onAddEvent: (event: Partial<CalendarEvent>) => Promise<void>,
  onUpdateEvent: (event: CalendarEvent) => Promise<void>,
  onDeleteEvent: (id: string) => Promise<void>,
  onDeleteEvents: (ids: string[]) => Promise<void>
}> = ({ currentUser, events, onAddEvent, onUpdateEvent, onDeleteEvent, onDeleteEvents }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    time: '10:00',
    content: '',
    location: '',
    memo: ''
  });

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  const handleDateClick = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateStr = date.toISOString().split('T')[0];
    setSelectedDate(dateStr);
  };

  const handleAddEvent = () => {
    setEditingEvent(null);
    setFormData({
      title: '',
      time: '10:00',
      content: '',
      location: '',
      memo: ''
    });
    setIsModalOpen(true);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setSelectedDate(event.date);
    setFormData({
      title: event.title,
      time: event.time,
      content: event.content,
      location: event.location,
      memo: event.memo
    });
    setIsModalOpen(true);
  };

  const handleSaveEvent = async () => {
    if (!formData.title.trim()) return;

    if (editingEvent) {
      await onUpdateEvent({ ...editingEvent, ...formData, date: selectedDate });
    } else {
      await onAddEvent({
        date: selectedDate,
        ...formData
      });
    }
    setIsModalOpen(false);
  };

  const handleDeleteEvents = async () => {
    if (selectedEventIds.length === 0) return;
    if (!confirm(`${selectedEventIds.length}개의 일정을 삭제하시겠습니까?`)) return;
    await onDeleteEvents(selectedEventIds);
    setSelectedEventIds([]);
  };

  const toggleEventSelection = (id: string) => {
    setSelectedEventIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleAllSelection = () => {
    if (selectedEventIds.length === filteredEvents.length) {
      setSelectedEventIds([]);
    } else {
      setSelectedEventIds(filteredEvents.map(e => e.id));
    }
  };

  const filteredEvents = events
    .filter(e => {
      const eventDate = new Date(e.date);
      return eventDate.getFullYear() === currentDate.getFullYear() && 
             eventDate.getMonth() === currentDate.getMonth();
    })
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  const calendarDays = [];
  const totalDays = daysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const startDay = firstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());

  for (let i = 0; i < startDay; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= totalDays; i++) {
    calendarDays.push(i);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">스마트 일정 관리</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Personal Schedule Management</p>
          </div>
        </div>
        
        <button 
          onClick={handleAddEvent}
          className="px-6 py-3 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          일정 추가
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left: Monthly Calendar */}
        <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-900">
              {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
            </h3>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  const today = new Date();
                  setCurrentDate(today);
                  setSelectedDate(today.toISOString().split('T')[0]);
                }}
                className="px-4 py-2 text-[10px] font-black text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-all border border-indigo-100 uppercase tracking-widest"
              >
                Today
              </button>
              <button onClick={prevMonth} className="p-2 hover:bg-slate-50 rounded-xl transition-all border border-slate-100">
                <ChevronRight className="w-4 h-4 rotate-180" />
              </button>
              <button onClick={nextMonth} className="p-2 hover:bg-slate-50 rounded-xl transition-all border border-slate-100">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-2">
            {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
              <div key={i} className={`text-center text-[10px] font-black uppercase tracking-widest py-2 ${i === 0 ? 'text-rose-500' : i === 6 ? 'text-blue-500' : 'text-slate-400'}`}>
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, i) => {
              if (day === null) return <div key={i} className="aspect-square"></div>;
              
              const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
              const dateStr = date.toISOString().split('T')[0];
              const isSelected = selectedDate === dateStr;
              const hasEvents = events.some(e => e.date === dateStr);
              const isToday = new Date().toISOString().split('T')[0] === dateStr;

              return (
                <button
                  key={i}
                  onClick={() => handleDateClick(day)}
                  className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all group ${
                    isSelected 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className={`text-sm font-bold ${isToday && !isSelected ? 'text-indigo-600' : ''}`}>
                    {day}
                  </span>
                  {hasEvents && (
                    <div className={`w-1 h-1 rounded-full mt-1 ${isSelected ? 'bg-white' : 'bg-indigo-400'}`}></div>
                  )}
                  {isToday && !isSelected && (
                    <div className="absolute top-1 right-1 w-1 h-1 rounded-full bg-indigo-600"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Monthly Event List */}
        <div className="w-full lg:w-[450px] bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h4 className="text-lg font-black text-slate-900">
                {currentDate.getMonth() + 1}월 일정 목록
              </h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monthly Event List</p>
            </div>
            <div className="flex gap-2">
              {selectedEventIds.length > 0 && (
                <button 
                  onClick={handleDeleteEvents}
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all border border-rose-100"
                  title="선택 삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button 
                onClick={toggleAllSelection}
                className={`p-2 rounded-xl border transition-all ${selectedEventIds.length === filteredEvents.length && filteredEvents.length > 0 ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'}`}
                title="전체 선택"
              >
                <CheckSquare className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
            {filteredEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 rounded-[2rem] flex items-center justify-center">
                  <CalendarIcon className="w-8 h-8 text-slate-200" />
                </div>
                <p className="text-sm font-bold text-slate-400">이번 달 등록된 일정이 없습니다.</p>
              </div>
            ) : (
              filteredEvents.map((event) => (
                <div key={event.id} className={`group flex items-start gap-4 p-4 rounded-2xl border transition-all ${selectedEventIds.includes(event.id) ? 'bg-indigo-50/30 border-indigo-100' : 'bg-slate-50 border-slate-50 hover:border-slate-200'}`}>
                  <button 
                    onClick={() => toggleEventSelection(event.id)}
                    className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all shrink-0 mt-1 ${
                      selectedEventIds.includes(event.id) 
                        ? 'bg-indigo-600 border-indigo-600 text-white' 
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    {selectedEventIds.includes(event.id) && <CheckCircle2 className="w-3 h-3" />}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{event.date.split('-')[2]}일 {event.time}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEditEvent(event)} className="p-1 text-slate-400 hover:text-indigo-600 transition-colors">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => onDeleteEvent(event.id)} className="p-1 text-slate-400 hover:text-rose-600 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <h5 className="text-sm font-black text-slate-900 mb-1 truncate">{event.title}</h5>
                    {event.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-slate-300" />
                        <span className="text-[10px] font-bold text-slate-400 truncate">{event.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Event Form Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <h4 className="text-xl font-black text-slate-900">
                  {editingEvent ? '일정 수정' : '새 일정 추가'}
                </h4>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-all">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">날짜</label>
                    <input 
                      type="date" 
                      value={selectedDate} 
                      onChange={e => setSelectedDate(e.target.value)}
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all text-sm font-bold" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">시간</label>
                    <input 
                      type="time" 
                      value={formData.time} 
                      onChange={e => setFormData({...formData, time: e.target.value})}
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all text-sm font-bold" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">제목</label>
                  <input 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    placeholder="일정 제목을 입력하세요"
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all text-sm font-bold" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">장소</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input 
                      value={formData.location} 
                      onChange={e => setFormData({...formData, location: e.target.value})}
                      placeholder="장소를 입력하세요"
                      className="w-full p-4 pl-12 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all text-sm font-bold" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">내용</label>
                  <textarea 
                    value={formData.content} 
                    onChange={e => setFormData({...formData, content: e.target.value})}
                    placeholder="상세 내용을 입력하세요"
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all text-sm font-bold h-24 resize-none" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">메모</label>
                  <textarea 
                    value={formData.memo} 
                    onChange={e => setFormData({...formData, memo: e.target.value})}
                    placeholder="추가 메모를 입력하세요"
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all text-sm font-bold h-20 resize-none" 
                  />
                </div>
              </div>

              <div className="p-8 bg-slate-50 flex gap-4">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 bg-white text-slate-500 font-bold rounded-2xl border border-slate-200 hover:bg-slate-100 transition-all"
                >
                  취소
                </button>
                <button 
                  onClick={handleSaveEvent}
                  className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all"
                >
                  {editingEvent ? '수정 완료' : '일정 저장'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const BusinessCardTool: React.FC = () => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState('홍길동');
  const [title, setTitle] = useState('수석 보험 컨설턴트');
  const [phone, setPhone] = useState('010-1234-5678');
  const [email, setEmail] = useState('hong@smartincome.com');
  const [company, setCompany] = useState('스마트인컴 보험연구소');
  const [address, setAddress] = useState('서울특별시 강남구 테헤란로 123');
  const [regNo, setRegNo] = useState('2024-03-00001');
  const [kakao, setKakao] = useState('smart_hong');
  const [blog, setBlog] = useState('blog.naver.com/smart_hong');
  const [insta, setInsta] = useState('@smart_hong');
  const [intro, setIntro] = useState('고객의 미래를 함께 설계하는 든든한 파트너입니다.');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [aiSlogans, setAiSlogans] = useState<string[]>([]);
  const [isGeneratingSlogan, setIsGeneratingSlogan] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveImage = async () => {
    if (!cardRef.current) return;
    
    setIsSaving(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      });
      const link = document.createElement('a');
      link.download = `business-card-${name}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('명함 이미지 저장 실패:', err);
      alert('이미지 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateSlogan = async () => {
    const gemini = getGeminiKey();
    const openai = getOpenAIKey();
    if (!gemini && !openai) {
      alert("API 키가 설정되지 않았습니다. [설정] 메뉴의 'AI 엔진 API 연동 설정'에서 Gemini 또는 OpenAI 키를 입력해주세요.");
      return;
    }

    setIsGeneratingSlogan(true);
    try {
      const result = await generateBusinessCardSlogan(name, title, intro);
      if (result.slogans) setAiSlogans(result.slogans);
    } catch (e) {
      alert('슬로건 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingSlogan(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col xl:flex-row gap-12">
        <div className="flex-1 space-y-8">
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <Contact2 className="w-6 h-6 text-emerald-500" />
              프리미엄 디지털 명함
            </h3>
            <p className="text-slate-500 text-sm font-medium">입력하신 정보에 따라 최적의 레이아웃으로 명함이 자동 구성됩니다.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">이름</label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">직함</label>
              <input value={title} onChange={e => setTitle(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">연락처</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">이메일</label>
              <input value={email} onChange={e => setEmail(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">소속</label>
              <input value={company} onChange={e => setCompany(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">등록번호</label>
              <input value={regNo} onChange={e => setRegNo(e.target.value)} placeholder="보험설계사 등록번호" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all" />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">프로필 사진</label>
              <div className="flex items-center gap-4">
                <label className="flex-1 flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50 transition-all cursor-pointer group">
                  <Upload className="w-6 h-6 text-slate-300 group-hover:text-emerald-500 mb-2" />
                  <span className="text-xs font-bold text-slate-400 group-hover:text-emerald-600">사진 업로드 (JPG, PNG)</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
                {profileImage && (
                  <button onClick={() => setProfileImage(null)} className="px-4 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50 rounded-xl transition-all">삭제</button>
                )}
              </div>
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">주소</label>
              <input value={address} onChange={e => setAddress(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">카카오톡 ID</label>
              <input value={kakao} onChange={e => setKakao(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">인스타그램</label>
              <input value={insta} onChange={e => setInsta(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all" />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">블로그/홈페이지 링크</label>
              <input value={blog} onChange={e => setBlog(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all" />
            </div>
            <div className="md:col-span-2 space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">자기소개</label>
                <button 
                  onClick={handleGenerateSlogan}
                  disabled={isGeneratingSlogan}
                  className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg hover:bg-indigo-100 transition-all flex items-center gap-1"
                >
                  {isGeneratingSlogan ? <Clock className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  AI 슬로건 추천
                </button>
              </div>
              <textarea value={intro} onChange={e => setIntro(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all h-24 resize-none" />
              
              {aiSlogans.length > 0 && (
                <div className="mt-4 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 space-y-2 animate-fade-in">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">AI 추천 슬로건 (클릭하여 적용)</p>
                  <div className="flex flex-wrap gap-2">
                    {aiSlogans.map((s, i) => (
                      <button 
                        key={i} 
                        onClick={() => setIntro(s)}
                        className="text-xs font-bold text-indigo-700 bg-white px-3 py-2 rounded-xl border border-indigo-100 hover:border-indigo-300 transition-all text-left"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={handleSaveImage}
            disabled={isSaving}
            className="w-full py-5 bg-emerald-500 text-white font-black text-lg rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50"
          >
            {isSaving ? <Clock className="w-6 h-6 animate-spin" /> : <Download className="w-6 h-6" />}
            {isSaving ? '이미지 생성 중...' : '명함 이미지 저장하기'}
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center bg-slate-50 rounded-[3rem] p-8 lg:p-12 border border-slate-100 min-h-[600px]">
          <div ref={cardRef} className="w-full max-w-md bg-white rounded-[2rem] shadow-[0_40px_80px_-12px_rgba(0,0,0,0.18)] flex flex-col relative overflow-hidden group border border-slate-100">
            {/* Design Accents - More sophisticated gradients */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full -mr-32 -mt-32 transition-all duration-1000 group-hover:scale-110"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-slate-900/5 to-transparent rounded-full -ml-24 -mb-24 transition-all duration-1000 group-hover:scale-110"></div>
            
            <div className="p-10 space-y-10 relative z-10">
              {/* Header Section */}
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-2 flex-1">
                  <h4 className="text-4xl font-black text-slate-900 tracking-tight leading-none">{name}</h4>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-3 bg-emerald-500 rounded-full"></div>
                    <p className="text-emerald-600 text-xs font-black uppercase tracking-[0.25em]">{title}</p>
                  </div>
                </div>
                
                {/* Sophisticated Icon or Profile Image */}
                <div className="relative shrink-0">
                  <div className="w-32 h-32 rounded-[2rem] bg-slate-900 overflow-hidden shadow-2xl ring-4 ring-white transition-transform duration-500 group-hover:rotate-3">
                    {profileImage ? (
                      <img src={profileImage} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950">
                        <Award className="w-16 h-16 text-emerald-400" />
                      </div>
                    )}
                  </div>
                  {!profileImage && (
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              </div>

              {/* Intro Section */}
              {intro && (
                <div className="relative py-5 px-7 bg-slate-50/80 backdrop-blur-sm rounded-3xl border border-slate-100 shadow-inner">
                  <Quote className="absolute -top-3 -left-1 w-6 h-6 text-emerald-500/20" />
                  <p className="text-sm text-slate-600 font-bold leading-relaxed italic">{intro}</p>
                </div>
              )}

              {/* Contact Info Grid - More refined spacing and icons */}
              <div className="grid grid-cols-1 gap-5">
                <div className="flex items-center gap-5 group/item">
                  <div className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-slate-50 flex items-center justify-center text-slate-400 group-hover/item:bg-emerald-500 group-hover/item:text-white transition-all duration-300">
                    <Phone className="w-4 h-4" />
                  </div>
                  <span className="text-base font-black text-slate-800">{phone}</span>
                </div>
                
                {email && (
                  <div className="flex items-center gap-5 group/item">
                    <div className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-slate-50 flex items-center justify-center text-slate-400 group-hover/item:bg-emerald-500 group-hover/item:text-white transition-all duration-300">
                      <Mail className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-slate-600">{email}</span>
                  </div>
                )}

                {(company || regNo) && (
                  <div className="flex items-center gap-5 group/item">
                    <div className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-slate-50 flex items-center justify-center text-slate-400 group-hover/item:bg-emerald-500 group-hover/item:text-white transition-all duration-300">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-700">{company}</span>
                      {regNo && <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Reg No. {regNo}</span>}
                    </div>
                  </div>
                )}

                {address && (
                  <div className="flex items-center gap-5 group/item">
                    <div className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-slate-50 flex items-center justify-center text-slate-400 group-hover/item:bg-emerald-500 group-hover/item:text-white transition-all duration-300">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-slate-600">{address}</span>
                  </div>
                )}
              </div>

              {/* Social Links - More premium look */}
              {(kakao || blog || insta) && (
                <div className="pt-8 border-t border-slate-100 flex flex-wrap gap-3">
                  {kakao && (
                    <div className="flex items-center gap-2.5 px-4 py-2 bg-yellow-400/10 text-yellow-700 rounded-xl text-xs font-black border border-yellow-400/20">
                      <MessageCircle className="w-3.5 h-3.5" /> {kakao}
                    </div>
                  )}
                  {insta && (
                    <div className="flex items-center gap-2.5 px-4 py-2 bg-pink-500/10 text-pink-700 rounded-xl text-xs font-black border border-pink-500/20">
                      <Instagram className="w-3.5 h-3.5" /> {insta}
                    </div>
                  )}
                  {blog && (
                    <div className="flex items-center gap-2.5 px-4 py-2 bg-blue-500/10 text-blue-700 rounded-xl text-xs font-black border border-blue-500/20">
                      <Globe className="w-3.5 h-3.5" /> {blog.length > 25 ? 'Official Blog' : blog}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer - Simplified and more modern */}
            <div className="mt-auto bg-slate-950 p-8 flex justify-center items-center">
              <div className="flex items-center gap-3 opacity-40">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FinancialLawTool: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!query.trim()) return;
    
    const gemini = getGeminiKey();
    const openai = getOpenAIKey();
    if (!gemini && !openai) {
      alert("API 키가 설정되지 않았습니다. [설정] 메뉴의 'AI 엔진 API 연동 설정'에서 Gemini 또는 OpenAI 키를 입력해주세요.");
      return;
    }

    setIsAnalyzing(true);
    try {
      const data = await getFinancialLawGuide(query);
      setResult(data);
    } catch (e) {
      alert('분석 중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="space-y-1">
        <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 text-amber-500" />
          금소법 AI 가이드
        </h3>
        <p className="text-slate-500 text-sm font-medium">금융소비자보호법 준수를 위한 AI 법률 자문 서비스입니다.</p>
      </div>

      <div className="flex gap-4">
        <input 
          value={query} 
          onChange={e => setQuery(e.target.value)}
          placeholder="궁금한 금소법 관련 내용을 입력하세요 (예: 블로그 광고 시 필수 포함 문구)"
          className="flex-1 p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-amber-500/5 transition-all text-sm"
        />
        <button 
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="px-8 py-4 bg-amber-500 text-white font-bold rounded-2xl shadow-lg shadow-amber-500/20 flex items-center gap-2 disabled:opacity-50"
        >
          {isAnalyzing ? <Clock className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          분석하기
        </button>
      </div>

      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <div className="bg-amber-50 border border-amber-100 rounded-3xl p-8 space-y-4">
            <h4 className="font-bold text-amber-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> 법적 요약
            </h4>
            <p className="text-amber-800 text-sm leading-relaxed font-medium">{result.summary}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-100 rounded-3xl p-8 space-y-4 shadow-sm">
              <h4 className="font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" /> 핵심 준수 원칙
              </h4>
              <ul className="space-y-3">
                {result.keyRules?.map((rule: string, i: number) => (
                  <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-1.5 flex-shrink-0"></span>
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white border border-slate-100 rounded-3xl p-8 space-y-4 shadow-sm">
              <h4 className="font-bold text-slate-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-500" /> 금지 행위
              </h4>
              <ul className="space-y-3">
                {result.prohibitedActions?.map((action: string, i: number) => (
                  <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-rose-400 rounded-full mt-1.5 flex-shrink-0"></span>
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-slate-900 text-white rounded-3xl p-8 space-y-4">
            <h4 className="font-bold flex items-center gap-2 text-amber-400">
              <Sparkles className="w-5 h-5" /> 전문가 권장 가이드
            </h4>
            <p className="text-slate-300 text-sm leading-relaxed">{result.bestPractice}</p>
            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Penalty Info</span>
              <span className="text-xs font-bold text-rose-400">{result.penalty}</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

const KeywordAnalysisTool: React.FC<{ currentUser: any, onUpdateUser: (user: any) => void }> = ({ currentUser, onUpdateUser }) => {
  const [keyword, setKeyword] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!keyword.trim()) return;
    
    const gemini = getGeminiKey();
    const openai = getOpenAIKey();
    if (!gemini && !openai) {
      alert("API 키가 설정되지 않았습니다. [설정] 메뉴의 'AI 엔진 API 연동 설정'에서 Gemini 또는 OpenAI 키를 입력해주세요.");
      return;
    }

    setIsAnalyzing(true);
    try {
      const data = await analyzeKeyword(keyword);
      setResult(data);
      
      // Increment Golden System count
      if (currentUser) {
        onUpdateUser({
          ...currentUser,
          goldenSystemCount: (currentUser.goldenSystemCount || 0) + 1
        });
      }
    } catch (e) {
      alert('분석 중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="space-y-1">
        <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-indigo-500" />
          AI 키워드 심층 분석
        </h3>
        <p className="text-slate-500 text-sm font-medium">타겟 키워드의 경쟁력과 트렌드를 AI로 정밀 분석합니다.</p>
      </div>

      <div className="flex gap-4">
        <input 
          value={keyword} 
          onChange={e => setKeyword(e.target.value)}
          placeholder="분석할 키워드를 입력하세요 (예: 4세대 실손보험 전환)"
          className="flex-1 p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all text-sm"
        />
        <button 
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="px-8 py-4 bg-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/20 flex items-center gap-2 disabled:opacity-50"
        >
          {isAnalyzing ? <Clock className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          분석하기
        </button>
      </div>

      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-100 rounded-3xl p-8 space-y-4 shadow-sm">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">검색량 및 경쟁도</h4>
                <div className="flex items-end gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-500">검색량</p>
                    <p className="text-2xl font-black text-indigo-600">{result.searchVolume}</p>
                  </div>
                  <div className="w-px h-8 bg-slate-100 mb-1"></div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-500">경쟁도</p>
                    <p className="text-2xl font-black text-slate-900">{result.competition}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white border border-slate-100 rounded-3xl p-8 space-y-4 shadow-sm">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">최근 트렌드</h4>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">{result.trend}</p>
              </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-8 space-y-4">
              <h4 className="font-bold text-indigo-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5" /> 추천 마케팅 전략
              </h4>
              <p className="text-indigo-800 text-sm leading-relaxed font-medium">{result.marketingStrategy}</p>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl p-8 space-y-6 shadow-sm">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-50 pb-4">
              <TrendingUp className="w-5 h-5 text-indigo-500" /> 연관 키워드
            </h4>
            <div className="flex flex-wrap gap-2">
              {result.relatedKeywords?.map((kw: string, i: number) => (
                <span key={i} className="px-4 py-2 bg-slate-50 text-slate-600 text-xs font-bold rounded-xl border border-slate-100 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all cursor-pointer">
                  #{kw}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

const DiseaseCodeTool: React.FC<{ currentUser: any, onUpdateUser: (user: any) => void }> = ({ currentUser, onUpdateUser }) => {
  const [code, setCode] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!code.trim()) return;
    
    const gemini = getGeminiKey();
    const openai = getOpenAIKey();
    if (!gemini && !openai) {
      alert("API 키가 설정되지 않았습니다. [설정] 메뉴의 'AI 엔진 API 연동 설정'에서 Gemini 또는 OpenAI 키를 입력해주세요.");
      return;
    }

    setIsAnalyzing(true);
    try {
      const data = await analyzeDiseaseCode(code);
      setResult(data);
      
      // Increment Insurance Design count
      if (currentUser) {
        onUpdateUser({
          ...currentUser,
          insuranceDesignCount: (currentUser.insuranceDesignCount || 0) + 1
        });
      }
    } catch (e) {
      alert('분석 중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="space-y-1">
        <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
          <Activity className="w-6 h-6 text-rose-500" />
          질병코드(KCD) 정밀 분석
        </h3>
        <p className="text-slate-500 text-sm font-medium">질병코드에 따른 보장 분석 및 보험 심사 포인트를 안내합니다.</p>
      </div>

      <div className="flex gap-4">
        <input 
          value={code} 
          onChange={e => setCode(e.target.value)}
          placeholder="질병코드를 입력하세요 (예: I20, C18)"
          className="flex-1 p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-rose-500/5 transition-all text-sm"
        />
        <button 
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="px-8 py-4 bg-rose-500 text-white font-bold rounded-2xl shadow-lg shadow-rose-500/20 flex items-center gap-2 disabled:opacity-50"
        >
          {isAnalyzing ? <Clock className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          분석하기
        </button>
      </div>

      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <div className="bg-white border border-slate-100 rounded-3xl p-10 flex flex-col md:flex-row gap-10 shadow-sm">
            <div className="flex-1 space-y-6">
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">질병명</h4>
                <p className="text-3xl font-black text-slate-900 tracking-tight">{result.diseaseName}</p>
              </div>
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">정의</h4>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">{result.definition}</p>
              </div>
            </div>
            <div className="w-full md:w-px bg-slate-100"></div>
            <div className="flex-1 space-y-6">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">주요 증상</h4>
              <div className="flex flex-wrap gap-2">
                {result.symptoms?.map((s: string, i: number) => (
                  <span key={i} className="px-4 py-2 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl border border-rose-100">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-rose-900 text-white rounded-3xl p-10 space-y-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            <h4 className="text-xl font-bold flex items-center gap-3 text-rose-300 relative z-10">
              <ShieldCheck className="w-6 h-6" /> 보험 심사 및 보장 포인트
            </h4>
            <p className="text-rose-50 text-base leading-relaxed font-medium relative z-10">{result.insuranceImplication}</p>
            <div className="pt-6 border-t border-white/10 flex flex-wrap gap-3 relative z-10">
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mr-4 self-center">Related Codes:</span>
              {result.relatedCodes?.map((rc: string, i: number) => (
                <span key={i} className="px-3 py-1.5 bg-white/10 rounded-lg text-xs font-bold border border-white/10">
                  {rc}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

const InsuranceAgeTool: React.FC = () => {
  const [birthDate, setBirthDate] = useState('');
  const [insuranceAge, setInsuranceAge] = useState<number | null>(null);
  const [nextAgeDate, setNextAgeDate] = useState<string | null>(null);
  const [aiTip, setAiTip] = useState<string | null>(null);
  const [isGeneratingTip, setIsGeneratingTip] = useState(false);

  const calculateAge = async () => {
    if (!birthDate) return;
    
    const birth = new Date(birthDate);
    const today = new Date();
    
    const diffTime = Math.abs(today.getTime() - birth.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = diffDays / 30.44;
    
    const years = Math.floor(diffMonths / 12);
    const remainingMonths = diffMonths % 12;
    
    const age = remainingMonths >= 6 ? years + 1 : years;
    setInsuranceAge(age);

    const nextDate = new Date(birth);
    nextDate.setFullYear(today.getFullYear());
    nextDate.setMonth(birth.getMonth() + 6);
    
    if (nextDate < today) {
      nextDate.setFullYear(today.getFullYear() + 1);
    }
    
    setNextAgeDate(nextDate.toLocaleDateString());

    // Generate AI Tip
    const gemini = getGeminiKey();
    const openai = getOpenAIKey();
    if (!gemini && !openai) {
      // Don't alert here as the primary function (age calculation) is done
      console.warn("AI keys missing, skipping tip generation");
      return;
    }

    setIsGeneratingTip(true);
    try {
      const result = await generateInsuranceAgeTip(age, birthDate);
      setAiTip(result.tip);
    } catch (e) {
      console.error('AI Tip generation failed:', e);
    } finally {
      setIsGeneratingTip(false);
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col lg:flex-row gap-12">
        <div className="flex-1 space-y-8">
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <Calculator className="w-6 h-6 text-slate-700" />
              보험나이 계산기
            </h3>
            <p className="text-slate-500 text-sm font-medium">보험 가입의 기준이 되는 보험나이와 상령일을 계산합니다.</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">생년월일</label>
              <input 
                type="date" 
                value={birthDate} 
                onChange={e => setBirthDate(e.target.value)}
                className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-slate-700/5 transition-all text-lg font-bold" 
              />
            </div>
            <button 
              onClick={calculateAge}
              className="w-full py-5 bg-slate-900 text-white font-black text-lg rounded-2xl shadow-xl shadow-slate-900/20 active:scale-95 transition-all"
            >
              보험나이 계산하기
            </button>
          </div>
        </div>

        <div className="flex-1 bg-slate-50 rounded-[3rem] p-10 border border-slate-100 flex flex-col justify-center items-center text-center space-y-8">
          {insuranceAge !== null ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8 w-full">
              <div className="space-y-2">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">현재 보험나이</p>
                <div className="text-7xl font-black text-slate-900 tracking-tighter">
                  {insuranceAge}<span className="text-3xl text-slate-400 ml-1">세</span>
                </div>
              </div>
              
              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400 font-bold">다음 상령일</span>
                  <span className="text-rose-500 font-black">{nextAgeDate}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-rose-400 h-full w-[65%]"></div>
                </div>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  상령일이 지나면 보험료가 인상될 수 있으므로,<br />
                  <span className="text-rose-500 font-bold">그 이전에 청약</span>을 완료하는 것이 유리합니다.
                </p>
              </div>

              {isGeneratingTip ? (
                <div className="w-full p-6 bg-slate-100 rounded-3xl animate-pulse flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4 text-slate-300 animate-spin" />
                  <span className="text-xs font-bold text-slate-400">AI 맞춤 팁 분석 중...</span>
                </div>
              ) : aiTip && (
                <div className="w-full p-6 bg-indigo-600 text-white rounded-3xl shadow-xl shadow-indigo-200 text-left space-y-2 relative overflow-hidden">
                  <Sparkles className="absolute top-2 right-2 w-12 h-12 text-white/10" />
                  <h5 className="text-[10px] font-black text-indigo-200 uppercase tracking-widest flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> AI 맞춤 보험 팁
                  </h5>
                  <p className="text-xs font-bold leading-relaxed relative z-10">{aiTip}</p>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="space-y-4">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                <Calculator className="w-10 h-10 text-slate-200" />
              </div>
              <p className="text-slate-400 font-bold text-sm">생년월일을 입력하시면<br />보험나이가 계산됩니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsefulTools;
