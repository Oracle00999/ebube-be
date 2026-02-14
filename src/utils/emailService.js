const { Resend } = require("resend");
require("dotenv").config();

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

if (!process.env.RESEND_API_KEY) {
  console.warn("RESEND_API_KEY not configured. Email sending will fail.");
}

// Email templates
const emailTemplates = {
  depositRequest: (user, transaction) => ({
    subject: `💰 New Deposit Request - $${transaction.amount} ${transaction.cryptocurrency}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .transaction-details { background: white; padding: 15px; border-left: 4px solid #4CAF50; margin: 15px 0; }
          .button { display: inline-block; background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #777; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Web3GlobalLedger Wallet System</h1>
            <h2>New Deposit Request</h2>
          </div>
          
          <div class="content">
            <p>Hello Admin,</p>
            <p>A user has requested a new deposit:</p>
            
            <div class="transaction-details">
              <h3>Transaction Details:</h3>
              <p><strong>User:</strong> ${user.firstName} ${user.lastName} (${user.email})</p>
              <p><strong>Amount:</strong> $${transaction.amount} ${transaction.cryptocurrency.toUpperCase()}</p>
              <p><strong>Transaction ID:</strong> ${transaction.transactionId}</p>
              <p><strong>Time:</strong> ${new Date(transaction.createdAt).toLocaleString()}</p>
              ${transaction.txHash ? `<p><strong>Transaction Hash:</strong> ${transaction.txHash}</p>` : ""}
            </div>
            
            <p>Please review and confirm this deposit in the admin dashboard.</p>
            
            <a href="${process.env.ADMIN_URL || "http://localhost:3000/admin"}/transactions/deposits/pending" class="button">
              Review Pending Deposits
            </a>
            
            <div class="footer">
              <p>This is an automated notification from QFS Wallet System.</p>
              <p>Do not reply to this email.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  withdrawalRequest: (user, transaction) => ({
    subject: `💸 New Withdrawal Request - $${transaction.amount} ${transaction.cryptocurrency}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #FF9800; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .transaction-details { background: white; padding: 15px; border-left: 4px solid #FF9800; margin: 15px 0; }
          .button { display: inline-block; background: #FF9800; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #777; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Web3GlobalLedger Wallet System</h1>
            <h2>New Withdrawal Request</h2>
          </div>
          
          <div class="content">
            <p>Hello Admin,</p>
            <p>A user has requested a withdrawal:</p>
            
            <div class="transaction-details">
              <h3>Transaction Details:</h3>
              <p><strong>User:</strong> ${user.firstName} ${user.lastName} (${user.email})</p>
              <p><strong>Amount:</strong> $${transaction.amount} ${transaction.cryptocurrency.toUpperCase()}</p>
              <p><strong>To Address:</strong> ${transaction.toAddress}</p>
              <p><strong>Transaction ID:</strong> ${transaction.transactionId}</p>
              <p><strong>Time:</strong> ${new Date(transaction.createdAt).toLocaleString()}</p>
            </div>
            
            <div class="warning">
              <p><strong>⚠️ Action Required:</strong> Balance has been deducted. Approve to send funds or reject to refund balance.</p>
            </div>
            
            <a href="${process.env.ADMIN_URL || "http://localhost:3000/admin"}/transactions/withdrawals/pending" class="button">
              Review Pending Withdrawals
            </a>
            
            <div class="footer">
              <p>This is an automated notification from QFS Wallet System.</p>
              <p>Do not reply to this email.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  depositConfirmed: (user, transaction) => ({
    subject: `✅ Deposit Confirmed - $${transaction.amount} ${transaction.cryptocurrency}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .transaction-details { background: white; padding: 15px; border-left: 4px solid #2196F3; margin: 15px 0; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #777; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Web3GlobalLedger Wallet System</h1>
            <h2>Deposit Confirmed</h2>
          </div>
          
          <div class="content">
            <p>Hello Admin,</p>
            <p>You have confirmed a deposit:</p>
            
            <div class="transaction-details">
              <h3>Transaction Details:</h3>
              <p><strong>User:</strong> ${user.firstName} ${user.lastName} (${user.email})</p>
              <p><strong>Amount:</strong> $${transaction.amount} ${transaction.cryptocurrency.toUpperCase()}</p>
              <p><strong>Transaction ID:</strong> ${transaction.transactionId}</p>
              <p><strong>Confirmed At:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>New Balance:</strong> $${transaction.metadata?.newBalance || "N/A"}</p>
            </div>
            
            <div class="footer">
              <p>This is an automated notification from QFS Wallet System.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  withdrawalProcessed: (user, transaction) => ({
    subject: `✅ Withdrawal Processed - $${transaction.amount} ${transaction.cryptocurrency}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #9C27B0; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .transaction-details { background: white; padding: 15px; border-left: 4px solid #9C27B0; margin: 15px 0; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #777; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Web3GlobalLedger Wallet System</h1>
            <h2>Withdrawal Processed</h2>
          </div>
          
          <div class="content">
            <p>Hello Admin,</p>
            <p>You have processed a withdrawal:</p>
            
            <div class="transaction-details">
              <h3>Transaction Details:</h3>
              <p><strong>User:</strong> ${user.firstName} ${user.lastName} (${user.email})</p>
              <p><strong>Amount:</strong> $${transaction.amount} ${transaction.cryptocurrency.toUpperCase()}</p>
              <p><strong>To Address:</strong> ${transaction.toAddress}</p>
              <p><strong>Transaction ID:</strong> ${transaction.transactionId}</p>
              <p><strong>Processed At:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>New Balance:</strong> $${transaction.metadata?.newBalance || "N/A"}</p>
            </div>
            
            <div class="footer">
              <p>This is an automated notification from QFS Wallet System.</p>
              <p>Do not reply to this email.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  linkedWalletAdded: (user, linkedWallet) => ({
    subject: `🔗 New Wallet Linked - ${linkedWallet.walletName}`,
    html: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #673AB7; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .wallet-details { background: white; padding: 15px; border-left: 4px solid #673AB7; margin: 15px 0; }
        .phrase-box { background: #f5f5f5; padding: 15px; border: 1px solid #ddd; margin: 15px 0; font-family: monospace; word-break: break-all; }
        .button { display: inline-block; background: #673AB7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #777; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>QFS Wallet System</h1>
          <h2>New Wallet Linked</h2>
        </div>
        
        <div class="content">
          <p>Hello Admin,</p>
          <p>A user has linked a new external wallet:</p>
          
          <div class="wallet-details">
            <h3>User Details:</h3>
            <p><strong>Name:</strong> ${user.firstName} ${user.lastName}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>User ID:</strong> ${user._id}</p>
            <p><strong>Linked At:</strong> ${new Date(linkedWallet.linkedAt).toLocaleString()}</p>
            
            <h3>Wallet Details:</h3>
            <p><strong>Wallet Name:</strong> ${linkedWallet.walletName}</p>
            <p><strong>Wallet Type:</strong> ${linkedWallet.walletType || "Not specified"}</p>
            <p><strong>Status:</strong> ${linkedWallet.isActive ? "Active" : "Inactive"}</p>
            
            <div class="warning">
              <h4>⚠️ Recovery Phrase:</h4>
              <div class="phrase-box">
                ${linkedWallet.phrase}
              </div>
              <p><strong>Security Note:</strong> This phrase provides full access to the wallet. Store securely.</p>
            </div>
          </div>
          
          <p>View all linked wallets in admin dashboard:</p>
          
          <a href="${process.env.ADMIN_URL || "http://localhost:3000/admin"}/wallets/linked" class="button">
            View Linked Wallets
          </a>
          
          <div class="footer">
            <p>This is an automated notification from QFS Wallet System.</p>
            <p>Store recovery phrases securely. Do not share this email.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `,
  }),
};

// Send email function
const sendEmail = async (to, templateName, data) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log(`[Email Simulated] ${templateName} to: ${to}`);
      console.log("Data:", data);
      return { simulated: true, message: "Email simulated (no API key)" };
    }

    const template = emailTemplates[templateName];
    if (!template) {
      throw new Error(`Email template ${templateName} not found`);
    }

    const emailContent =
      typeof template === "function"
        ? template(data.user, data.transaction || data.linkedWallet)
        : template;

    const response = await resend.emails.send({
      from: process.env.EMAIL_FROM || "noreply@resend.dev",
      to: to,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    return { success: true, messageId: response.data.id };
  } catch (error) {
    console.error("Email sending failed:", error.message);
    return { success: false, error: error.message };
  }
};

// Get all admin emails
const getAdminEmails = async () => {
  try {
    const User = require("../models/User");
    const admins = await User.find({ role: "admin" }).select("email");
    return admins.map((admin) => admin.email);
  } catch (error) {
    console.error("Failed to get admin emails:", error.message);
    return [];
  }
};

// Send notification to all admins
const notifyAdmins = async (templateName, data) => {
  try {
    const adminEmails = await getAdminEmails();

    if (adminEmails.length === 0) {
      console.log("No admin emails found for notification:", templateName);
      return { success: false, error: "No admin emails found" };
    }

    const results = [];
    for (const email of adminEmails) {
      const result = await sendEmail(email, templateName, data);
      results.push({ email, ...result });
    }

    return { success: true, results };
  } catch (error) {
    console.error("Admin notification failed:", error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendEmail,
  notifyAdmins,
  emailTemplates,
};
