
import React, { useState, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import Dashboard from './views/Dashboard';
import Marketing from './views/Marketing';
import CRM from './views/CRM';
import AIHub from './views/AIHub';
import Settings from './views/Settings';
import Admin from './views/Admin';
import MemberManagement from './views/MemberManagement';
import SecretRoom from './views/SecretRoom';
import Introduction from './views/Introduction';
import LeadCollection from './views/LeadCollection';
import UsefulTools from './views/UsefulTools';
import PublicFormView from './views/PublicFormView';
import Login from './views/Login';
import Signup from './views/Signup';
import { User, UserRole, MembershipGrade, SubscriptionStatus, DashboardData, SystemSettings, Lead, LeadStatus, AppNotification, CalendarEvent } from './types';
import { supabase, supabaseUrl, supabaseAnonKey } from './src/lib/supabase';
import { createClient } from '@supabase/supabase-js';

const INITIAL_NOTIFICATIONS: AppNotification[] = [];

const INITIAL_LEADS: Lead[] = [];

const INITIAL_SYSTEM_SETTINGS: SystemSettings = {
  autoApproveNewMembers: true,
  defaultMonthlyFee: 39000,
  syncDashboardWithMemberFees: false,
  maintenanceMode: false
};

const INITIAL_DASHBOARD_DATA: DashboardData = {
  stats: {
    contentGenCount: '1,248',
    insuranceDesignCount: '856',
    goldenSystemCount: '342',
    totalLeads: '1,284',
    activeConsultations: '42',
    contentGenTrend: '+15%',
    insuranceDesignTrend: '+8%',
    goldenSystemTrend: '+22%',
    totalLeadsTrend: '+12%',
    activeConsultationsTrend: '+5%',
  },
  chartData: [
    { name: '월', leads: 40, revenue: 2400 },
    { name: '화', leads: 30, revenue: 1398 },
    { name: '수', leads: 20, revenue: 9800 },
    { name: '목', leads: 27, revenue: 3908 },
    { name: '금', leads: 18, revenue: 4800 },
    { name: '토', leads: 23, revenue: 3800 },
    { name: '일', leads: 34, revenue: 4300 },
  ]
};

const INITIAL_USERS: User[] = [
  { 
    id: 'admin-0', loginId: 'admin', password: 'AUTH_MANAGED', name: '시스템관리자', phone: '010-0000-0000', role: UserRole.ADMIN, 
    createdAt: '2024-01-01', isActive: true 
  },
  { 
    id: 'admin-1', loginId: 'ilheonha@gmail.com', password: 'AUTH_MANAGED', name: '마스터관리자', phone: '010-0000-0000', role: UserRole.ADMIN, 
    createdAt: '2024-01-01', isActive: true 
  },
  { 
    id: 'admin-2', loginId: 'hih@sciencecenter.or.kr', password: 'AUTH_MANAGED', name: '마스터관리자', phone: '010-0000-0000', role: UserRole.ADMIN, 
    createdAt: '2024-01-01', isActive: true 
  }
];

// Helper functions for database column mapping (Recursive)
const toSnakeCase = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toSnakeCase);
  
  const snakeObj: any = {};
  for (const key in obj) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    const value = obj[key];
    
    // Recursively convert nested objects
    snakeObj[snakeKey] = (typeof value === 'object' && value !== null && !(value instanceof Date)) 
      ? toSnakeCase(value) 
      : value;
  }
  return snakeObj;
};

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

