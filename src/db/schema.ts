import { pgTable, serial, varchar, text, boolean, integer, timestamp, uniqueIndex, index, primaryKey, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }), // For legacy, can be removed
  leetcodeUsername: varchar('leetcode_username', { length: 255 }).notNull().unique(),
  github: varchar('github', { length: 255 }).notNull(),
  linkedin: varchar('linkedin', { length: 255 }),
  phoneNumber: varchar('phone_number', { length: 32 }),
  role: varchar('role', { length: 16 }).notNull().default('user'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const groups = pgTable('groups', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 32 }).notNull().unique(),
  description: text('description'),
  owner: integer('owner').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const groupMembers = pgTable('group_members', {
  groupId: integer('group_id').notNull().references(() => groups.id),
  userId: integer('user_id').notNull().references(() => users.id),
}, (table) => ({
  pk: primaryKey({ columns: [table.groupId, table.userId] }),
}));

export const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  automationEnabled: boolean('automation_enabled').default(true),
  emailAutomationEnabled: boolean('email_automation_enabled').default(true),
  whatsappAutomationEnabled: boolean('whatsapp_automation_enabled').default(true),
  emailSchedule: jsonb('email_schedule').default(['09:00']),
  whatsappSchedule: jsonb('whatsapp_schedule').default(['09:30']),
  timezone: varchar('timezone', { length: 64 }).default('Asia/Kolkata'),
  maxDailyEmails: integer('max_daily_emails').default(1),
  maxDailyWhatsapp: integer('max_daily_whatsapp').default(1),
  emailsSentToday: integer('emails_sent_today').default(0),
  whatsappSentToday: integer('whatsapp_sent_today').default(0),
  lastEmailSent: timestamp('last_email_sent', { withTimezone: true }),
  lastWhatsappSent: timestamp('last_whatsapp_sent', { withTimezone: true }),
  lastResetDate: timestamp('last_reset_date', { withTimezone: true }).defaultNow(),
  skipWeekends: boolean('skip_weekends').default(false),
  skipHolidays: boolean('skip_holidays').default(false),
  customSkipDates: jsonb('custom_skip_dates').default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const messageTemplates = pgTable('message_templates', {
  id: serial('id').primaryKey(),
  type: varchar('type', { length: 32 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 255 }),
  content: text('content').notNull(),
  variables: jsonb('variables').default([]),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  uniq: uniqueIndex('type_name_idx').on(table.type, table.name),
}));

export const dailyStats = pgTable('daily_stats', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  date: varchar('date', { length: 16 }).notNull(),
  easy: integer('easy').default(0),
  medium: integer('medium').default(0),
  hard: integer('hard').default(0),
  total: integer('total').default(0),
  ranking: integer('ranking').default(0),
  avatar: varchar('avatar', { length: 255 }).default(''),
  country: varchar('country', { length: 64 }).default(''),
  streak: integer('streak').default(0),
  lastSubmission: varchar('last_submission', { length: 64 }),
  recentProblems: jsonb('recent_problems').default([]),
  previousTotal: integer('previous_total').default(0),
  todayPoints: integer('today_points').default(0),
}, (table) => ({
  uniq: uniqueIndex('user_date_idx').on(table.userId, table.date),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type DailyStat = typeof dailyStats.$inferSelect;
export type NewDailyStat = typeof dailyStats.$inferInsert;
export type Group = typeof groups.$inferSelect;
export type NewGroup = typeof groups.$inferInsert;
export type GroupMember = typeof groupMembers.$inferSelect;
export type NewGroupMember = typeof groupMembers.$inferInsert;
export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;
export type MessageTemplate = typeof messageTemplates.$inferSelect;
export type NewMessageTemplate = typeof messageTemplates.$inferInsert;
