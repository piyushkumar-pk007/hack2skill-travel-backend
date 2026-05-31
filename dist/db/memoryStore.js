class MemoryStore {
    users = new Map();
    usersByEmail = new Map();
    trips = new Map();
    updates = new Map();
    reset() {
        this.users.clear();
        this.usersByEmail.clear();
        this.trips.clear();
        this.updates.clear();
    }
    createUser(user) {
        this.users.set(user.id, user);
        this.usersByEmail.set(user.email, user);
        return user;
    }
    getUserById(id) {
        return this.users.get(id) ?? null;
    }
    getUserByEmail(email) {
        return this.usersByEmail.get(email) ?? null;
    }
    saveTrip(trip, itinerary) {
        const stored = { ...trip, itinerary };
        this.trips.set(trip.id, stored);
        return stored;
    }
    listTripsForUser(userId) {
        return [...this.trips.values()].filter((trip) => trip.userId === userId);
    }
    getTrip(tripId) {
        return this.trips.get(tripId) ?? null;
    }
}
export const memoryStore = new MemoryStore();
export function mapTripPreferences(value) {
    return value;
}
