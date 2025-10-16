'use client'

import React, { useState } from 'react';
import { StarIcon } from '@heroicons/react/24/solid'; // Using solid star for filled state

interface RatingInputProps {
    value: number; // Current selected rating
    onChange: (rating: number) => void; // Callback for when rating changes
    disabled?: boolean; // To disable interaction if needed
}

export default function RatingInput({ value, onChange, disabled = false }: RatingInputProps) {
    const [hover, setHover] = useState(0);

    return (
        <div className="flex items-center">
            {[...Array(5)].map((_, index) => {
                const ratingValue = index + 1;
                return (
                    <label key={ratingValue}>
                        <input
                            type="radio"
                            name="rating"
                            value={ratingValue}
                            onClick={() => !disabled && onChange(ratingValue)}
                            className="hidden"
                            disabled={disabled}
                        />
                        <StarIcon
                            className={`cursor-pointer h-8 w-8 transition-colors duration-200
                                ${ratingValue <= (hover || value) ? 'text-yellow-400' : 'text-gray-300'}
                                ${disabled ? 'cursor-not-allowed' : 'hover:text-yellow-500'}
                            `}
                            onMouseEnter={() => !disabled && setHover(ratingValue)}
                            onMouseLeave={() => !disabled && setHover(0)}
                        />
                    </label>
                );
            })}
        </div>
    );
}
