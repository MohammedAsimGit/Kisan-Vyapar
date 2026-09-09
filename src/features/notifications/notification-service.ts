/* eslint-disable @typescript-eslint/no-explicit-any -- Mongoose filter types require string-to ObjectId coercion */
import "server-only";
import { connectToDatabase } from "@/lib/db";
import { NotificationModel } from "@/models";
import type { NotificationType } from "@/constants/notification-types";
import { NotFoundError } from "@/lib/errors";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

export interface NotificationView {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  isRead: boolean;
  createdAt: string;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

interface LeanDoc {
  _id: unknown;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  isRead: boolean;
  createdAt?: Date;
}

function toView(doc: LeanDoc): NotificationView {
  return {
    id: String(doc._id),
    type: doc.type,
    title: doc.title,
    message: doc.message,
    entityType: doc.entityType,
    entityId: doc.entityId,
    isRead: doc.isRead,
    createdAt: doc.createdAt?.toISOString?.() ?? new Date().toISOString(),
  };
}

/* -------------------------------------------------------------------------- */
/* Create                                                                      */
/* -------------------------------------------------------------------------- */

export async function createNotification(opts: {
  recipientId: string;
  recipientRole: "farmer" | "vendor" | "admin";
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
}): Promise<void> {
  await connectToDatabase();
  await NotificationModel.create({
    recipientId: opts.recipientId,
    recipientRole: opts.recipientRole,
    type: opts.type,
    title: opts.title,
    message: opts.message,
    entityType: opts.entityType,
    entityId: opts.entityId,
  } as any);
}

/* -------------------------------------------------------------------------- */
/* Read                                                                        */
/* -------------------------------------------------------------------------- */

export async function listNotifications(
  recipientId: string,
  opts?: { page?: number; limit?: number },
): Promise<{ notifications: NotificationView[]; total: number; unreadCount: number }> {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  await connectToDatabase();

  const filter: any = { recipientId };
  const [total, unreadCount, docs] = await Promise.all([
    NotificationModel.countDocuments(filter),
    NotificationModel.countDocuments({ recipientId, isRead: false } as any),
    NotificationModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  return {
    notifications: (docs as unknown as LeanDoc[]).map(toView),
    total,
    unreadCount,
  };
}

export async function getUnreadCount(recipientId: string): Promise<number> {
  await connectToDatabase();
  return NotificationModel.countDocuments({ recipientId, isRead: false } as any);
}

/* -------------------------------------------------------------------------- */
/* Mutations                                                                   */
/* -------------------------------------------------------------------------- */

export async function markAsRead(
  recipientId: string,
  notificationId: string,
): Promise<void> {
  await connectToDatabase();
  const filter: any = { _id: notificationId, recipientId };
  const doc = await NotificationModel.findOneAndUpdate(
    filter,
    { $set: { isRead: true, readAt: new Date() } },
    { new: true },
  );
  if (!doc) {
    throw new NotFoundError("Notification not found.");
  }
}

export async function markAllAsRead(recipientId: string): Promise<void> {
  await connectToDatabase();
  const filter: any = { recipientId, isRead: false };
  await NotificationModel.updateMany(
    filter,
    { $set: { isRead: true, readAt: new Date() } },
  );
}
