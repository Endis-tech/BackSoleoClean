// jobs/sendWorkoutReminders.js
const User = require('../models/User');
const { sendFcmNotification } = require('../utils/fcm');

async function sendWorkoutReminders() {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  const users = await User.find({
    role: 'CLIENTE',
    exerciseTime: { $exists: true, $ne: null },
    fcmTokens: { $exists: true, $ne: [] },
    status: 'ACTIVO'
  }).select('name exerciseTime fcmTokens');

  for (const user of users) {
    const [userHour, userMinute] = user.exerciseTime.split(':').map(Number);
    const diffMinutes = Math.abs((currentHour * 60 + currentMinute) - (userHour * 60 + userMinute));
    
    if (diffMinutes <= 5) {
      await sendFcmNotification(
        user.fcmTokens,
        '🏋️ ¡Hora de entrenar!',
        `¡${user.name}, es tu momento! No rompas tu racha de hoy.`
      );
    }
  }
}

// Ejecutar cada 15 minutos
setInterval(sendWorkoutReminders, 5 * 60 * 1000);

// Ejecutar al iniciar
sendWorkoutReminders();

module.exports = { sendWorkoutReminders };