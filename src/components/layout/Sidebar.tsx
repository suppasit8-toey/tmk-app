import Link from 'next/link';
import { Home, Users, Package, FileText, Settings, PenTool, LogOut, Share2, FolderKanban, Store } from 'lucide-react';
import styles from './layout.module.css';
import { logout } from '@/app/login/actions';

const navItems = [
    { name: 'แดชบอร์ด', href: '/dashboard', icon: Home },
    { name: 'ลูกค้า / งานขาย', href: '/customers', icon: Users },
    { name: 'โปรเจกต์', href: '/projects', icon: FolderKanban },
    { name: 'สินค้า', href: '/products', icon: Package },
    { name: 'ตัวแทนขาย / คนแนะนำ', href: '/referrers', icon: Share2 },
    { name: 'ข้อมูลบริษัท / สาขา', href: '/stores', icon: Store },
    { name: 'พนักงาน (Admin)', href: '/settings/employees', icon: Users },
    { name: 'ตั้งค่า', href: '/settings', icon: Settings },
];

export default function Sidebar({ currentPath }: { currentPath: string }) {
    return (
        <aside className={styles.sidebar}>
            <div className={styles.sidebarLogo}>
                <div style={{
                    width: '2rem',
                    height: '2rem',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                    color: 'white',
                }}>
                    <Settings size={16} />
                </div>
                TMK TEAM
            </div>
            <nav style={{ flex: 1 }}>
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPath.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={styles.navItem}
                            data-active={isActive}
                        >
                            <Icon size={18} />
                            <span>{item.name}</span>
                        </Link>
                    );
                })}
            </nav>
            <div style={{ borderTop: '1px solid var(--border)', padding: '1rem 0.5rem', marginTop: 'auto' }}>
                <form action={logout}>
                    <button type="submit" style={{
                        display: 'flex',
                        width: '100%',
                        alignItems: 'center',
                        gap: '0.5rem',
                        borderRadius: '0.5rem',
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        color: '#ef4444',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                    }}>
                        <LogOut size={18} />
                        <span>ออกจากระบบ</span>
                    </button>
                </form>
            </div>
        </aside>
    );
}
