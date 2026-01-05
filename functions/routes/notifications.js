const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const functions = require('firebase-functions');
const twilio = require('twilio');

const db = admin.firestore();

// Configure Twilio client for SMS
const getTwilioClient = () => {
  const twilioConfig = functions.config().twilio;
  if (twilioConfig && twilioConfig.account_sid && twilioConfig.auth_token && twilioConfig.from) {
    return {
      client: twilio(twilioConfig.account_sid, twilioConfig.auth_token),
      from: twilioConfig.from
    };
  }
  console.log('No Twilio config found. SMS notifications are disabled.');
  return null;
};

// Configure transporter
// In production, set these config variables using:
// firebase functions:config:set email.service="gmail" email.user="your@email.com" email.pass="yourpassword"
const getTransporter = () => {
  const emailConfig = functions.config().email;
  
  if (emailConfig && emailConfig.service && emailConfig.user && emailConfig.pass) {
    return nodemailer.createTransport({
      service: emailConfig.service,
      auth: {
        user: emailConfig.user,
        pass: emailConfig.pass
      }
    });
  }
  
  // Fallback for development/testing (logs to console)
  console.log('No email config found. Using JSON transport for logging.');
  return nodemailer.createTransport({
    jsonTransport: true
  });
};

/**
 * Send weekly expense summary to all users who had activity
 */
async function sendWeeklyExpenseSummary() {
  console.log('Starting weekly expense summary job...');
  
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);

  try {
    // 1. Get all expenses from the last week
    const expensesSnapshot = await db.collection('expenses')
      .where('createdAt', '>=', startDate)
      .where('createdAt', '<=', endDate)
      .get();

    if (expensesSnapshot.empty) {
      console.log('No expenses found for the past week.');
      return null;
    }

    // 2. Group expenses by participant
    const userExpensesMap = {}; // userId -> { expenses: [], totalAmount: 0 }

    expensesSnapshot.forEach(doc => {
      const expense = doc.data();
      const expenseId = doc.id;
      
      // Add to payer's list
      if (!userExpensesMap[expense.createdBy]) {
        userExpensesMap[expense.createdBy] = { expenses: [], role: 'payer' };
      }
      userExpensesMap[expense.createdBy].expenses.push({
        ...expense,
        id: expenseId,
        role: 'payer'
      });

      // Add to participants' list
      if (expense.participants) {
        expense.participants.forEach(userId => {
          if (userId !== expense.createdBy) {
            if (!userExpensesMap[userId]) {
              userExpensesMap[userId] = { expenses: [], role: 'participant' };
            }
            userExpensesMap[userId].expenses.push({
              ...expense,
              id: expenseId,
              role: 'participant'
            });
          }
        });
      }
    });

    // 3. Send emails
    const transporter = getTransporter();
    const emailPromises = [];

    for (const [userId, data] of Object.entries(userExpensesMap)) {
      if (data.expenses.length === 0) continue;

      const userPromise = db.collection('users').doc(userId).get()
        .then(async (userDoc) => {
          if (!userDoc.exists) {
            console.log(`User ${userId} not found, skipping email.`);
            return;
          }

          const user = userDoc.data();
          if (!user.email) {
            console.log(`User ${userId} has no email, skipping.`);
            return;
          }

          const emailContent = generateEmailContent(user.displayName, data.expenses, startDate, endDate);
          
          const mailOptions = {
            from: '"Settle Up" <noreply@settleup.app>',
            to: user.email,
            subject: `Weekly Expense Summary (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})`,
            html: emailContent
          };

          try {
            const info = await transporter.sendMail(mailOptions);
            console.log(`Email sent to ${user.email}: ${info.messageId || JSON.stringify(info)}`);
          } catch (err) {
            console.error(`Failed to send email to ${user.email}:`, err);
          }
        });

      emailPromises.push(userPromise);
    }

    await Promise.all(emailPromises);
    console.log('Weekly summary job completed.');
    return { success: true, emailsSent: emailPromises.length };

  } catch (error) {
    console.error('Error in weekly summary job:', error);
    throw error;
  }
}

function generateEmailContent(userName, expenses, startDate, endDate) {
  const expenseRows = expenses.map(exp => {
    const date = exp.date ? new Date(exp.date._seconds * 1000).toLocaleDateString() : 'N/A';
    const role = exp.role === 'payer' ? '<span style="color: green">Paid</span>' : '<span style="color: orange">Owe</span>';
    return `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${date}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${exp.description}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${exp.currency} ${exp.amount}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${role}</td>
      </tr>
    `;
  }).join('');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Hi ${userName},</h2>
      <p>Here is your expense summary for the week of ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}.</p>
      
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
          <tr style="background-color: #f8f9fa; text-align: left;">
            <th style="padding: 8px; border-bottom: 2px solid #ddd;">Date</th>
            <th style="padding: 8px; border-bottom: 2px solid #ddd;">Description</th>
            <th style="padding: 8px; border-bottom: 2px solid #ddd;">Amount</th>
            <th style="padding: 8px; border-bottom: 2px solid #ddd;">Role</th>
          </tr>
        </thead>
        <tbody>
          ${expenseRows}
        </tbody>
      </table>
      
      <p style="margin-top: 20px; color: #666;">
        <small>This is an automated message from Settle Up.</small>
      </p>
    </div>
  `;
}

/**
 * Send notification to participants when added to an expense
 * @param {Object} expense - The expense object
 * @param {Object} creator - The user who created the expense
 * @param {Array} participants - Array of participant user objects (must include email)
 */
async function sendExpenseNotification(expense, creator, participants) {
  const transporter = getTransporter();
  const twilioClient = getTwilioClient();
  
  const notifications = participants.map(async (participant) => {
    // Skip if participant is the creator or has no email
    if (participant.uid === creator.uid) return;

    const sendEmailPromise = async () => {
      if (!participant.email) return null;

      const mailOptions = {
        from: '"Settle Up" <noreply@settleup.app>',
        to: participant.email,
        subject: `New Expense: ${expense.description}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #4f46e5;">New Expense Added</h2>
            <p><strong>${creator.displayName || 'Someone'}</strong> added you to an expense.</p>
            
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0;">${expense.description}</h3>
              <p style="margin: 5px 0; font-size: 18px; font-weight: bold;">${expense.currency} ${expense.amount}</p>
              <p style="margin: 5px 0; color: #64748b;">${new Date(expense.date).toLocaleDateString()}</p>
            </div>

            <p>Log in to the app to see the full details and settle up.</p>
            
            <p style="margin-top: 30px; color: #94a3b8; font-size: 12px;">
              Settle Up App Notification
            </p>
          </div>
        `
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`Notification sent to ${participant.email}: ${info.messageId}`);
      return info;
    };

    const sendSmsPromise = async () => {
      if (!twilioClient || !participant.phoneNumber) return null;
      try {
        const body = `${creator.displayName || 'Someone'} added an expense: ${expense.description} for ${expense.currency} ${expense.amount}. View details in Settle Up.`;
        const resp = await twilioClient.client.messages.create({
          body,
          from: twilioClient.from,
          to: participant.phoneNumber
        });
        console.log(`SMS sent to ${participant.phoneNumber}: ${resp.sid}`);
        return resp;
      } catch (err) {
        console.error(`Failed to send SMS to ${participant.phoneNumber}:`, err);
        return null;
      }
    };

    return Promise.all([sendEmailPromise(), sendSmsPromise()]);
  });

  await Promise.all(notifications);
}

module.exports = {
  sendWeeklyExpenseSummary,
  sendExpenseNotification
};
