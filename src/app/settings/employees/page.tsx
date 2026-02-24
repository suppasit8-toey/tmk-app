import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { Trash2, UserPlus, Users, Shield, Phone, Mail, Edit } from 'lucide-react';
import { createEmployee, deleteEmployee, updateEmployeeRole } from './actions';
import { AppRole } from '@/utils/rbac';

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    admin: { label: 'ผู้ดูแลระบบ', color: '#ef4444', bg: '#fee2e2' },
    customer_service: { label: 'ฝ่ายบริการลูกค้า', color: '#3b82f6', bg: '#dbeafe' },
    sales_measurement: { label: 'ฝ่ายขาย/วัดงาน', color: '#8b5cf6', bg: '#f5f3ff' },
    technician: { label: 'ช่างติดตั้ง', color: '#f97316', bg: '#fff7ed' },
    supervisor: { label: 'หัวหน้าช่าง', color: '#f59e0b', bg: '#fef3e2' },
    stock_checker: { label: 'ฝ่ายสต็อก', color: '#22c55e', bg: '#dcfce7' },
    purchasing: { label: 'ฝ่ายจัดซื้อ', color: '#14b8a6', bg: '#ccfbf1' },
    accounting: { label: 'ฝ่ายบัญชี', color: '#6366f1', bg: '#e8e8ff' },
    quotation: { label: 'ฝ่ายเสนอราคา', color: '#ec4899', bg: '#fce7f3' },
    marketing: { label: 'ฝ่ายการตลาด', color: '#0ea5e9', bg: '#e0f2fe' },
};

const ALL_ROLES: { value: AppRole; label: string }[] = [
    { value: 'admin', label: 'ผู้ดูแลระบบ (Admin)' },
    { value: 'customer_service', label: 'ฝ่ายบริการลูกค้า' },
    { value: 'sales_measurement', label: 'ฝ่ายขาย/วัดงาน' },
    { value: 'technician', label: 'ช่างติดตั้ง' },
    { value: 'supervisor', label: 'หัวหน้าช่าง' },
    { value: 'stock_checker', label: 'ฝ่ายสต็อก' },
    { value: 'purchasing', label: 'ฝ่ายจัดซื้อ' },
    { value: 'accounting', label: 'ฝ่ายบัญชี' },
    { value: 'quotation', label: 'ฝ่ายเสนอราคา' },
    { value: 'marketing', label: 'ฝ่ายการตลาด' },
];

