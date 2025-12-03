// src/controllers/payment.controller.js
import Payment from "../models/Payment.js";
import Membership from "../models/Membership.js";
import MembershipService from "../services/membershipService.js";
import axios from "axios";

// Configuración de PayPal - ELIMINA ESPACIOS EN LOS VALUES
const PAYPAL_API = 'https://api-m.sandbox.paypal.com';
const CLIENT_ID = process.env.PAYPAL_CLIENT_ID?.replace(/\s/g, ''); // Elimina espacios
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET?.replace(/\s/g, ''); // Elimina espacios
const FRONTEND_URL = process.env.FRONTEND_URL?.replace(/'/g, ''); // Elimina comillas

// Helper para obtener access token de PayPal
const getPayPalAccessToken = async () => {
    try {
        console.log('🔑 Obteniendo token de PayPal...');
        console.log('🔑 Client ID:', CLIENT_ID ? `${CLIENT_ID.substring(0, 10)}...` : 'NO CONFIGURADO');
        
        if (!CLIENT_ID || !CLIENT_SECRET) {
            throw new Error('Credenciales de PayPal no configuradas. Verifica tu archivo .env');
        }

        const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
        const response = await axios.post(`${PAYPAL_API}/v1/oauth2/token`, 
            'grant_type=client_credentials',
            {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                timeout: 10000
            }
        );
        
        console.log('✅ Token obtenido exitosamente');
        return response.data.access_token;
    } catch (error) {
        console.error('❌ Error obteniendo token de PayPal:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });
        throw new Error('No se pudo conectar con PayPal: ' + (error.response?.data?.error_description || error.message));
    }
};

// Crear orden de PayPal
const createPayPalOrder = async (amount, paymentId) => {
    try {
        console.log('💰 Creando orden PayPal:', { amount, paymentId });
        
        const accessToken = await getPayPalAccessToken();
        
        const orderData = {
            intent: 'CAPTURE',
            purchase_units: [{
                amount: {
                    currency_code: 'MXN',
                    value: amount.toFixed(2)
                },
                custom_id: paymentId.toString(),
                description: `Membresía SÓLEO`
            }],
            application_context: {
                brand_name: 'SÓLEO Fitness',
                landing_page: 'LOGIN',
                user_action: 'PAY_NOW',
                return_url: `${FRONTEND_URL || 'http://localhost:5173'}/payment-success`,
                cancel_url: `${FRONTEND_URL || 'http://localhost:5173'}/payment-cancel`
            }
        };

        console.log('📦 Enviando orden a PayPal...');

        const response = await axios.post(
            `${PAYPAL_API}/v2/checkout/orders`,
            orderData,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                timeout: 15000
            }
        );

        console.log('✅ Orden PayPal creada:', response.data.id);
        return response.data;

    } catch (error) {
        console.error('❌ Error creando orden PayPal:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });
        throw new Error(`Error PayPal: ${error.response?.data?.message || error.message}`);
    }
};

// Capturar orden de PayPal
const capturePayPalOrder = async (orderId) => {
    try {
        console.log('💰 Capturando orden PayPal:', orderId);
        
        const accessToken = await getPayPalAccessToken();

        const response = await axios.post(
            `${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`,
            {},
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            }
        );

        console.log('✅ Orden PayPal capturada:', response.data.id);
        return response.data;

    } catch (error) {
        console.error('❌ Error capturando orden PayPal:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });
        throw new Error(`Error capturando pago: ${error.response?.data?.message || error.message}`);
    }
};

// 1. Crear pago
export const createPayment = async (req, res) => {
    try {
        const { membershipId } = req.body;
        const userId = req.userId;

        console.log('💰 Creando pago:', { userId, membershipId });

        // Validaciones
        if (!membershipId) {
            return res.status(400).json({ 
                success: false, 
                message: 'membershipId es requerido' 
            });
        }

        // Verificar membresía
        const membership = await Membership.findById(membershipId);
        if (!membership) {
            return res.status(404).json({ 
                success: false, 
                message: 'Membresía no encontrada' 
            });
        }

        // Verificar que el usuario no tenga ya esta membresía activa
        const existingActivePayment = await Payment.findOne({
            user: userId,
            membership: membershipId,
            status: 'COMPLETADO',
            expirationDate: { $gt: new Date() }
        });

        if (existingActivePayment) {
            return res.status(400).json({
                success: false,
                message: 'Ya tienes esta membresía activa'
            });
        }

        // Crear pago en BD
        const payment = new Payment({
            user: userId,
            membership: membershipId,
            amount: membership.price,
            status: 'PENDIENTE',
            purchaseDate: new Date()
        });
        await payment.save();

        console.log('🔄 Creando orden en PayPal...');
        
        // Crear orden en PayPal
        const order = await createPayPalOrder(membership.price, payment._id);
        
        // Actualizar pago con ID de PayPal
        payment.paypalOrderId = order.id;
        await payment.save();

        console.log('✅ Pago creado exitosamente:', {
            paymentId: payment._id,
            paypalOrderId: order.id
        });

        // Encontrar el link de aprobación
        const approvalLink = order.links.find(link => link.rel === 'approve');
        if (!approvalLink) {
            throw new Error('No se pudo obtener el link de aprobación de PayPal');
        }

        res.json({
            success: true,
            approvalURL: approvalLink.href,
            paymentId: payment._id,
            orderId: order.id
        });

    } catch (error) {
        console.error('❌ Error en createPayment:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al crear el pago: ' + error.message
        });
    }
};




export const capturePayment = async (req, res) => {
    try {
        const { orderId } = req.body;
        
        console.log('🔄 Capturando pago PayPal:', orderId);
        
        const captureData = await capturePayPalOrder(orderId);
        
        // Buscar el pago
        const payment = await Payment.findOne({ paypalOrderId: orderId })
            .populate('membership')
            .populate('user');
        
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Pago no encontrado'
            });
        }

        // ✅ ACTUALIZAR PAGO CON INFORMACIÓN COMPLETA
        payment.status = 'COMPLETADO';
        payment.paypalCaptureId = captureData.id;
        
        // Calcular fecha de expiración
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + payment.membership.durationDays);
        payment.expirationDate = expirationDate;

        // ✅ USAR EL SERVICIO PARA ASIGNAR/REEMPLAZAR MEMBRESÍA
        const membershipResult = await MembershipService.assignMembershipToClient(
            payment.user._id, 
            payment.membership._id,
            payment._id
        );

        // ✅ ACTUALIZAR PAGO CON INFORMACIÓN DE REMPLAZO
        payment.replacedPreviousMembership = membershipResult.wasReplaced;
        payment.previousMembership = membershipResult.previousMembership;
        payment.previousMembershipExpiredAt = new Date();
        
        await payment.save();

        console.log('✅ Pago completado y membresía actualizada:', {
            userId: payment.user._id,
            nuevaMembresia: payment.membership.name,
            reemplazóAnterior: membershipResult.wasReplaced,
            anteriorMembresia: membershipResult.previousMembership
        });

        res.json({ 
            success: true, 
            message: membershipResult.wasReplaced ? 
                'Pago completado. Tu nueva membresía ha sido activada y reemplazó la anterior.' :
                'Pago completado. Tu membresía ha sido activada.',
            captureData,
            membershipInfo: {
                newMembership: membershipResult.newMembership,
                expirationDate: membershipResult.expirationDate,
                previousMembershipReplaced: membershipResult.wasReplaced
            }
        });

    } catch (error) {
        console.error('❌ Error capturando pago:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error capturando pago: ' + error.message 
        });
    }
};

