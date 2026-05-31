import Anthropic from '@anthropic-ai/sdk';
import {
  ItinerarySchema,
  TripPreferencesSchema,
  UpdatesFeedSchema,
  type Itinerary,
  type TripPreferences,
  type UpdatesFeed,
} from '@travel-engine/shared';

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 800): Promise<T> {
  for (let index = 0; index < retries; index += 1) {
    try {
      return await fn();
    } catch (error: any) {
      const status = error?.status;
      if (index === retries - 1 || (status !== 429 && (typeof status !== 'number' || status < 500))) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs * 2 ** index));
    }
  }

  throw new Error('Retry loop exhausted');
}

function datesBetween(startDate: string, endDate: string) {
  const result: string[] = [];
  const cursor = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);

  while (cursor <= end) {
    result.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return result;
}

function buildFallbackItinerary(preferences: TripPreferences): Itinerary {
  const dates = datesBetween(preferences.startDate, preferences.endDate);
  const activitiesByPace = {
    relaxed: 3,
    moderate: 4,
    packed: 6,
  } as const;
  const activityCount = activitiesByPace[preferences.pace];

  const days = dates.map((date, dayIndex) => {
    const baseActivities = [
      {
        id: crypto.randomUUID(),
        time: '08:30',
        name: `Breakfast near ${preferences.destination}`,
        description: 'Start the day with a nearby breakfast spot chosen for convenience and local flavour.',
        type: 'food' as const,
        cost: '$$' as const,
        duration: '1h',
        location: preferences.destination,
        tags: ['breakfast', 'local'],
      },
      {
        id: crypto.randomUUID(),
        time: '10:00',
        name: `${preferences.destination} signature walk`,
        description: 'A walk through a high-interest district that matches your stated travel style.',
        type: preferences.styles.includes('nature') ? ('nature' as const) : ('culture' as const),
        cost: '$' as const,
        duration: '2h',
        location: preferences.destination,
        tags: preferences.styles,
      },
      {
        id: crypto.randomUUID(),
        time: '13:00',
        name: 'Lunch and recharge',
        description: 'Pause for lunch in a well-connected area to preserve energy for the afternoon.',
        type: 'food' as const,
        cost: '$$' as const,
        duration: '1.5h',
        location: preferences.destination,
        tags: ['meal'],
      },
      {
        id: crypto.randomUUID(),
        time: '15:00',
        name: 'Afternoon anchor activity',
        description: 'A flexible afternoon block reserved for one major highlight or experience.',
        type: preferences.styles.includes('adventure') ? ('adventure' as const) : ('leisure' as const),
        cost: '$$' as const,
        duration: '2h',
        location: preferences.destination,
        tags: ['highlight'],
      },
      {
        id: crypto.randomUUID(),
        time: '18:00',
        name: 'Check-in or hotel reset',
        description: 'Built-in buffer for accommodation logistics and downtime.',
        type: 'accommodation' as const,
        cost: 'free' as const,
        duration: '45m',
        location: preferences.destination,
        tags: ['hotel'],
      },
      {
        id: crypto.randomUUID(),
        time: '20:00',
        name: 'Dinner in a lively district',
        description: 'End the day with a dinner recommendation in an area that stays active into the evening.',
        type: preferences.styles.includes('nightlife') ? ('leisure' as const) : ('food' as const),
        cost: '$$' as const,
        duration: '2h',
        location: preferences.destination,
        tags: ['dinner'],
      },
    ];

    return {
      day: dayIndex + 1,
      date,
      title: dayIndex === 0 ? 'Arrival and orientation' : `Day ${dayIndex + 1} highlights`,
      theme: preferences.styles[dayIndex % preferences.styles.length],
      activities: baseActivities.slice(0, activityCount),
    };
  });

  const itinerary: Itinerary = {
    id: crypto.randomUUID(),
    tripId: '',
    destination: preferences.destination,
    summary: `A balanced plan for ${preferences.destination} shaped around your ${preferences.pace} pace and ${preferences.styles.join(', ')} interests. The itinerary leaves room for flexibility while keeping logistics practical.`,
    highlights: [
      `Neighbourhood exploration in ${preferences.destination}`,
      'Budget-aware dining picks',
      'Built-in transport and reset buffers',
    ],
    stats: {
      days: dates.length,
      budgetEstimate: `$${preferences.budgetUSD.toLocaleString()} total`,
      activities: days.reduce((count, day) => count + day.activities.length, 0),
      accommodation: preferences.accommodation,
    },
    alerts: [
      { type: 'info', message: 'Review booking availability before confirming paid activities.' },
    ],
    days,
    generatedAt: new Date().toISOString(),
  };

  return ItinerarySchema.parse(itinerary);
}

