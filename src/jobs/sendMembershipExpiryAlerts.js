// jobs/sendMembershipExpiryAlerts.js
const User = require('../models/User');
const { sendFcmNotification } = require('../utils/fcm');

async function sendMembershipExpiryAlerts() {
  const today = new Date();
  const in3Days = new Date(today);
  in3Days.setDate(today.getDate() + 3);

  const users = await User.find({
    membershipExpiresAt: { $gte: today, $lte: in3Days },
    fcmTokens: { $exists: true, $ne: [] },
    status: 'ACTIVO'
  })
  .select('name fcmTokens membershipExpiresAt currentMembership')
  .populate('currentMembership', 'name');

  for (const user of users) {
    const expiry = new Date(user.membershipExpiresAt);
    const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    const plan = user.currentMembership?.name || 'Semilla';

    let message = `Tu plan "${plan}" expira `;
    if (daysLeft === 1) message += 'hoy';
    else message += `en ${daysLeft} días`;

    await sendFcmNotification(
      user.fcmTokens,
      '⚠️ Tu membresía está por expirar',
      `${user.name}, ${message}. ¡Renuévala para seguir avanzando!`
    );
  }
}

// Ejecutar diariamente a las 9 AM
const now = new Date();
const nineAm = new Date(now);
nineAm.setHours(9, 0, 0, 0);
const delay = nineAm > now ? nineAm - now : 24 * 60 * 60 * 1000 - (now - nineAm);

setTimeout(() => {
  sendMembershipExpiryAlerts();
  setInterval(sendMembershipExpiryAlerts, 24 * 60 * 60 * 1000);
}, delay);

module.exports = { sendMembershipExpiryAlerts };