// 3. Cancelar pago
export const cancelPayment = async (req, res) => {
    try {
        const { orderId } = req.body;
        const userId = req.userId;

        console.log('❌ Cancelando pago:', orderId, 'usuario:', userId);

        // Buscar y actualizar el pago
        const payment = await Payment.findOne({ 
            paypalOrderId: orderId, 
            user: userId 
        });

        if (!payment) {
            return res.status(404).json({ 
                success: false,
                message: 'Pago no encontrado' 
            });
        }

        if (payment.status !== 'PENDIENTE') {
            return res.status(400).json({ 
                success: false,
                message: 'Solo se pueden cancelar pagos pendientes' 
            });
        }

        payment.status = 'CANCELADO';
        await payment.save();

        console.log('✅ Pago cancelado:', orderId);

        res.json({
            success: true,
            message: 'Pago cancelado exitosamente'
        });

    } catch (error) {
        console.error('❌ Error cancelando pago:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error al cancelar el pago: ' + error.message 
        });
    }
};

// 4. Obtener historial de pagos (ADMIN)
export const getPaymentHistory = async (req, res) => {
    try {
        const { page = 1, limit = 10, userId } = req.query;
        
        console.log('📊 Obteniendo historial de pagos - Admin:', req.userId);

        let filter = {};
        if (userId) {
            filter.user = userId;
        }

        const payments = await Payment.find(filter)
            .populate('user', 'name email')
            .populate('membership', 'name durationDays price')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Payment.countDocuments(filter);

        res.json({
            success: true,
            payments,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });

    } catch (error) {
        console.error('❌ Error obteniendo historial:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error al obtener el historial de pagos: ' + error.message 
        });
    }
};

// 5. Obtener mis pagos (CLIENTE)
export const getMyPayments = async (req, res) => {
    try {
        const userId = req.userId;
        const { page = 1, limit = 10 } = req.query;

        console.log('📊 Obteniendo mis pagos - Usuario:', userId);

        const payments = await Payment.find({ user: userId })
            .populate('membership', 'name durationDays price description')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Payment.countDocuments({ user: userId });

        res.json({
            success: true,
            payments,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });

    } catch (error) {
        console.error('❌ Error obteniendo mis pagos:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error al obtener tus pagos: ' + error.message 
        });
    }
};

// 6. Obtener estadísticas de pagos (ADMIN)
export const getPaymentStats = async (req, res) => {
    try {
        console.log('📈 Obteniendo estadísticas - Admin:', req.userId);

        const totalPayments = await Payment.countDocuments();
        const completedPayments = await Payment.countDocuments({ status: 'COMPLETADO' });
        const pendingPayments = await Payment.countDocuments({ status: 'PENDIENTE' });
        
        const totalRevenue = await Payment.aggregate([
            { $match: { status: 'COMPLETADO' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;

        // Pagos por membresía
        const paymentsByMembership = await Payment.aggregate([
            { $match: { status: 'COMPLETADO' } },
            { $group: { 
                _id: '$membership', 
                count: { $sum: 1 },
                revenue: { $sum: '$amount' }
            }},
            { $lookup: {
                from: 'memberships',
                localField: '_id',
                foreignField: '_id',
                as: 'membershipInfo'
            }},
            { $unwind: '$membershipInfo' }
        ]);

        res.json({
            success: true,
            stats: {
                totalPayments,
                completedPayments,
                pendingPayments,
                totalRevenue: revenue,
                paymentsByMembership
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo estadísticas:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error al obtener estadísticas: ' + error.message 
        });
    }
};