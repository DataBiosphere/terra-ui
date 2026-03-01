import { render, screen } from '@testing-library/react';
import React from 'react';
import { BasicAccountInfoDisplay } from 'src/pages/scientificServices/pipelines/account/sections/BasicAccountInfoDisplay';

jest.mock('src/libs/state', () => ({
  ...jest.requireActual('src/libs/state'),
  getTerraUser: jest.fn(() => ({ email: 'user@example.com' })),
  getTerraUserProfile: jest.fn(() => ({ firstName: 'John', lastName: 'Doe' })),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const mockGetTerraUser = jest.mocked(require('src/libs/state').getTerraUser);
// eslint-disable-next-line @typescript-eslint/no-var-requires
const mockGetTerraUserProfile = jest.mocked(require('src/libs/state').getTerraUserProfile);

beforeEach(() => {
  mockGetTerraUser.mockReturnValue({ email: 'user@example.com' });
  mockGetTerraUserProfile.mockReturnValue({ firstName: 'John', lastName: 'Doe' });
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('BasicAccountInfoDisplay', () => {
  it('renders the full name and email', () => {
    render(<BasicAccountInfoDisplay />);

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('user@example.com')).toBeInTheDocument();
  });

  it('displays "Name not provided" in italics when both first and last name are missing', () => {
    mockGetTerraUserProfile.mockReturnValue({ firstName: undefined, lastName: undefined });

    render(<BasicAccountInfoDisplay />);

    expect(screen.getByText('Name not provided')).toBeInTheDocument();
  });

  it('displays only the first name when last name is missing', () => {
    mockGetTerraUserProfile.mockReturnValue({ firstName: 'John', lastName: undefined });

    render(<BasicAccountInfoDisplay />);

    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.queryByText('Name not provided')).not.toBeInTheDocument();
  });

  it('displays only the last name when first name is missing', () => {
    mockGetTerraUserProfile.mockReturnValue({ firstName: undefined, lastName: 'Doe' });

    render(<BasicAccountInfoDisplay />);

    expect(screen.getByText('Doe')).toBeInTheDocument();
    expect(screen.queryByText('Name not provided')).not.toBeInTheDocument();
  });
});
