const { NotificationChannel, NotificationStatus } = require("@prisma/client");
const prisma = require("../config/prisma");
const env = require("../config/env");
const { logTransaction } = require("../utils/logger");

async function createNotification({
  userId,
  channel = NotificationChannel.IN_APP,
  type,
  subject,
  message
}) {
  const notification = await prisma.notification.create({
    data: {
      userId,
      channel,
      type,
      subject,
      message,
      status: NotificationStatus.SENT,
      sentAt: new Date()
    }
  });

  logTransaction("notification_dispatched", {
    userId,
    channel,
    type,
    from: channel === NotificationChannel.SMS ? env.smsFrom : env.emailFrom
  });

  return notification;
}

async function notifyUser(userId, payload) {
  return Promise.all(
    (payload.channels || [NotificationChannel.IN_APP]).map((channel) =>
      createNotification({
        userId,
        channel,
        type: payload.type,
        subject: payload.subject,
        message: payload.message
      })
    )
  );
}

module.exports = {
  createNotification,
  notifyUser
};
