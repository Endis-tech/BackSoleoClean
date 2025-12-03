// src/config/paypal.js
import { core } from '@paypal/checkout-server-sdk';

const environment = () => {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET; // ← Cambiado aquí también

    console.log('🔧 Configurando PayPal...');
    console.log('🔧 Client ID:', clientId ? '✅ Configurado' : '❌ Faltante');
    console.log('🔧 Client Secret:', clientSecret ? '✅ Configurado' : '❌ Faltante');

    if (!clientId || !clientSecret) {
        throw new Error('❌ PayPal credentials missing. Verifica tu archivo .env');
    }

    return new core.SandboxEnvironment(clientId, clientSecret);
};

const client = new core.PayPalHttpClient(environment());

export const createPayPalOrder = async (amount, paymentId) => {
    try {
        console.log('💰 Creando orden PayPal:', { amount, paymentId });

        const request = new core.orders.OrdersCreateRequest();
        request.prefer("return=representation");
        request.requestBody({
            intent: 'CAPTURE',
            purchase_units: [{
                amount: {
                    currency_code: 'MXN',
                    value: amount.toString()
                },
                custom_id: paymentId.toString(),
                description: `Membresía SÓLEO`
            }],
            application_context: {
                brand_name: 'SÓLEO Fitness',
                landing_page: 'LOGIN',
                user_action: 'PAY_NOW',
                return_url: `${process.env.FRONTEND_URL}/payment-success`,
                cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`
            }
        });

        const response = await client.execute(request);
        console.log('✅ Orden PayPal creada:', response.result.id);
        return response.result;
    } catch (error) {
        console.error('❌ Error creando orden PayPal:', error);
        throw error;
    }
};

export const capturePayPalOrder = async (orderId) => {
    try {
        console.log('💰 Capturando orden PayPal:', orderId);
        const request = new core.orders.OrdersCaptureRequest(orderId);
        const response = await client.execute(request);
        console.log('✅ Orden PayPal capturada:', response.result.id);
        return response.result;
    } catch (error) {
        console.error('❌ Error capturando orden PayPal:', error);
        throw error;
    }
};