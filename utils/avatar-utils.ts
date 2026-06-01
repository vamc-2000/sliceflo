/**
 * Returns initials from a name or email.
 * @param name The user's name
 * @param email The user's email
 * @returns A 1-2 character string of initials
 */
export const getInitials = (name?: string, email?: string): string => {
  if (name && name.trim()) {
    const initials = name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
    
    if (initials.length > 2) {
      return initials[0] + initials[initials.length - 1];
    }
    return initials || "U";
  }

  if (email && email.trim()) {
    const [localPart] = email.split("@");
    if (!localPart) return "U";

    const parts = localPart.split(/[._\-]/).filter(Boolean);

    if (parts.length === 1) {
      const chunk = parts[0];
      if (chunk.length === 1) return chunk.toUpperCase();
      return (chunk[0] + chunk[chunk.length - 1]).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  return "U";
};

/**
 * Returns a consistent Tailwind background color class based on an ID.
 * @param id The user or object ID
 * @returns A string representing a Tailwind bg color class
 */
export const getAvatarColor = (id: string): string => {
  if (!id) return 'bg-blue-500';
  
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-red-500',
    'bg-orange-500',
    'bg-teal-500'
  ];

  // Parse ID or hash it if it's alphanumeric to reliably get a number
  const num = parseInt(id);
  const index = (isNaN(num) ? Array.from(id).reduce((acc, char) => acc + char.charCodeAt(0), 0) : num) % colors.length;
  
  return colors[index];
};
