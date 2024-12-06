'use server'

import { manageOrder } from "@/actions/order/manage-order";
import connectDB from "@/lib/db"
import Order, { IOrder } from "@/models/Order"
import { NextResponse, NextRequest } from 'next/server';
import { getOrder } from "@/actions/purchaseOrder/get-order";
import { updateOrder } from "@/actions/purchaseOrder/update-order";
import { acceptOrder } from "@/actions/order/accept-order";
import { stockUp } from "@/actions/product/stock-up";
import { reOrganize } from "@/actions/product/reorganize";
import { saveBalance } from "@/actions/invoice/balance-interval";

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const data = await req.json();
        const { id } = data;
        saveBalance();
        // Get Order from api
        const order = await getOrder({ orderId: id });

        if (!order) {
            return NextResponse.json({
                error: 'Orden no encontrada'
            }, { status: 404 });
        }

        // save order in db
        let o: IOrder;
        try{
            o = await Order.create({
                _id: id,
                products: {
                    sku: order.sku,
                    quantity: order.cantidad
                },
                quantity: order.cantidad,
                dispatched: order.despachado,
                client: order.cliente,
                provider: order.proveedor,
                status: 'pending',
                dueDate: order.vencimiento
            });
        } catch (error) {
            const existingOrder = await Order.findById(id);
            if (!existingOrder) {
                return NextResponse.json({
                    error: 'Error al crear la orden'
                }, { status: 500 });
            }
            o = existingOrder;
        }

        const accept = await acceptOrder(o);
        if (accept) {
            console.log('Orden aceptada');
            manageOrder(o._id)
            await updateOrder({ orderId: id, status: 'aceptada' });
            o.status = 'acepted';
            await o.save();

            return NextResponse.json({
                status: 'aceptado'
            }, {status: 200});
        } else {
            console.log('Orden rechazada');
            await updateOrder({ orderId: id, status: 'rechazada' });
            stockUp();
            reOrganize();
            return NextResponse.json({
                status: 'rechazado'
            }, { status: 200 });
        }
        
        
    } catch (error) {
        console.log('Error en POST /api/orders:', error);
        return NextResponse.json({
            error: (error as Error).message || 'Error desconocido en POST /api/orders'
        }, { status: 500 });
    }
}
