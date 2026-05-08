/**
 * Bonjour command: Montréal weather + surrealist poem
 */

import { getDailyPoem, getFavorites, getPoemHash, type FavoritePoem } from './poem';
import { initRatingsRecord, getRatings } from './ratings';

const MONTREAL_COORDS = { lat: 45.5017, lon: -73.5673 };
const WEATHER_CACHE_TTL = 900; // 15 minutes

// WMO Weather interpretation codes
// https://open-meteo.com/en/docs#weathervariables
type WeatherCondition = 'clear' | 'clouds' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'thunderstorm';

const WMO_CODE_MAP: Record<number, WeatherCondition> = {
  0: 'clear',
  1: 'clear',
  2: 'clouds',
  3: 'clouds',
  45: 'fog',
  48: 'fog',
  51: 'drizzle',
  53: 'drizzle',
  55: 'drizzle',
  56: 'drizzle',
  57: 'drizzle',
  61: 'rain',
  63: 'rain',
  65: 'rain',
  66: 'rain',
  67: 'rain',
  71: 'snow',
  73: 'snow',
  75: 'snow',
  77: 'snow',
  80: 'rain',
  81: 'rain',
  82: 'rain',
  85: 'snow',
  86: 'snow',
  95: 'thunderstorm',
  96: 'thunderstorm',
  99: 'thunderstorm',
};

// Phrase banks: French primary, Spanish occasional, no English
const WEATHER_PHRASES: Record<WeatherCondition, string[]> = {
  clear: [
    'le ciel est nu.',
    'montréal respire.',
    'el sol mira sin pestañear.',
    'pas un nuage pour se cacher.',
    'le bleu pèse sur les toits.',
  ],
  clouds: [
    'les nuages traînent.',
    'el cielo piensa.',
    'gris sur gris.',
    'quelque chose se prépare.',
    'nubes como pensamientos.',
  ],
  fog: [
    'le brouillard mange les rues.',
    'on ne voit pas le bout.',
    'la niebla tiene sus raisons.',
    'tout est flou.',
    'la ville se cache.',
  ],
  drizzle: [
    'il pleuviote.',
    'lluvia fina.',
    'ça mouille sans se presser.',
    'l\'air est mouillé.',
    'bruine.',
  ],
  rain: [
    'il pleut sur le plateau.',
    'llueve.',
    'les fenêtres pleurent.',
    'l\'eau tombe.',
    'el agua busca su nivel.',
  ],
  snow: [
    'neige sur la ville.',
    'le silence blanc.',
    'nieve otra vez.',
    'l\'hiver insiste.',
    'blanc sur blanc.',
  ],
  thunderstorm: [
    'l\'orage parle.',
    'tormenta.',
    'le ciel gronde.',
    'électricité dans l\'air.',
    'el cielo tiene algo que decir.',
  ],
};

const COLD_PHRASES = [
  'il fait froid.',
  'hace frío.',
  'le froid mord.',
  'les os gèlent.',
];

const HOT_PHRASES = [
  'il fait chaud.',
  'hace calor.',
  'la chaleur pèse.',
  'el calor insiste.',
];

const NIGHT_PHRASES = [
  'la nuit écoute.',
  'la noche mira.',
  'tout dort sauf nous.',
  'les étoiles attendent.',
];

const ENCOUNTER_LOCATIONS = [
  'sur le banc du parc lafontaine',
  'au coin d\'une ruelle du plateau',
  'devant la vitrine d\'un dépanneur fermé',
  'sous un escalier en colimaçon',
  'à l\'arrêt d\'autobus vide',
  'dans l\'ombre d\'un balcon',
  'près du marché jean-talon',
  'au bord du canal lachine',
  'sous un lampadaire qui clignote',
  'devant une porte rouge',
  'en el callejón detrás del café',
  'junto a un mural medio borrado',
];

const FALLBACK_POEM = 'le jardin regarde dehors. le ciel est là.';

interface WeatherData {
  temperature: number;
  weatherCode: number;
  isDay: boolean;
}

interface SelectedPoem {
  text: string;
  hash: string;
  source: 'daily' | 'favorite';
  sourceDate?: string;
}

interface BonjourResponse {
  ok: true;
  weather: {
    temperature: number;
    condition: WeatherCondition;
    isDay: boolean;
    phrase: string;
  } | null;
  encounter: string;
  poem: string;
  poemId: string;
  engagement: {
    bien: number;
    bof: number;
    nul: number;
    total: number;
  } | null;
}

export interface BonjourEnv {
  VISITORS_KV: KVNamespace;
}

/**
 * Fetch weather from Open-Meteo with 15-min KV cache
 */
