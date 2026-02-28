import { render, screen } from '@testing-library/react';
import React from 'react';
import { AccountInfoDisplay } from 'src/pages/scientificServices/pipelines/account/sections/AccountInfoDisplay';

describe('AccountInfoDisplay', () => {
  it('renders all user information when provided', () => {
    render(<AccountInfoDisplay firstName='John' lastName='Doe' email='john.doe@example.com' />);

    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('Doe')).toBeInTheDocument();
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
  });

  it('displays "N/A" for all fields when all are undefined', () => {
    render(<AccountInfoDisplay firstName={undefined} lastName={undefined} email={undefined} />);

    expect(screen.getAllByText('N/A')).toHaveLength(3);
  });
});
