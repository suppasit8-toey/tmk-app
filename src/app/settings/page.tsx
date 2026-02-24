import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { Settings } from 'lucide-react';

export default async function SettingsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1 className="page-title">
                ตั้งค่า
            </h1>

            <div className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                    <div className="header-icon" style={{ background: '#f1f5f9', color: '#64748b' }}><Settings size={18} /></div>
                    <h2 className="section-title">ข้อมูลของคุณ</h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>Email</label>
                        <p style={{ fontWeight: 500, fontSize: '0.875rem' }}>{user.email}</p>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>Role</label>
                        <span className="pill" style={{ fontSize: '0.7rem', textTransform: 'capitalize' }}>{profile?.role?.replace('_', ' ')}</span>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>First Name</label>
                        <p style={{ fontWeight: 500, fontSize: '0.875rem' }}>{profile?.first_name || '-'}</p>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>Last Name</label>
                        <p style={{ fontWeight: 500, fontSize: '0.875rem' }}>{profile?.last_name || '-'}</p>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>Phone</label>
                        <p style={{ fontWeight: 500, fontSize: '0.875rem' }}>{profile?.phone || '-'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
