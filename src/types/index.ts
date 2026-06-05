/**
 * Core TypeScript types for AidHero
 * Mirrors the schema defined in PRD.md Section 7
 */

// ─── Language Types ──────────────────────────────────────────────────────────

export type Locale = "en" | "ha" | "ig" | "yo" | "pcm";

export type LanguageMap = {
  en: string;
  ha: string;
  ig: string;
  yo: string;
  pcm: string;
};

// ─── Scenario / Content Types ─────────────────────────────────────────────────

export type CategoryId =
  | "cardiac"
  | "respiratory"
  | "trauma"
  | "neurological"
  | "environmental"
  | "pediatric"
  | "obstetric"
  | "toxicological"
  | "burns"
  | "other";

export type Severity = "critical" | "urgent" | "moderate";

export interface Step {
  id: number;
  instruction: string;
  instruction_translations: LanguageMap;
  detail?: string;
  detail_translations?: LanguageMap;
  do_not?: string;
  do_not_translations?: LanguageMap;
  /** Resolved path: /audio/{scenario}/{lang}/step-{id}.mp3 */
  audio_path: string;
}

export interface TrustSignals {
  medical_reviewer: string;
  reviewer_institution: string;
  last_medically_reviewed: string; // ISO date
  medical_references: string[];
}

export interface Scenario {
  id: string;
  slug: string;
  content_version: number;
  content_version_date: string; // ISO date
  category: CategoryId;
  title: string;
  title_translations: LanguageMap;
  /** Aliases for search — MUST include all language variants */
  aliases: string[];
  severity: Severity;
  immediate_warning?: string;
  immediate_warning_translations: LanguageMap;
  description: string;
  description_translations: LanguageMap;
  signs: string[];
  signs_translations: Record<number, LanguageMap>;
  steps: Step[];
  do_not: string[];
  do_not_translations: Record<number, LanguageMap>;
  hospital_threshold: string;
  hospital_threshold_translations: LanguageMap;
  decision_tree_id?: string;
  trust_signals: TrustSignals;
}

// ─── Decision Tree Types ──────────────────────────────────────────────────────

export interface QuestionNode {
  type: "question";
  text: string;
  translations: LanguageMap;
  options: {
    label: string;
    translations: LanguageMap;
    next_node_id: string;
  }[];
}

export interface InstructionNode {
  type: "instruction";
  steps_reference: string;
  variant?: string; // e.g. "conscious", "unconscious"
}

export type TreeNode = QuestionNode | InstructionNode;

export interface DecisionTree {
  id: string;
  incident_id: string;
  root_node_id: string;
  nodes: Record<string, TreeNode>;
}

// ─── Emergency Numbers Types ──────────────────────────────────────────────────

export type ServiceType = "ambulance" | "police" | "fire" | "emergency";

export interface EmergencyService {
  name: string;
  number: string;
  type: ServiceType;
}

export interface StateEmergency {
  name: string;
  services: EmergencyService[];
}

export interface EmergencyNumbers {
  national: {
    name: string;
    number: string;
    description: string;
  }[];
  states: Record<string, StateEmergency>;
}

// ─── Content Versioning ───────────────────────────────────────────────────────

export interface ContentManifest {
  generated_at: string;
  scenarios: Record<string, { version: number; checksum: string }>;
}

// ─── Search Types ─────────────────────────────────────────────────────────────

export interface SearchResult {
  scenario: Scenario;
  score: number;
}

// ─── PWA / Offline Types ──────────────────────────────────────────────────────

export type OfflineStatus = "online" | "offline" | "checking";
