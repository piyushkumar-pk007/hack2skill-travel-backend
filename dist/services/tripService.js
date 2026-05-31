import { prisma } from '../db/prisma.js';
import { mapTripPreferences, memoryStore } from '../db/memoryStore.js';
import { ServiceError } from '../lib/errors.js';
function serializeTrip(record) {
    return {
        id: record.id,
        userId: record.userId,
        preferences: record.preferences,
        status: record.status,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
    };
}
export async function saveTripWithItinerary(userId, preferences, itinerary) {
    if (!prisma) {
        const now = new Date().toISOString();
        const trip = {
            id: crypto.randomUUID(),
            userId,
            preferences,
            status: 'draft',
            createdAt: now,
            updatedAt: now,
        };
        memoryStore.saveTrip({ ...trip }, { ...itinerary, tripId: trip.id });
        return trip;
    }
    const trip = await prisma.trip.create({
        data: {
            userId,
            preferences: preferences,
            status: 'draft',
            itinerary: {
                create: {
                    data: { ...itinerary, tripId: undefined },
                },
            },
        },
    });
    return serializeTrip({
        id: trip.id,
        userId: trip.userId,
        preferences: mapTripPreferences(trip.preferences),
        status: trip.status,
        createdAt: trip.createdAt,
        updatedAt: trip.updatedAt,
    });
}
export async function getTripItinerary(tripId, userId) {
    if (!prisma) {
        const trip = memoryStore.getTrip(tripId);
        if (!trip || trip.userId !== userId) {
            return null;
        }
        return trip.itinerary ?? null;
    }
    const trip = await prisma.trip.findFirst({
        where: { id: tripId, userId },
        include: { itinerary: true },
    });
    if (!trip?.itinerary) {
        return null;
    }
    return trip.itinerary.data;
}
export async function getTripPreferences(tripId, userId) {
    if (!prisma) {
        const trip = memoryStore.getTrip(tripId);
        if (!trip || trip.userId !== userId) {
            return undefined;
        }
        return trip.preferences;
    }
    const trip = await prisma.trip.findFirst({
        where: { id: tripId, userId },
    });
    return trip ? mapTripPreferences(trip.preferences) : undefined;
}
export async function listTripsForUser(userId) {
    if (!prisma) {
        return memoryStore.listTripsForUser(userId);
    }
    const trips = await prisma.trip.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
    });
    return trips.map((trip) => serializeTrip({
        id: trip.id,
        userId: trip.userId,
        preferences: mapTripPreferences(trip.preferences),
        status: trip.status,
        createdAt: trip.createdAt,
        updatedAt: trip.updatedAt,
    }));
}
export async function getTripById(tripId, userId) {
    if (!prisma) {
        const trip = memoryStore.getTrip(tripId);
        if (!trip || trip.userId !== userId) {
            throw new ServiceError('Trip not found', 404, 'NOT_FOUND');
        }
        return trip;
    }
    const trip = await prisma.trip.findFirst({
        where: { id: tripId, userId },
    });
    if (!trip) {
        throw new ServiceError('Trip not found', 404, 'NOT_FOUND');
    }
    return serializeTrip({
        id: trip.id,
        userId: trip.userId,
        preferences: mapTripPreferences(trip.preferences),
        status: trip.status,
        createdAt: trip.createdAt,
        updatedAt: trip.updatedAt,
    });
}
