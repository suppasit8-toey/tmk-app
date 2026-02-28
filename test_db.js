import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProducts() {
    console.log('Fetching products...');
    const { data: products, error } = await supabase
        .from('products')
        .select('*, price_tiers(*)');

    if (error) {
        console.error('Error fetching products:', error);
    } else {
        console.log(`Found ${products.length} products`);
        console.dir(products, { depth: null });
    }
}

checkProducts();