export default async function EmployeesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: currentProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const isAdmin = currentProfile?.role === 'admin';

    const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    const employees = profiles || [];

    // Stats
    const totalEmployees = employees.length;
    const roleGroups = employees.reduce((acc, p) => {
        acc[p.role] = (acc[p.role] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h1 className="page-title">
                จัดการพนักงาน
            </h1>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div className="card" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div className="stat-icon" style={{ background: '#dbeafe', color: '#3b82f6', width: '2.25rem', height: '2.25rem' }}>
                        <Users size={14} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 500 }}>ทั้งหมด</p>
                        <p className="font-outfit" style={{ fontSize: '1.1rem', fontWeight: 700 }}>{totalEmployees}</p>
                    </div>
                </div>
                {Object.entries(roleGroups).slice(0, 4).map(([role, count]) => {
                    const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.admin;
                    return (
                        <div key={role} className="card" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <div className="stat-icon" style={{ background: cfg.bg, color: cfg.color, width: '2.25rem', height: '2.25rem' }}>
                                <Shield size={14} />
                            </div>
                            <div>
                                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 500 }}>{cfg.label}</p>
                                <p className="font-outfit" style={{ fontSize: '1.1rem', fontWeight: 700 }}>{String(count)}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? '340px 1fr' : '1fr', gap: '1.5rem' }}>
                {/* Add Employee Card */}
                {isAdmin && (
                    <div className="card" style={{ padding: '1.5rem', height: 'fit-content', position: 'sticky', top: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                            <div className="header-icon" style={{ background: '#eef3ff', color: '#3b82f6' }}><UserPlus size={18} /></div>
                            <h2 className="section-title">เพิ่มพนักงานใหม่</h2>
                        </div>
                        <form style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }} action={async (formData) => { 'use server'; await createEmployee(formData); }}>
                            <div>
                                <label style={labelStyle}>อีเมล *</label>
                                <input name="email" type="email" required placeholder="employee@tmkteam.com" style={{ width: '100%' }} />
                            </div>
                            <div>
                                <label style={labelStyle}>รหัสผ่าน *</label>
                                <input name="password" type="text" required placeholder="ตั้งรหัสผ่าน" style={{ width: '100%' }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label style={labelStyle}>ชื่อ *</label>
                                    <input name="firstName" type="text" required placeholder="ชื่อ" style={{ width: '100%' }} />
                                </div>
                                <div>
                                    <label style={labelStyle}>นามสกุล *</label>
                                    <input name="lastName" type="text" required placeholder="นามสกุล" style={{ width: '100%' }} />
                                </div>
                            </div>
                            <div>
                                <label style={labelStyle}>เบอร์โทร</label>
                                <input name="phone" type="tel" placeholder="08X-XXX-XXXX" style={{ width: '100%' }} />
                            </div>
                            <div>
                                <label style={labelStyle}>ตำแหน่ง *</label>
                                <select name="role" required style={{ width: '100%' }}>
                                    {ALL_ROLES.map(r => (
                                        <option key={r.value} value={r.value}>{r.label}</option>
                                    ))}
                                </select>
                            </div>
                            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.25rem' }}>
                                <UserPlus size={16} /> เพิ่มพนักงาน
                            </button>
                        </form>
                    </div>
                )}

                {/* Employee Table */}
                <div className="card" style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div className="header-icon" style={{ background: '#f1f5f9', color: '#64748b' }}><Users size={18} /></div>
                        <h2 className="section-title">รายชื่อพนักงาน</h2>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginLeft: 'auto' }}>{totalEmployees} คน</span>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', textAlign: 'left', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                    <th style={thStyle}>พนักงาน</th>
                                    <th style={thStyle}>เบอร์โทร</th>
                                    <th style={thStyle}>ตำแหน่ง</th>
                                    {isAdmin && <th style={thStyle}>เปลี่ยนตำแหน่ง</th>}
                                    {isAdmin && <th style={{ ...thStyle, textAlign: 'center' }}>ลบ</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {employees.map((p) => {
                                    const roleCfg = ROLE_CONFIG[p.role] || ROLE_CONFIG.admin;
                                    const isMe = p.id === user.id;
                                    return (
                                        <tr key={p.id} style={{ borderBottom: '1px solid var(--border)', background: isMe ? '#f8fafc' : 'transparent' }}>
                                            <td style={{ padding: '0.75rem 1.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                                    <div style={{
                                                        width: '2rem', height: '2rem', borderRadius: '50%',
                                                        background: roleCfg.bg, color: roleCfg.color,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontWeight: 700, fontSize: '0.7rem', flexShrink: 0,
                                                    }}>
                                                        {(p.first_name || '?')[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                                            {p.first_name} {p.last_name}
                                                            {isMe && <span style={{ fontSize: '0.6rem', color: 'var(--primary)', marginLeft: '0.3rem' }}>(คุณ)</span>}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                                {p.phone ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                        <Phone size={12} /> {p.phone}
                                                    </div>
                                                ) : (
                                                    <span style={{ color: 'var(--text-dim)' }}>-</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <span className="badge" style={{ background: roleCfg.bg, color: roleCfg.color }}>
                                                    {roleCfg.label}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.5rem 1rem' }}>
                                                {isAdmin && !isMe && (
                                                    <form action={updateEmployeeRole} style={{ display: 'flex', gap: '0.25rem' }}>
                                                        <input type="hidden" name="userId" value={p.id} />
                                                        <select name="role" defaultValue={p.role} style={{ fontSize: '0.7rem', padding: '0.3rem', flex: 1 }}>
                                                            {ALL_ROLES.map(r => (
                                                                <option key={r.value} value={r.value}>{r.label}</option>
                                                            ))}
                                                        </select>
                                                        <button type="submit" style={{
                                                            padding: '0.3rem 0.5rem', borderRadius: '0.35rem', border: 'none',
                                                            background: '#dbeafe', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center',
                                                        }}>
                                                            <Edit size={12} />
                                                        </button>
                                                    </form>
                                                )}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                                {isAdmin && !isMe && (
                                                    <form action={async () => { 'use server'; await deleteEmployee(p.id); }}>
                                                        <button type="submit" style={{
                                                            padding: '0.35rem', borderRadius: '0.4rem', border: 'none',
                                                            color: '#ef4444', background: '#fee2e2', cursor: 'pointer',
                                                        }}><Trash2 size={14} /></button>
                                                    </form>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {employees.length === 0 && (
                                    <tr><td colSpan={isAdmin ? 5 : 3} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        <Users size={40} style={{ color: 'var(--text-dim)', marginBottom: '0.5rem' }} />
                                        <p>ไม่พบพนักงาน</p>
                                    </td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div >
    );
}

const thStyle: React.CSSProperties = {
    padding: '0.65rem 1rem',
    fontSize: '0.65rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--text-dim)',
};

const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--text-muted)',
    marginBottom: '0.3rem',
};
