export interface LanguageOption {
  value: string;
  label: string;
  icon: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { value: "typescript", label: "TypeScript", icon: "TS" },
  { value: "javascript", label: "JavaScript", icon: "JS" },
  { value: "python", label: "Python", icon: "PY" },
  { value: "java", label: "Java", icon: "JV" },
  { value: "go", label: "Go", icon: "GO" },
  { value: "rust", label: "Rust", icon: "RS" },
  { value: "c", label: "C", icon: "C" },
  { value: "cpp", label: "C++", icon: "C+" },
  { value: "csharp", label: "C#", icon: "C#" },
  { value: "php", label: "PHP", icon: "PH" },
  { value: "kotlin", label: "Kotlin", icon: "KT" },
  { value: "swift", label: "Swift", icon: "SW" }
];

const languageMap = new Map(SUPPORTED_LANGUAGES.map((language) => [language.value, language]));

export function getLanguageMeta(language: string): LanguageOption {
  return languageMap.get(language.toLowerCase()) ?? {
    value: language,
    label: language,
    icon: language.slice(0, 2).toUpperCase()
  };
}
