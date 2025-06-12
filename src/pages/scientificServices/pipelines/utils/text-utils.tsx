import React from 'react';

// This component is used to render the "All of Us" name in italics
// Useful for text that's returned by the backend
export const BrandedDiv: React.FC<{ children: string }> = ({ children }) => {
  const parts = children.split(/(All of Us)/g);
  return <div>{parts.map((part) => (part === 'All of Us' ? <i>All of Us</i> : part))}</div>;
};
