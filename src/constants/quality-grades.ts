export const QUALITY_GRADES = {
  A: "a",
  B: "b",
  C: "c",
  UNGRADED: "ungraded",
} as const;

export type QualityGrade = (typeof QUALITY_GRADES)[keyof typeof QUALITY_GRADES];

export const QUALITY_GRADE_VALUES = Object.values(QUALITY_GRADES);

export interface QualityGradeOption {
  value: QualityGrade;
  label: string;
  description: string;
}

export const QUALITY_GRADE_OPTIONS: QualityGradeOption[] = [
  {
    value: QUALITY_GRADES.A,
    label: "A Grade",
    description: "Excellent quality",
  },
  {
    value: QUALITY_GRADES.B,
    label: "B Grade",
    description: "Good quality",
  },
  {
    value: QUALITY_GRADES.C,
    label: "C Grade",
    description: "Average quality",
  },
  {
    value: QUALITY_GRADES.UNGRADED,
    label: "Not sure",
    description: "I don't know the grade yet",
  },
];

export function getQualityGradeLabel(grade: string | undefined): string {
  return (
    QUALITY_GRADE_OPTIONS.find((option) => option.value === grade)?.label ??
    "Not set"
  );
}
