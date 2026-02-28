'use client';

import { useState, useEffect, useRef, useTransition, useCallback } from 'react';
import { Megaphone, Plus, Edit, Trash2, X, ArrowLeft, Target, DollarSign, Users, CalendarDays, TrendingUp, CheckCircle2, Clock, AlertCircle, BarChart3, Save, ChevronDown, ChevronUp } from 'lucide-react';

// Hook to detect mobile viewport
function useIsMobile(breakpoint = 640) {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < breakpoint);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, [breakpoint]);
    return isMobile;
}
import { getCampaigns, createCampaign, updateCampaign, deleteCampaign, createTask, updateTask, deleteTask, createEvaluation, deleteEvaluation, createExpense, deleteExpense, getProfiles } from './actions';
import { MarketingCampaign, MarketingTask, MarketingEvaluation, MarketingExpense } from '@/types/marketing';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
    draft: { label: 'แบบร่าง', color: '#64748b', bg: '#f1f5f9' },
    active: { label: 'กำลังดำเนินการ', color: '#3b82f6', bg: '#eff6ff' },
    completed: { label: 'เสร็จสิ้น', color: '#22c55e', bg: '#f0fdf4' },
    cancelled: { label: 'ยกเลิก', color: '#ef4444', bg: '#fef2f2' },
};

const PRIORITY_MAP: Record<string, { label: string; color: string }> = {
    low: { label: 'ต่ำ', color: '#22c55e' },
    medium: { label: 'ปานกลาง', color: '#f59e0b' },
    high: { label: 'สูง', color: '#ef4444' },
};

const TASK_STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: 'รอดำเนินการ', color: '#f59e0b', bg: '#fffbeb' },
    in_progress: { label: 'กำลังทำ', color: '#3b82f6', bg: '#eff6ff' },
    completed: { label: 'เสร็จแล้ว', color: '#22c55e', bg: '#f0fdf4' },
};

const fmt = (n: number) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 }).format(n);
const fmtNum = (n: number) => new Intl.NumberFormat('th-TH').format(n);

