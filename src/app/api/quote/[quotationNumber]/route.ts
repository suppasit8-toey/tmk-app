import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ quotationNumber: string }> }
) {
    const resolvedParams = await params;
    const quotationNumber = resolvedParams.quotationNumber;

    const supabase = await createClient();

    // Fetch quotation by quotation_number
    const { data: qtData, error: qtError } = await supabase
        .from('quotations')
        .select(`*, customer:customers(*), store:stores(*)`)
        .eq('quotation_number', quotationNumber)
        .single();

    if (qtError || !qtData) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Fetch items
    const { data: itemsData } = await supabase
        .from('quotation_items')
        .select('*')
        .eq('quotation_id', qtData.id)
        .order('created_at', { ascending: true });

    return NextResponse.json({
        quotation: qtData,
        items: itemsData || [],
    });
}
