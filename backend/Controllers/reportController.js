const mongoose = require('mongoose');
const User = require('../models/userModel');
const Activity = require('../models/trackingModel');
const { sendReportEmail } = require('../services/mailService');
const UserInfo = require('../models/UserInfoModel');

// Build report text for a single user and date
const buildReportForUserAndDate = async (user, dateStr) => {
    const activities = await Activity.find({ userId: user._id, eatenDate: dateStr });
    const userInfos = await UserInfo.findOne({ userId: user._id });
    const dailyCalorieRequirement = userInfos && userInfos.dailyCalorieRequirement ? userInfos.dailyCalorieRequirement : 0;

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFats = 0;
    let totalFiber = 0;

    let reportContent = `Hello ${user.name || 'User'},\n\nHere is your daily activity summary for ${dateStr}:\n`;

    activities.forEach(activity => {
        const details = activity.details || {};
        totalCalories += Number(details.calories || 0);
        totalProtein += Number(details.protein || 0);
        totalCarbs += Number(details.carbohydrates || 0);
        totalFats += Number(details.fat || 0);
        totalFiber += Number(details.fiber || 0);
        reportContent += `- ${activity.mealType || 'Meal'}: ${Number(details.calories || 0)} cal\n`;
    });

    const percentageCompleted = dailyCalorieRequirement > 0 ? (totalCalories / dailyCalorieRequirement) * 100 : 0;

    reportContent += `\nTotals:\nCalories: ${totalCalories} cal\nProtein: ${totalProtein} g\nCarbs: ${totalCarbs} g\nFats: ${totalFats} g\nFiber: ${totalFiber} g\nYou have completed ${percentageCompleted.toFixed(2)}% of your daily requirement.\n\n`;
    reportContent += `Keep tracking your activities to stay fit!\n`;

    return { reportContent, activities, totals: { totalCalories, totalProtein, totalCarbs, totalFats, totalFiber }, percentageCompleted };
};

const generateDailyReport = async ({ forDate } = {}) => {
    try {
        // Determine target date (defaults to yesterday)
        const base = forDate ? new Date(forDate) : new Date();
        if (!forDate) base.setDate(base.getDate() - 1);
        const dd = String(base.getDate()).padStart(2, '0');
        const mm = String(base.getMonth() + 1).padStart(2, '0');
        const yyyy = base.getFullYear();
        const formattedDate = `${dd}-${mm}-${yyyy}`;

        const users = await User.find(); // Fetch all users

        for (const user of users) {
            try {
                const { reportContent } = await buildReportForUserAndDate(user, formattedDate);
                if (user.email) {
                    const info = await sendReportEmail(user.email, reportContent);
                    console.log(`Report sent to ${user.email}. Response:`, info && info.response ? info.response : info);
                }
            } catch (err) {
                console.error(`Failed to send report to ${user.email}:`, err);
            }
        }

    } catch (error) {
        console.error('Error generating report:', error);
        throw error;
    }
};

// Helper to send report for a single user id (useful for admin testing)
const sendReportForUserId = async (userId, { forDate } = {}) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    const base = forDate ? new Date(forDate) : new Date();
    if (!forDate) base.setDate(base.getDate() - 1);
    const dd = String(base.getDate()).padStart(2, '0');
    const mm = String(base.getMonth() + 1).padStart(2, '0');
    const yyyy = base.getFullYear();
    const formattedDate = `${dd}-${mm}-${yyyy}`;

    const { reportContent } = await buildReportForUserAndDate(user, formattedDate);
    if (user.email) {
        const info = await sendReportEmail(user.email, reportContent);
        return info;
    }
    throw new Error('User has no email');
};

module.exports = generateDailyReport;
module.exports.sendReportForUserId = sendReportForUserId;
