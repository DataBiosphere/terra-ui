import React from 'react';

interface StylizedStringProps {
  text?: string;
}

// Pipeline descriptions and names are returned from the backend as plain text,
// but we want to stylize occurrences of "All of Us" in italics.

// This component takes a string and returns a React fragment with the appropriate styling.
export const AoUStylizedString: React.FC<StylizedStringProps> = ({ text }) => {
  if (text === undefined) {
    return null;
  }

  const parts = text.split(/(All of Us)/gi);

  return (
    <>
      {parts.map((part, index) => {
        const key = `${part.toLowerCase().replace(/\s/g, '-')}-at-${index}`;

        if (part.toLowerCase() === 'all of us') {
          return (
            <span style={{ fontStyle: 'italic' }} key={`em-${key}`}>
              {part}
            </span>
          );
        }
        return <span key={`span-${key}`}>{part}</span>;
      })}
    </>
  );
};
