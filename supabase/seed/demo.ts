// demo.ts — what the demo property IS, shared by seed and teardown.
//
// Teardown removes exactly what seed created, and the only way to guarantee that is for both
// to read the same list. A teardown that maintains its own copy of the slugs drifts the first
// time a room type is added to one file and not the other.
//
// Everything the seed creates is reachable from ROOM_TYPE_SLUGS, DEMO_PAGE_SLUGS, or the
// demo-assets bucket. Nothing else is touched.

export const DEMO_STORAGE_BUCKET = 'demo-assets';

/** Every room type the demo creates. Deleting these reaches units, bookings, and overrides. */
export const ROOM_TYPE_SLUGS = [
  'kubo-garden',
  'capiz-suite',
  'amihan-loft',
  'beachfront-cabana',
  'family-bahay',
] as const;

// Content pages are deliberately NOT seeded here. The three policies plus amenities and
// activities are deployment baseline (migration 0038), and teardown must leave them alone —
// removing the demo must never leave a site missing its legally required pages.

export type RoomTypeSeed = {
  slug: string;
  name: string;
  description: string;
  bedConfiguration: string;
  maxOccupancy: number;
  baseNightlyRate: number;
  sortOrder: number;
  units: string[];
};

export const ROOM_TYPES: RoomTypeSeed[] = [
  {
    slug: 'kubo-garden',
    name: 'Kubo Garden',
    description:
      'A native kubo set back in the garden, with a woven bamboo ceiling and shutters that ' +
      'open onto the palms. Quiet, shaded, and the coolest room on the property in April.',
    bedConfiguration: 'One queen bed',
    maxOccupancy: 2,
    baseNightlyRate: 3200,
    sortOrder: 0,
    units: ['Kubo 1', 'Kubo 2', 'Kubo 3'],
  },
  {
    slug: 'capiz-suite',
    name: 'Capiz Suite',
    description:
      'Named for the capiz-shell ventanilla above the bed, which throws a pale grid of light ' +
      'across the floor through the afternoon. Sitting area, outdoor shower.',
    bedConfiguration: 'One king bed, one daybed',
    maxOccupancy: 3,
    baseNightlyRate: 4800,
    sortOrder: 1,
    units: ['Capiz A', 'Capiz B'],
  },
  {
    slug: 'amihan-loft',
    name: 'Amihan Loft',
    description:
      'Upstairs, open on two sides to the amihan — the northeast wind that runs from ' +
      'November through March. Sleeps four with the loft bed.',
    bedConfiguration: 'One king bed, two singles in the loft',
    maxOccupancy: 4,
    baseNightlyRate: 6500,
    sortOrder: 2,
    units: ['Loft North', 'Loft South'],
  },
  {
    slug: 'beachfront-cabana',
    name: 'Beachfront Cabana',
    description:
      'The two rooms closest to the water. You hear the reef break at night. Private deck, ' +
      'two steps down to the sand.',
    bedConfiguration: 'One king bed',
    maxOccupancy: 2,
    baseNightlyRate: 7200,
    sortOrder: 3,
    units: ['Cabana East', 'Cabana West'],
  },
  {
    slug: 'family-bahay',
    name: 'Family Bahay',
    description:
      'A whole house for one group — two bedrooms, a kitchen, and a long table under the ' +
      'awning that seats everyone. Booked as a single unit.',
    bedConfiguration: 'Two king beds, two singles',
    maxOccupancy: 6,
    baseNightlyRate: 9400,
    sortOrder: 4,
    units: ['Bahay'],
  },
];

/** Seasonal rates. At least one is required (FR-072); two show that they can differ. */
export const RATE_OVERRIDES = [
  { roomTypeSlug: 'beachfront-cabana', label: 'Peak season', monthsAhead: 4, nights: 45, rate: 9800 },
  { roomTypeSlug: 'kubo-garden', label: 'Peak season', monthsAhead: 4, nights: 45, rate: 4100 },
  { roomTypeSlug: 'amihan-loft', label: 'Amihan season', monthsAhead: 6, nights: 60, rate: 7900 },
];

/** Demo imagery. T054 supplies the files; the seed uploads whatever of these it finds. */
export const DEMO_IMAGES = [
  { file: 'hero-beach.jpg', category: 'beach', alt: 'The reef break at first light, seen from the shore' },
  { file: 'pool-morning.jpg', category: 'pool', alt: 'The pool before anyone is awake, palms reflected in it' },
  { file: 'dining-table.jpg', category: 'dining', alt: 'The long table under the awning, set for breakfast' },
  { file: 'grounds-path.jpg', category: 'grounds', alt: 'A coral-stone path running between the kubos' },
  { file: 'room-kubo.jpg', category: 'rooms', alt: 'Inside a garden kubo, shutters open to the palms', roomTypeSlug: 'kubo-garden' },
  { file: 'room-capiz.jpg', category: 'rooms', alt: 'Capiz ventanilla above the bed, light falling through it', roomTypeSlug: 'capiz-suite' },
  { file: 'room-loft.jpg', category: 'rooms', alt: 'The loft, open on two sides to the wind', roomTypeSlug: 'amihan-loft' },
  { file: 'room-cabana.jpg', category: 'rooms', alt: 'A cabana deck with two steps down to the sand', roomTypeSlug: 'beachfront-cabana' },
  { file: 'room-bahay.jpg', category: 'rooms', alt: 'The family house seen from the garden', roomTypeSlug: 'family-bahay' },
];

/** The demo property's own settings, written over the migration-0038 placeholders. */
export const DEMO_SETTINGS = {
  property_name: 'Balai Amihan',
  address: 'Purok 5, General Luna, Siargao Island, Surigao del Norte',
  latitude: 9.8036,
  longitude: 126.1553,
  contact_phone: '+63 917 555 0142',
  contact_email: 'stay@balaiamihan.example',
  transport_notes:
    'Fly into Sayak (IAO) and take a van to General Luna, about an hour. We can arrange a ' +
    'pickup if you send us your flight number. From the town centre we are seven minutes ' +
    'south by trike — tell the driver Balai Amihan, they will know it.',
  deposit_guidance: 'Send 50% to reserve your room. The balance is paid on arrival.',
};

/** The placeholders migration 0038 installs. Teardown restores these. */
export const BASELINE_SETTINGS = {
  property_name: 'Your Property Name',
  address: 'Set your address in Settings',
  latitude: 9.8482,
  longitude: 126.0458,
  contact_phone: '+63',
  contact_email: 'hello@example.com',
  transport_notes: null,
  deposit_guidance: 'Send 50% to reserve your room.',
};