export default function MarketingPage() {
    const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<MarketingCampaign | null>(null);
    const [profiles, setProfiles] = useState<{ id: string; full_name: string }[]>([]);
    const [isSubmitting, startTransition] = useTransition();
    const isMobile = useIsMobile();

    // Campaign Modal
    const campaignDialogRef = useRef<HTMLDialogElement>(null);
    const [editingCampaign, setEditingCampaign] = useState<MarketingCampaign | null>(null);
    const [campaignForm, setCampaignForm] = useState({
        name: '', description: '', strategy: '', status: 'draft',
        start_date: '', end_date: '', budget: 0, expected_sales: 0, expected_leads: 0, notes: '',
    });

    // Task Modal
    const taskDialogRef = useRef<HTMLDialogElement>(null);
    const [editingTask, setEditingTask] = useState<MarketingTask | null>(null);
    const [taskForm, setTaskForm] = useState({
        title: '', description: '', assigned_to: '', status: 'pending', due_date: '', priority: 'medium',
    });

    // Evaluation Modal
    const evalDialogRef = useRef<HTMLDialogElement>(null);
    const [evalForm, setEvalForm] = useState({
        evaluation_date: new Date().toISOString().split('T')[0],
        sales_result: 0, leads_result: 0, spend_result: 0, roi: 0, summary: '',
    });

    const [evalOpen, setEvalOpen] = useState(true);
    const [expenseForm, setExpenseForm] = useState({ actual_sales: 0, actual_leads: 0, actual_spend: 0 });
    const [newExpense, setNewExpense] = useState({ description: '', amount: 0, expense_date: new Date().toISOString().split('T')[0], category: 'อื่นๆ' });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [c, p] = await Promise.all([getCampaigns(), getProfiles()]);
            setCampaigns(c as MarketingCampaign[]);
            setProfiles(p);
        } finally { setLoading(false); }
    };

    const refreshSelected = (list: MarketingCampaign[]) => {
        if (selected) {
            const updated = list.find(c => c.id === selected.id);
            if (updated) setSelected(updated);
        }
    };

    // Campaign CRUD
    const openCampaignModal = (c?: MarketingCampaign) => {
        if (c) {
            setEditingCampaign(c);
            setCampaignForm({
                name: c.name, description: c.description || '', strategy: c.strategy || '',
                status: c.status, start_date: c.start_date || '', end_date: c.end_date || '',
                budget: c.budget, expected_sales: c.expected_sales, expected_leads: c.expected_leads,
                notes: c.notes || '',
            });
        } else {
            setEditingCampaign(null);
            setCampaignForm({ name: '', description: '', strategy: '', status: 'draft', start_date: '', end_date: '', budget: 0, expected_sales: 0, expected_leads: 0, notes: '' });
        }
        campaignDialogRef.current?.showModal();
    };

    const handleCampaignSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            try {
                if (editingCampaign) { await updateCampaign(editingCampaign.id, campaignForm); }
                else { await createCampaign(campaignForm); }
                campaignDialogRef.current?.close();
                const c = await getCampaigns() as MarketingCampaign[];
                setCampaigns(c);
                refreshSelected(c);
            } catch { alert('เกิดข้อผิดพลาด'); }
        });
    };

    const handleDeleteCampaign = async (id: string) => {
        if (!confirm('ลบแคมเปญนี้?')) return;
        startTransition(async () => {
            await deleteCampaign(id);
            setSelected(null);
            const c = await getCampaigns() as MarketingCampaign[];
            setCampaigns(c);
        });
    };

    // Task CRUD
    const openTaskModal = (t?: MarketingTask) => {
        if (t) {
            setEditingTask(t);
            setTaskForm({ title: t.title, description: t.description || '', assigned_to: t.assigned_to || '', status: t.status, due_date: t.due_date || '', priority: t.priority });
        } else {
            setEditingTask(null);
            setTaskForm({ title: '', description: '', assigned_to: '', status: 'pending', due_date: '', priority: 'medium' });
        }
        taskDialogRef.current?.showModal();
    };

    const handleTaskSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selected) return;
        startTransition(async () => {
            try {
                if (editingTask) { await updateTask(editingTask.id, taskForm); }
                else { await createTask({ ...taskForm, campaign_id: selected.id }); }
                taskDialogRef.current?.close();
                const c = await getCampaigns() as MarketingCampaign[];
                setCampaigns(c);
                refreshSelected(c);
            } catch { alert('เกิดข้อผิดพลาด'); }
        });
    };

    const handleDeleteTask = async (id: string) => {
        if (!confirm('ลบงานนี้?')) return;
        startTransition(async () => {
            await deleteTask(id);
            const c = await getCampaigns() as MarketingCampaign[];
            setCampaigns(c);
            refreshSelected(c);
        });
    };

    const handleToggleTaskStatus = async (t: MarketingTask) => {
        const next = t.status === 'completed' ? 'pending' : t.status === 'pending' ? 'in_progress' : 'completed';
        startTransition(async () => {
            await updateTask(t.id, { status: next });
            const c = await getCampaigns() as MarketingCampaign[];
            setCampaigns(c);
            refreshSelected(c);
        });
    };

    // Evaluation
    const openEvalModal = () => {
        setEvalForm({ evaluation_date: new Date().toISOString().split('T')[0], sales_result: 0, leads_result: 0, spend_result: 0, roi: 0, summary: '' });
        evalDialogRef.current?.showModal();
    };

    const handleEvalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selected) return;
        startTransition(async () => {
            try {
                await createEvaluation({ ...evalForm, campaign_id: selected.id });
                evalDialogRef.current?.close();
                const c = await getCampaigns() as MarketingCampaign[];
                setCampaigns(c);
                refreshSelected(c);
            } catch { alert('เกิดข้อผิดพลาด'); }
        });
    };

    const handleDeleteEval = async (id: string) => {
        if (!confirm('ลบผลประเมินนี้?')) return;
        startTransition(async () => {
            await deleteEvaluation(id);
            const c = await getCampaigns() as MarketingCampaign[];
            setCampaigns(c);
            refreshSelected(c);
        });
    };

    // Stats
    const totalBudget = campaigns.reduce((s, c) => s + (c.budget || 0), 0);
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
    const totalExpectedSales = campaigns.reduce((s, c) => s + (c.expected_sales || 0), 0);
    const totalExpectedLeads = campaigns.reduce((s, c) => s + (c.expected_leads || 0), 0);

    // ══════════════════════════════
    // DETAIL VIEW
    // ══════════════════════════════
    if (selected) {
        const tasks = selected.tasks || [];
        const evals = selected.evaluations || [];
        const completedTasks = tasks.filter(t => t.status === 'completed').length;
        const taskProgress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

        // Sync expense form when selected changes
        const syncExpenseForm = () => {
            if (selected) {
                setExpenseForm({
                    actual_sales: selected.actual_sales || 0,
                    actual_leads: selected.actual_leads || 0,
                    actual_spend: selected.actual_spend || 0,
                });
            }
        };

        const handleSaveExpenses = async () => {
            startTransition(async () => {
                try {
                    await updateCampaign(selected.id, expenseForm);
                    const c = await getCampaigns() as MarketingCampaign[];
                    setCampaigns(c);
                    const updated = c.find(x => x.id === selected.id);
                    if (updated) setSelected(updated);
                } catch { alert('เกิดข้อผิดพลาด'); }
            });
        };

        const handleAddExpense = async (e: React.FormEvent) => {
            e.preventDefault();
            if (!newExpense.description || !newExpense.amount) return;
            startTransition(async () => {
                try {
                    await createExpense({ ...newExpense, campaign_id: selected.id });
                    setNewExpense({ description: '', amount: 0, expense_date: new Date().toISOString().split('T')[0], category: 'อื่นๆ' });
                    const c = await getCampaigns() as MarketingCampaign[];
                    setCampaigns(c);
                    const updated = c.find(x => x.id === selected.id);
                    if (updated) setSelected(updated);
                } catch { alert('เกิดข้อผิดพลาด'); }
            });
        };

        const handleDeleteExpense = async (id: string) => {
            if (!confirm('ลบรายการค่าใช้จ่ายนี้?')) return;
            startTransition(async () => {
                await deleteExpense(id);
                const c = await getCampaigns() as MarketingCampaign[];
                setCampaigns(c);
                const updated = c.find(x => x.id === selected.id);
                if (updated) setSelected(updated);
            });
        };

        const expenses = selected.expenses || [];
        const totalExpenses = expenses.reduce((sum, ex) => sum + (ex.amount || 0), 0);

        return (
            <div style={{ display: 'flex', height: '100vh', backgroundColor: 'var(--bg-main)' }}>
                <main style={{ flex: 1, overflowY: 'auto' }}>
                    <div style={{ padding: isMobile ? '1rem' : '2rem', maxWidth: '1200px', margin: '0 auto' }}>
                        <button onClick={() => setSelected(null)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem', marginBottom: '1.5rem', padding: 0 }}>
                            <ArrowLeft size={18} /> กลับไปยังรายการแคมเปญ
                        </button>

                        {/* Campaign Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                    <h1 style={{ fontSize: isMobile ? '1.25rem' : '1.75rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>{selected.name}</h1>
                                    <span style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, color: STATUS_MAP[selected.status]?.color, background: STATUS_MAP[selected.status]?.bg }}>{STATUS_MAP[selected.status]?.label}</span>
                                </div>
                                {selected.strategy && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0.25rem 0' }}>กลยุทธ์: {selected.strategy}</p>}
                                {selected.description && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.25rem 0' }}>{selected.description}</p>}
                                {(selected.start_date || selected.end_date) && (
                                    <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.5rem' }}>
                                        <CalendarDays size={14} /> {selected.start_date || '?'} — {selected.end_date || '?'}
                                    </p>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={() => openCampaignModal(selected)} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}><Edit size={14} /> แก้ไข</button>
                                <button onClick={() => handleDeleteCampaign(selected.id)} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 'var(--radius-lg)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}><Trash2 size={14} /> ลบ</button>
                            </div>
                        </div>

                        {/* Forecast Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(180px, 1fr))', gap: isMobile ? '0.75rem' : '1rem', marginBottom: '1.5rem' }}>
                            {[
                                { label: 'งบประมาณ', value: fmt(selected.budget), icon: DollarSign, gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)' },
                                { label: 'คาดการณ์ยอดขาย', value: fmt(selected.expected_sales), icon: TrendingUp, gradient: 'linear-gradient(135deg, #22c55e, #16a34a)' },
                                { label: 'คาดการณ์ลูกค้าสนใจ', value: fmtNum(selected.expected_leads) + ' คน', icon: Users, gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' },
                                { label: 'ความคืบหน้างาน', value: taskProgress + '%', icon: CheckCircle2, gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
                            ].map((s, i) => (
                                <div key={i} style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', padding: isMobile ? '0.85rem' : '1.25rem', display: 'flex', alignItems: 'center', gap: isMobile ? '0.65rem' : '1rem' }}>
                                    <div style={{ width: isMobile ? 36 : 44, height: isMobile ? 36 : 44, borderRadius: 'var(--radius-lg)', background: s.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}><s.icon size={isMobile ? 16 : 20} /></div>
                                    <div><p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>{s.label}</p><p style={{ fontSize: isMobile ? '0.9rem' : '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>{s.value}</p></div>
                                </div>
                            ))}
                        </div>

                        {/* Expense Items Section */}
                        <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', overflow: 'hidden', marginBottom: '1.5rem' }}>
                            <div style={{ padding: isMobile ? '1rem' : '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, #ef4444, #dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><DollarSign size={18} /></div>
                                    <div><h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>ค่าใช้จ่าย</h3><p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>รวม: {fmt(totalExpenses)} | งบประมาณ: {fmt(selected.budget)}</p></div>
                                </div>
                            </div>
                            <div style={{ padding: isMobile ? '1rem' : '1.25rem 1.5rem' }}>
                                {/* Add Expense Form */}
                                <form onSubmit={handleAddExpense} style={{ display: 'flex', gap: '0.5rem', marginBottom: expenses.length > 0 ? '1rem' : 0, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                                    <div style={{ flex: 2, minWidth: isMobile ? '100%' : '150px' }}>
                                        <label style={labelStyle}>รายละเอียด</label>
                                        <input required value={newExpense.description} onChange={e => setNewExpense({ ...newExpense, description: e.target.value })} style={inputStyle} placeholder="เช่น ค่าโฆษณา Facebook" />
                                    </div>
                                    <div style={{ flex: 1, minWidth: isMobile ? '45%' : '100px' }}>
                                        <label style={labelStyle}>จำนวนเงิน (฿)</label>
                                        <input required type="number" value={newExpense.amount || ''} onChange={e => setNewExpense({ ...newExpense, amount: Number(e.target.value) })} style={inputStyle} placeholder="0" />
                                    </div>
                                    <div style={{ flex: 1, minWidth: isMobile ? '45%' : '120px' }}>
                                        <label style={labelStyle}>วันที่</label>
                                        <input type="date" value={newExpense.expense_date} onChange={e => setNewExpense({ ...newExpense, expense_date: e.target.value })} style={inputStyle} />
                                    </div>
                                    <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ padding: '0.65rem 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap', height: 'fit-content' }}>
                                        <Plus size={14} /> เพิ่ม
                                    </button>
                                </form>

                                {/* Expense List */}
                                {expenses.length > 0 && (
                                    <div>
                                        {expenses.map(ex => (
                                            <div key={ex.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p style={{ fontWeight: 600, fontSize: '0.85rem', margin: 0, color: 'var(--text-main)' }}>{ex.description}</p>
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', margin: '0.15rem 0 0' }}>{ex.expense_date}</p>
                                                </div>
                                                <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#ef4444', margin: 0, flexShrink: 0 }}>{fmt(ex.amount)}</p>
                                                <button onClick={() => handleDeleteExpense(ex.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0.25rem', flexShrink: 0 }}><Trash2 size={14} /></button>
                                            </div>
                                        ))}
                                        {/* Total */}
                                        <div style={{ padding: '0.75rem 0', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.5rem' }}>
                                            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', margin: 0 }}>รวมทั้งหมด:</p>
                                            <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ef4444', margin: 0 }}>{fmt(totalExpenses)}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tasks Section */}
                        <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', overflow: 'hidden', marginBottom: '2rem' }}>
                            <div style={{ padding: isMobile ? '1rem' : '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><CheckCircle2 size={18} /></div>
                                    <div><h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>รายการงาน / หน้าที่</h3><p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>{completedTasks}/{tasks.length} เสร็จแล้ว</p></div>
                                </div>
                                <button onClick={() => openTaskModal()} className="btn-primary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}><Plus size={14} /> เพิ่มงาน</button>
                            </div>
                            {tasks.length === 0 ? (
                                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-dim)' }}>ยังไม่มีรายการงาน</div>
                            ) : (
                                <div>
                                    {/* Progress Bar */}
                                    <div style={{ padding: '1rem 1.5rem 0.5rem' }}>
                                        <div style={{ height: 8, background: 'var(--bg-input)', borderRadius: 99, overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: taskProgress + '%', background: 'linear-gradient(90deg, #22c55e, #16a34a)', borderRadius: 99, transition: 'width 0.5s ease' }} />
                                        </div>
                                    </div>
                                    {tasks.map(t => (
                                        <div key={t.id} style={{ padding: isMobile ? '0.85rem 1rem' : '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: isMobile ? '0.65rem' : '1rem' }}>
                                            <button onClick={() => handleToggleTaskStatus(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: TASK_STATUS_MAP[t.status]?.color, flexShrink: 0 }}>
                                                {t.status === 'completed' ? <CheckCircle2 size={22} /> : t.status === 'in_progress' ? <Clock size={22} /> : <AlertCircle size={22} />}
                                            </button>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ fontWeight: 600, fontSize: '0.9rem', margin: 0, textDecoration: t.status === 'completed' ? 'line-through' : 'none', color: t.status === 'completed' ? 'var(--text-dim)' : 'var(--text-main)' }}>{t.title}</p>
                                                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                                                    {t.due_date && <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>กำหนด: {t.due_date}</span>}
                                                    <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.5rem', borderRadius: 99, fontWeight: 600, color: PRIORITY_MAP[t.priority]?.color, background: PRIORITY_MAP[t.priority]?.color + '18' }}>{PRIORITY_MAP[t.priority]?.label}</span>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                                                <button onClick={() => openTaskModal(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}><Edit size={15} /></button>
                                                <button onClick={() => handleDeleteTask(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0.25rem' }}><Trash2 size={15} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Evaluation Section */}
                        <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                            <button onClick={() => setEvalOpen(!evalOpen)} style={{ width: '100%', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><BarChart3 size={18} /></div>
                                    <div><h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>ประเมินผล</h3><p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>เปรียบเทียบ คาดการณ์ vs ผลจริง</p></div>
                                </div>
                                {evalOpen ? <ChevronUp size={20} color="var(--text-muted)" /> : <ChevronDown size={20} color="var(--text-muted)" />}
                            </button>
                            {evalOpen && (
                                <div style={{ borderTop: '1px solid var(--border)', padding: '1.5rem' }}>
                                    {/* Comparison Grid */}
                                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                        {[
                                            { label: 'ยอดขาย', expected: selected.expected_sales, actual: selected.actual_sales, format: fmt },
                                            { label: 'ลูกค้าสนใจ', expected: selected.expected_leads, actual: selected.actual_leads, format: (n: number) => fmtNum(n) + ' คน' },
                                            { label: 'เงินลงทุน', expected: selected.budget, actual: selected.actual_spend, format: fmt },
                                        ].map((item, i) => {
                                            const pct = item.expected > 0 ? Math.round((item.actual / item.expected) * 100) : 0;
                                            return (
                                                <div key={i} style={{ padding: '1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-lg)' }}>
                                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 0.5rem' }}>{item.label}</p>
                                                    <p style={{ fontSize: '0.75rem', margin: '0.25rem 0' }}>คาดการณ์: <strong>{item.format(item.expected)}</strong></p>
                                                    <p style={{ fontSize: '0.75rem', margin: '0.25rem 0' }}>ผลจริง: <strong style={{ color: item.actual >= item.expected && item.expected > 0 ? '#22c55e' : '#ef4444' }}>{item.format(item.actual)}</strong></p>
                                                    <div style={{ height: 6, background: '#e2e8f0', borderRadius: 99, marginTop: '0.5rem', overflow: 'hidden' }}>
                                                        <div style={{ height: '100%', width: Math.min(pct, 100) + '%', background: pct >= 100 ? '#22c55e' : '#3b82f6', borderRadius: 99, transition: 'width 0.5s ease' }} />
                                                    </div>
                                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textAlign: 'right', margin: '0.25rem 0 0' }}>{pct}%</p>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Add Evaluation Button */}
                                    <button onClick={openEvalModal} className="btn-primary" style={{ marginBottom: '1rem', padding: '0.45rem 1rem', fontSize: '0.85rem' }}><Plus size={14} /> เพิ่มผลประเมิน</button>

                                    {/* Evaluations List */}
                                    {evals.length > 0 && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            {evals.map(ev => (
                                                <div key={ev.id} style={{ padding: '1rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <div>
                                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', margin: 0 }}>{ev.evaluation_date}</p>
                                                        <p style={{ fontSize: isMobile ? '0.75rem' : '0.85rem', margin: '0.25rem 0', wordBreak: 'break-word' }}>ยอดขาย: {fmt(ev.sales_result)} | ลูกค้า: {ev.leads_result} คน | ค่าใช้จ่าย: {fmt(ev.spend_result)}</p>
                                                        {ev.roi > 0 && <p style={{ fontSize: '0.8rem', color: '#22c55e', fontWeight: 600, margin: 0 }}>ROI: {ev.roi}%</p>}
                                                        {ev.summary && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>{ev.summary}</p>}
                                                    </div>
                                                    <button onClick={() => handleDeleteEval(ev.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0.25rem', flexShrink: 0 }}><Trash2 size={14} /></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Task Modal */}
                    <dialog ref={taskDialogRef} style={{ maxWidth: 480 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0 }}>{editingTask ? 'แก้ไขงาน' : 'เพิ่มงานใหม่'}</h2>
                            <button onClick={() => taskDialogRef.current?.close()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleTaskSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div><label style={labelStyle}>ชื่องาน *</label><input required value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} style={inputStyle} /></div>
                            <div><label style={labelStyle}>รายละเอียด</label><textarea value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} style={{ ...inputStyle, minHeight: 60 }} /></div>
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.75rem' }}>
                                <div><label style={labelStyle}>กำหนดเสร็จ</label><input type="date" value={taskForm.due_date} onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })} style={inputStyle} /></div>
                                <div><label style={labelStyle}>ความสำคัญ</label><select value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })} style={inputStyle}><option value="low">ต่ำ</option><option value="medium">ปานกลาง</option><option value="high">สูง</option></select></div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div><label style={labelStyle}>มอบหมายให้</label><select value={taskForm.assigned_to} onChange={e => setTaskForm({ ...taskForm, assigned_to: e.target.value })} style={inputStyle}><option value="">— ไม่ระบุ —</option>{profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}</select></div>
                                <div><label style={labelStyle}>สถานะ</label><select value={taskForm.status} onChange={e => setTaskForm({ ...taskForm, status: e.target.value })} style={inputStyle}><option value="pending">รอดำเนินการ</option><option value="in_progress">กำลังทำ</option><option value="completed">เสร็จแล้ว</option></select></div>
                            </div>
                            <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ marginTop: '0.5rem' }}>{isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}</button>
                        </form>
                    </dialog>

                    {/* Evaluation Modal */}
                    <dialog ref={evalDialogRef} style={{ maxWidth: 480 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0 }}>เพิ่มผลประเมิน</h2>
                            <button onClick={() => evalDialogRef.current?.close()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleEvalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div><label style={labelStyle}>วันที่ประเมิน</label><input type="date" value={evalForm.evaluation_date} onChange={e => setEvalForm({ ...evalForm, evaluation_date: e.target.value })} style={inputStyle} /></div>
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.75rem' }}>
                                <div><label style={labelStyle}>ยอดขาย (฿)</label><input type="number" value={evalForm.sales_result || ''} onChange={e => setEvalForm({ ...evalForm, sales_result: Number(e.target.value) })} style={inputStyle} /></div>
                                <div><label style={labelStyle}>ลูกค้าสนใจ (คน)</label><input type="number" value={evalForm.leads_result || ''} onChange={e => setEvalForm({ ...evalForm, leads_result: Number(e.target.value) })} style={inputStyle} /></div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div><label style={labelStyle}>ค่าใช้จ่าย (฿)</label><input type="number" value={evalForm.spend_result || ''} onChange={e => setEvalForm({ ...evalForm, spend_result: Number(e.target.value) })} style={inputStyle} /></div>
                                <div><label style={labelStyle}>ROI (%)</label><input type="number" step="0.01" value={evalForm.roi || ''} onChange={e => setEvalForm({ ...evalForm, roi: Number(e.target.value) })} style={inputStyle} /></div>
                            </div>
                            <div><label style={labelStyle}>สรุปผล</label><textarea value={evalForm.summary} onChange={e => setEvalForm({ ...evalForm, summary: e.target.value })} style={{ ...inputStyle, minHeight: 60 }} /></div>
                            <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ marginTop: '0.5rem' }}>{isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}</button>
                        </form>
                    </dialog>

                    {/* Campaign Modal (shared) */}
                    {renderCampaignModal()}
                </main>
            </div>
        );
    }

    // ══════════════════════════════
    // LIST VIEW
    // ══════════════════════════════
    return (
        <div style={{ display: 'flex', height: '100vh', backgroundColor: 'var(--bg-main)' }}>
            <main style={{ flex: 1, overflowY: 'auto' }}>
                <div style={{ padding: isMobile ? '1rem' : '2rem', maxWidth: '1200px', margin: '0 auto' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-lg)', background: 'linear-gradient(135deg, #ec4899, #be185d)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><Megaphone size={22} /></div>
                            <div><h1 className="page-title" style={{ margin: 0 }}>การตลาด</h1><p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>จัดการแคมเปญ กลยุทธ์ และประเมินผล</p></div>
                        </div>
                        <button onClick={() => openCampaignModal()} className="btn-primary"><Plus size={16} /> สร้างแคมเปญ</button>
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: isMobile ? '0.75rem' : '1rem', marginBottom: '1.5rem' }}>
                        {[
                            { label: 'แคมเปญทั้งหมด', value: campaigns.length, icon: Target, gradient: 'linear-gradient(135deg, #ec4899, #be185d)' },
                            { label: 'กำลังดำเนินการ', value: activeCampaigns, icon: Clock, gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)' },
                            { label: 'งบประมาณรวม', value: fmt(totalBudget), icon: DollarSign, gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
                            { label: 'คาดการณ์ยอดขายรวม', value: fmt(totalExpectedSales), icon: TrendingUp, gradient: 'linear-gradient(135deg, #22c55e, #16a34a)' },
                        ].map((s, i) => (
                            <div key={i} style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', padding: isMobile ? '0.85rem' : '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.5rem' : '0.75rem' }}>
                                    <div style={{ width: isMobile ? 36 : 44, height: isMobile ? 36 : 44, borderRadius: 'var(--radius-lg)', background: s.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}><s.icon size={isMobile ? 16 : 20} /></div>
                                    <div><p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>{s.label}</p><p style={{ fontSize: isMobile ? '1rem' : '1.25rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>{s.value}</p></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Campaign List */}
                    <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
                            <h2 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>รายการแคมเปญ</h2>
                        </div>
                        {loading ? (
                            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-dim)' }}>กำลังโหลด...</div>
                        ) : campaigns.length === 0 ? (
                            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-dim)' }}>ยังไม่มีแคมเปญ — กดปุ่ม "สร้างแคมเปญ" เพื่อเริ่มต้น</div>
                        ) : (
                            <div>
                                {campaigns.map(c => {
                                    const tasks = c.tasks || [];
                                    const done = tasks.filter(t => t.status === 'completed').length;
                                    return (
                                        <div key={c.id} onClick={() => { setSelected(c); setEvalOpen(true); }} style={{ padding: isMobile ? '0.85rem 1rem' : '1rem 1.5rem', borderBottom: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: isMobile ? '0.65rem' : '1rem', transition: 'background 0.15s' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                                    <p style={{ fontWeight: 600, fontSize: '0.95rem', margin: 0 }}>{c.name}</p>
                                                    <span style={{ padding: '0.15rem 0.55rem', borderRadius: 99, fontSize: '0.7rem', fontWeight: 600, color: STATUS_MAP[c.status]?.color, background: STATUS_MAP[c.status]?.bg }}>{STATUS_MAP[c.status]?.label}</span>
                                                </div>
                                                {c.strategy && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>{c.strategy}</p>}
                                            </div>
                                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                <p style={{ fontSize: '0.85rem', fontWeight: 600, margin: 0, color: 'var(--text-main)' }}>{fmt(c.budget)}</p>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', margin: 0 }}>งาน: {done}/{tasks.length}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {renderCampaignModal()}
            </main>
        </div>
    );

    // ══════════════════════════════
    // Campaign Modal (shared render)
    // ══════════════════════════════
    function renderCampaignModal() {
        return (
            <dialog ref={campaignDialogRef} style={{ maxWidth: 560 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0 }}>{editingCampaign ? 'แก้ไขแคมเปญ' : 'สร้างแคมเปญใหม่'}</h2>
                    <button onClick={() => campaignDialogRef.current?.close()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
                </div>
                <form onSubmit={handleCampaignSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div><label style={labelStyle}>ชื่อแคมเปญ *</label><input required value={campaignForm.name} onChange={e => setCampaignForm({ ...campaignForm, name: e.target.value })} style={inputStyle} /></div>
                    <div><label style={labelStyle}>กลยุทธ์</label><textarea value={campaignForm.strategy} onChange={e => setCampaignForm({ ...campaignForm, strategy: e.target.value })} style={{ ...inputStyle, minHeight: 60 }} placeholder="อธิบายกลยุทธ์การตลาด..." /></div>
                    <div><label style={labelStyle}>รายละเอียด</label><textarea value={campaignForm.description} onChange={e => setCampaignForm({ ...campaignForm, description: e.target.value })} style={{ ...inputStyle, minHeight: 50 }} /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.75rem' }}>
                        <div><label style={labelStyle}>วันเริ่มต้น</label><input type="date" value={campaignForm.start_date} onChange={e => setCampaignForm({ ...campaignForm, start_date: e.target.value })} style={inputStyle} /></div>
                        <div><label style={labelStyle}>วันสิ้นสุด</label><input type="date" value={campaignForm.end_date} onChange={e => setCampaignForm({ ...campaignForm, end_date: e.target.value })} style={inputStyle} /></div>
                    </div>
                    <div><label style={labelStyle}>สถานะ</label><select value={campaignForm.status} onChange={e => setCampaignForm({ ...campaignForm, status: e.target.value })} style={inputStyle}><option value="draft">แบบร่าง</option><option value="active">กำลังดำเนินการ</option><option value="completed">เสร็จสิ้น</option><option value="cancelled">ยกเลิก</option></select></div>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '0.75rem' }}>
                        <div><label style={labelStyle}>งบประมาณ (฿)</label><input type="number" value={campaignForm.budget || ''} onChange={e => setCampaignForm({ ...campaignForm, budget: Number(e.target.value) })} style={inputStyle} /></div>
                        <div><label style={labelStyle}>คาดการณ์ยอดขาย</label><input type="number" value={campaignForm.expected_sales || ''} onChange={e => setCampaignForm({ ...campaignForm, expected_sales: Number(e.target.value) })} style={inputStyle} /></div>
                        <div><label style={labelStyle}>คาดการณ์ลูกค้า</label><input type="number" value={campaignForm.expected_leads || ''} onChange={e => setCampaignForm({ ...campaignForm, expected_leads: Number(e.target.value) })} style={inputStyle} /></div>
                    </div>
                    <div><label style={labelStyle}>หมายเหตุ</label><textarea value={campaignForm.notes} onChange={e => setCampaignForm({ ...campaignForm, notes: e.target.value })} style={{ ...inputStyle, minHeight: 40 }} /></div>
                    <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ marginTop: '0.5rem' }}>{isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}</button>
                </form>
            </dialog>
        );
    }
}

// Shared inline styles
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.9rem' };
