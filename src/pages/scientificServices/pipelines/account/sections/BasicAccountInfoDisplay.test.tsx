import { render, screen } from '@testing-library/react';
import React from 'react';
import * as stateModule from 'src/libs/state';
import { BasicAccountInfoDisplay } from 'src/pages/scientificServices/pipelines/account/sections/BasicAccountInfoDisplay';

const mockGetTerraUser = jest.spyOn(stateModule, 'getTerraUser');
const mockGetTerraUserProfile = jest.spyOn(stateModule, 'getTerraUserProfile');

beforeEach(() => {
  mockGetTerraUser.mockReturnValue({ email: 'user@example.com' } as any);
  mockGetTerraUserProfile.mockReturnValue({ firstName: 'John', lastName: 'Doe' } as any);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('BasicAccountInfoDisplay', () => {
  it('renders the user first name, last name, and email with field labels', () => {
    render(<BasicAccountInfoDisplay />);

    expect(screen.getByText('First Name:')).toBeInTheDocument();
    expect(screen.getByText('John')).toBeInTheDocument();

    expect(screen.getByText('Last Name:')).toBeInTheDocument();
    expect(screen.getByText('Doe')).toBeInTheDocument();

    expect(screen.getByText('Email:')).toBeInTheDocument();
    expect(screen.getByText('user@example.com')).toBeInTheDocument();
  });

  it('displays "N/A" for fields when they are undefined', () => {
    mockGetTerraUser.mockReturnValue({ email: undefined });
    mockGetTerraUserProfile.mockReturnValue({ firstName: undefined, lastName: undefined } as any);

    render(<BasicAccountInfoDisplay />);

    expect(screen.getAllByText('N/A')).toHaveLength(3);
  });
});
