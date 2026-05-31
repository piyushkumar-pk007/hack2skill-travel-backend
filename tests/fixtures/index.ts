import type { Itinerary, TripPreferences } from '@travel-engine/shared';

export const mockTripPreferences: TripPreferences = {
  destination: 'Kyoto, Japan',
  origin: 'New Delhi',
  startDate: '2026-08-10',
  endDate: '2026-08-12',
  styles: ['culture', 'food'],
  pace: 'moderate',
  groupType: 'solo',
  accommodation: 'midrange',
  budgetUSD: 2000,
};

export const mockItinerary: Itinerary = {
  id: crypto.randomUUID(),
  tripId: '',
  destination: 'Kyoto, Japan',
  summary: 'A compact Kyoto itinerary with cultural anchors and flexible food stops.',
  highlights: ['Fushimi Inari area', 'Gion evening walk', 'Nishiki Market'],
  stats: {
    days: 3,
    budgetEstimate: '$2,000 total',
    activities: 9,
    accommodation: 'midrange',
  },
  alerts: [{ type: 'info', message: 'Reserve temple-adjacent dining in advance during busy periods.' }],
  days: [
    {
      day: 1,
      date: '2026-08-10',
      title: 'Arrival',
      theme: 'culture',
      activities: [
        {
          id: crypto.randomUUID(),
          time: '10:00',
          name: 'Airport transfer',
          description: 'Train transfer into central Kyoto.',
          type: 'transport',
          cost: '$',
          duration: '1h',
          location: 'Kyoto',
          tags: ['transfer'],
        },
      ],
    },
    {
      day: 2,
      date: '2026-08-11',
      title: 'Heritage core',
      theme: 'culture',
      activities: [
        {
          id: crypto.randomUUID(),
          time: '09:00',
          name: 'Temple visit',
          description: 'Morning visit to a major temple complex.',
          type: 'culture',
          cost: '$',
          duration: '2h',
          location: 'Kyoto',
          tags: ['temple'],
        },
      ],
    },
    {
      day: 3,
      date: '2026-08-12',
      title: 'Departure',
      theme: 'food',
      activities: [
        {
          id: crypto.randomUUID(),
          time: '08:30',
          name: 'Market breakfast',
          description: 'Breakfast before checkout.',
          type: 'food',
          cost: '$$',
          duration: '1h',
          location: 'Kyoto',
          tags: ['food'],
        },
      ],
    },
  ],
  generatedAt: new Date().toISOString(),
};
