const { Expo } = require('expo-server-sdk');
const { allQuery } = require('../database');

// Create a new Expo SDK client
const expo = new Expo();

async function sendPushNotification(title, body) {
  try {
    // Get all push tokens
    const tokens = await allQuery('SELECT token FROM push_tokens WHERE token IS NOT NULL');
    
    if (tokens.length === 0) {
      return { success: false, message: 'No push tokens registered' };
    }

    // Filter valid Expo push tokens
    const validTokens = tokens
      .map(t => t.token)
      .filter(token => Expo.isExpoPushToken(token));

    if (validTokens.length === 0) {
      return { success: false, message: 'No valid Expo push tokens' };
    }

    // Create messages
    const messages = validTokens.map(token => ({
      to: token,
      sound: 'default',
      title,
      body,
      data: { title, body },
    }));

    // Send notifications in chunks
    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Error sending push notification chunk:', error);
      }
    }

    // Check for errors
    const errors = tickets
      .map((ticket, i) => {
        if (ticket.status === 'error') {
          return { token: validTokens[i], error: ticket.message };
        }
        return null;
      })
      .filter(Boolean);

    return {
      success: true,
      sent: tickets.filter(t => t.status === 'ok').length,
      errors: errors.length,
      errorDetails: errors,
    };
  } catch (error) {
    console.error('Error in sendPushNotification:', error);
    return { success: false, error: error.message };
  }
}

module.exports = { sendPushNotification };