function buildFallbackUpdates(destination: string): UpdatesFeed {
  const now = new Date().toISOString();
  const feed: UpdatesFeed = {
    destination,
    updatedAt: now,
    updates: [
      {
        id: crypto.randomUUID(),
        type: 'weather',
        severity: 'info',
        title: 'Pack for variable conditions',
        description: `Weather patterns in ${destination} may shift across the day, so layering is recommended.`,
        source: 'Travel Engine fallback intelligence',
        destination,
        createdAt: now,
      },
      {
        id: crypto.randomUUID(),
        type: 'transport',
        severity: 'warning',
        title: 'Allow buffer for transfers',
        description: 'Major stations and airport connections can take longer than maps suggest during peak periods.',
        source: 'Travel Engine fallback intelligence',
        destination,
        createdAt: now,
      },
      {
        id: crypto.randomUUID(),
        type: 'entry',
        severity: 'info',
        title: 'Verify entry documentation',
        description: 'Passport validity, onward travel proof, and accommodation details should be checked before departure.',
        source: 'Travel Engine fallback intelligence',
        destination,
        createdAt: now,
      },
    ],
  };

  return UpdatesFeedSchema.parse(feed);
}

export async function generateItinerary(preferences: TripPreferences): Promise<Itinerary> {
  const prefs = TripPreferencesSchema.parse(preferences);

  if (!client) {
    return buildFallbackItinerary(prefs);
  }

  const systemPrompt = `You are an expert travel planner with deep local knowledge.
Generate a detailed, realistic, day-by-day itinerary as a single JSON object.
Return ONLY valid JSON with no markdown, no prose, and no additional keys.`;

  const userPrompt = `Plan a trip to ${prefs.destination} from ${prefs.origin}.
Dates: ${prefs.startDate} to ${prefs.endDate}.
Travel style: ${prefs.styles.join(', ')}.
Pace: ${prefs.pace}.
Group: ${prefs.groupType}.
Accommodation: ${prefs.accommodation}.
Total budget: $${prefs.budgetUSD.toLocaleString()} USD.
${prefs.specialRequirements ? `Special requirements: ${prefs.specialRequirements}` : ''}

Rules:
- Use real landmark and neighbourhood names.
- Include transport legs and accommodation logistics as activities.
- Respect the pace and budget.`;

  return withRetry(async () => {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const raw = response.content.map((block: any) => block.text ?? '').join('');
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    const itinerary = {
      ...parsed,
      id: parsed.id ?? crypto.randomUUID(),
      tripId: '',
      generatedAt: parsed.generatedAt ?? new Date().toISOString(),
    };

    return ItinerarySchema.parse(itinerary);
  });
}

export async function fetchLiveTravelUpdates(destination: string, travelDates: string): Promise<UpdatesFeed> {
  if (!client) {
    return buildFallbackUpdates(destination);
  }

  const systemPrompt = `You are a real-time travel intelligence API.
Return ONLY valid JSON with realistic, specific, and actionable travel updates.`;

  return withRetry(async () => {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Travel intelligence for ${destination} during ${travelDates}. Include weather, safety, events, entry requirements, and transport.`,
        },
      ],
    });

    const raw = response.content.map((block: any) => block.text ?? '').join('');
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
    return UpdatesFeedSchema.parse(parsed);
  });
}

export async function* streamConciergeChat(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  tripContext?: TripPreferences,
): AsyncGenerator<string> {
  if (!client) {
    const fallback = tripContext
      ? `Here’s a practical suggestion for ${tripContext.destination}: prioritize one anchor activity, keep transport buffers generous, and book the first-night accommodation early. If you want, I can help refine food, neighbourhood, or budget choices next.`
      : 'I can help with pacing, local neighbourhood strategy, transport planning, or budget tradeoffs for your trip. Share a destination or trip question and I will make it concrete.';

    for (const chunk of fallback.split(' ')) {
      yield `${chunk} `;
      await new Promise((resolve) => setTimeout(resolve, 5));
    }

    return;
  }

  const system = `You are an expert AI travel concierge with encyclopaedic destination knowledge.
Be specific, practical, and concise.
${tripContext ? `Current trip context: ${JSON.stringify(tripContext)}` : ''}`;

  const stream = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 800,
    system,
    messages: [...history, { role: 'user', content: message }],
    stream: true,
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      yield event.delta.text;
    }
  }
}