async function fetchWeather(kv: KVNamespace): Promise<WeatherData | null> {
  // Check cache first
  const cached = await kv.get('bonjour:weather:current');
  if (cached) {
    try {
      return JSON.parse(cached) as WeatherData;
    } catch {
      // Continue to fetch fresh
    }
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${MONTREAL_COORDS.lat}&longitude=${MONTREAL_COORDS.lon}&current=temperature_2m,weather_code,is_day`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error('Open-Meteo error:', response.status);
      return null;
    }

    const data = await response.json() as {
      current?: {
        temperature_2m?: number;
        weather_code?: number;
        is_day?: number;
      };
    };

    if (!data.current) return null;

    const weather: WeatherData = {
      temperature: data.current.temperature_2m ?? 0,
      weatherCode: data.current.weather_code ?? 0,
      isDay: (data.current.is_day ?? 1) === 1,
    };

    // Cache for 15 minutes
    await kv.put('bonjour:weather:current', JSON.stringify(weather), { expirationTtl: WEATHER_CACHE_TTL });
    return weather;
  } catch (error) {
    console.error('Weather fetch failed:', error);
    return null;
  }
}

/**
 * Get weather condition from code
 */
function getWeatherCondition(data: WeatherData): WeatherCondition {
  return WMO_CODE_MAP[data.weatherCode] ?? 'clouds';
}

/**
 * Get a random phrase for the weather
 */
function getWeatherPhrase(condition: WeatherCondition, data: WeatherData): string {
  const phrases: string[] = [];

  // Base condition phrases
  phrases.push(...WEATHER_PHRASES[condition]);

  // Temperature modifiers
  if (data.temperature < -10) {
    phrases.push(...COLD_PHRASES);
  } else if (data.temperature > 28) {
    phrases.push(...HOT_PHRASES);
  }

  // Night modifier
  if (!data.isDay) {
    phrases.push(...NIGHT_PHRASES);
  }

  return phrases[Math.floor(Math.random() * phrases.length)];
}

/**
 * Get a random encounter location
 */
function getEncounterLocation(): string {
  return ENCOUNTER_LOCATIONS[Math.floor(Math.random() * ENCOUNTER_LOCATIONS.length)];
}

/**
 * Select a poem: 70% daily, 30% favorites (if available)
 * Returns poem text with metadata for rating system
 */
async function selectPoem(kv: KVNamespace): Promise<SelectedPoem> {
  const today = new Date().toISOString().slice(0, 10);

  // Get today's poem
  const dailyPoem = await getDailyPoem(kv);

  // Get favorites
  const favorites = await getFavorites(kv);

  // If no daily and no favorites, use fallback
  if (!dailyPoem && favorites.length === 0) {
    const hash = await getPoemHash(FALLBACK_POEM);
    return { text: FALLBACK_POEM, hash, source: 'daily', sourceDate: today };
  }

  // If no favorites, use daily (or fallback)
  if (favorites.length === 0) {
    const text = dailyPoem || FALLBACK_POEM;
    const hash = await getPoemHash(text);
    return { text, hash, source: 'daily', sourceDate: today };
  }

  // If no daily, use favorite
  if (!dailyPoem) {
    const favorite = favorites[Math.floor(Math.random() * favorites.length)];
    const hash = await getPoemHash(favorite.text);
    return { text: favorite.text, hash, source: 'favorite', sourceDate: favorite.date };
  }

  // 70/30 weighted selection
  if (Math.random() < 0.7) {
    const hash = await getPoemHash(dailyPoem);
    return { text: dailyPoem, hash, source: 'daily', sourceDate: today };
  } else {
    const favorite = favorites[Math.floor(Math.random() * favorites.length)];
    const hash = await getPoemHash(favorite.text);
    return { text: favorite.text, hash, source: 'favorite', sourceDate: favorite.date };
  }
}

/**
 * Compose the full bonjour response
 */
export async function composeBonjour(env: BonjourEnv): Promise<BonjourResponse> {
  // Fetch weather (may be null if API fails)
  const weatherData = await fetchWeather(env.VISITORS_KV);

  let weatherResponse: BonjourResponse['weather'] = null;
  if (weatherData) {
    const condition = getWeatherCondition(weatherData);
    weatherResponse = {
      temperature: Math.round(weatherData.temperature),
      condition,
      isDay: weatherData.isDay,
      phrase: getWeatherPhrase(condition, weatherData),
    };
  }

  // Get encounter location
  const encounter = getEncounterLocation();

  // Select poem with metadata
  const selectedPoem = await selectPoem(env.VISITORS_KV);

  // Initialize ratings record for this poem (no-op if already exists)
  await initRatingsRecord(
    env.VISITORS_KV,
    selectedPoem.hash,
    selectedPoem.text,
    selectedPoem.source,
    selectedPoem.sourceDate
  );

  // Fetch engagement counts
  const ratings = await getRatings(env.VISITORS_KV, selectedPoem.hash);
  let engagement: BonjourResponse['engagement'] = null;
  if (ratings) {
    const { bien, bof, nul } = ratings.ratings;
    engagement = { bien, bof, nul, total: bien + bof + nul };
  }

  return {
    ok: true,
    weather: weatherResponse,
    encounter,
    poem: selectedPoem.text,
    poemId: selectedPoem.hash,
    engagement,
  };
}
