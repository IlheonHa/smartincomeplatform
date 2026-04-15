
import React, { useState, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { User, UserRole, MembershipGrade, SubscriptionStatus } from '../types';
import { 
  Search, 
  Plus, 
  Download, 
  Upload, 
  Trash2, 
  CheckSquare, 
  Square, 
  User as UserIcon, 
  DollarSign, 
  AlertCircle,
  MoreVertical,
  ChevronRight,
  Shield,
  CreditCard,
  Activity,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MemberManagementProps {
  users: User[];
  onUpdateUser: (user: User) => void;
  onDeleteUser: (id: string) => Promise<boolean>;
  onDeleteUsers: (ids: string[]) => Promise<boolean>;
  onAddUser: (userData: Partial<User>) => Promise<{ success: boolean; message?: string }>;
  onRefresh: () => void;
}

const MemberManagement: React.FC<MemberManagementProps> = ({ users, onUpdateUser, onDeleteUser, onDeleteUsers, onAddUser, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedUser, setEditedUser] = useState<User | null>(null);
  const [deleteConfirmType, setDeleteConfirmType] = useState<'single' | 'bulk' | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newPartner, setNewPartner] = useState({
    name: '',
    loginId: '',
    password: '',
    phone: '',
    grade: MembershipGrade.SILVER,
    role: UserRole.PARTNER,
    subscriptionStatus: SubscriptionStatus.TRIAL,
    monthlyFee: 0
  });

  const handleAddPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartner.name || !newPartner.loginId || !newPartner.phone || !newPartner.password) {
      alert('모든 필드를 입력해주세요.');
      return;
    }
    
    if (!newPartner.loginId.toLowerCase().endsWith('@gmail.com')) {
      alert('아이디는 반드시 gmail 계정(@gmail.com)이어야 합니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onAddUser(newPartner);
      if (result.success) {
        setIsAddModalOpen(false);
        setNewPartner({ 
          name: '', 
          loginId: '', 
          password: '', 
          phone: '', 
          grade: MembershipGrade.SILVER,
          role: UserRole.PARTNER,
          subscriptionStatus: SubscriptionStatus.TRIAL,
          monthlyFee: 0
        });
        alert('신규 파트너가 성공적으로 추가되었습니다.');
      } else {
        alert('파트너 추가 실패: ' + (result.message || '알 수 없는 오류'));
      }
    } catch (error) {
      console.error('Add partner error:', error);
      alert('파트너 추가 중 예기치 않은 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateUserInfo = (id: string, field: keyof User, value: string) => {
    if (field === 'loginId' && value && !value.toLowerCase().endsWith('@gmail.com')) {
      // We allow typing, but maybe we should warn or just let it be and validate on blur?
      // For now, let's just update but maybe add a visual cue.
      // Actually, the user wants it to be MANDATORY.
    }
    const user = users.find(u => u.id === id);
    if (user) onUpdateUser({ ...user, [field]: value });
  };

  const updateUserNumericInfo = (id: string, field: keyof User, value: string) => {
    const user = users.find(u => u.id === id);
    if (user) {
      const numValue = parseInt(value.replace(/[^0-9]/g, '')) || 0;
      onUpdateUser({ ...user, [field]: numValue });
    }
  };

  const toggleUserStatus = (id: string) => {
    const user = users.find(u => u.id === id);
    if (user) {
      if (user.loginId === 'admin') {
        alert('마스터 관리자 계정은 비활성화할 수 없습니다.');
        return;
      }
      onUpdateUser({ ...user, isActive: !user.isActive });
    }
  };

  const changeUserGrade = (id: string, newGrade: MembershipGrade) => {
    const user = users.find(u => u.id === id);
    if (user) onUpdateUser({ ...user, grade: newGrade });
  };

  const changeSubscriptionStatus = (id: string, status: SubscriptionStatus) => {
    const user = users.find(u => u.id === id);
    if (user) onUpdateUser({ ...user, subscriptionStatus: status });
  };

  const updateMonthlyFee = (id: string, fee: string) => {
    const user = users.find(u => u.id === id);
    if (user) {
      const numericFee = parseInt(fee.replace(/[^0-9]/g, '')) || 0;
      onUpdateUser({ ...user, monthlyFee: numericFee });
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, u: User) => {
    e.preventDefault();
    e.stopPropagation();
    const protectedIds = ['admin', 'ilheonha@gmail.com', 'hih@sciencecenter.or.kr'];
    if (protectedIds.includes(u.loginId)) {
      alert('마스터 관리자 계정은 삭제할 수 없습니다.');
      return;
    }
    setUserToDelete(u);
    setDeleteConfirmType('single');
  };

  const handleBulkDelete = () => {
    const protectedIds = ['admin', 'ilheonha@gmail.com', 'hih@sciencecenter.or.kr'];
    const hasAdmin = users.some(u => selectedUserIds.includes(u.id) && protectedIds.includes(u.loginId));
    if (hasAdmin) {
      alert('마스터 관리자 계정은 삭제할 수 없습니다. 선택 항목에서 제외해주세요.');
      return;
    }
    setDeleteConfirmType('bulk');
  };

  const confirmDelete = async () => {
    setIsSubmitting(true);
    try {
      if (deleteConfirmType === 'single' && userToDelete) {
        const success = await onDeleteUser(userToDelete.id);
        if (success) {
          setUserToDelete(null);
          setDeleteConfirmType(null);
        }
      } else if (deleteConfirmType === 'bulk') {
        const success = await onDeleteUsers(selectedUserIds);
        if (success) {
          setSelectedUserIds([]);
          setDeleteConfirmType(null);
        }
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('삭제 처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleUserSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedUserIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUserIds.length === filteredUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.map(u => u.id));
    }
  };

  const handleOpenProfile = (u: User) => {
    setSelectedUser(u);
    setEditedUser({ ...u });
    setIsEditingProfile(false);
  };

  const handleSaveProfile = () => {
    if (editedUser) {
      onUpdateUser(editedUser);
      setSelectedUser(editedUser);
      setIsEditingProfile(false);
      alert('회원 정보가 성공적으로 수정되었습니다.');
    }
  };

  const handleToggleActive = (user: User, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateUser({
      ...user,
      isActive: !user.isActive
    });
  };
  const getGradeStyle = (grade?: MembershipGrade) => {
    switch (grade) {
      case MembershipGrade.SILVER: return 'bg-slate-100 text-slate-600 border-slate-200';
      case MembershipGrade.GOLD: return 'bg-amber-50 text-amber-600 border-amber-100';
      case MembershipGrade.DIAMOND: return 'bg-cyan-50 text-cyan-600 border-cyan-100';
      case MembershipGrade.PLATINUM: return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      default: return 'bg-gray-50 text-gray-500 border-gray-100';
    }
  };

  const getStatusStyle = (status: SubscriptionStatus) => {
    switch (status) {
      case SubscriptionStatus.ACTIVE: return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case SubscriptionStatus.TRIAL: return 'bg-blue-50 text-blue-600 border-blue-100';
      case SubscriptionStatus.OVERDUE: return 'bg-red-50 text-red-600 border-red-100';
      case SubscriptionStatus.CANCELLED: return 'bg-slate-100 text-slate-500 border-slate-200';
      default: return 'bg-gray-50 text-gray-500 border-gray-100';
    }
  };

  const handleExportExcel = () => {
    const exportData = users.map(u => ({
      '이름': u.name,
      '아이디': u.loginId,
      '비밀번호': u.password || '',
      '전화번호': u.phone,
      '역할': u.role,
      '등급': u.grade || '',
      '구독상태': u.subscriptionStatus || '',
      '월구독료': u.monthlyFee || 0,
      '가입일': u.createdAt,
      '활성상태': u.isActive ? 'Y' : 'N',
      '콘텐츠생성': u.contentGenCount || 0,
      '보험설계': u.insuranceDesignCount || 0,
      '골든시스템': u.goldenSystemCount || 0,
      '고객수': u.leadsCount || 0,
      '상담수': u.activeConsultationsCount || 0,
      '발생수익': u.revenueGenerated || 0,
      '차기결제일': u.nextPaymentDate || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Members");
    XLSX.writeFile(wb, `SmartInsureLab_Members_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        setIsSubmitting(true);
        let successCount = 0;
        for (const row of data) {
          let loginId = String(row['아이디'] || `user_${Math.random().toString(36).substr(2, 5)}`);
          if (!loginId.toLowerCase().endsWith('@gmail.com')) {
            loginId = loginId + '@gmail.com';
          }
          const userData: Partial<User> = {
            name: String(row['이름'] || '신규회원'),
            loginId: loginId,
            password: String(row['비밀번호'] || '1234'),
            phone: String(row['전화번호'] || '010-0000-0000'),
            role: (row['역할'] === 'ADMIN' ? UserRole.ADMIN : UserRole.PARTNER),
            grade: (row['등급'] as MembershipGrade) || MembershipGrade.SILVER,
            subscriptionStatus: (row['구독상태'] as SubscriptionStatus) || SubscriptionStatus.TRIAL,
            monthlyFee: parseInt(row['월구독료']) || 0,
            createdAt: String(row['가입일'] || new Date().toISOString().split('T')[0]),
            isActive: row['활성상태'] === 'Y' || row['활성상태'] === true || row['활성상태'] === undefined || row['활성상태'] === null || row['활성상태'] === '',
            contentGenCount: parseInt(row['콘텐츠생성']) || 0,
            insuranceDesignCount: parseInt(row['보험설계']) || 0,
            goldenSystemCount: parseInt(row['골든시스템']) || 0,
            leadsCount: parseInt(row['고객수']) || 0,
            activeConsultationsCount: parseInt(row['상담수']) || 0,
            revenueGenerated: parseInt(row['발생수익']) || 0,
            nextPaymentDate: String(row['차기결제일'] || '')
          };
          const result = await onAddUser(userData);
          if (result.success) successCount++;
        }
        setIsSubmitting(false);
        alert(`${successCount}명의 회원 정보가 성공적으로 업로드되었습니다.`);
      } catch (error) {
        setIsSubmitting(false);
        console.error('Excel Import Error:', error);
        alert('엑셀 파일 형식이 올바르지 않습니다.');
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filteredUsers = useMemo(() => {
    return users
      .filter(u => {
        const matchesSearch = u.name.includes(searchTerm) || u.loginId.includes(searchTerm) || u.phone.includes(searchTerm);
        const matchesGrade = gradeFilter === 'ALL' || u.grade === gradeFilter;
        return matchesSearch && matchesGrade;
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
  }, [users, searchTerm, gradeFilter]);

  const { totalMonthlyRevenue, overdueCount, partnerCount, activePartnerCount } = useMemo(() => {
    const totalMonthlyRevenue = users.reduce((acc, curr) => acc + (curr.monthlyFee || 0), 0);
    const overdueCount = users.filter(u => u.subscriptionStatus === SubscriptionStatus.OVERDUE).length;
    const partnerCount = users.filter(u => u.role === UserRole.PARTNER).length;
    const activePartnerCount = users.filter(u => u.isActive).length;

    return { totalMonthlyRevenue, overdueCount, partnerCount, activePartnerCount };
  }, [users]);

  const stats = useMemo(() => [
    { label: '예상 월 구독 매출', value: `₩${totalMonthlyRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-[#002D62]', bg: 'bg-blue-100', sub: `전체 ${partnerCount}개 계정 합산` },
    { label: '미납/연체 계정', value: `${overdueCount}건`, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-100', sub: '즉시 조치 필요' },
    { label: '활성 파트너', value: `${activePartnerCount}명`, icon: UserIcon, color: 'text-blue-600', bg: 'bg-blue-100', sub: `전체 대비 ${((activePartnerCount / (users.length || 1)) * 100).toFixed(1)}%` },
  ], [totalMonthlyRevenue, overdueCount, partnerCount, activePartnerCount, users.length]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border shadow-sm group hover:shadow-blue-100 hover:shadow-xl transition-all">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">예상 월 구독 매출</p>
          <h3 className="text-2xl font-black text-[#002D62]">₩{totalMonthlyRevenue.toLocaleString()}</h3>
          <p className="text-[9px] text-gray-400 mt-2 font-bold">전체 {users.filter(u => u.role === UserRole.PARTNER).length}개 계정 합산</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border shadow-sm group hover:shadow-blue-100 hover:shadow-xl transition-all">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">미납/연체 계정</p>
          <h3 className="text-2xl font-black text-red-500">{users.filter(u => u.subscriptionStatus === SubscriptionStatus.OVERDUE).length}건</h3>
          <p className="text-[9px] text-red-400 mt-2 font-bold">즉시 조치 필요</p>
        </div>
        <div 
          onClick={handleExportExcel}
          className="bg-[#002D62] p-6 rounded-[2rem] shadow-xl flex flex-col justify-center items-center text-white cursor-pointer hover:bg-[#001A3A] transition-colors"
        >
           <span className="text-2xl mb-1">🧾</span>
           <button className="font-bold text-xs">엑셀 리포트 다운로드</button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white p-4 rounded-3xl border shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md w-full">
          <input 
            type="text" 
            placeholder="회원 이름, 아이디, 휴대폰 검색..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-[1.5rem] text-sm focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-medium"
          />
          <span className="absolute left-4 top-4 text-xl">🔍</span>
        </div>
        <div className="flex space-x-3 w-full md:w-auto">
          {selectedUserIds.length > 0 && (
            <button 
              onClick={handleBulkDelete}
              className="px-6 py-4 bg-red-500 text-white text-xs font-black rounded-[1.5rem] hover:bg-red-600 shadow-lg shadow-red-100 transition-all active:scale-95 flex items-center space-x-2"
            >
              <span>🗑️</span>
              <span>{selectedUserIds.length}명 일괄 삭제</span>
            </button>
          )}
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleImportExcel}
            accept=".xlsx, .xls"
            className="hidden"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-4 bg-emerald-600 text-white text-xs font-black rounded-[1.5rem] hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all active:scale-95 flex items-center space-x-2"
          >
            <span>📥</span>
            <span>엑셀 업로드</span>
          </button>
          <button 
            onClick={onRefresh}
            className="px-6 py-4 bg-white text-slate-600 text-xs font-black rounded-[1.5rem] hover:bg-slate-50 border-2 border-slate-100 transition-all active:scale-95 flex items-center space-x-2"
          >
            <span>🔄</span>
            <span>새로고침</span>
          </button>
          <button 
            onClick={() => {
              console.log('Opening Add Member modal');
              setIsAddModalOpen(true);
            }}
            className="px-6 py-4 bg-[#002D62] text-white text-xs font-black rounded-[1.5rem] hover:bg-[#001A3A] shadow-lg shadow-blue-100 transition-all active:scale-95 flex items-center space-x-2"
          >
            <span>➕</span>
            <span>신규 회원 추가</span>
          </button>
          <select 
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="text-xs font-bold bg-white border-2 border-gray-100 px-6 py-4 rounded-[1.5rem] outline-none cursor-pointer focus:border-indigo-500 transition-colors"
          >
            <option value="ALL">전체 등급</option>
            {Object.values(MembershipGrade).map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>

      {/* Enhanced Table */}
      <div className="bg-white rounded-[2.5rem] border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] whitespace-nowrap">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-4 w-10">
                  <button 
                    onClick={toggleSelectAll}
                    className="text-gray-400 hover:text-indigo-600 transition-colors"
                  >
                    {selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0 ? (
                      <CheckSquare className="w-5 h-5 text-indigo-600" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                </th>
                <th className="px-3 py-4 font-black uppercase tracking-wider text-[10px] text-gray-400">Member Name</th>
                <th className="px-3 py-4 font-black uppercase tracking-wider text-[10px] text-gray-400">Login ID (Gmail)</th>
                <th className="px-3 py-4 font-black uppercase tracking-wider text-[10px] text-gray-400">Password</th>
                <th className="px-3 py-4 font-black uppercase tracking-wider text-[10px] text-gray-400">Phone Number</th>
                <th className="px-3 py-4 font-black uppercase tracking-wider text-[10px] text-gray-400">Initial Grade</th>
                <th className="px-3 py-4 font-black uppercase tracking-wider text-[10px] text-gray-400">Role</th>
                <th className="px-3 py-4 font-black uppercase tracking-wider text-[10px] text-gray-400">Subscription</th>
                <th className="px-3 py-4 font-black uppercase tracking-wider text-[10px] text-gray-400">Monthly Fee</th>
                <th className="px-3 py-4 font-black uppercase tracking-wider text-[10px] text-gray-400">Status</th>
                <th className="px-4 py-4 font-black uppercase tracking-wider text-[10px] text-gray-400 text-right">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.map((u) => (
                <tr 
                  key={u.id} 
                  className={`hover:bg-indigo-50/30 transition-all group cursor-pointer ${selectedUserIds.includes(u.id) ? 'bg-indigo-50/50' : ''}`}
                  onClick={() => handleOpenProfile(u)}
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={(e) => toggleUserSelection(u.id, e)}
                      className="text-gray-300 group-hover:text-indigo-400 transition-colors"
                    >
                      {selectedUserIds.includes(u.id) ? (
                        <CheckSquare className="w-5 h-5 text-indigo-600" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center space-x-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[11px] border shadow-sm ${u.role === UserRole.ADMIN ? 'bg-[#002D62] text-white border-[#001A3A]' : 'bg-white text-[#002D62] border-slate-100'}`}>
                        {u.name[0]}
                      </div>
                      <span className="font-black text-slate-900 text-[13px]">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-[12px] font-bold text-slate-500">{u.loginId}</span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="px-2 py-0.5 bg-slate-50 rounded border border-slate-100 text-[10px] font-black text-slate-600 w-fit">
                      {u.password || '****'}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-[12px] font-bold text-slate-500">{u.phone}</span>
                  </td>
                  <td className="px-3 py-3">
                    <div className={`inline-flex items-center px-2 py-0.5 rounded-lg border text-[10px] font-black w-fit ${getGradeStyle(u.grade)}`}>
                      <Shield className="w-3 h-3 mr-1" />
                      {u.grade || 'SILVER'}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{u.role}</span>
                  </td>
                  <td className="px-3 py-3">
                    <div className={`inline-flex items-center px-2 py-0.5 rounded-lg border text-[10px] font-black w-fit ${getStatusStyle(u.subscriptionStatus || SubscriptionStatus.TRIAL)}`}>
                      {u.subscriptionStatus || 'TRIAL'}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-[13px] font-black text-slate-700">₩{(u.monthlyFee || 0).toLocaleString()}</span>
                  </td>
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => handleToggleActive(u, e)}
                        className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors focus:outline-none ${u.isActive ? 'bg-emerald-500' : 'bg-slate-200'}`}
                      >
                        <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${u.isActive ? 'translate-x-4.5' : 'translate-x-1'}`} />
                      </button>
                      <span className={`text-[10px] font-black ${u.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {u.isActive ? '사용' : '정지'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => handleOpenProfile(u)}
                        className="p-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-all border border-slate-100"
                        title="상세 보기"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => handleDeleteClick(e, u)}
                        className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-all border border-slate-100"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <div className="p-32 text-center">
            <div className="text-6xl mb-6 grayscale">🕵️‍♂️</div>
            <p className="text-gray-400 font-black text-lg">검색 결과와 일치하는 파트너가 없습니다.</p>
            <button onClick={() => {setSearchTerm(''); setGradeFilter('ALL');}} className="mt-4 text-indigo-600 font-bold hover:underline">필터 초기화</button>
          </div>
        )}
      </div>

      {/* Information Footer */}
      <div className="bg-gradient-to-br from-indigo-50 to-white p-8 rounded-[2.5rem] border border-indigo-100 flex flex-col md:flex-row items-center justify-between shadow-sm">
        <div className="flex items-center space-x-6 mb-4 md:mb-0">
          <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-3xl shadow-indigo-100 shadow-lg border-2 border-white">⚙️</div>
          <div>
            <h4 className="font-black text-indigo-900 text-lg">회원 등급 및 구독 관리</h4>
            <p className="text-xs text-indigo-700/70 font-medium leading-relaxed">
              설정된 등급에 따라 월 구독료가 매달 1일 자동 청구됩니다. <br/>
              미납 시 계정이 자동으로 정지 상태(SUSPENDED)로 변경되도록 자동화 엔진이 감시 중입니다.
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => {
              console.log('Opening Add Member modal from footer');
              setIsAddModalOpen(true);
            }}
            className="px-6 py-4 bg-[#002D62] text-white text-xs font-black rounded-2xl hover:bg-[#001A3A] shadow-xl shadow-blue-100 transition-all active:scale-95"
          >
            신규 회원 추가
          </button>
        </div>
      </div>

      {/* Add Partner Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-indigo-950/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-slideUp">
            <div className="bg-[#002D62] p-8 text-white">
              <h3 className="text-xl font-black tracking-tight">신규 회원 등록</h3>
              <p className="text-blue-100 text-[10px] font-bold mt-1 uppercase tracking-widest">Add New Strategic Member</p>
            </div>
            <form onSubmit={handleAddPartner} className="p-8 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Member Name</label>
                <input 
                  type="text" 
                  value={newPartner.name}
                  onChange={(e) => setNewPartner({...newPartner, name: e.target.value})}
                  placeholder="성함을 입력하세요"
                  className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm font-bold"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Login ID (Gmail Only)</label>
                <input 
                  type="email" 
                  value={newPartner.loginId}
                  onChange={(e) => setNewPartner({...newPartner, loginId: e.target.value})}
                  placeholder="example@gmail.com"
                  className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm font-bold"
                  required
                />
                <p className="text-[10px] text-indigo-600 font-bold ml-1">
                  * 반드시 @gmail.com 계정으로 등록해주세요.
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Password</label>
                <input 
                  type="text" 
                  value={newPartner.password}
                  onChange={(e) => setNewPartner({...newPartner, password: e.target.value})}
                  placeholder="비밀번호를 입력하세요"
                  className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm font-bold"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                <input 
                  type="text" 
                  value={newPartner.phone}
                  onChange={(e) => setNewPartner({...newPartner, phone: e.target.value})}
                  placeholder="010-0000-0000"
                  className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm font-bold"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Initial Grade</label>
                  <select 
                    value={newPartner.grade}
                    onChange={(e) => setNewPartner({...newPartner, grade: e.target.value as MembershipGrade})}
                    className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm font-bold cursor-pointer"
                  >
                    {Object.values(MembershipGrade).map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Role</label>
                  <select 
                    value={newPartner.role}
                    onChange={(e) => setNewPartner({...newPartner, role: e.target.value as UserRole})}
                    className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm font-bold cursor-pointer"
                  >
                    {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Subscription</label>
                  <select 
                    value={newPartner.subscriptionStatus}
                    onChange={(e) => setNewPartner({...newPartner, subscriptionStatus: e.target.value as SubscriptionStatus})}
                    className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm font-bold cursor-pointer"
                  >
                    {Object.values(SubscriptionStatus).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Monthly Fee</label>
                  <input 
                    type="number" 
                    value={newPartner.monthlyFee}
                    onChange={(e) => setNewPartner({...newPartner, monthlyFee: parseInt(e.target.value) || 0})}
                    placeholder="0"
                    className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm font-bold"
                  />
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-4 bg-gray-100 text-gray-500 font-black rounded-2xl hover:bg-gray-200 transition-all"
                >
                  취소
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-2 py-4 bg-[#002D62] text-white font-black rounded-2xl hover:bg-[#001A3A] shadow-xl shadow-blue-100 transition-all active:scale-95 flex items-center justify-center ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : null}
                  회원 등록 완료
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmType && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-indigo-950/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-slideUp border-4 border-red-100">
            <div className="bg-red-500 p-8 text-white text-center">
              <div className="text-5xl mb-4">⚠️</div>
              <h3 className="text-xl font-black tracking-tight">
                {deleteConfirmType === 'single' ? '회원 영구 삭제' : `${selectedUserIds.length}명 일괄 삭제`}
              </h3>
              <p className="text-red-100 text-[10px] font-bold mt-1 uppercase tracking-widest">Permanent Data Deletion</p>
            </div>
            <div className="p-8 text-center space-y-6">
              <p className="text-gray-600 font-bold text-sm leading-relaxed">
                {deleteConfirmType === 'single' ? (
                  <>
                    <span className="text-red-600 font-black">{userToDelete?.name}</span> 파트너의 모든 데이터가 <br/>
                    시스템에서 <span className="text-red-600">영구적으로 삭제</span>됩니다.
                  </>
                ) : (
                  <>
                    선택한 <span className="text-red-600 font-black">{selectedUserIds.length}명</span>의 파트너 데이터가 <br/>
                    시스템에서 <span className="text-red-600">영구적으로 삭제</span>됩니다.
                  </>
                )}
                <br/>
                이 작업은 되돌릴 수 없습니다.
              </p>
              <div className="flex space-x-3">
                <button 
                  onClick={() => setDeleteConfirmType(null)}
                  className="flex-1 py-4 bg-gray-100 text-gray-500 font-black rounded-2xl hover:bg-gray-200 transition-all"
                >
                  취소
                </button>
                <button 
                  onClick={confirmDelete}
                  disabled={isSubmitting}
                  className={`flex-1 py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 shadow-xl shadow-red-100 transition-all active:scale-95 flex items-center justify-center ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : null}
                  삭제 승인
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Profile Modal */}
      {selectedUser && editedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-indigo-950/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-slideUp">
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-10 text-white relative">
              <button 
                onClick={() => {setSelectedUser(null); setEditedUser(null);}}
                className="absolute top-8 right-8 text-2xl hover:scale-110 transition-transform"
              >
                ✕
              </button>
              <div className="flex items-center space-x-6">
                <div className="w-24 h-24 rounded-[2rem] bg-white/20 backdrop-blur-md border-2 border-white/30 flex items-center justify-center text-4xl font-black">
                  {editedUser.name[0]}
                </div>
                <div className="flex-1">
                  {isEditingProfile ? (
                    <input 
                      type="text"
                      value={editedUser.name}
                      onChange={(e) => setEditedUser({...editedUser, name: e.target.value})}
                      className="text-3xl font-black tracking-tight bg-white/10 border-b border-white/30 outline-none w-full px-2 py-1 rounded-lg focus:bg-white/20"
                    />
                  ) : (
                    <h3 className="text-3xl font-black tracking-tight">{editedUser.name}</h3>
                  )}
                  
                  <div className="flex items-center space-x-3 mt-4">
                    {isEditingProfile ? (
                      <div className="flex gap-2">
                        <select 
                          value={editedUser.role}
                          onChange={(e) => setEditedUser({...editedUser, role: e.target.value as UserRole})}
                          className="bg-white/10 border border-white/30 rounded-lg px-2 py-1 text-[10px] font-black outline-none"
                        >
                          {Object.values(UserRole).map(r => <option key={r} value={r} className="text-gray-900">{r}</option>)}
                        </select>
                        <select 
                          value={editedUser.grade}
                          onChange={(e) => setEditedUser({...editedUser, grade: e.target.value as MembershipGrade})}
                          className="bg-white/10 border border-white/30 rounded-lg px-2 py-1 text-[10px] font-black outline-none"
                        >
                          {Object.values(MembershipGrade).map(g => <option key={g} value={g} className="text-gray-900">{g}</option>)}
                        </select>
                        <select 
                          value={editedUser.subscriptionStatus}
                          onChange={(e) => setEditedUser({...editedUser, subscriptionStatus: e.target.value as SubscriptionStatus})}
                          className="bg-white/10 border border-white/30 rounded-lg px-2 py-1 text-[10px] font-black outline-none"
                        >
                          {Object.values(SubscriptionStatus).map(s => <option key={s} value={s} className="text-gray-900">{s}</option>)}
                        </select>
                      </div>
                    ) : (
                      <p className="text-indigo-100 font-bold opacity-80 uppercase tracking-widest text-xs">
                        {editedUser.role} · {editedUser.grade || 'NO GRADE'} · {editedUser.subscriptionStatus}
                      </p>
                    )}
                    
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black ${editedUser.isActive ? 'bg-emerald-400 text-emerald-950' : 'bg-red-400 text-red-950'}`}>
                      {editedUser.isActive ? 'ACTIVE' : 'SUSPENDED'}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-indigo-200 uppercase">ID:</span>
                      {isEditingProfile ? (
                        <input 
                          type="email"
                          value={editedUser.loginId}
                          onChange={(e) => setEditedUser({...editedUser, loginId: e.target.value})}
                          className="text-[10px] font-bold text-white bg-white/10 border-b border-white/30 outline-none px-1"
                        />
                      ) : (
                        <span className="text-[10px] font-bold text-indigo-200">{editedUser.loginId}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-10 grid grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">연락처 및 기본 정보</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl">
                      <span className="text-xs font-bold text-gray-500">휴대폰</span>
                      {isEditingProfile ? (
                        <input 
                          type="text"
                          value={editedUser.phone}
                          onChange={(e) => setEditedUser({...editedUser, phone: e.target.value})}
                          className="text-xs font-black text-gray-900 bg-white border border-gray-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                      ) : (
                        <span className="text-xs font-black text-gray-900">{editedUser.phone}</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl">
                      <span className="text-xs font-bold text-gray-500">가입일</span>
                      <span className="text-xs font-black text-gray-900">{editedUser.createdAt}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl">
                      <span className="text-xs font-bold text-gray-500">비밀번호</span>
                      {isEditingProfile ? (
                        <input 
                          type="text"
                          value={editedUser.password}
                          onChange={(e) => setEditedUser({...editedUser, password: e.target.value})}
                          className="text-xs font-black text-indigo-600 bg-white border border-gray-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                      ) : (
                        <span className="text-xs font-black text-indigo-600">{editedUser.password}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">구독 및 정산</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-2xl border border-indigo-100">
                      <span className="text-xs font-bold text-indigo-600">월 구독료</span>
                      {isEditingProfile ? (
                        <div className="flex items-center">
                          <span className="text-xs font-black text-indigo-900 mr-1">₩</span>
                          <input 
                            type="text"
                            value={editedUser.monthlyFee}
                            onChange={(e) => setEditedUser({...editedUser, monthlyFee: parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0})}
                            className="text-xs font-black text-indigo-900 bg-white border border-indigo-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-100 w-24"
                          />
                        </div>
                      ) : (
                        <span className="text-xs font-black text-indigo-900">₩{editedUser.monthlyFee?.toLocaleString()}</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl">
                      <span className="text-xs font-bold text-gray-500">차기 결제일</span>
                      {isEditingProfile ? (
                        <input 
                          type="text"
                          value={editedUser.nextPaymentDate || ''}
                          onChange={(e) => setEditedUser({...editedUser, nextPaymentDate: e.target.value})}
                          placeholder="YYYY-MM-DD"
                          className="text-xs font-black text-gray-900 bg-white border border-gray-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-100 w-28"
                        />
                      ) : (
                        <span className="text-xs font-black text-gray-900">{editedUser.nextPaymentDate || '-'}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">활동 실적</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-indigo-50 rounded-3xl border border-indigo-100 text-center">
                      <p className="text-[10px] font-black text-indigo-400 uppercase mb-1">고객 생성</p>
                      {isEditingProfile ? (
                        <input 
                          type="number"
                          value={editedUser.leadsCount || 0}
                          onChange={(e) => setEditedUser({...editedUser, leadsCount: parseInt(e.target.value) || 0})}
                          className="text-xl font-black text-indigo-600 bg-white border border-indigo-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-100 w-full text-center"
                        />
                      ) : (
                        <p className="text-2xl font-black text-indigo-600">{editedUser.leadsCount || 0}</p>
                      )}
                    </div>
                    <div className="p-4 bg-blue-50 rounded-3xl border border-blue-100 text-center">
                      <p className="text-[10px] font-black text-blue-400 uppercase mb-1">상담 진행</p>
                      {isEditingProfile ? (
                        <input 
                          type="number"
                          value={editedUser.activeConsultationsCount || 0}
                          onChange={(e) => setEditedUser({...editedUser, activeConsultationsCount: parseInt(e.target.value) || 0})}
                          className="text-xl font-black text-blue-600 bg-white border border-blue-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-100 w-full text-center"
                        />
                      ) : (
                        <p className="text-2xl font-black text-blue-600">{editedUser.activeConsultationsCount || 0}</p>
                      )}
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-3xl border border-emerald-100 text-center col-span-2">
                      <p className="text-[10px] font-black text-emerald-400 uppercase mb-1">총 발생 수익</p>
                      {isEditingProfile ? (
                        <div className="flex items-center justify-center">
                          <span className="text-xl font-black text-emerald-600 mr-1">₩</span>
                          <input 
                            type="text"
                            value={editedUser.revenueGenerated}
                            onChange={(e) => setEditedUser({...editedUser, revenueGenerated: parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0})}
                            className="text-xl font-black text-emerald-600 bg-white border border-emerald-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-100 w-48 text-center"
                          />
                        </div>
                      ) : (
                        <p className="text-2xl font-black text-emerald-600">₩{editedUser.revenueGenerated?.toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex space-x-3">
                  {isEditingProfile ? (
                    <>
                      <button 
                        onClick={() => setIsEditingProfile(false)}
                        className="flex-1 py-4 bg-gray-100 text-gray-500 font-black rounded-2xl hover:bg-gray-200 transition-all"
                      >
                        취소
                      </button>
                      <button 
                        onClick={handleSaveProfile}
                        className="flex-2 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95"
                      >
                        저장하기
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => setIsEditingProfile(true)}
                        className="flex-1 py-4 bg-indigo-50 text-indigo-600 font-black rounded-2xl hover:bg-indigo-100 transition-all border-2 border-indigo-100"
                      >
                        정보 수정
                      </button>
                      <button 
                        onClick={(e) => {
                          handleDeleteClick(e, editedUser);
                          setSelectedUser(null);
                        }}
                        className="flex-1 py-4 bg-red-50 text-red-600 font-black rounded-2xl hover:bg-red-100 transition-all border-2 border-red-100"
                      >
                        회원 삭제
                      </button>
                      <button 
                        onClick={() => setSelectedUser(null)}
                        className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95"
                      >
                        닫기
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberManagement;
