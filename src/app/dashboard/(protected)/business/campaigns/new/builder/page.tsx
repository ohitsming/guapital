'use client'

import { Button } from "@/components/Button";
import { useCampaignForm } from "@/lib/context/CampaignFormContext";
import { useRouter } from 'next/navigation';
import { useState, useEffect } from "react";
import { SurveyQuestion, QuestionType } from '@/lib/interfaces/survey';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';

function classNames(...classes: any) {
    return classes.filter(Boolean).join(' ')
}

export default function SurveyBuilderPage() {
    const { state: campaignFormState, dispatch } = useCampaignForm();
    const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
    const router = useRouter();

    useEffect(() => {
        if (campaignFormState.surveyQuestions) {
            setQuestions(campaignFormState.surveyQuestions);
        }
    }, [campaignFormState.surveyQuestions]);

    const handleQuestionChange = (index: number, field: keyof SurveyQuestion, value: any) => {
        const newQuestions = [...questions];
        newQuestions[index] = { ...newQuestions[index], [field]: value };
        setQuestions(newQuestions);
    };

    const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
        const newQuestions = [...questions];
        if (newQuestions[qIndex].options) {
            newQuestions[qIndex].options![oIndex] = value;
            setQuestions(newQuestions);
        }
    };

    const addOption = (qIndex: number) => {
        const newQuestions = [...questions];
        if (newQuestions[qIndex].options) {
            newQuestions[qIndex].options!.push('');
            setQuestions(newQuestions);
        }
    };

    const removeOption = (qIndex: number, oIndex: number) => {
        const newQuestions = [...questions];
        newQuestions.splice(oIndex, 1);
        setQuestions(newQuestions);
    };

    const addQuestion = () => {
        setQuestions([...questions, { text: '', type: 'open-ended', options: [] }]);
    };

    const removeQuestion = (index: number) => {
        const newQuestions = [...questions];
        newQuestions.splice(index, 1);
        setQuestions(newQuestions);
    };

    const handleNext = () => {
        dispatch({ type: 'SET_SURVEY_QUESTIONS', payload: questions });
        router.push('/dashboard/business/campaigns/new/demographics');
    };

    const questionTypeOptions: QuestionType[] = ['open-ended', 'multiple-choice', 'rating-scale', 'yes-no'];

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8">Task Builder</h1>
            <div className="space-y-6">
                {questions.map((q, qIndex) => (
                    <div key={qIndex} className="p-6 border border-neutral-200 rounded-lg bg-white shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-xl font-semibold">Question {qIndex + 1}</h2>
                            <button onClick={() => removeQuestion(qIndex)} className="text-neutral-500 hover:text-red-500">
                                <TrashIcon className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-neutral-700">Question Text</label>
                                <input
                                    type="text"
                                    value={q.text}
                                    onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 bg-white border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label htmlFor={`question-type-${qIndex}`} className="block text-sm font-medium text-neutral-700">Question Type</label>
                                <Menu as="div" className="relative block text-left w-full">
                                    <MenuButton className="inline-flex w-full justify-between items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500">
                                        {q.type}
                                        <ChevronDownIcon aria-hidden="true" className="-mr-1 size-5 text-gray-400" />
                                    </MenuButton>

                                    <MenuItems
                                        transition
                                        className="absolute left-0 z-50 mt-2 w-full origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
                                    >
                                        <div className="py-1">
                                            {questionTypeOptions.map((typeOption) => (
                                                <MenuItem key={typeOption}>
                                                    {({ focus }) => (
                                                        <a
                                                            onClick={() => handleQuestionChange(qIndex, 'type', typeOption)}
                                                            className={classNames(
                                                                focus ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                                                                'block px-4 py-2 text-sm'
                                                            )}
                                                        >
                                                            {typeOption}
                                                        </a>
                                                    )}
                                                </MenuItem>
                                            ))}
                                        </div>
                                    </MenuItems>
                                </Menu>
                            </div>
                        </div>
                        {q.type === 'multiple-choice' && (
                            <div className="mt-4">
                                <h3 className="text-lg font-medium text-neutral-800 mb-2">Options</h3>
                                <div className="space-y-2">
                                    {q.options?.map((opt, oIndex) => (
                                        <div key={oIndex} className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={opt}
                                                onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                                                className="block w-full px-3 py-2 bg-white border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            />
                                            <button onClick={() => removeOption(qIndex, oIndex)} className="text-neutral-500 hover:text-red-500">
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <Button onClick={() => addOption(qIndex)} className="rounded-md mt-4 px-3.5 py-2.5 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-600">
                                    <span className="inline-flex items-center gap-x-2">
                                        <PlusIcon className="h-5 w-5" />
                                        Add Option
                                    </span>
                                </Button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <div className="mt-8 flex justify-between">
                <Button onClick={addQuestion} className="rounded-md px-3.5 py-2.5 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-600">
                    <span className="inline-flex items-center gap-x-2">
                        <PlusIcon className="h-5 w-5" />
                        Add Question
                    </span>
                </Button>
                <Button onClick={handleNext} className="px-8 py-3 text-lg">Next</Button>
            </div>
        </div>
    );
}
