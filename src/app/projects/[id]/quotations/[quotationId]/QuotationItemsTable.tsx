'use client';

import { useState, useMemo } from 'react';
import { Trash2, Filter, MapPin, Layers, X } from 'lucide-react';
import { QuotationItem } from '@/types/sales';

interface QuotationItemsTableProps {
    items: QuotationItem[];
    quotationId: string;
    deleteAction: (itemId: string) => Promise<void>;
}

export default function QuotationItemsTable({ items, quotationId, deleteAction }: QuotationItemsTableProps) {
    const [locationFilter, setLocationFilter] = useState<string>('');
    const [productFilter, setProductFilter] = useState<string>('');

    // Extract unique locations from items
    const uniqueLocations = useMemo(() => {
        const locations = items
            .map(item => item.location_name)
            .filter((loc): loc is string => !!loc);
        return [...new Set(locations)].sort();
    }, [items]);

    // Extract unique product types (first word/curtain type from product_name)
    const uniqueProductTypes = useMemo(() => {
        const types = items
            .map(item => {
                // Extract curtain type pattern: ม่านจีบ, ม่านม้วน, ม่านลอน, etc.
                const match = item.product_name.match(/^(ม่าน\S+)/);
                return match ? match[1] : item.product_name.split(' ')[0];
            })
            .filter(Boolean);
        return [...new Set(types)].sort();
    }, [items]);

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            if (locationFilter && item.location_name !== locationFilter) return false;
            if (productFilter) {
                const match = item.product_name.match(/^(ม่าน\S+)/);
                const itemType = match ? match[1] : item.product_name.split(' ')[0];
                if (itemType !== productFilter) return false;
            }
            return true;
        });
    }, [items, locationFilter, productFilter]);

    const hasActiveFilter = locationFilter || productFilter;

    return (
        <div>
            {/* Filter Bar */}
            {(uniqueLocations.length > 0 || uniqueProductTypes.length > 1) && (
                <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', background: hasActiveFilter ? '#f0f9ff' : 'transparent', transition: 'background 0.2s' }}>
                    <Filter size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />

                    {/* Location Filter */}
                    {uniqueLocations.length > 0 && (
                        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                            <MapPin size={13} style={{ position: 'absolute', left: '0.5rem', color: locationFilter ? '#2563eb' : 'var(--text-muted)', zIndex: 1 }} />
                            <select
                                value={locationFilter}
                                onChange={e => setLocationFilter(e.target.value)}
                                style={{
                                    padding: '0.35rem 1.75rem 0.35rem 1.6rem',
                                    borderRadius: '2rem',
                                    border: `1px solid ${locationFilter ? '#93c5fd' : 'var(--border)'}`,
                                    fontSize: '0.75rem', fontWeight: 500,
                                    background: locationFilter ? '#eff6ff' : '#fff',
                                    color: locationFilter ? '#2563eb' : 'var(--text)',
                                    appearance: 'none', cursor: 'pointer',
                                    minWidth: '120px'
                                }}
                            >
                                <option value="">ทุกตำแหน่ง</option>
                                {uniqueLocations.map(loc => (
                                    <option key={loc} value={loc}>{loc}</option>
                                ))}
                            </select>
                            <Layers size={11} style={{ position: 'absolute', right: '0.5rem', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                        </div>
                    )}

                    {/* Product Type Filter */}
                    {uniqueProductTypes.length > 1 && (
                        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                            <Layers size={13} style={{ position: 'absolute', left: '0.5rem', color: productFilter ? '#7c3aed' : 'var(--text-muted)', zIndex: 1 }} />
                            <select
                                value={productFilter}
                                onChange={e => setProductFilter(e.target.value)}
                                style={{
                                    padding: '0.35rem 1.75rem 0.35rem 1.6rem',
                                    borderRadius: '2rem',
                                    border: `1px solid ${productFilter ? '#c4b5fd' : 'var(--border)'}`,
                                    fontSize: '0.75rem', fontWeight: 500,
                                    background: productFilter ? '#f5f3ff' : '#fff',
                                    color: productFilter ? '#7c3aed' : 'var(--text)',
                                    appearance: 'none', cursor: 'pointer',
                                    minWidth: '120px'
                                }}
                            >
                                <option value="">ทุกรูปแบบ</option>
                                {uniqueProductTypes.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                            <Layers size={11} style={{ position: 'absolute', right: '0.5rem', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                        </div>
                    )}

                    {/* Clear Filters */}
                    {hasActiveFilter && (
                        <button
                            onClick={() => { setLocationFilter(''); setProductFilter(''); }}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                                padding: '0.3rem 0.6rem', borderRadius: '2rem',
                                border: '1px solid #fecaca', background: '#fef2f2',
                                color: '#dc2626', fontSize: '0.7rem', fontWeight: 500,
                                cursor: 'pointer'
                            }}
                        >
                            <X size={12} /> ล้างตัวกรอง
                        </button>
                    )}

                    {/* Count */}
                    {hasActiveFilter && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                            แสดง {filteredItems.length}/{items.length} รายการ
                        </span>
                    )}
                </div>
            )}

            {/* Items Table */}
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', textAlign: 'left', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                            <th style={{ padding: '0.65rem 1.5rem', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)' }}>รายการ</th>
                            <th style={{ padding: '0.65rem 1rem', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)', textAlign: 'center' }}>ขนาด</th>
                            <th style={{ padding: '0.65rem 1rem', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)', textAlign: 'right' }}>จำนวน</th>
                            <th style={{ padding: '0.65rem 1rem', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)', textAlign: 'right' }}>ราคา/หน่วย</th>
                            <th style={{ padding: '0.65rem 1rem', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)', textAlign: 'right' }}>รวม</th>
                            <th style={{ padding: '0.65rem 1rem', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)', textAlign: 'center' }}>ลบ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.map(item => (
                            <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '0.75rem 1.5rem' }}>
                                    {item.location_name && <div style={{ fontSize: '0.7rem', color: '#2563eb', fontWeight: 500, marginBottom: '0.15rem' }}>{item.location_name}</div>}
                                    <div style={{ fontWeight: 500 }}>{item.product_name}</div>
                                    {item.description && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description}</div>}
                                </td>
                                <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    {item.width && item.height ? `${item.width}×${item.height}` : '-'}
                                </td>
                                <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 500 }}>{item.quantity}</td>
                                <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: 'var(--text-muted)' }}>฿{Number(item.unit_price).toLocaleString()}</td>
                                <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: 'var(--primary)' }}>฿{Number(item.total_price).toLocaleString()}</td>
                                <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                    <form action={deleteAction.bind(null, item.id)}>
                                        <button type="submit" style={{ padding: '0.3rem', borderRadius: '0.35rem', border: 'none', color: '#ef4444', background: '#fee2e2', cursor: 'pointer' }}>
                                            <Trash2 size={14} />
                                        </button>
                                    </form>
                                </td>
                            </tr>
                        ))}
                        {filteredItems.length === 0 && (
                            <tr><td colSpan={6} style={{ padding: '2rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                {hasActiveFilter ? 'ไม่พบรายการที่ตรงกับตัวกรอง' : 'ยังไม่มีรายการ'}
                            </td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
