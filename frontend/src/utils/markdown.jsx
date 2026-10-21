import React from 'react';

/**
 * Parses simple markdown (bold asterisks **text**) and returns JSX elements.
 * Correctly replaces markdown double asterisks with <strong> elements.
 */
export function parseMarkdown(text) {
  if (!text) return '';
  const parts = text.split('**');
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return <strong key={index} style={{ color: 'var(--text-light)', fontWeight: 700 }}>{part}</strong>;
    }
    return part;
  });
}
