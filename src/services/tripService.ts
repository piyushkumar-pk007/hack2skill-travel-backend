import { Prisma } from '@prisma/client';
import type { Itinerary, Trip, TripPreferences } from '@travel-engine/shared';
import { prisma } from '../db/prisma.js';
import { mapTripPreferences, memoryStore } from '../db/memoryStore.js';
import { ServiceError } from '../lib/errors.js';

function serializeTrip(record: {
  id: string;
  userId: string;
  preferences: TripPreferences;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): Trip {
  return {
    id: record.id,
    userId: record.userId,
    preferences: record.preferences,
    status: record.status as Trip['status'],
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function saveTripWithItinerary(userId: string, preferences: TripPreferences, itinerary: Itinerary) {
  if (!prisma) {
    const now = new Date().toISOString();
    const trip: Trip = {
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
      preferences: preferences as unknown as Prisma.InputJsonValue,
      status: 'draft',
      itinerary: {
        create: {
          data: { ...(itinerary as unknown as Prisma.InputJsonObject), tripId: undefined },
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

export async function getTripItinerary(tripId: string, userId: string): Promise<Itinerary | null> {
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

  return trip.itinerary.data as unknown as Itinerary;
}

export async function getTripPreferences(tripId: string, userId: string): Promise<TripPreferences | undefined> {
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

export async function listTripsForUser(userId: string): Promise<Trip[]> {
  if (!prisma) {
    return memoryStore.listTripsForUser(userId);
  }

  const trips = await prisma.trip.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return trips.map((trip: { id: string; userId: string; preferences: unknown; status: string; createdAt: Date; updatedAt: Date }) =>
    serializeTrip({
      id: trip.id,
      userId: trip.userId,
      preferences: mapTripPreferences(trip.preferences),
      status: trip.status,
      createdAt: trip.createdAt,
      updatedAt: trip.updatedAt,
    }),
  );
}

export async function getTripById(tripId: string, userId: string): Promise<Trip> {
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
