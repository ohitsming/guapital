
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Survey } from '@/lib/interfaces/survey';
import { NextResponse } from 'next/server';

interface ClientMessage {
    sender: 'user' | 'bot';
    text: string;
}

function validateSurvey(survey: any): survey is Survey {
    if (!survey || typeof survey !== 'object' || !Array.isArray(survey.questions)) {
        return false;
    }

    for (const question of survey.questions) {
        if (!question || typeof question !== 'object' || typeof question.text !== 'string' || typeof question.type !== 'string') {
            return false;
        }

        if (question.type === 'multiple-choice' && (!Array.isArray(question.options) || question.options.some((opt: any) => typeof opt !== 'string'))) {
            return false;
        }
    }

    return true;
}

function mapClientHistoryToGeminiHistory(clientHistory: ClientMessage[]) {
    return clientHistory.map(msg => ({
        role: msg.sender === 'bot' ? 'model' : 'user',
        parts: [{ text: msg.text }],
    }));
}

export async function POST(request: Request) {
    const { messages, campaignTitle, campaignDescription } = await request.json();

    if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json({ error: 'Gemini API key not found.' }, { status: 500 });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return NextResponse.json({ error: 'Conversation history is required.' }, { status: 400 });
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash'
        });

        const generationPrompt = `
            Based on the preceding conversation history about a campaign titled "${campaignTitle}" with the description "${campaignDescription}", your task is to generate a complete survey object.

            The survey should contain between 10 and 15 insightful, clear, and concise questions that are easy for a general audience to understand. Avoid jargon and aim to elicit actionable feedback.

            When generating the questions, adhere to these best practices:
            - **Clarity:** Questions should be easy to understand for a general audience. Avoid jargon, technical terms, and acronyms unless they are defined.
            - **Specificity:** Ask about one thing at a time. Avoid double-barreled questions (e.g., "Was the website easy to navigate and visually appealing?").
            - **Neutrality:** Frame questions in a neutral way to avoid leading the respondent to a particular answer.
            - **Actionability:** The answers to the questions should provide actionable insights for the business.

            The final output must be a single, valid JSON object that conforms to the following TypeScript interface. Do not include any other text, explanations, or markdown formatting around the JSON.

            \
            export type QuestionType = 'open-ended' | 'multiple-choice' | 'rating-scale' | 'yes-no';

            export interface SurveyQuestion {
                type: QuestionType;
                text: string;
                options?: string[]; // Only for 'multiple-choice'
            }

            export interface Survey {
                questions: SurveyQuestion[];
            }
            \
        `;

        // The Gemini API requires the chat history to start with a 'user' role.
        // We find the first user message and slice the array from there.
        const firstUserMessageIndex = messages.findIndex(msg => msg.sender === 'user');
        if (firstUserMessageIndex === -1) {
            return NextResponse.json({ error: 'Cannot generate a survey without user input.' }, { status: 400 });
        }
        const validHistoryMessages = messages.slice(firstUserMessageIndex);
        const conversationHistory = mapClientHistoryToGeminiHistory(validHistoryMessages);

        const contents = [
            ...conversationHistory,
            { role: 'user', parts: [{ text: generationPrompt }] }
        ];

        const result = await model.generateContent({ contents });

        const response = await result.response;
        const text = response.text();

        let survey: Survey | null = null;

        // Attempt to extract and parse JSON from the text
        const jsonMatch = text.match(/```(json|typescript)\n([\s\S]*?)\n```/);
        let parsedJson;
        if (jsonMatch && jsonMatch[2]) {
            try {
                parsedJson = JSON.parse(jsonMatch[2]);
            } catch (e) {
                console.error("Failed to parse JSON from Gemini response:", e);
                return NextResponse.json({ error: 'Failed to generate a valid survey from the conversation.' }, { status: 500 });
            }
        } else {
             try {
                parsedJson = JSON.parse(text);
            } catch (e) {
                 return NextResponse.json({ error: 'The model did not return a valid JSON object.' }, { status: 500 });
            }
        }

        if (validateSurvey(parsedJson)) {
            survey = parsedJson;
        } else {
            return NextResponse.json({ error: 'Failed to generate a valid survey that matches the required structure.' }, { status: 500 });
        }

        return NextResponse.json({ survey });

    } catch (error) {
        console.error('Error communicating with Gemini API:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: `Failed to get response from Gemini: ${errorMessage}` }, { status: 500 });
    }
}
