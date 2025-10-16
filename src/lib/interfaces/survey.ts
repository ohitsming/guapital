export type QuestionType = 'open-ended' | 'multiple-choice' | 'rating-scale' | 'yes-no';

export interface SurveyQuestion {
  type: QuestionType;
  text: string;
  options?: string[]; // Only for 'multiple-choice'
}

export interface Survey {
  questions: SurveyQuestion[];
}