// Helper to generate a valid UUID v4
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const App: React.FC = () => {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSignupView, setIsSignupView] = useState(false);
  const [activeTab, setActiveTab] = useState('introduction');

  // Expose setActiveTab to window for global navigation from components
  useEffect(() => {
    (window as any).setActiveTab = setActiveTab;
  }, []);

  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [savedFormConfigs, setSavedFormConfigs] = useState<any[]>([]);
  const [savedLandingPages, setSavedLandingPages] = useState<any[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData>(INITIAL_DASHBOARD_DATA);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(INITIAL_SYSTEM_SETTINGS);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const saved = sessionStorage.getItem('sil_current_user');
    if (saved) {
      try {
        const user = JSON.parse(saved);
        setCurrentUser(user);
        console.log('[App] Session restored from sessionStorage:', user.loginId);
      } catch (e) {
        console.error('[App] Failed to restore session:', e);
      }
    }
  }, []);

  // Initial Data Fetch from Supabase with Local Fallback
  const fetchAllData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    console.log('[App] Starting data fetch...');
    
    try {
      // 1. Try Supabase with Timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('FETCH_TIMEOUT')), 10000)
      );

      const fetchFromSupabase = (async () => {
        const { data: userData, error: userErr } = await supabase.from('users').select('*');
        if (userErr) console.error('[App] Supabase fetch users error:', userErr);
        
        const { data: leadData, error: leadErr } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
        if (leadErr) console.error('[App] Supabase fetch leads error:', leadErr);
        
        const { data: settingsData, error: setErr } = await supabase.from('system_settings').select('*').single();
        if (setErr) console.error('[App] Supabase fetch settings error:', setErr);
        
        const { data: dashData, error: dashErr } = await supabase.from('dashboard_data').select('*').single();
        if (dashErr) console.error('[App] Supabase fetch dashboard error:', dashErr);
        
        const { data: notifData, error: notifErr } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
        if (notifErr) console.error('[App] Supabase fetch notifications error:', notifErr);
        
        const { data: formData, error: formErr } = await supabase.from('form_configs').select('*');
        if (formErr) console.error('[App] Supabase fetch form_configs error:', formErr);
        
        const { data: landingPages, error: lpErr } = await supabase.from('landing_pages').select('*');
        if (lpErr) console.error('[App] Supabase fetch landing_pages error:', lpErr);
        
        const { data: calData, error: calErr } = await supabase.from('calendar_events').select('*');
        if (calErr) console.error('[App] Supabase fetch calendar_events error:', calErr);
        
        return { userData, leadData, settingsData, dashData, notifData, formData, landingPages, calData };
      })();

      let fetchedUsers: User[] = [];

      try {
        const { userData, leadData, settingsData, dashData, notifData, formData, landingPages, calData }: any = await Promise.race([fetchFromSupabase, timeoutPromise]);
        
        if (userData) {
          fetchedUsers = userData.map(toCamelCase);
          setUsers(fetchedUsers);
        }
        if (leadData) setLeads(leadData.map(toCamelCase));
        if (settingsData) setSystemSettings(toCamelCase(settingsData));
        if (dashData) setDashboardData(toCamelCase(dashData));
        if (notifData) setNotifications(notifData.map(toCamelCase));
        if (formData) setSavedFormConfigs(formData.map(toCamelCase));
        if (landingPages) setSavedLandingPages(landingPages.map(toCamelCase));
        if (calData) setCalendarEvents(calData.map(toCamelCase));
        
        console.log('[App] Data fetch from Supabase successful');
      } catch (supaErr: any) {
        console.warn('[App] Supabase fetch failed or timed out, falling back to local server...', supaErr.message);
        
        // 2. Fallback to Local Express Server
        const [uRes, lRes, sRes] = await Promise.all([
          fetch('/api/users').catch(() => null),
          fetch('/api/leads').catch(() => null),
          fetch('/api/schedules').catch(() => null)
        ]);

        if (uRes && uRes.ok) {
          fetchedUsers = (await uRes.json()).map(toCamelCase);
          setUsers(fetchedUsers);
        }
        if (lRes && lRes.ok) setLeads((await lRes.json()).map(toCamelCase));
        if (sRes && sRes.ok) setCalendarEvents((await sRes.json()).map(toCamelCase));
        
        console.log('[App] Local server fallback fetch completed');
      }
    } catch (error) {
      console.error('[App] Critical error in fetchAllData:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      console.log('[App] Initializing...');
      // Fetch all data (has its own timeout and fallback)
      await fetchAllData();
    };
    init();
  }, [fetchAllData]);

  // Real-time Subscriptions
  useEffect(() => {
    const usersChannel = supabase
      .channel('public:users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
        console.log('[App] Real-time user change:', payload);
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const newUser = toCamelCase(payload.new) as User;
          setUsers(prev => {
            const exists = prev.some(u => u.id === newUser.id);
            if (exists) return prev.map(u => u.id === newUser.id ? newUser : u);
            return [...prev, newUser];
          });
        } else if (payload.eventType === 'DELETE') {
          setUsers(prev => prev.filter(u => u.id === payload.old.id));
        }
      })
      .subscribe();

    const leadsChannel = supabase
      .channel('public:leads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, (payload) => {
        console.log('[App] Real-time lead change:', payload);
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const newLead = toCamelCase(payload.new) as Lead;
          setLeads(prev => {
            const exists = prev.some(l => l.id === newLead.id);
            if (exists) return prev.map(l => l.id === newLead.id ? newLead : l);
            return [newLead, ...prev];
          });
        } else if (payload.eventType === 'DELETE') {
          setLeads(prev => prev.filter(l => l.id === payload.old.id));
        }
      })
      .subscribe();

    const calendarChannel = supabase
      .channel('public:calendar_events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_events' }, (payload) => {
        console.log('[App] Real-time calendar change:', payload);
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const newEvent = toCamelCase(payload.new) as CalendarEvent;
          setCalendarEvents(prev => {
            const exists = prev.some(e => e.id === newEvent.id);
            if (exists) return prev.map(e => e.id === newEvent.id ? newEvent : e);
            return [...prev, newEvent];
          });
        } else if (payload.eventType === 'DELETE') {
          setCalendarEvents(prev => prev.filter(e => e.id === payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(usersChannel);
      supabase.removeChannel(leadsChannel);
      supabase.removeChannel(calendarChannel);
    };
  }, []);

  // Fetch Calendar Events when user changes
  useEffect(() => {
    if (currentUser) {
      const fetchEvents = async () => {
        const { data } = await supabase
          .from('calendar_events')
          .select('*')
          .eq('user_id', currentUser.id);
        if (data) setCalendarEvents(data.map(toCamelCase));
      };
      fetchEvents();
    }
  }, [currentUser?.id]);

  // Sync state changes to Supabase
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.email);
      
      if (event === 'SIGNED_IN' && session?.user) {
        fetchAllData(true); // Refresh all data on sign in silently
        try {
          // Handle 'admin' mapping
          const loginId = session.user.email === 'admin@smartincome.local' ? 'admin' : session.user.email;
          
          // Fetch user directly from DB to ensure we have the latest
          const { data: userData, error } = await supabase.from('users').select('*').eq('login_id', loginId).single();
          
          if (userData) {
            const mappedUser = toCamelCase(userData) as User;
            // Sync ID if it's a placeholder (like admin-0)
            if (mappedUser.id !== session.user.id) {
              console.log('Syncing user ID for:', loginId);
              const { error: syncError } = await supabase.from('users').update({ id: session.user.id }).eq('login_id', loginId);
              if (!syncError) {
                mappedUser.id = session.user.id;
              } else {
                console.error('ID sync error:', syncError);
              }
            }
            setCurrentUser(mappedUser);
          } else {
            console.log('User record not found in DB, checking INITIAL_USERS for:', loginId);
            // If user record doesn't exist but it's a known admin, create it
            const adminInfo = INITIAL_USERS.find(u => u.loginId === loginId);
            if (adminInfo) {
              const newUser = { ...adminInfo, id: session.user.id };
              const { error: insertError } = await supabase.from('users').insert(toSnakeCase(newUser));
              if (!insertError) {
                setUsers(prev => [...prev, newUser]);
                setCurrentUser(newUser);
              } else {
                console.error('Admin insert error:', insertError);
              }
            }
          }
        } catch (err) {
          console.error('Error in onAuthStateChange SIGNED_IN:', err);
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setActiveTab('introduction');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Helper for syncing users
  useEffect(() => {
    if (!isLoading && users.length > 0) {
      // In a real app, we'd only sync changes, but for simplicity:
      // supabase.from('users').upsert(users);
    }
  }, [users, isLoading]);

  // Integration Logic: Sync Dashboard Stats with Member Data
  useEffect(() => {
    // 1. Calculate Dashboard Stats from Users table data
    const totalLeads = users.reduce((acc, curr) => acc + (curr.leadsCount || 0), 0);
    const totalConsultations = users.reduce((acc, curr) => acc + (curr.activeConsultationsCount || 0), 0);
    const totalContentGen = users.reduce((acc, curr) => acc + (curr.contentGenCount || 0), 0);
    const totalInsuranceDesign = users.reduce((acc, curr) => acc + (curr.insuranceDesignCount || 0), 0);
    const totalGoldenSystem = users.reduce((acc, curr) => acc + (curr.goldenSystemCount || 0), 0);
    
    setDashboardData(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        totalLeads: totalLeads.toLocaleString(),
        activeConsultations: totalConsultations.toString(),
        contentGenCount: totalContentGen.toLocaleString(),
        insuranceDesignCount: totalInsuranceDesign.toLocaleString(),
        goldenSystemCount: totalGoldenSystem.toLocaleString(),
      }
    }));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      sessionStorage.setItem('sil_current_user', JSON.stringify(currentUser));
      setIsSignupView(false); // Reset signup view when logged in
      
      // Keep currentUser in sync with users array if it changes there
      const updatedUser = users.find(u => u.id === currentUser.id);
      if (updatedUser && JSON.stringify(updatedUser) !== JSON.stringify(currentUser)) {
        setCurrentUser(updatedUser);
      }
    } else {
      sessionStorage.removeItem('sil_current_user');
    }
  }, [currentUser, users]);

  const handleLogin = async (id: string, pw: string) => {
    console.log('Login attempt started for:', id);
    const MASTER_ADMINS = [
      { id: 'admin', pw: '260301', name: '시스템관리자' },
      { id: 'ilheonha@gmail.com', pw: '!1gkdlfgjs!1', name: '마스터관리자' },
      { id: 'hih@sciencecenter.or.kr', pw: '!1gkdlfgjs!1', name: '마스터관리자' }
    ];

    const masterAdmin = MASTER_ADMINS.find(ma => ma.id === id && ma.pw === pw);

    try {
      // 1. Check Database directly (Custom Auth)
      console.log('Checking public.users table for credentials...');
      const { data: dbUserRaw, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('login_id', id)
        .eq('password', pw)
        .maybeSingle();

      if (dbError) {
        console.error('Database login error:', dbError);
      }

      const dbUser = toCamelCase(dbUserRaw) as User;

      if (dbUser) {
        console.log('User found in database:', dbUser.loginId);
        if (!dbUser.isActive) {
          return { success: false, message: '비활성화된 계정입니다. 관리자에게 문의하세요.' };
        }
        setCurrentUser(dbUser);
        return { success: true };
      }

      // 2. Fallback for Master Admins if not in DB yet
      if (masterAdmin) {
        console.log('Master admin not in DB or password mismatch, using fail-safe bypass:', id);
        const adminInfo = INITIAL_USERS.find(u => u.loginId === id) || {
          id: 'bypass-' + id,
          loginId: id,
          name: masterAdmin.name,
          role: UserRole.ADMIN,
          isActive: true,
          createdAt: new Date().toISOString()
        };
        setCurrentUser(adminInfo as User);
        return { success: true };
      }

      return { success: false, message: '아이디 또는 비밀번호가 일치하지 않습니다.' };
    } catch (error: any) {
      console.error('Login critical error:', error);
      return { success: false, message: '로그인 중 오류가 발생했습니다.' };
    }
  };

  const handleSignup = async (userData: Partial<User>) => {
    const isAdmin = userData.loginId === 'ilheonha@gmail.com' || userData.loginId === 'hih@sciencecenter.or.kr' || userData.loginId === 'admin';
    
    if (!isAdmin && userData.loginId && !userData.loginId.toLowerCase().endsWith('@gmail.com')) {
      return { success: false, message: '아이디는 반드시 gmail 계정(@gmail.com)이어야 합니다.' };
    }

    try {
      console.log('[App] Signup process started for:', userData.loginId);
      
      // 1. Check if user already exists in DB to get their ID
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('login_id', userData.loginId)
        .maybeSingle();

      // 2. Determine ID (Prefer existing ID, then UUID if possible, then generate a new UUID)
      let finalId = existingUser?.id || userData.id || generateUUID();

      // 3. Prepare User Object
      const newUser: User = {
        id: finalId,
        loginId: userData.loginId!,
        password: userData.password,
        name: userData.name!,
        phone: userData.phone!,
        role: userData.role || (isAdmin ? UserRole.ADMIN : UserRole.PARTNER),
        grade: userData.grade || MembershipGrade.SILVER,
        subscriptionStatus: userData.subscriptionStatus || SubscriptionStatus.TRIAL,
        monthlyFee: userData.monthlyFee || systemSettings.defaultMonthlyFee,
        nextPaymentDate: userData.nextPaymentDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        createdAt: userData.createdAt || new Date().toISOString().split('T')[0],
        isActive: userData.isActive !== undefined ? userData.isActive : (isAdmin ? true : systemSettings.autoApproveNewMembers),
        leadsCount: userData.leadsCount || 0,
        activeConsultationsCount: userData.activeConsultationsCount || 0,
        contentGenCount: userData.contentGenCount || 0,
        insuranceDesignCount: userData.insuranceDesignCount || 0,
        goldenSystemCount: userData.goldenSystemCount || 0,
        revenueGenerated: userData.revenueGenerated || 0
      };

      const snakeUser = toSnakeCase(newUser);
      console.log('[App] Saving user data to Database...', userData.loginId, snakeUser);

      // 4. DB Operation
      const { error: dbError } = await supabase.from('users').upsert(snakeUser, { onConflict: 'login_id' });
      
      if (dbError) {
        console.error('[App] Database save failed:', dbError.message, dbError.details, dbError.hint);
        // Fallback to local server if Supabase fails
        try {
          const response = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify([...users, newUser])
          });
          if (!response.ok) throw new Error('Local save failed');
        } catch (localErr) {
          throw new Error('회원 정보를 저장할 수 없습니다: ' + dbError.message);
        }
      }

      // 5. Update Local State Immediately
      setUsers(prev => {
        const filtered = prev.filter(u => u.loginId !== newUser.loginId);
        return [newUser, ...filtered];
      });

      return { 
        success: true, 
        message: isAdmin ? '관리자 계정이 생성되었습니다.' : '회원 등록이 완료되었습니다.' 
      };
    } catch (error: any) {
      console.error('[App] Signup Critical Error:', error);
      return { success: false, message: error.message || '회원 등록 중 오류가 발생했습니다.' };
    }
  };

  const handleLogout = async () => {
    console.log('[App] Logging out...');
    try {
      // No need to call supabase.auth.signOut() as we are using custom auth
      sessionStorage.removeItem('sil_current_user');
      setCurrentUser(null);
      setIsSignupView(false);
      setActiveTab('introduction');
      console.log('[App] Logout complete');
    } catch (e) {
      console.warn('[App] Logout warning:', e);
    }
  };

  const updateUser = async (updatedUser: User) => {
    const { id, ...rest } = updatedUser;
    const { error } = await supabase.from('users').update(toSnakeCase(rest)).eq('id', id);
    if (!error) {
      setUsers(prev => prev.map(u => u.id === id ? updatedUser : u));
      if (currentUser?.id === id) setCurrentUser(updatedUser);
    } else {
      console.error('Update user error:', error);
      alert('회원 정보 수정 중 오류가 발생했습니다: ' + error.message);
    }
  };

  const deleteUser = async (id: string) => {
    console.log('Attempting to delete user:', id);
    const userToDelete = users.find(u => u.id === id);
    const protectedIds = ['admin', 'ilheonha@gmail.com', 'hih@sciencecenter.or.kr'];
    
    if (userToDelete && protectedIds.includes(userToDelete.loginId)) {
      alert('마스터 관리자 계정은 삭제할 수 없습니다.');
      return false;
    }

    try {
      // Delete associated data first to avoid foreign key constraints
      await supabase.from('leads').delete().eq('user_id', id);
      await supabase.from('notifications').delete().eq('target_user_id', id);
      await supabase.from('calendar_events').delete().eq('user_id', id);
      await supabase.from('form_configs').delete().eq('user_id', id);
      await supabase.from('landing_pages').delete().eq('user_id', id);

      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) {
        console.error('Supabase delete error:', error);
        alert('회원 삭제 중 오류가 발생했습니다: ' + error.message);
        return false;
      }

      console.log('User deleted successfully from DB:', id);
      setUsers(prev => prev.filter(u => u.id !== id));
      if (currentUser?.id === id) handleLogout();
      return true;
    } catch (err: any) {
      console.error('Unexpected error during deleteUser:', err);
      alert('삭제 중 예기치 않은 오류가 발생했습니다: ' + (err.message || '알 수 없는 오류'));
      return false;
    }
  };

  const deleteUsers = async (ids: string[]) => {
    console.log('Attempting to bulk delete users:', ids);
    const protectedIds = ['admin', 'ilheonha@gmail.com', 'hih@sciencecenter.or.kr'];
    const usersToDelete = users.filter(u => ids.includes(u.id));
    const idsToDelete = usersToDelete
      .filter(u => !protectedIds.includes(u.loginId))
      .map(u => u.id);

    if (idsToDelete.length === 0) {
      alert('삭제할 수 있는 계정이 없습니다. (관리자 계정 제외)');
      return false;
    }

    try {
      // Delete associated data first
      await supabase.from('leads').delete().in('user_id', idsToDelete);
      await supabase.from('notifications').delete().in('target_user_id', idsToDelete);
      await supabase.from('calendar_events').delete().in('user_id', idsToDelete);
      await supabase.from('form_configs').delete().in('user_id', idsToDelete);
      await supabase.from('landing_pages').delete().in('user_id', idsToDelete);

      const { error } = await supabase.from('users').delete().in('id', idsToDelete);
      if (error) {
        console.error('Supabase bulk delete error:', error);
        alert('회원 일괄 삭제 중 오류가 발생했습니다: ' + error.message);
        return false;
      }

      console.log('Users deleted successfully from DB:', idsToDelete);
      setUsers(prev => prev.filter(u => !idsToDelete.includes(u.id)));
      return true;
    } catch (err: any) {
      console.error('Unexpected error during deleteUsers:', err);
      alert('일괄 삭제 중 예기치 않은 오류가 발생했습니다: ' + (err.message || '알 수 없는 오류'));
      return false;
    }
  };

  const addLead = async (leadData: Partial<Lead>) => {
    const newLead: Lead = {
      id: 'l_' + Math.random().toString(36).substr(2, 9),
      userId: currentUser?.id || 'admin-1',
      name: leadData.name || '무명 고객',
      phone: leadData.phone || '010-0000-0000',
      status: leadData.status || LeadStatus.NEW,
      priority: leadData.priority || 'MEDIUM',
      source: leadData.source || '직접 입력',
      createdAt: new Date().toISOString().split('T')[0],
      submittedAt: new Date().toLocaleString(),
      ...leadData
    };
    const { error } = await supabase.from('leads').insert(toSnakeCase(newLead));
    if (!error) {
      setLeads(prev => [newLead, ...prev]);
    }
  };

  const addLeads = async (leadsData: Partial<Lead>[]) => {
    const newLeads: Lead[] = leadsData.map(leadData => ({
      id: 'l_' + Math.random().toString(36).substr(2, 9),
      userId: currentUser?.id || 'admin-1',
      name: leadData.name || '무명 고객',
      phone: leadData.phone || '010-0000-0000',
      status: leadData.status || LeadStatus.NEW,
      priority: leadData.priority || 'MEDIUM',
      source: leadData.source || '직접 입력',
      createdAt: new Date().toISOString().split('T')[0],
      submittedAt: new Date().toLocaleString(),
      ...leadData
    }));
    const { error } = await supabase.from('leads').insert(newLeads.map(toSnakeCase));
    if (!error) {
      setLeads(prev => [...newLeads, ...prev]);
    }
  };

  const updateLead = async (updatedLead: Lead) => {
    const { error } = await supabase.from('leads').update(toSnakeCase(updatedLead)).eq('id', updatedLead.id);
    if (!error) {
      setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
    }
  };

  const deleteLead = async (id: string) => {
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (!error) {
      setLeads(prev => prev.filter(l => l.id !== id));
    }
  };

  const deleteLeads = async (ids: string[]) => {
    const { error } = await supabase.from('leads').delete().in('id', ids);
    if (!error) {
      setLeads(prev => prev.filter(l => !ids.includes(l.id)));
    }
  };

  const addNotification = async (notif: Partial<AppNotification>) => {
    const newNotif: AppNotification = {
      id: 'n_' + Math.random().toString(36).substr(2, 9),
      type: notif.type || 'INFO',
      title: notif.title || '알림',
      message: notif.message || '',
      targetUserId: notif.targetUserId,
      targetUserName: notif.targetUserName,
      createdAt: new Date().toISOString(),
    };
    const { error } = await supabase.from('notifications').insert(toSnakeCase(newNotif));
    if (!error) {
      setNotifications(prev => [newNotif, ...prev]);
    }
  };

  const deleteNotification = async (id: string) => {
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (!error) {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  const deleteNotifications = async (ids: string[]) => {
    const { error } = await supabase.from('notifications').delete().in('id', ids);
    if (!error) {
      setNotifications(prev => prev.filter(n => !ids.includes(n.id)));
    }
  };

  // Update Dashboard Data in Supabase
  const updateDashboardData = async (data: DashboardData) => {
    const { error } = await supabase.from('dashboard_data').upsert(toSnakeCase({ id: 1, ...data }));
    if (!error) setDashboardData(data);
  };

  // Update System Settings in Supabase
  const updateSystemSettings = async (settings: SystemSettings) => {
    const { error } = await supabase.from('system_settings').upsert(toSnakeCase({ id: 1, ...settings }));
    if (!error) setSystemSettings(settings);
  };

  const isPublicForm = window.location.pathname.includes('/form/');

  // Calendar Event Handlers
  const addCalendarEvent = async (eventData: Partial<CalendarEvent>) => {
    if (!currentUser) {
      alert('로그인이 필요합니다.');
      return;
    }

    const newEvent: CalendarEvent = {
      id: 'ev_' + Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      date: eventData.date || new Date().toISOString().split('T')[0],
      title: eventData.title || '',
      time: eventData.time || '10:00',
      content: eventData.content || '',
      location: eventData.location || '',
      memo: eventData.memo || '',
      createdAt: new Date().toISOString()
    };

    try {
      const { error } = await supabase.from('calendar_events').insert(toSnakeCase(newEvent));
      if (error) {
        console.error('[App] Supabase addCalendarEvent error:', error);
        alert('일정 저장 중 오류가 발생했습니다: ' + error.message);
        return;
      }
      setCalendarEvents(prev => [...prev, newEvent]);
    } catch (err: any) {
      console.error('[App] Unexpected error in addCalendarEvent:', err);
      alert('일정 저장 중 예기치 않은 오류가 발생했습니다.');
    }
  };

  const updateCalendarEvent = async (updatedEvent: CalendarEvent) => {
    try {
      const { error } = await supabase.from('calendar_events').update(toSnakeCase(updatedEvent)).eq('id', updatedEvent.id);
      if (error) {
        console.error('[App] Supabase updateCalendarEvent error:', error);
        alert('일정 수정 중 오류가 발생했습니다: ' + error.message);
        return;
      }
      setCalendarEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
    } catch (err: any) {
      console.error('[App] Unexpected error in updateCalendarEvent:', err);
      alert('일정 수정 중 예기치 않은 오류가 발생했습니다.');
    }
  };

  const deleteCalendarEvent = async (id: string) => {
    const { error } = await supabase.from('calendar_events').delete().eq('id', id);
    if (!error) {
      setCalendarEvents(prev => prev.filter(e => e.id !== id));
    }
  };

  const deleteCalendarEvents = async (ids: string[]) => {
    const { error } = await supabase.from('calendar_events').delete().in('id', ids);
    if (!error) {
      setCalendarEvents(prev => prev.filter(e => !ids.includes(e.id)));
    }
  };

  // Database Reset Handler
  const resetDatabase = async () => {
    if (!confirm('관리자를 제외한 모든 데이터를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
    
    setIsLoading(true);
    try {
      console.log('[App] Starting database reset...');
      
      // 1. Get admin IDs to preserve
      const adminLogins = INITIAL_USERS.map(u => u.loginId);
      const { data: adminUsers } = await supabase.from('users').select('id').in('login_id', adminLogins);
      const adminIds = adminUsers?.map(u => u.id) || [];

      // 2. Delete data from all tables except admins
      // Delete non-admin users (associated data will be deleted via CASCADE if set up, but let's be explicit)
      await supabase.from('leads').delete().neq('id', '0'); // Delete all leads
      await supabase.from('notifications').delete().neq('id', '0'); // Delete all notifications
      await supabase.from('calendar_events').delete().neq('id', '0'); // Delete all events
      await supabase.from('form_configs').delete().neq('id', '0'); // Delete all configs
      await supabase.from('landing_pages').delete().neq('id', '0'); // Delete all pages
      
      // Delete non-admin users
      if (adminIds.length > 0) {
        await supabase.from('users').delete().not('id', 'in', `(${adminIds.join(',')})`);
      } else {
        // If no admins found in DB, just delete all and they will be re-seeded
        await supabase.from('users').delete().neq('id', '0');
      }

      // 3. Reset Dashboard and Settings to initial
      await supabase.from('dashboard_data').upsert(toSnakeCase({ id: 1, ...INITIAL_DASHBOARD_DATA }));
      await supabase.from('system_settings').upsert(toSnakeCase({ id: 1, ...INITIAL_SYSTEM_SETTINGS }));

      console.log('[App] Database reset complete. Re-fetching data...');
      await fetchAllData();
      alert('데이터베이스가 성공적으로 초기화되었습니다.');
    } catch (error) {
      console.error('[App] Error during database reset:', error);
      alert('초기화 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // Form Config Handlers
  const addFormConfig = async (config: any) => {
    try {
      const snakeConfig = toSnakeCase(config);
      console.log('[App] Saving form config to Supabase:', snakeConfig);
      const { error } = await supabase.from('form_configs').upsert(snakeConfig);
      if (error) {
        console.error('[App] Supabase form_configs save error:', error);
        throw error;
      }
      setSavedFormConfigs(prev => {
        const filtered = prev.filter(c => c.id !== config.id);
        return [...filtered, config];
      });
    } catch (error: any) {
      console.error('[App] addFormConfig error:', error);
      alert('폼 설정을 저장하는 중 오류가 발생했습니다: ' + (error.message || '알 수 없는 오류'));
      throw error;
    }
  };

  const deleteFormConfig = async (id: string) => {
    try {
      const { error } = await supabase.from('form_configs').delete().eq('id', id);
      if (error) throw error;
      setSavedFormConfigs(prev => prev.filter(c => c.id !== id));
    } catch (error: any) {
      console.error('[App] deleteFormConfig error:', error);
      alert('폼 설정을 삭제하는 중 오류가 발생했습니다.');
    }
  };

  // Landing Page Handlers
  const addLandingPage = async (page: any) => {
    const pageWithUser = {
      ...page,
      userId: currentUser?.id
    };
    const { error } = await supabase.from('landing_pages').insert(toSnakeCase(pageWithUser));
    if (error) {
      console.error('Landing page save error:', error);
      throw error;
    }
    setSavedLandingPages(prev => [...prev, pageWithUser]);
  };

  const deleteLandingPage = async (id: string) => {
    const { error } = await supabase.from('landing_pages').delete().eq('id', id);
    if (!error) {
      setSavedLandingPages(prev => prev.filter(p => p.id !== id));
    }
  };

  if (isPublicForm) {
    return <PublicFormView />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mb-6"></div>
        <div className="text-center space-y-2">
          <p className="text-white font-bold uppercase tracking-[0.3em] text-sm">Smart Income</p>
          <p className="text-white/40 font-medium text-[10px] uppercase tracking-widest">데이터를 동기화하는 중입니다...</p>
        </div>
        <button 
          onClick={() => {
            sessionStorage.clear();
            window.location.reload();
          }}
          className="mt-12 text-[10px] text-white/20 hover:text-white/40 transition-colors uppercase tracking-widest"
        >
          로그인 세션 초기화
        </button>
      </div>
    );
  }

  if (!currentUser) {
    if (isSignupView) {
      return <Signup onSignupSuccess={handleSignup} onGoToLogin={() => setIsSignupView(false)} />;
    }
    return <Login onLogin={handleLogin} onGoToSignup={() => setIsSignupView(true)} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'introduction': return <Introduction onNavigate={setActiveTab} />;
      case 'dashboard': {
        const userEvents = currentUser.role === UserRole.ADMIN ? calendarEvents : calendarEvents.filter(e => e.userId === currentUser.id);
        return <Dashboard data={dashboardData} users={users} currentUser={currentUser} leads={leads} notifications={notifications} calendarEvents={userEvents} />;
      }
      case 'marketing': return <Marketing currentUser={currentUser} onUpdateUser={updateUser} />;
      case 'ai-hub': return <AIHub currentUser={currentUser} onUpdateUser={updateUser} />;
      case 'useful-tools': {
        const userEvents = currentUser.role === UserRole.ADMIN ? calendarEvents : calendarEvents.filter(e => e.userId === currentUser.id);
        return (
          <UsefulTools 
            currentUser={currentUser} 
            onUpdateUser={updateUser} 
            calendarEvents={userEvents} 
            onAddEvent={addCalendarEvent}
            onUpdateEvent={updateCalendarEvent}
            onDeleteEvent={deleteCalendarEvent}
            onDeleteEvents={deleteCalendarEvents}
          />
        );
      }
      case 'lead-collection': {
        const userLeads = currentUser.role === UserRole.ADMIN ? leads : leads.filter(l => l.userId === currentUser.id);
        const userForms = currentUser.role === UserRole.ADMIN ? savedFormConfigs : savedFormConfigs.filter(f => f.userId === currentUser.id);
        const userPages = currentUser.role === UserRole.ADMIN ? savedLandingPages : savedLandingPages.filter(p => p.userId === currentUser.id);
        
        return (
          <LeadCollection 
            currentUser={currentUser}
            leads={userLeads} 
            onAddLead={addLead}
            onDeleteLead={deleteLead}
            onDeleteLeads={deleteLeads}
            setActiveTab={setActiveTab}
            savedFormConfigs={userForms}
            onSaveFormConfig={addFormConfig}
            onDeleteFormConfig={deleteFormConfig}
            savedLandingPages={userPages}
            onSaveLandingPage={addLandingPage}
            onDeleteLandingPage={deleteLandingPage}
          />
        );
      }
      case 'crm': {
        const userLeads = currentUser.role === UserRole.ADMIN ? leads : leads.filter(l => l.userId === currentUser.id);
        return (
          <CRM 
            leads={userLeads} 
            currentUser={currentUser} 
            onAddLead={addLead} 
            onAddLeads={addLeads}
            onUpdateLead={updateLead} 
            onDeleteLead={deleteLead} 
            onDeleteLeads={deleteLeads}
          />
        );
      }
      case 'settings': return (
        <Settings 
          onLogout={handleLogout} 
          user={currentUser} 
          onUpdateUser={updateUser}
          systemSettings={systemSettings}
          setSystemSettings={updateSystemSettings}
        />
      );
      case 'member-management': return <MemberManagement users={users} onUpdateUser={updateUser} onDeleteUser={deleteUser} onDeleteUsers={deleteUsers} onAddUser={handleSignup} onRefresh={fetchAllData} />;
      case 'secret-room': return <SecretRoom user={currentUser} />;
      case 'admin': return (
        <Admin 
          dashboardData={dashboardData} 
          setDashboardData={updateDashboardData} 
          systemSettings={systemSettings}
          setSystemSettings={updateSystemSettings}
          users={users}
          onUpdateUser={updateUser}
          notifications={notifications}
          onAddNotification={addNotification}
          onDeleteNotification={deleteNotification}
          onDeleteNotifications={deleteNotifications}
          onResetDatabase={resetDatabase}
          onRefresh={fetchAllData}
        />
      );
      default: return <Dashboard data={dashboardData} users={users} currentUser={currentUser} leads={leads} notifications={notifications} calendarEvents={calendarEvents} />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} user={currentUser} onLogout={handleLogout}>
      {renderContent()}
    </Layout>
  );
};

export default App;
