import { render, screen } from '@testing-library/react';
import React from 'react';

import { AoUStylizedString } from './AoUStylizedString';

describe('AoUStylizedString', () => {
  it('renders null when text is undefined', () => {
    const { container } = render(<AoUStylizedString />);
    expect(container.firstChild).toBeNull();
  });

  it('renders text without "All of Us" unchanged', () => {
    const text = 'No mentions of the keywords here';
    render(<AoUStylizedString text={text} />);

    expect(screen.getByText(text)).toBeInTheDocument();

    // Should not have any italic styling
    const element = screen.getByText(text);
    expect(element.tagName).toBe('SPAN');
    expect(element).not.toHaveStyle('font-style: italic');
  });

  it('italicizes "All of Us"', () => {
    const text = 'Phase and impute genotypes using Beagle 5.5 with the All of Us + AnVIL reference panel.';
    render(<AoUStylizedString text={text} />);

    // Check that "All of Us" is rendered in italics
    const italicElement = screen.getByText('All of Us');
    expect(italicElement).toBeInTheDocument();
    expect(italicElement).toHaveStyle('font-style: italic');

    expect(screen.getByText('Phase and impute genotypes using Beagle 5.5 with the')).toBeInTheDocument();
    expect(screen.getByText('+ AnVIL reference panel.')).toBeInTheDocument();
  });

  it('handles multiple instances of "All of Us" in the same text', () => {
    const text = 'All of Us is great and All of Us provides valuable data to researchers.';
    render(<AoUStylizedString text={text} />);

    // Should find both instances of "All of Us" with italic styling
    const italicElements = screen.getAllByText('All of Us');
    expect(italicElements).toHaveLength(2);
    italicElements.forEach((element) => {
      expect(element).toHaveStyle('font-style: italic');
    });
  });

  it('handles case-insensitive matching of "All of Us"', () => {
    const text = 'all of us is great and ALL OF US provides valuable data to researchers.';
    render(<AoUStylizedString text={text} />);

    const allOfUsLower = screen.getByText('all of us');
    const allOfUsUpper = screen.getByText('ALL OF US');

    expect(allOfUsLower).toHaveStyle('font-style: italic');
    expect(allOfUsUpper).toHaveStyle('font-style: italic');
  });
});
