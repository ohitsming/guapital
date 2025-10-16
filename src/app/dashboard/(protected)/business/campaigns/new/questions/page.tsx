'use client';

import { Button } from "@/components/Button";
import LetterAvatar from "@/components/LetterAvatar";
import { useCampaignForm } from "@/lib/context/CampaignFormContext";
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from "react";
import { SurveyQuestion } from '@/lib/interfaces/survey';
import SurveyModeSelector from '@/components/SurveyModeSelector';

interface Message {
    text: string;
    sender: 'user' | 'bot';
}

export default function NewCampaignQuestions() {
    const [mode, setMode] = useState<'choice' | 'ai'>('choice');
    const [messages, setMessages] = useState<Message[]>([]);
    const [userInput, setUserInput] = useState('');
    const [userProfile, setUserProfile] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [surveyReady, setSurveyReady] = useState(false);
    const [conversationEnded, setConversationEnded] = useState(false);
    const { state: campaignFormState, dispatch } = useCampaignForm();
    const router = useRouter();

    const handleNext = () => {
        router.push('/dashboard/business/campaigns/new/builder');
    };

    const handleSelectAi = () => {
        setMode('ai');
    };

    const handleSelectManual = () => {
        dispatch({ type: 'SET_SURVEY_QUESTIONS', payload: [{ text: '', type: 'open-ended', options: [] }] });
        router.push('/dashboard/business/campaigns/new/builder');
    };

    const messagesEndRef = useRef<null | HTMLDivElement>(null);
    const textareaRef = useRef<null | HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (mode === 'ai') {
            scrollToBottom();
        }
    }, [messages, mode]);

    useEffect(() => {
        if (mode === 'ai' && messages.length === 0) {
            const fetchUserProfile = async () => {
                try {
                    const response = await fetch('/api/supabase/settings/profile');
                    if (!response.ok) {
                        throw new Error('Failed to fetch user profile');
                    }
                    const data = await response.json();
                    setUserProfile(data);

                    let initialBotMessage = `Alright, let's get down to business! I'm here to be your strategic sidekick and help you build the best survey possible. To start, what's the big idea you're looking to validate?`;

                    if (campaignFormState.campaignTitle) {
                        initialBotMessage = `Great, you've set up a campaign titled "${campaignFormState.campaignTitle}".`;
                        if (campaignFormState.campaignDescription) {
                            initialBotMessage += ` You've described it as: "${campaignFormState.campaignDescription}".`;
                        }
                        initialBotMessage += `\n\nNow, what would you like to know from your audiences?`;
                    }

                    setMessages([
                        { sender: 'bot', text: initialBotMessage }
                    ]);
                } catch (error) {
                    console.error('Error fetching user profile:', error);
                }
            };

            fetchUserProfile();
        }
    }, [mode, messages.length, campaignFormState.campaignDescription, campaignFormState.campaignTitle]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (userInput.trim() === '' || isLoading) return;

        const newMessages: Message[] = [...messages, { sender: 'user', text: userInput }];
        setMessages(newMessages);
        setUserInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/gemini/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: newMessages,
                    campaignTitle: campaignFormState.campaignTitle,
                    campaignDescription: campaignFormState.campaignDescription
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to get response from bot.');
            }

            const data = await response.json();
            const botMessage = data.text || "Sorry, I couldn't get a response.";
            const nextStepReady = data.nextStepReady || false;

            setMessages(prevMessages => [...prevMessages, { sender: 'bot', text: botMessage }]);

            if (nextStepReady) {
                setConversationEnded(true);
            }

        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prevMessages => [...prevMessages, { sender: 'bot', text: "Sorry, something went wrong. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateSurvey = async () => {
        setIsGenerating(true);
        try {

            const response = await fetch('/api/gemini/generate-survey', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: messages,
                    campaignTitle: campaignFormState.campaignTitle,
                    campaignDescription: campaignFormState.campaignDescription
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate survey.');
            }

            const data = await response.json();
            if (data.survey && data.survey.questions) {
                dispatch({ type: 'SET_SURVEY_QUESTIONS', payload: data.survey.questions });
                setMessages(prev => [...prev, { sender: 'bot', text: "Great! I've generated a set of survey questions for you based on our conversation. You can now proceed to the next step." }]);
                setSurveyReady(true);
            } else {
                throw new Error('Generated survey is not in the expected format.');
            }

        } catch (error) {
            console.error('Error generating survey:', error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            setMessages(prevMessages => [...prevMessages, { sender: 'bot', text: `Sorry, I ran into an error while generating the survey: ${errorMessage}` }]);
        } finally {
            setIsGenerating(false);
        }
    };

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [userInput]);

    return (
        <div className="fixed top-16 bottom-0 right-0 lg:left-72 left-0 flex flex-col bg-white">
            {mode === 'choice' ? (
                <SurveyModeSelector onSelectAi={handleSelectAi} onSelectManual={handleSelectManual} />
            ) : (
                <>
                    <div className="flex-grow p-6 overflow-y-auto mt-10 pb-48">
                        <div className="max-w-4xl mx-auto w-full space-y-6">
                            {messages.map((message, index) => (
                                <div key={index} className={`flex items-start gap-4 ${message.sender === 'user' ? 'justify-end' : ''}`}>
                                    {message.sender === 'bot' && (
                                        <LetterAvatar name={'LocalMoco'} size={32} textSize="text-sm" className="mt-2"/>
                                    )}
                                    <div className={`max-w-xl p-4 rounded-2xl ${message.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-neutral-100 text-neutral-800'}`}>
                                        <p className="whitespace-pre-wrap">{message.text}</p>
                                    </div>
                                     {message.sender === 'user' && (
                                        <LetterAvatar name={userProfile?.full_name || ''} size={32} textSize="text-sm" className="mt-2" />
                                    )}
                                </div>
                            ))}
                             {(isLoading || isGenerating) && (
                                <div className="flex items-start gap-4">
                                     <LetterAvatar name={'LocalMoco'} size={32} textSize="text-sm" className="mt-2"/>
                                    <div className="max-w-xl p-4 rounded-2xl bg-neutral-100 text-neutral-800">
                                        <p className="animate-pulse">{isGenerating ? 'Generating your survey...' : 'Thinking...'}</p>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>
                    <div className="fixed bottom-0 right-0 lg:left-72 left-0 bg-transparent p-4 mb-8">
                        <div className="max-w-4xl mx-auto w-full">
                            {surveyReady ? (
                                <div className="flex justify-end">
                                    <Button type="button" onClick={handleNext} className="px-6 py-3 text-lg">Next</Button>
                                </div>
                            ) : (
                                <form onSubmit={handleSendMessage} className="relative">
                                    <textarea
                                        ref={textareaRef}
                                        value={userInput}
                                        onChange={(e) => setUserInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage(e);
                                            }
                                        }}
                                        placeholder={isLoading ? "Waiting for response..." : (conversationEnded ? "Ready to generate survey!" : "Type your message...")}
                                        className="w-full p-4 pr-32 bg-white rounded-2xl border-2 border-neutral-200 focus:border-blue-500 focus:outline-none resize-none shadow-lg transition-all duration-300"
                                        rows={1}
                                        disabled={isLoading || isGenerating}
                                        style={{ minHeight: '108px', maxHeight: '200px' }}
                                    />
                                    <div className="absolute top-1/2 right-4 -translate-y-1/2 flex items-center space-x-2">
                                        {conversationEnded && (
                                            <Button 
                                                type="button"
                                                onClick={handleGenerateSurvey}
                                                disabled={isLoading || isGenerating}
                                                className="!p-2 px-6 rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:bg-neutral-300"
                                                title="Generate Survey"
                                            >
                                                Build
                                            </Button>
                                        )}
                                        <Button 
                                            type="submit" 
                                            disabled={isLoading || isGenerating || userInput.trim() === ''}
                                            className="!p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:bg-neutral-300"
                                            title="Send Message"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                                            </svg>
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

