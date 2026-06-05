export type LanguageMap = {
  en: string;
  ha: string;
  ig: string;
  yo: string;
  pcm: string;
};

export type CategoryId = string;

export interface Step {
  id: number;
  instruction: string;
  instruction_translations: LanguageMap;
  detail?: string;
  detail_translations?: LanguageMap;
  do_not?: string;
  do_not_translations?: LanguageMap;
  audio_path: string;
}

export interface TrustSignals {
  medical_reviewer: string;
  reviewer_institution: string;
  last_medically_reviewed: string;
  medical_references: string[];
}

export interface Scenario {
  id: string;
  slug: string;
  content_version: number;
  content_version_date: string;
  category: CategoryId;
  title: string;
  title_translations: LanguageMap;
  aliases: string[];
  severity: "critical" | "urgent" | "moderate";
  immediate_warning?: string;
  immediate_warning_translations?: LanguageMap;
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

export interface Category {
  id: CategoryId;
  name: string;
  name_translations: LanguageMap;
}
