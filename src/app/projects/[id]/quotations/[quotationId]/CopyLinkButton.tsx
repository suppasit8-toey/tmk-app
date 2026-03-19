'use client';

import { useState } from 'react';
import { Link2, Check } from 'lucide-react';

export default function CopyLinkButton({ quotationNumber }: { quotationNumber: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        const url = `${window.location.origin}/quote/${quotationNumber}`;
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = url;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <button
            onClick={handleCopy}
            className="pill"
            style={{
                cursor: 'pointer',
                gap: '0.3rem',
                background: copied ? '#dcfce7' : undefined,
                color: copied ? '#16a34a' : undefined,
                borderColor: copied ? '#86efac' : undefined,
                transition: 'all 0.2s ease',
            }}
        >
            {copied ? <Check size={16} /> : <Link2 size={16} />}
            {copied ? 'คัดลอกแล้ว!' : 'คัดลอกลิงก์'}
        </button>
    );
}
