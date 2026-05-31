import { Prisma } from '@prisma/client';
import type { UpdatesFeed } from '@travel-engine/shared';
import { prisma } from '../db/prisma.js';
import { memoryStore } from '../db/memoryStore.js';

export async function getCachedUpdates(destination: string): Promise<UpdatesFeed | null> {
  if (!prisma) {
    const cached = memoryStore.updates.get(destination.toLowerCase());
    if (!cached || cached.expiresAt < new Date()) {
      if (cached) {
        memoryStore.updates.delete(destination.toLowerCase());
      }

      return null;
    }

    return cached.feed;
  }

  const record = await prisma.cachedUpdate.findFirst({
    where: {
      destination: destination.toLowerCase(),
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (record?.data as UpdatesFeed | undefined) ?? null;
}

export async function cacheUpdates(destination: string, feed: UpdatesFeed, ttlMinutes: number) {
  const expiresAt = new Date(Date.now() + ttlMinutes * 60_000);

  if (!prisma) {
    memoryStore.updates.set(destination.toLowerCase(), { feed, expiresAt });
    return;
  }

  await prisma.cachedUpdate.create({
    data: {
      destination: destination.toLowerCase(),
      data: feed as unknown as Prisma.InputJsonValue,
      expiresAt,
    },
  });
}
