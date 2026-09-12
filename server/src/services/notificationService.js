import prisma from '../prisma.js';
import notificationManager from '../notificationManager.js';
import { sendLiveQuizNotificationEmail } from './emailService.js';

class NotificationService {
  constructor() {
    this.tableEnsured = false;
  }

  /**
   * Ensure the PostgreSQL table StudentNotification exists
   */
  async ensureTable() {
    if (this.tableEnsured) return;
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "StudentNotification" (
          "id" TEXT PRIMARY KEY,
          "userId" TEXT,
          "type" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "message" TEXT NOT NULL,
          "roomCode" TEXT,
          "quizTitle" TEXT NOT NULL,
          "subject" TEXT NOT NULL,
          "timeLimit" INTEGER DEFAULT 20,
          "totalQuestions" INTEGER DEFAULT 0,
          "hostName" TEXT DEFAULT 'Teacher',
          "isLive" BOOLEAN DEFAULT false,
          "read" BOOLEAN DEFAULT false,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "idx_student_notif_created_at" ON "StudentNotification"("createdAt" DESC)
      `);

      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "idx_student_notif_room" ON "StudentNotification"("roomCode")
      `);

      this.tableEnsured = true;
    } catch (err) {
      console.warn('⚠️ Could not verify/create StudentNotification table in Postgres:', err.message);
    }
  }

  /**
   * Query all registered students from the PostgreSQL database
   */
  async getRegisteredStudents() {
    try {
      const students = await prisma.user.findMany({
        where: { role: 'STUDENT' },
        select: { id: true, name: true, email: true, role: true }
      });
      return students || [];
    } catch (err) {
      console.error('Failed to query registered students:', err);
      return [];
    }
  }

  /**
   * Dispatched whenever a teacher hosts a live quiz session
   */
  async notifyLiveQuizHosted({ quiz, roomCode, hostName = 'Teacher', hostId = null, io = null }) {
    await this.ensureTable();

    const notifId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const quizTitle = quiz?.title || 'Classroom Quiz';
    const subject = quiz?.subject || 'General Knowledge';
    const defaultTimeLimit = Number(quiz?.defaultTimeLimit || 20);
    const totalQuestions = Number(quiz?.questions?.length || 0);

    const title = `Live Quiz Started: ${quizTitle}`;
    const message = `${hostName} launched "${quizTitle}" (${totalQuestions} questions, ${defaultTimeLimit}s timer). Room PIN: ${roomCode}`;

    // 1. Fetch all registered students in the system
    const registeredStudents = await this.getRegisteredStudents();
    console.log(`📢 Found ${registeredStudents.length} registered students to notify for live quiz room ${roomCode}`);

    // 2. Persist notification in PostgreSQL
    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "StudentNotification" 
          ("id", "type", "title", "message", "roomCode", "quizTitle", "subject", "timeLimit", "totalQuestions", "hostName", "isLive", "read", "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`,
        notifId,
        'LIVE_ROOM',
        title,
        message,
        roomCode,
        quizTitle,
        subject,
        defaultTimeLimit,
        totalQuestions,
        hostName,
        true,
        false
      );
    } catch (dbErr) {
      console.error('Error inserting into StudentNotification:', dbErr.message);
    }

    // 3. Keep in in-memory notificationManager for fast cache
    const cachedNotif = notificationManager.addNotification({
      id: notifId,
      type: 'LIVE_ROOM',
      title,
      message,
      roomCode,
      quizTitle,
      subject,
      timeLimit: defaultTimeLimit,
      totalQuestions,
      hostName,
      isLive: true
    });

    const notifPayload = {
      ...cachedNotif,
      id: notifId,
      registeredStudentsCount: registeredStudents.length
    };

    // 4. Real-time Socket.IO emission to all connected dashboards and specific student rooms
    if (io) {
      io.emit('classroom:notification', notifPayload);
      io.to('students:registered').emit('student:quiz-hosted', notifPayload);
    }

    // 5. Asynchronous Email Notification Dispatch to all registered student email addresses
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    this.dispatchStudentNotificationEmails({
      students: registeredStudents,
      teacherName: hostName,
      quizTitle,
      subject,
      roomCode,
      timeLimit: defaultTimeLimit,
      totalQuestions,
      clientUrl
    }).catch(err => {
      console.warn('⚠️ Background email dispatch encountered an issue:', err.message);
    });

    return {
      notification: notifPayload,
      studentsNotifiedCount: registeredStudents.length,
      students: registeredStudents.map(s => ({ id: s.id, name: s.name, email: s.email }))
    };
  }

  /**
   * Dispatch notification emails to registered students asynchronously
   */
  async dispatchStudentNotificationEmails({
    students,
    teacherName,
    quizTitle,
    subject,
    roomCode,
    timeLimit,
    totalQuestions,
    clientUrl
  }) {
    if (!students || students.length === 0) return;

    console.log(`📧 Starting email dispatch to ${students.length} registered students for Room ${roomCode}...`);

    const emailPromises = students.map(student => {
      return sendLiveQuizNotificationEmail({
        studentEmail: student.email,
        studentName: student.name,
        teacherName,
        quizTitle,
        subject,
        roomCode,
        timeLimit,
        totalQuestions,
        clientUrl
      }).catch(err => {
        console.warn(`Could not deliver live quiz email to ${student.email}:`, err.message);
        return { success: false, email: student.email, error: err.message };
      });
    });

    const results = await Promise.allSettled(emailPromises);
    const fulfilled = results.filter(r => r.status === 'fulfilled').length;
    console.log(`✅ Live quiz notification emails dispatched: ${fulfilled}/${students.length} sent for Room ${roomCode}`);
  }

  /**
   * Mark room as no longer live when quiz ends or host closes it
   */
  async markRoomEnded(roomCode) {
    if (!roomCode) return;
    try {
      await this.ensureTable();
      await prisma.$executeRawUnsafe(
        `UPDATE "StudentNotification" SET "isLive" = false WHERE "roomCode" = $1`,
        roomCode
      );
    } catch (err) {
      console.warn('Could not update StudentNotification ended status in Postgres:', err.message);
    }

    const inMemory = notificationManager.getNotifications();
    inMemory.forEach(n => {
      if (n.roomCode === roomCode) {
        n.isLive = false;
      }
    });
  }

  /**
   * Retrieve notifications for student portal with live verification against active roomManager
   */
  async getNotifications({ roomManager = null } = {}) {
    await this.ensureTable();

    let list = [];
    try {
      const rows = await prisma.$queryRawUnsafe(`
        SELECT "id", "type", "title", "message", "roomCode", "quizTitle", "subject", 
               "timeLimit", "totalQuestions", "hostName", "isLive", "read", "createdAt"
        FROM "StudentNotification"
        ORDER BY "createdAt" DESC
        LIMIT 50;
      `);

      if (rows && rows.length > 0) {
        list = rows.map(r => ({
          ...r,
          isLive: roomManager && r.roomCode ? !!roomManager.getRoom(r.roomCode) : Boolean(r.isLive),
          createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString()
        }));
      }
    } catch (dbErr) {
      console.warn('Could not read from Postgres StudentNotification, falling back to memory:', dbErr.message);
      list = notificationManager.getNotifications();
    }

    // Merge with in-memory if Postgres was empty or partial
    if (list.length === 0) {
      list = notificationManager.getNotifications();
    }

    return list;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    try {
      await this.ensureTable();
      await prisma.$executeRawUnsafe(`UPDATE "StudentNotification" SET "read" = true;`);
    } catch (err) {
      console.warn('Could not mark StudentNotification read in Postgres:', err.message);
    }
    return notificationManager.markAllAsRead();
  }

  /**
   * Clear notifications
   */
  async clearNotifications() {
    try {
      await this.ensureTable();
      await prisma.$executeRawUnsafe(`DELETE FROM "StudentNotification";`);
    } catch (err) {
      console.warn('Could not clear StudentNotification in Postgres:', err.message);
    }
    return notificationManager.clearNotifications();
  }
}

const notificationService = new NotificationService();
export default notificationService;
