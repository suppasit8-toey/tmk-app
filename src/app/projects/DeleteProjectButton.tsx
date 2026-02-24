'use client';

import { useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { deleteProject } from './actions';

export default function DeleteProjectButton({ id }: { id: string }) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = () => {
        if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบโปรเจกต์นี้? ข้อมูลที่เกี่ยวข้องทั้งหมดจะถูกลบไปด้วย')) {
            startTransition(async () => {
                try {
                    await deleteProject(id);
                } catch (error) {
                    console.error('Error deleting project:', error);
                    alert('เกิดข้อผิดพลาด ไม่สามารถลบโปรเจกต์ได้');
                }
            });
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isPending}
            style={{
                fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                fontWeight: 500, padding: '0.4rem 0.75rem', borderRadius: '0.4rem',
                color: 'var(--danger)', background: '#fef2f2', border: 'none', cursor: isPending ? 'not-allowed' : 'pointer',
                opacity: isPending ? 0.7 : 1
            }}
        >
            <Trash2 size={14} />
            {isPending ? 'กำลังลบ...' : 'ลบ'}
        </button>
    );
}
