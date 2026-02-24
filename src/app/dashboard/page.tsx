import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { hasAccess, AppRole } from '@/utils/rbac';
import { Users, FileText, DollarSign, Award, TrendingUp, BarChart3 } from 'lucide-react';

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const userRole = profile?.role as AppRole;
    if (!hasAccess(userRole, '/dashboard')) {
        return <div style={{ padding: '2rem', color: 'var(--danger)' }}>Access Denied</div>;
    }

    // Fetch stats
    const { count: customerCount } = await supabase.from('customers').select('*', { count: 'exact', head: true });
    const { count: quotationCount } = await supabase.from('quotations').select('*', { count: 'exact', head: true });
    const { data: quotationTotals } = await supabase.from('quotations').select('grand_total');
    const totalRevenue = quotationTotals?.reduce((sum, q) => sum + (q.grand_total || 0), 0) || 0;

    const stats = [
        {
            icon: <Users size={22} />,
            label: 'ลูกค้าทั้งหมด',
            value: customerCount?.toString() || '0',
            bg: '#eef3ff',
            iconColor: '#3b82f6',
        },
        {
            icon: <FileText size={22} />,
            label: 'ใบเสนอราคา',
            value: quotationCount?.toString() || '0',
            percent: '12 %',
            bg: '#fef3e2',
            iconColor: '#f59e0b',
        },
        {
            icon: <TrendingUp size={22} />,
            label: 'งานเสร็จสิ้น',
            value: '0',
            percent: '0 %',
            bg: '#ecfdf5',
            iconColor: '#22c55e',
        },
        {
            icon: <Award size={22} />,
            label: 'ยอดรวม',
            value: `฿${(totalRevenue / 1000).toFixed(0)}k`,
            bg: '#f5f3ff',
            iconColor: '#8b5cf6',
        },
    ];

    return (
        <div style={{ padding: '0.5rem 0', maxWidth: '1200px', margin: '0 auto' }}>

            {/* Page Title */}
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 className="page-title" style={{ marginBottom: 0 }}>
                    Dashboard
                </h1>
            </div>

            {/* Overview Card */}
            <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <h2 className="section-title" style={{ marginBottom: '1.25rem' }}>
                    Overview
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    {stats.map((stat, i) => (
                        <div key={i} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '1rem',
                            borderRadius: 'var(--radius-lg)',
                            background: stat.bg,
                        }}>
                            <div className="stat-icon" style={{ background: 'white', color: stat.iconColor, boxShadow: 'var(--shadow-sm)' }}>
                                {stat.icon}
                            </div>
                            <div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{stat.label}</p>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                                    <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }} className="font-outfit">{stat.value}</span>
                                    {stat.percent && <span style={{ fontSize: '0.7rem', fontWeight: 600, color: stat.iconColor }}>{stat.percent}</span>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Two Column Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem' }}>

                {/* Performance Ring */}
                <div className="card" style={{ padding: '1.5rem' }}>
                    <h2 className="section-title" style={{ fontStyle: 'italic', marginBottom: '1.25rem' }}>
                        ภาพรวมผลงาน
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 0' }}>
                        {/* Donut Chart SVG */}
                        <svg width="180" height="180" viewBox="0 0 180 180">
                            <circle cx="90" cy="90" r="70" fill="none" stroke="#e8ecf1" strokeWidth="18" />
                            <circle cx="90" cy="90" r="70" fill="none" stroke="#8b5cf6" strokeWidth="18"
                                strokeDasharray={`${0.35 * 440} ${440}`}
                                strokeLinecap="round" transform="rotate(-90 90 90)" />
                            <circle cx="90" cy="90" r="70" fill="none" stroke="#f59e0b" strokeWidth="18"
                                strokeDasharray={`${0.25 * 440} ${440}`}
                                strokeDashoffset={`${-0.35 * 440}`}
                                strokeLinecap="round" transform="rotate(-90 90 90)" />
                            <circle cx="90" cy="90" r="70" fill="none" stroke="#22c55e" strokeWidth="18"
                                strokeDasharray={`${0.15 * 440} ${440}`}
                                strokeDashoffset={`${-0.60 * 440}`}
                                strokeLinecap="round" transform="rotate(-90 90 90)" />
                            <circle cx="90" cy="90" r="70" fill="none" stroke="#ef4444" strokeWidth="18"
                                strokeDasharray={`${0.10 * 440} ${440}`}
                                strokeDashoffset={`${-0.75 * 440}`}
                                strokeLinecap="round" transform="rotate(-90 90 90)" />
                            <text x="90" y="85" textAnchor="middle" fontSize="28" fontWeight="700" fill="#1e293b" fontFamily="var(--font-outfit)">57%</text>
                            <text x="90" y="105" textAnchor="middle" fontSize="10" fill="#94a3b8">ดำเนินการอยู่</text>
                        </svg>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                            {[
                                { label: 'ร่าง', color: '#8b5cf6' },
                                { label: 'ส่งแล้ว', color: '#f59e0b' },
                                { label: 'อนุมัติ', color: '#22c55e' },
                                { label: 'ยกเลิก', color: '#ef4444' },
                            ].map((item, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
                                    {item.label}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bar Chart */}
                <div className="card" style={{ padding: '1.5rem' }}>
                    <h2 className="section-title" style={{ fontStyle: 'italic', marginBottom: '1.25rem' }}>
                        ยอดขายรายเดือน
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: '200px', paddingTop: '1rem' }}>
                        {[
                            { month: 'ม.ค.', value: 35 },
                            { month: 'ก.พ.', value: 65 },
                            { month: 'มี.ค.', value: 85 },
                            { month: 'เม.ย.', value: 50 },
                            { month: 'พ.ค.', value: 95 },
                            { month: 'มิ.ย.', value: 70 },
                            { month: 'ก.ค.', value: 80 },
                            { month: 'ส.ค.', value: 90 },
                            { month: 'ก.ย.', value: 55 },
                            { month: 'ต.ค.', value: 75 },
                            { month: 'พ.ย.', value: 100 },
                            { month: 'ธ.ค.', value: 60 },
                        ].map((bar, i) => (
                            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                                <div style={{
                                    width: '100%',
                                    maxWidth: '2rem',
                                    height: `${bar.value * 1.6}px`,
                                    borderRadius: '0.25rem 0.25rem 0 0',
                                    background: 'linear-gradient(180deg, #3b82f6, #6366f1)',
                                    transition: 'height 0.3s ease',
                                    minHeight: '4px',
                                }} />
                                <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>{bar.month}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

        </div>
    );
}
