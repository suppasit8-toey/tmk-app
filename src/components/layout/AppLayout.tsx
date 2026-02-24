'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
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

    // Exclude auth-related routes from layout
    if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
        return <>{children}</>;
    }

    return (
        <div className={styles.appContainer}>
            <Sidebar currentPath={pathname} />
            <main className={styles.mainContent}>
                {children}
            </main>
            <BottomNav currentPath={pathname} />
        </div>
    );
}
