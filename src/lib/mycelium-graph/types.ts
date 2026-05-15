/**
 * Type definitions for the Mycelium graph system.
 */

export type NodeType = 'track' | 'article' | 'cultivation' | 'dispatch' | 'exit' | 'specimen';
export type EdgeType = 'musical' | 'wikilink' | 'announced' | 'context' | 'exit';
export type CitationType = 'section' | 'text' | 'block' | 'heading';

export interface MyceliumNode {
  id: string;
  type: NodeType;
  // Common
  firstSeen: string;    // ISO date
  appearances: number;
  // Track-specific
  artist?: string;
  title?: string;
  url?: string;
  bpm?: number;
  key?: string;
  openKey?: string;     // Camelot notation
  timeSignature?: string;
  danceability?: number;
  songbpmId?: string;   // provenance marker
  sourceVerified?: boolean;
  corrections?: string;
  energy?: number;
  // Article-specific
  slug?: string;
  articleTitle?: string;
  excerpt?: string;     // first ~100 chars
  // Cultivation-specific
  cultivationName?: string;
  status?: 'growing' | 'dormant' | 'wild' | 'composted';
  // Dispatch-specific
  date?: string;
  announcements?: number;
  hasProseLinks?: boolean;
  // Exit-specific
  platform?: 'spotify' | 'youtube' | 'bandcamp' | 'soundcloud' | 'github' | 'external';
  label?: string;
  // Specimen-specific
  specimenName?: string;
  specimenStatus?: 'wild' | 'growing' | 'dormant' | 'composted';
  specimenSeries?: string;
}

export interface MyceliumEdge {
  source: string;
  target: string;
  weight: number;       // connection strength
  reasons: string[];    // why connected
  edgeType: EdgeType;   // for visual differentiation
  citationType?: CitationType;  // only when edgeType === 'wikilink'
  citationCount?: number;       // aggregated citations to same target
}

export interface MyceliumGraph {
  nodes: MyceliumNode[];
  edges: MyceliumEdge[];
  generated: string;    // ISO timestamp
  meta: {
    tracksFromSongbpm: number;
    articleCount: number;
    cultivationCount: number;
    specimenCount?: number;
    dispatchCount?: number;
    exitCount?: number;
  };
}

export interface TrackData {
  artist: string;
  title: string;
  url: string;
  bpm?: number;
  key?: string;
  openKey?: string;
  timeSignature?: string;
  danceability?: number;
  songbpmId?: string;
  sourceVerified?: boolean;
  corrections?: string;
  energy?: number;
  genre?: string[];
  date: string;
}

export interface WikilinkData {
  target: string;           // "collection:slug"
  citationType: CitationType;
  anchor?: string;          // raw anchor for tooltips
}

export interface ArticleData {
  slug: string;
  title: string;
  date: string;       // ISO date
  excerpt: string;    // first ~100 chars
  wikilinks: WikilinkData[]; // rich wikilink data
}

export interface CultivationData {
  slug: string;
  name: string;
  status: 'growing' | 'dormant' | 'wild' | 'composted';
  wikilinks: WikilinkData[]; // rich wikilink data
}

export interface AhoraLink {
  date: string;       // dispatch date
  articleSlug: string; // article announced
}

export interface CultivandoLink {
  date: string;          // dispatch date
  cultivationSlug: string; // cultivation mentioned
}

export interface SpecimenLink {
  date: string;          // dispatch date
  specimenId: string;    // specimen announced
}

export interface SpecimenData {
  id: string;
  name: string;
  status: 'wild' | 'growing' | 'dormant' | 'composted';
  series?: string;
  grown: string;         // ISO date
}

export interface DispatchData {
  date: string;                    // ISO date
  announcements: number;           // count of articuloNuevo + specimenNuevo + cultivando
  hasProseLinks: boolean;          // has wikilinks or external links in prose
  proseWikilinks: WikilinkData[];  // rich wikilink data
  proseExternalLinks: string[];    // external URLs in prose
}

export interface GraphInput {
  tracks: TrackData[];
  articles: ArticleData[];
  cultivations: CultivationData[];
  specimens?: SpecimenData[];
  ahoraLinks: AhoraLink[]; // articuloNuevo announcements
  cultivandoLinks?: CultivandoLink[]; // cultivando announcements
  specimenLinks?: SpecimenLink[]; // specimenNuevo announcements
  dispatches?: DispatchData[]; // notable dispatches
}

/** Internal edge data structure during graph building */
export interface EdgeData {
  weight: number;
  reasons: Set<string>;
  edgeType: EdgeType;
  citationType?: CitationType;
  citationCount?: number;
}
