'use client';

import { useEffect } from 'react';

export default function PrintTrigger() {
    useEffect(() => {
        // Small delay to let the page render fully before printing
        const timer = setTimeout(() => {
            window.print();
        }, 600);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="print-actions no-print">
            <button className="back-btn" onClick={() => window.close()}>
                ← กลับ
            </button>
            <button className="print-btn" onClick={() => window.print()}>
                🖨️ พิมพ์ / บันทึก PDF
            </button>
        </div>
    );
}
