import React from 'react';
import { getInitials, stringToColor } from '@/utils/avatarUtils';

interface LetterAvatarProps {
    name: string;
    size?: number; // Size in pixels (width and height)
    textSize?: string; // Tailwind CSS text size class (e.g., 'text-lg', 'text-xl')
    className?: string; // Additional Tailwind CSS classes
}

const LetterAvatar: React.FC<LetterAvatarProps> = ({
    name,
    size = 40, // Default size
    textSize = 'text-base', // Default text size
    className = '',
}) => {
    const initials = getInitials(name);
    const backgroundColor = stringToColor(name);

    return (
        <div
            className={`relative inline-flex items-center justify-center rounded-full overflow-hidden ${className}`}
            style={{
                width: size,
                height: size,
                backgroundColor: backgroundColor,
            }}
            title={name}
        >
            <span className={`font-medium text-white ${textSize}`}>
                {initials}
            </span>
        </div>
    );
};

export default LetterAvatar;
