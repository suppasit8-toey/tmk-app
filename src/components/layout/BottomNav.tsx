import Link from 'next/link';
import { Home, Users, FileText, PenTool } from 'lucide-react';
import styles from './layout.module.css';

const bottomNavItems = [
    { name: 'หน้าหลัก', href: '/dashboard', icon: Home },
    { name: 'งานขาย', href: '/customers', icon: Users },
    { name: 'ช่าง', href: '/installation', icon: PenTool },
    { name: 'เอกสาร', href: '/accounting', icon: FileText },
];

export default function BottomNav({ currentPath }: { currentPath: string }) {
    return (
        <nav className={styles.bottomNav}>
            {bottomNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath.startsWith(item.href);
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={styles.bottomNavItem}
                        data-active={isActive}
                    >
                        <Icon size={24} />
                        <span>{item.name}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
