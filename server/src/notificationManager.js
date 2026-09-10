/**
 * Notification Manager for Classroom Quiz Notifications
 * Tracks real-time and persistent announcements for students:
 * - LIVE_ROOM: Teacher launched a live quiz session with PIN and timer
 * - NEW_QUIZ: Teacher created a new quiz
 * - TIME_SET: Teacher updated or configured question timer
 */

class NotificationManager {
  constructor() {
    // Only real teacher announcements & live quiz sessions should appear
    this.notifications = [];
  }

  clearNotifications() {
    this.notifications = [];
    return this.notifications;
  }

  addNotification(data) {
    const newNotif = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: data.type || 'NEW_QUIZ', // 'LIVE_ROOM' | 'NEW_QUIZ' | 'TIME_SET'
      title: data.title || 'Classroom Notification',
      message: data.message || '',
      roomCode: data.roomCode || null,
      quizTitle: data.quizTitle || 'Quiz',
      subject: data.subject || 'General',
      timeLimit: data.timeLimit || 20,
      totalQuestions: data.totalQuestions || 0,
      hostName: data.hostName || 'Teacher',
      createdAt: data.createdAt || new Date().toISOString(),
      isLive: data.isLive !== undefined ? data.isLive : (data.type === 'LIVE_ROOM'),
      read: false
    };

    // Prepend to front of list
    this.notifications.unshift(newNotif);

    // Keep max 50 notifications
    if (this.notifications.length > 50) {
      this.notifications.pop();
    }

    return newNotif;
  }

  getNotifications() {
    return this.notifications;
  }

  markAllAsRead() {
    this.notifications.forEach(n => { n.read = true; });
    return this.notifications;
  }

  markAsRead(id) {
    const notif = this.notifications.find(n => n.id === id);
    if (notif) notif.read = true;
    return notif;
  }
}

const notificationManager = new NotificationManager();
export default notificationManager;
