import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

interface ClientMessage {
    sender: 'user' | 'bot';
    text: string;
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

    if (!messages || !Array.isArray(messages)) {
        return NextResponse.json({ error: 'Messages are required.' }, { status: 400 });
    }

    // Hard stop after 20 messages (10 exchanges)
    if (messages.length > 60) {
        return NextResponse.json({
            text: "We've had a detailed discussion. I believe we have enough information to create a strong survey. Please click the 'Generate Survey' button to proceed.",
            nextStepReady: true
        });
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash'
        });

        const businessContextPrompt = [];
        if (campaignTitle) {
            let contextText = `My campaign is titled "${campaignTitle}"`;
            if (campaignDescription) {
                contextText += ` and is about: "${campaignDescription}".`;
            }
            contextText += ` Your goal is to help me create survey questions by asking clarifying questions one at a time. Wait for my response before asking the next question.`;

            businessContextPrompt.push(
                {
                    role: "user",
                    parts: [{ text: contextText }],
                },
                {
                    role: "model",
                    parts: [{ text: "Great! I can help with that. To start, what is the primary goal of your survey? For example, are you trying to gauge interest, validate a feature, or understand customer pain points?" }],
                }
            );
        }

        const guardrailPrompt = {
            role: "user",
            parts: [{
                text: `
                You are an expert business strategy assistant with a witty and slightly humorous personality. Your sole and exclusive purpose is to help business owners define, refine, and articulate their business goals by asking clarifying questions. While you can be funny, you always remain professional and on-task.
                
                **CRITICAL RULES:**
                - **CONCISE CONVERSATION:** Aim to define the survey and gather all necessary information within approximately 10 back-and-forth exchanges (20 messages total). Be efficient and constructive in your questions.
                - **MAINTAIN STRICT FOCUS:** Your only function is business goal setting. Do not engage in conversations about any other topic.
                - **DEFLECT AND REDIRECT:** If the user asks about an unrelated topic, you MUST politely decline (perhaps with a touch of humor) and immediately steer the conversation back to the business goal.
                - **ONE QUESTION AT A TIME:** Ask only one question at a time and wait for the user's response.
                - **FLEXIBILITY:** If the user indicates they don't want to answer a question or want to move on, acknowledge their preference and smoothly transition to the next relevant topic without being persistent.
                - **NO REPEATING QUESTIONS:** Never ask a question that you have already asked in this conversation.
                - **SIGNAL COMPLETION:** When you have gathered enough information and are ready to generate the survey, you MUST end your final response with the exact phrase: '[SURVEY_READY]'.
            ` }],
        };

        const guardrailResponse = {
            role: "model",
            parts: [{ text: "Alright, let's get down to business! I'm here to be your strategic sidekick and help you build the best survey possible. Think of me as the witty assistant in a spy movie, but for market research. To start, what's the big idea you're looking to validate?" }],
        };

        const incomingHistory = mapClientHistoryToGeminiHistory(messages);

        // The first message from the client is the initial bot message, which we ignore in the history.
        const conversationHistory = incomingHistory.length > 1 ? incomingHistory.slice(1) : [];

        const fullHistory = [
            guardrailPrompt,
            guardrailResponse,
            ...businessContextPrompt,
            ...conversationHistory
        ];

        const latestMessage = fullHistory.pop();
        if (!latestMessage) {
            return NextResponse.json({ error: 'No message to send' }, { status: 400 });
        }

        const chat = model.startChat({
            history: fullHistory,
            generationConfig: {
                maxOutputTokens: 500,
                temperature: 0.8,
            },
        });

        const result = await chat.sendMessage(latestMessage.parts[0].text);
        const response = await result.response;
        const text = response.text();

        const nextStepReady = text.includes('[SURVEY_READY]');
        const cleanText = text.replace('[SURVEY_READY]', '').trim();

        return NextResponse.json({ text: cleanText, nextStepReady });

    } catch (error) {
        console.error('Error communicating with Gemini API:', error);
        return NextResponse.json({ error: 'Failed to get response from Gemini.' }, { status: 500 });
    }
}