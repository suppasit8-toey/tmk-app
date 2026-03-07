'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';
import styles from './layout.module.css';
import { type User } from '@supabase/supabase-js';

export default function AppLayout({
    children,
    user,
    profile
}: {
    children: React.ReactNode,
    user?: User | null,
    profile?: any | null
}) {
    const pathname = usePathname() || '/';
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Exclude auth-related routes from layout
    if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
        return <>{children}</>;
    }

    return (
        <div className={styles.appContainer}>
            <header className={styles.mobileHeader}>
                <button
                    className={styles.menuTrigger}
                    onClick={() => setIsSidebarOpen(true)}
                    aria-label="Open Menu"
                >
                    <Menu size={24} />
                </button>
                <div className={styles.mobileLogo}>
                    TMK TEAM
                </div>
            </header>
            <Sidebar currentPath={pathname} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <main className={styles.mainContent}>
                {children}
            </main>
        </div>
    );
}
