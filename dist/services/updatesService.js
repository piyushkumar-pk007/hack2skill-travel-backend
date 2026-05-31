import { prisma } from '../db/prisma.js';
import { memoryStore } from '../db/memoryStore.js';
export async function getCachedUpdates(destination) {
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
    return record?.data ?? null;
}
export async function cacheUpdates(destination, feed, ttlMinutes) {
    const expiresAt = new Date(Date.now() + ttlMinutes * 60_000);
    if (!prisma) {
        memoryStore.updates.set(destination.toLowerCase(), { feed, expiresAt });
        return;
    }
    await prisma.cachedUpdate.create({
        data: {
            destination: destination.toLowerCase(),
            data: feed,
            expiresAt,
        },
    });
}
