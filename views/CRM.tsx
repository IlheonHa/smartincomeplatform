
import React, { useState, useMemo, useRef } from 'react';
import { Lead, LeadStatus, User, UserRole } from '../types';
import * as XLSX from 'xlsx';
import { 
  Search, 
  Plus, 
  Filter, 
  LayoutGrid, 
  List as ListIcon, 
  MoreVertical, 
  Phone, 
  Mail, 
  Calendar, 
  Clock, 
  AlertCircle,
  ChevronRight,
  User as UserIcon,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  X,
  Download,
  Upload,
  Trash2,
  CheckSquare,
  Square,
  ArrowUpRight,
  Users,
  Target,
  Briefcase,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CRMProps {
  leads: Lead[];
  currentUser: User | null;
  onAddLead: (lead: Partial<Lead>) => void;
  onAddLeads: (leads: Partial<Lead>[]) => void;
  onUpdateLead: (lead: Lead) => void;
  onDeleteLead: (id: string) => void;
  onDeleteLeads: (ids: string[]) => void;
}

const CRM: React.FC<CRMProps> = ({ leads, currentUser, onAddLead, onAddLeads, onUpdateLead, onDeleteLead, onDeleteLeads }) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [deleteConfirmType, setDeleteConfirmType] = useState<'single' | 'bulk' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newLead, setNewLead] = useState<Partial<Lead>>({
    name: '',
    phone: '',
    email: '',
    status: LeadStatus.NEW,
    priority: 'MEDIUM',
    source: '직접 입력',
    notes: '',
    estimatedValue: 0
  });

  // Filter leads based on user role and search/filters
  const filteredLeads = useMemo(() => {
    let result = leads;
    
    // If not admin, only show leads belonging to current user
    if (currentUser?.role !== UserRole.ADMIN) {
      result = result.filter(l => l.userId === currentUser?.id);
    }

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(l => 
        l.name.toLowerCase().includes(lowerSearch) || 
        l.phone.includes(searchTerm) ||
        l.email?.toLowerCase().includes(lowerSearch)
      );
    }

    if (statusFilter !== 'ALL') {
      result = result.filter(l => l.status === statusFilter);
    }

    if (priorityFilter !== 'ALL') {
      result = result.filter(l => l.priority === priorityFilter);
    }

    return result;
  }, [leads, currentUser, searchTerm, statusFilter, priorityFilter]);

  const columns = [
    { id: LeadStatus.NEW, label: '신규 유입', color: 'bg-blue-500', border: 'border-blue-200', bg: 'bg-blue-50/50', icon: Zap },
    { id: LeadStatus.CONTACTED, label: '최초 상담', color: 'bg-primary', border: 'border-primary/20', bg: 'bg-primary/5', icon: Phone },
    { id: LeadStatus.ANALYSIS, label: '보장 분석', color: 'bg-amber-500', border: 'border-amber-200', bg: 'bg-amber-50/50', icon: Target },
    { id: LeadStatus.PROPOSAL, label: '제안 발송', color: 'bg-purple-500', border: 'border-purple-200', bg: 'bg-purple-50/50', icon: Mail },
    { id: LeadStatus.CONTRACTED, label: '계약 완료', color: 'bg-accent', border: 'border-accent/20', bg: 'bg-accent/5', icon: ShieldCheck },
  ];

  const stats = useMemo(() => {
    const total = filteredLeads.length;
    const contracted = filteredLeads.filter(l => l.status === LeadStatus.CONTRACTED).length;
    const conversionRate = total > 0 ? ((contracted / total) * 100).toFixed(1) : '0.0';
    const totalValue = filteredLeads.reduce((acc, curr) => acc + (curr.estimatedValue || 0), 0);
    
    return [
      { label: '전체 고객', value: total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+12%' },
      { label: '계약 완료', value: contracted, icon: ShieldCheck, color: 'text-accent', bg: 'bg-accent/10', trend: '+5%' },
      { label: '전환율', value: `${conversionRate}%`, icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/5', trend: '+2.4%' },
      { label: '예상 가치', value: `₩${(totalValue / 10000).toFixed(0)}만`, icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50', trend: '+₩240만' },
    ];
  }, [filteredLeads]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddLead(newLead);
    setIsAddModalOpen(false);
    setNewLead({
      name: '',
      phone: '',
      email: '',
      status: LeadStatus.NEW,
      priority: 'MEDIUM',
      source: '직접 입력',
      notes: '',
      estimatedValue: 0
    });
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLead) {
      onUpdateLead(selectedLead);
      setIsEditMode(false);
      alert('고객 정보가 성공적으로 업데이트되었습니다.');
    }
  };

  const handleDeleteLead = (id: string) => {
    if (!id) return;
    setDeleteConfirmType('single');
  };

  const handleBulkDelete = () => {
    if (selectedLeadIds.length === 0) return;
    setDeleteConfirmType('bulk');
  };

  const confirmDelete = () => {
    if (deleteConfirmType === 'single' && selectedLead) {
      onDeleteLead(selectedLead.id);
      setSelectedLead(null);
    } else if (deleteConfirmType === 'bulk') {
      onDeleteLeads(selectedLeadIds);
      setSelectedLeadIds([]);
    }
    setDeleteConfirmType(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'text-red-600 bg-red-100';
      case 'MEDIUM': return 'text-amber-600 bg-amber-100';
      case 'LOW': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleExportExcel = () => {
    const exportData = filteredLeads.map(l => ({
      '고객명': l.name,
      '연락처': l.phone,
      '이메일': l.email || '',
      '진행상태': columns.find(c => c.id === l.status)?.label || l.status,
      '우선순위': l.priority,
      '유입경로': l.source,
      '등록일': l.createdAt,
      '최근상담일': l.lastContactDate || '',
      '팔로업예정일': l.nextFollowUpDate || '',
      '예상가치': l.estimatedValue || 0,
      '메모': l.notes || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');
    XLSX.writeFile(workbook, `CRM_Leads_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws) as any[];

      const importedLeads: Partial<Lead>[] = data.map(item => {
        // Find status by label if possible
        const statusLabel = item['진행상태'];
        let status = LeadStatus.NEW;
        const foundCol = columns.find(c => c.label === statusLabel);
        if (foundCol) status = foundCol.id;

        return {
          name: item['고객명'] || '무명 고객',
          phone: item['연락처'] || '010-0000-0000',
          email: item['이메일'],
          status: status,
          priority: (item['우선순위'] as any) || 'MEDIUM',
          source: item['유입경로'] || '엑셀 업로드',
          notes: item['메모'],
          estimatedValue: parseInt(item['예상가치']) || 0,
          nextFollowUpDate: item['팔로업예정일']
        };
      });

      if (importedLeads.length > 0) {
        onAddLeads(importedLeads);
        alert(`${importedLeads.length}명의 고객이 성공적으로 업로드되었습니다.`);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  const toggleLeadSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedLeadIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedLeadIds.length === filteredLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(filteredLeads.map(l => l.id));
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* CRM Header Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="neo-card p-8 border-none relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
              <ArrowUpRight className="w-5 h-5 text-slate-300" />
            </div>
            <div className="flex items-center gap-6">
              <div className={`w-16 h-16 rounded-[1.5rem] ${stat.bg} flex items-center justify-center shadow-inner`}>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{stat.label}</p>
                  <span className="text-[10px] font-bold text-accent px-2 py-0.5 bg-accent/10 rounded-full">{stat.trend}</span>
                </div>
                <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{stat.value}</h3>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Control Bar */}
      <div className="neo-card p-6 border-none flex flex-col xl:flex-row gap-6 items-center justify-between bg-white/60 backdrop-blur-xl">
        <div className="flex flex-1 items-center gap-6 w-full">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
            <input 
              type="text" 
              placeholder="고객명, 연락처, 이메일로 검색..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-16 pr-8 py-5 bg-slate-50 border-none rounded-[2rem] text-sm focus:ring-8 focus:ring-primary/5 outline-none transition-all font-semibold text-slate-700 shadow-inner"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
              <Filter className="w-4 h-4 text-slate-400" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs font-black bg-transparent border-none outline-none cursor-pointer text-slate-600 uppercase tracking-widest"
              >
                <option value="ALL">전체 상태</option>
                {Object.values(LeadStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
              <TrendingUp className="w-4 h-4 text-slate-400" />
              <select 
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="text-xs font-black bg-transparent border-none outline-none cursor-pointer text-slate-600 uppercase tracking-widest"
              >
                <option value="ALL">전체 우선순위</option>
                <option value="HIGH">높음</option>
                <option value="MEDIUM">중간</option>
                <option value="LOW">낮음</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full xl:w-auto">
          {selectedLeadIds.length > 0 && (
            <motion.button 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={handleBulkDelete}
              className="px-6 py-4 bg-red-50 text-red-600 text-xs font-bold rounded-2xl hover:bg-red-100 transition-all flex items-center gap-3 border border-red-100 shadow-lg shadow-red-100/50"
            >
              <Trash2 className="w-4 h-4" />
              <span>{selectedLeadIds.length}개 삭제</span>
            </motion.button>
          )}
          
          <div className="flex gap-2">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-4 bg-white text-slate-600 rounded-2xl hover:bg-slate-50 transition-all border border-slate-100 flex items-center gap-3 shadow-sm"
              title="엑셀 업로드"
            >
              <Upload className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest hidden sm:inline">Import</span>
            </button>
            <button 
              onClick={handleExportExcel}
              className="p-4 bg-white text-slate-600 rounded-2xl hover:bg-slate-50 transition-all border border-slate-100 flex items-center gap-3 shadow-sm"
              title="엑셀 다운로드"
            >
              <Download className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest hidden sm:inline">Export</span>
            </button>
          </div>
          
          <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1 shadow-inner">
            <button 
              onClick={() => setViewMode('kanban')}
              className={`p-3 rounded-xl transition-all ${viewMode === 'kanban' ? 'bg-white shadow-md text-primary' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-3 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white shadow-md text-primary' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex-1 xl:flex-none px-8 py-5 bg-primary text-white text-xs font-bold rounded-[2rem] hover:bg-primary-light shadow-[0_20px_40px_rgba(0,45,98,0.2)] transition-all active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest"
          >
            <Plus className="w-5 h-5" />
            <span>신규 고객 추가</span>
          </button>
        </div>
      </div>

      {/* Main Content View */}
      <div className="h-[calc(100vh-360px)] overflow-hidden">
        {viewMode === 'kanban' ? (
          <div className="h-full flex overflow-x-auto gap-8 pb-8 scrollbar-hide">
            {columns.map((col) => (
              <div key={col.id} className="w-96 flex-shrink-0 flex flex-col space-y-6">
                <div className="flex items-center justify-between px-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-2xl ${col.bg} flex items-center justify-center shadow-sm`}>
                      <col.icon className={`w-5 h-5 ${col.color}`} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm tracking-tight uppercase tracking-widest">{col.label}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {filteredLeads.filter(l => l.status === col.id).length} Leads
                      </p>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-300 hover:text-slate-500">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
                
                <div className={`flex-1 ${col.bg} rounded-[3rem] p-4 space-y-4 overflow-y-auto border-2 border-dashed ${col.border} backdrop-blur-sm`}>
                  {filteredLeads
                    .filter(l => l.status === col.id)
                    .map((lead) => (
                      <motion.div 
                        layoutId={lead.id}
                        key={lead.id} 
                        onClick={() => setSelectedLead(lead)}
                        className={`neo-card p-6 border-none cursor-pointer transition-all group relative ${selectedLeadIds.includes(lead.id) ? 'ring-4 ring-primary/10' : 'hover:shadow-2xl'}`}
                      >
                        <div 
                          onClick={(e) => toggleLeadSelection(lead.id, e)}
                          className={`absolute top-6 right-6 p-1.5 rounded-xl transition-all z-10 ${selectedLeadIds.includes(lead.id) ? 'bg-primary text-white' : 'bg-slate-50 text-slate-200 opacity-0 group-hover:opacity-100'}`}
                        >
                          {selectedLeadIds.includes(lead.id) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        </div>
                        <div className="flex justify-between items-start mb-6">
                          <span className={`text-[9px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest ${getPriorityColor(lead.priority)}`}>
                            {lead.priority}
                          </span>
                          <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{lead.submittedAt || lead.createdAt}</span>
                        </div>
                        <h5 className="font-bold text-xl text-slate-900 mb-2 group-hover:text-primary transition-colors tracking-tight">{lead.name}</h5>
                        <div className="flex items-center gap-2 text-slate-400 mb-6">
                          <Phone className="w-3.5 h-3.5" />
                          <p className="text-xs font-semibold">{lead.phone}</p>
                        </div>
                        
                        <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-[10px] text-slate-400 font-bold uppercase tracking-widest border border-slate-100">
                              {lead.source[0]}
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lead.source}</span>
                          </div>
                          <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-primary group-hover:text-white transition-all">
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  <button 
                    onClick={() => {
                      setNewLead(prev => ({ ...prev, status: col.id }));
                      setIsAddModalOpen(true);
                    }}
                    className="w-full py-6 border-2 border-dashed border-slate-200 rounded-[2rem] text-[11px] text-slate-400 font-bold hover:bg-white hover:border-primary/20 hover:text-primary transition-all uppercase tracking-[0.2em] bg-white/40"
                  >
                    + Add New Lead
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="neo-card border-none overflow-hidden h-full flex flex-col bg-white/60 backdrop-blur-xl">
            <div className="overflow-y-auto flex-1">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50/50 border-b border-slate-100 sticky top-0 z-10">
                  <tr>
                    <th className="px-10 py-8 w-10">
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleSelectAll(); }}
                        className={`p-2 rounded-xl transition-all ${selectedLeadIds.length === filteredLeads.length && filteredLeads.length > 0 ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white border text-slate-200'}`}
                      >
                        {selectedLeadIds.length === filteredLeads.length && filteredLeads.length > 0 ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                      </button>
                    </th>
                    <th className="px-10 py-8 font-bold uppercase tracking-[0.2em] text-[10px] text-slate-400">고객명 / 연락처</th>
                    <th className="px-10 py-8 font-bold uppercase tracking-[0.2em] text-[10px] text-slate-400">진행 상태</th>
                    <th className="px-10 py-8 font-bold uppercase tracking-[0.2em] text-[10px] text-slate-400">우선순위</th>
                    <th className="px-10 py-8 font-bold uppercase tracking-[0.2em] text-[10px] text-slate-400">유입 경로</th>
                    <th className="px-10 py-8 font-bold uppercase tracking-[0.2em] text-[10px] text-slate-400">등록일</th>
                    <th className="px-10 py-8 font-bold uppercase tracking-[0.2em] text-[10px] text-slate-400 text-right">기능</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredLeads.map((l) => (
                    <tr 
                      key={l.id} 
                      onClick={() => setSelectedLead(l)}
                      className={`hover:bg-primary/5 transition-colors cursor-pointer group ${selectedLeadIds.includes(l.id) ? 'bg-primary/5' : ''}`}
                    >
                      <td className="px-10 py-6" onClick={(e) => toggleLeadSelection(l.id, e)}>
                        <div className={`p-2 rounded-xl transition-all inline-block ${selectedLeadIds.includes(l.id) ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-50 text-slate-200 group-hover:text-slate-400 border border-slate-100'}`}>
                          {selectedLeadIds.includes(l.id) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-6">
                          <div className="w-12 h-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center font-bold text-lg shadow-inner">
                            {l.name[0]}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-base tracking-tight">{l.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{l.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-2.5 h-2.5 rounded-full ${columns.find(c => c.id === l.status)?.color} shadow-sm`}></div>
                          <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">{columns.find(c => c.id === l.status)?.label}</span>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <span className={`text-[10px] font-bold px-4 py-2 rounded-full uppercase tracking-widest ${getPriorityColor(l.priority)}`}>
                          {l.priority}
                        </span>
                      </td>
                      <td className="px-10 py-6 text-xs font-bold text-slate-500 uppercase tracking-widest">{l.source}</td>
                      <td className="px-10 py-6 text-xs font-bold text-slate-400 uppercase tracking-widest">{l.submittedAt || l.createdAt}</td>
                      <td className="px-10 py-6 text-right">
                        <button className="p-3 bg-slate-50 text-slate-300 hover:bg-primary hover:text-white rounded-xl transition-all shadow-sm">
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Lead Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-primary/40 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/20"
            >
              <div className="bg-primary p-10 text-white flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold tracking-tight">신규 고객 등록</h3>
                  <p className="text-blue-200 text-[10px] font-bold mt-2 uppercase tracking-[0.3em]">Add New Potential Customer</p>
                </div>
                <button onClick={() => setIsAddModalOpen(false)} className="p-3 hover:bg-white/10 rounded-2xl transition-all relative z-10">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleAddSubmit} className="p-10 space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Customer Name</label>
                    <input 
                      type="text" 
                      value={newLead.name}
                      onChange={(e) => setNewLead({...newLead, name: e.target.value})}
                      placeholder="고객 성함"
                      className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-8 focus:ring-primary/5 outline-none transition-all text-sm font-semibold text-slate-700 shadow-inner"
                      required
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Phone Number</label>
                    <input 
                      type="text" 
                      value={newLead.phone}
                      onChange={(e) => setNewLead({...newLead, phone: e.target.value})}
                      placeholder="010-0000-0000"
                      className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-8 focus:ring-primary/5 outline-none transition-all text-sm font-semibold text-slate-700 shadow-inner"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Email Address (Optional)</label>
                  <input 
                    type="email" 
                    value={newLead.email}
                    onChange={(e) => setNewLead({...newLead, email: e.target.value})}
                    placeholder="example@email.com"
                    className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-8 focus:ring-primary/5 outline-none transition-all text-sm font-semibold text-slate-700 shadow-inner"
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Status</label>
                    <select 
                      value={newLead.status}
                      onChange={(e) => setNewLead({...newLead, status: e.target.value as LeadStatus})}
                      className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-8 focus:ring-primary/5 outline-none transition-all text-sm font-bold text-slate-600 cursor-pointer shadow-inner uppercase tracking-widest"
                    >
                      {columns.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Priority</label>
                    <select 
                      value={newLead.priority}
                      onChange={(e) => setNewLead({...newLead, priority: e.target.value as any})}
                      className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-8 focus:ring-primary/5 outline-none transition-all text-sm font-bold text-slate-600 cursor-pointer shadow-inner uppercase tracking-widest"
                    >
                      <option value="HIGH">높음 (High)</option>
                      <option value="MEDIUM">중간 (Medium)</option>
                      <option value="LOW">낮음 (Low)</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Source / Channel</label>
                  <input 
                    type="text" 
                    value={newLead.source}
                    onChange={(e) => setNewLead({...newLead, source: e.target.value})}
                    placeholder="예: 블로그, 지인소개, 유튜브"
                    className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-8 focus:ring-primary/5 outline-none transition-all text-sm font-semibold text-slate-700 shadow-inner"
                  />
                </div>
                <div className="flex gap-4 pt-6">
                  <button 
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 py-5 bg-slate-100 text-slate-500 font-bold rounded-[2rem] hover:bg-slate-200 transition-all uppercase tracking-widest text-xs"
                  >
                    취소
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] py-5 bg-primary text-white font-bold rounded-[2rem] hover:bg-primary-light shadow-[0_20px_40px_rgba(0,45,98,0.2)] transition-all active:scale-95 uppercase tracking-widest text-xs"
                  >
                    고객 등록 완료
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lead Detail / Edit Modal */}
      <AnimatePresence>
        {selectedLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-primary/40 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, x: 50 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: 50 }}
              className="bg-white w-full max-w-5xl h-[85vh] rounded-[4rem] shadow-2xl overflow-hidden border border-white/20 flex flex-col md:flex-row"
            >
              {/* Left Side: Summary & Actions */}
              <div className="w-full md:w-96 bg-slate-50/50 p-12 border-r border-slate-100 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
                <div className="space-y-12 relative z-10">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-[2.5rem] bg-primary text-white flex items-center justify-center text-3xl font-bold shadow-[0_20px_40px_rgba(0,45,98,0.2)]">
                      {selectedLead.name[0]}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{selectedLead.name}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">{selectedLead.source}</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-4 text-slate-500 group">
                      <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                        <Phone className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold tracking-tight">{selectedLead.phone}</span>
                    </div>
                    {selectedLead.email && (
                      <div className="flex items-center gap-4 text-slate-500 group">
                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                          <Mail className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold tracking-tight">{selectedLead.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-slate-500">
                      <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold tracking-tight">등록: {selectedLead.submittedAt || selectedLead.createdAt}</span>
                    </div>
                    {selectedLead.lastContactDate && (
                      <div className="flex items-center gap-4 text-slate-500">
                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                          <Clock className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold tracking-tight">최근 상담: {selectedLead.lastContactDate}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-8 space-y-4">
                    <button className="w-full py-5 bg-white border border-slate-100 text-primary text-xs font-bold rounded-[2rem] hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-3 uppercase tracking-widest shadow-sm">
                      <Phone className="w-4 h-4" />
                      <span>전화 걸기</span>
                    </button>
                    <button className="w-full py-5 bg-white border border-slate-100 text-accent text-xs font-bold rounded-[2rem] hover:bg-accent hover:text-white transition-all flex items-center justify-center gap-3 uppercase tracking-widest shadow-sm">
                      <Mail className="w-4 h-4" />
                      <span>문자 발송</span>
                    </button>
                  </div>
                </div>

                <button 
                  onClick={() => handleDeleteLead(selectedLead.id)}
                  className="w-full py-6 text-red-300 hover:text-red-500 text-[10px] font-bold transition-all flex items-center justify-center gap-3 uppercase tracking-[0.2em] border-t border-slate-100"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>이 고객 삭제하기</span>
                </button>
              </div>

              {/* Right Side: Details & Edit Form */}
              <div className="flex-1 p-16 overflow-y-auto bg-white relative">
                <div className="flex justify-between items-center mb-16">
                  <div>
                    <h4 className="text-3xl font-bold text-slate-900 tracking-tight">고객 상세 정보</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-2">Lead Intelligence & Management</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setIsEditMode(!isEditMode)}
                      className={`px-6 py-3 rounded-2xl text-[11px] font-bold transition-all uppercase tracking-widest ${isEditMode ? 'bg-slate-100 text-slate-500' : 'bg-primary/5 text-primary hover:bg-primary/10'}`}
                    >
                      {isEditMode ? '수정 취소' : '정보 수정'}
                    </button>
                    <button onClick={() => setSelectedLead(null)} className="p-3 hover:bg-slate-100 rounded-2xl transition-all text-slate-300">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <form onSubmit={handleUpdateSubmit} className="space-y-10">
                  <div className="grid grid-cols-2 gap-10">
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] ml-2">진행 상태</label>
                      <select 
                        disabled={!isEditMode}
                        value={selectedLead.status}
                        onChange={(e) => setSelectedLead({...selectedLead, status: e.target.value as LeadStatus})}
                        className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-8 focus:ring-primary/5 outline-none transition-all text-sm font-bold text-slate-600 disabled:opacity-50 shadow-inner uppercase tracking-widest"
                      >
                        {columns.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] ml-2">우선순위</label>
                      <select 
                        disabled={!isEditMode}
                        value={selectedLead.priority}
                        onChange={(e) => setSelectedLead({...selectedLead, priority: e.target.value as any})}
                        className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-8 focus:ring-primary/5 outline-none transition-all text-sm font-bold text-slate-600 disabled:opacity-50 shadow-inner uppercase tracking-widest"
                      >
                        <option value="HIGH">높음 (High)</option>
                        <option value="MEDIUM">중간 (Medium)</option>
                        <option value="LOW">낮음 (Low)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-10">
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] ml-2">예상 가치 (₩)</label>
                      <div className="relative">
                        <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <input 
                          type="text"
                          disabled={!isEditMode}
                          value={selectedLead.estimatedValue?.toLocaleString() || '0'}
                          onChange={(e) => setSelectedLead({...selectedLead, estimatedValue: parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0})}
                          className="w-full pl-14 pr-6 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-8 focus:ring-primary/5 outline-none transition-all text-sm font-semibold text-slate-700 disabled:opacity-50 shadow-inner"
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] ml-2">다음 팔로업 예정일</label>
                      <div className="relative">
                        <Clock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <input 
                          type="text"
                          disabled={!isEditMode}
                          value={selectedLead.nextFollowUpDate || ''}
                          onChange={(e) => setSelectedLead({...selectedLead, nextFollowUpDate: e.target.value})}
                          placeholder="YYYY-MM-DD"
                          className="w-full pl-14 pr-6 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-8 focus:ring-primary/5 outline-none transition-all text-sm font-semibold text-slate-700 disabled:opacity-50 shadow-inner"
                        />
                      </div>
                    </div>
                  </div>

                  {selectedLead.formData && Object.keys(selectedLead.formData).length > 0 && (
                    <div className="space-y-4">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] ml-2">수집된 양식 데이터</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(selectedLead.formData).map(([key, value]) => (
                          <div key={key} className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{key}</p>
                            <p className="text-sm font-bold text-slate-700">{String(value)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] ml-2">상담 메모 및 특이사항</label>
                    <textarea 
                      disabled={!isEditMode}
                      rows={8}
                      value={selectedLead.notes || ''}
                      onChange={(e) => setSelectedLead({...selectedLead, notes: e.target.value})}
                      placeholder="고객과의 상담 내용, 보장 분석 결과 등을 자유롭게 기록하세요."
                      className="w-full px-8 py-6 rounded-[2.5rem] border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-8 focus:ring-primary/5 outline-none transition-all text-sm font-semibold text-slate-700 disabled:opacity-50 shadow-inner resize-none leading-relaxed"
                    />
                  </div>

                  {isEditMode && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="pt-6"
                    >
                      <button 
                        type="submit"
                        className="w-full py-6 bg-primary text-white font-bold rounded-[2rem] hover:bg-primary-light shadow-[0_20px_40px_rgba(0,45,98,0.2)] transition-all active:scale-95 uppercase tracking-widest text-xs"
                      >
                        변경 사항 저장하기
                      </button>
                    </motion.div>
                  )}
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmType && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-primary/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden p-12 text-center border border-white/20"
            >
              <div className="w-24 h-24 bg-red-50 text-red-500 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                <AlertCircle className="w-12 h-12" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">고객 삭제 확인</h3>
              <p className="text-sm text-slate-400 font-medium mb-10 leading-relaxed">
                {deleteConfirmType === 'single' 
                  ? '정말 이 고객을 삭제하시겠습니까? 삭제된 데이터는 복구할 수 없습니다.' 
                  : `${selectedLeadIds.length}명의 고객을 모두 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setDeleteConfirmType(null)}
                  className="flex-1 py-5 bg-slate-100 text-slate-500 font-bold rounded-[2rem] hover:bg-slate-200 transition-all uppercase tracking-widest text-xs"
                >
                  취소
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-5 bg-red-500 text-white font-bold rounded-[2rem] hover:bg-red-600 shadow-[0_20px_40px_rgba(239,68,68,0.2)] transition-all active:scale-95 uppercase tracking-widest text-xs"
                >
                  삭제 실행
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CRM;
