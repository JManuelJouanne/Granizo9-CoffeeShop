'use server'

import { fetchToken } from "@/lib/coffeeshopToken";


interface ProductCountResponse {
    sku: string;
    quantity: number;
}

export async function getProductCount(storeId: string) {
    try {
        const token = await fetchToken();
        const res = await fetch(`${process.env.API_URI}/coffeeshop/spaces/${storeId}/inventory`,
            {   
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                cache: 'no-store'
            }
        );
        
        if (!res.ok) {
            throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
        }

        const data = await res.json() as ProductCountResponse[];

        // If the data is null or empty, return an empty array
        return data ?? [];
        
    } catch (error: any) {
        console.log(error);
        console.log("Error al solicitar conteo de productos en ", storeId);
        return null;
    }
}