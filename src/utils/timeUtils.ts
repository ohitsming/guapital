import { SurveyQuestion } from '@/lib/interfaces/survey';

const TIME_ESTIMATES_SECONDS: Record<SurveyQuestion['type'], number> = {
    'open-ended': 60,
    'multiple-choice': 20,
    'rating-scale': 20,
    'yes-no': 10,
};

const WORDS_PER_SECOND_RATE = 3; // Average reading speed: 3 words per second

export function calculateTimeEstimate(questions: SurveyQuestion[]): string {
    if (!questions || questions.length === 0) {
        return 'Less than a minute';
    }

    const totalSeconds = questions.reduce((acc, question) => {
        const baseTime = TIME_ESTIMATES_SECONDS[question.type] || 15; // Default to 15s if type is unknown
        const wordsInQuestion = question.text.split(/\s+/).filter(word => word.length > 0).length;
        const timeFromWords = wordsInQuestion / WORDS_PER_SECOND_RATE;
        return acc + baseTime + timeFromWords;
    }, 0);

    const minutes = Math.round(totalSeconds / 60);

    if (minutes < 1) {
        return 'Less than a minute';
    }

    if (minutes === 1) {
        return '1 minute';
    }

    return `${minutes} minutes`;
}