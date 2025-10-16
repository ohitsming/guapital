import { Button } from "@/components/Button";
import { SparklesIcon, PencilSquareIcon } from '@heroicons/react/24/outline';

interface SurveyModeSelectorProps {
    onSelectAi: () => void;
    onSelectManual: () => void;
}

const SurveyModeSelector: React.FC<SurveyModeSelectorProps> = ({
    onSelectAi,
    onSelectManual,
}) => {
    return (
        <div className="flex-grow flex items-center justify-center">
            <div className="bg-neutral-50 rounded-2xl shadow-xl ring-1 ring-black/5 p-10 max-w-md w-full text-center">
                <h2 className="text-3xl font-bold mb-4">How do you want to build your survey?</h2>
                <p className="text-neutral-600 mb-8">Choose your path. You can either use our AI assistant to generate questions or build them from scratch yourself.</p>
                <div className="flex flex-col space-y-4">
                    <Button onClick={onSelectAi} className="justify-center py-3 text-lg">
                        <span className="inline-flex items-center gap-x-2">
                            <SparklesIcon className="h-6 w-6" />
                            <span className="mt-1">Build with AI</span>
                        </span>
                    </Button>
                    <Button onClick={onSelectManual} className="justify-center py-3 text-lg">
                        <span className="inline-flex items-center gap-x-2">
                            <PencilSquareIcon className="h-6 w-6" />
                            <span className="mt-1">Build Manually</span>
                        </span>
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default SurveyModeSelector;
