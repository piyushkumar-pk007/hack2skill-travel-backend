import type { Itinerary, Trip, TripPreferences, UpdatesFeed, User } from '@travel-engine/shared';

export interface StoredUser extends User {
  passwordHash: string;
}

export interface StoredTrip extends Trip {
  itinerary?: Itinerary;
}

class MemoryStore {
  users = new Map<string, StoredUser>();
  usersByEmail = new Map<string, StoredUser>();
  trips = new Map<string, StoredTrip>();
  updates = new Map<string, { feed: UpdatesFeed; expiresAt: Date }>();

  reset() {
    this.users.clear();
    this.usersByEmail.clear();
    this.trips.clear();
    this.updates.clear();
  }

  createUser(user: StoredUser) {
    this.users.set(user.id, user);
    this.usersByEmail.set(user.email, user);
    return user;
  }

  getUserById(id: string) {
    return this.users.get(id) ?? null;
  }

  getUserByEmail(email: string) {
    return this.usersByEmail.get(email) ?? null;
  }

  saveTrip(trip: Trip, itinerary: Itinerary) {
    const stored: StoredTrip = { ...trip, itinerary };
    this.trips.set(trip.id, stored);
    return stored;
  }

  listTripsForUser(userId: string) {
    return [...this.trips.values()].filter((trip) => trip.userId === userId);
  }

  getTrip(tripId: string) {
    return this.trips.get(tripId) ?? null;
  }
}

export const memoryStore = new MemoryStore();

export function mapTripPreferences(value: unknown): TripPreferences {
  return value as TripPreferences;
}
