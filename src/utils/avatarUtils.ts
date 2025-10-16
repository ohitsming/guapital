/**
 * Generates initials from a given name.
 * Handles single names, multiple names, and trims whitespace.
 * @param name The full name (e.g., "John Doe", "Alice").
 * @returns The initials (e.g., "JD", "A").
 */
export const getInitials = (name: string): string => {
    if (!name) return '';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
        return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Generates a consistent HSL color based on a string.
 * This ensures the same name always gets the same color.
 * @param str The string to hash (e.g., a user's name or ID).
 * @returns An HSL color string (e.g., "hsl(120, 70%, 50%)").
 */
export const stringToColor = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Use a fixed saturation and lightness for better readability and consistency
    // Hue will vary based on the hash
    const hue = hash % 360;
    const saturation = 70; // 70% saturation
    const lightness = 50; // 50% lightness

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};
