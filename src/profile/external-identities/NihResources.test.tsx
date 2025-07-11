import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import { NihDatasetPermission } from 'src/libs/ajax/User';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

import { NihResources } from './NihResources';

const mockAuthorized: NihDatasetPermission[] = [
  { name: 'Dataset A', authorized: true },
  { name: 'Dataset B', authorized: true },
];

const mockUnauthorized: NihDatasetPermission[] = [
  { name: 'Dataset C', authorized: false },
  { name: 'Dataset D', authorized: false },
];

describe('NihResources', () => {
  describe('Component Structure', () => {
    it('should display the Resources header', () => {
      // Arrange
      const props = { authorizedDatasets: [], unauthorizedDatasets: [] };

      // Act
      render(<NihResources {...props} />);

      // Assert
      expect(screen.getByText('Resources')).toBeInTheDocument();
    });
  });

  describe('Authorized Datasets Section', () => {
    it('should display authorized datasets section when datasets are provided', () => {
      // Arrange
      const props = { authorizedDatasets: mockAuthorized, unauthorizedDatasets: [] };

      // Act
      render(<NihResources {...props} />);

      // Assert
      expect(screen.getByText('Authorized to access')).toBeInTheDocument();
      mockAuthorized.forEach(({ name }) => {
        expect(screen.getByText(name)).toBeInTheDocument();
      });
    });

    it('should not display authorized datasets section when no datasets are provided', () => {
      // Arrange
      const props = { authorizedDatasets: [], unauthorizedDatasets: [] };

      // Act
      render(<NihResources {...props} />);

      // Assert
      expect(screen.queryByText('Authorized to access')).not.toBeInTheDocument();
    });
  });

  describe('Unauthorized Datasets Section', () => {
    it('should display unauthorized datasets section header but hide content by default', () => {
      // Arrange
      const props = { authorizedDatasets: [], unauthorizedDatasets: mockUnauthorized };

      // Act
      render(<NihResources {...props} />);

      // Assert
      expect(screen.getByText('Not authorized')).toBeInTheDocument();
      mockUnauthorized.forEach(({ name }) => {
        expect(screen.queryByText(name)).not.toBeInTheDocument();
      });
    });

    it('should reveal unauthorized datasets when section header is clicked', () => {
      // Arrange
      const props = { authorizedDatasets: [], unauthorizedDatasets: mockUnauthorized };
      render(<NihResources {...props} />);

      // Act
      fireEvent.click(screen.getByText('Not authorized'));

      // Assert
      mockUnauthorized.forEach(({ name }) => {
        expect(screen.getByText(name)).toBeInTheDocument();
      });
    });

    it('should not display unauthorized datasets section when no datasets are provided', () => {
      // Arrange
      const props = { authorizedDatasets: [], unauthorizedDatasets: [] };

      // Act
      render(<NihResources {...props} />);

      // Assert
      expect(screen.queryByText('Not authorized')).not.toBeInTheDocument();
    });
  });

  describe('Combined Sections Behavior', () => {
    it('should display both sections independently with correct initial states', () => {
      // Arrange
      const props = { authorizedDatasets: mockAuthorized, unauthorizedDatasets: mockUnauthorized };

      // Act
      render(<NihResources {...props} />);

      // Assert - the Authorized section is expanded by default
      expect(screen.getByText('Authorized to access')).toBeInTheDocument();
      mockAuthorized.forEach(({ name }) => {
        expect(screen.getByText(name)).toBeInTheDocument();
      });

      // Assert - Unauthorized section is collapsed by default
      expect(screen.getByText('Not authorized')).toBeInTheDocument();
      mockUnauthorized.forEach(({ name }) => {
        expect(screen.queryByText(name)).not.toBeInTheDocument();
      });
    });

    it('should toggle unauthorized section independently of authorized section', () => {
      // Arrange
      const props = { authorizedDatasets: mockAuthorized, unauthorizedDatasets: mockUnauthorized };
      render(<NihResources {...props} />);

      // Act
      fireEvent.click(screen.getByText('Not authorized'));

      // Assert - the Authorized section remains visible
      mockAuthorized.forEach(({ name }) => {
        expect(screen.getByText(name)).toBeInTheDocument();
      });

      // Assert - the Unauthorized section is now visible
      mockUnauthorized.forEach(({ name }) => {
        expect(screen.getByText(name)).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should only display header when no datasets are provided', () => {
      // Arrange
      const props = { authorizedDatasets: [], unauthorizedDatasets: [] };

      // Act
      render(<NihResources {...props} />);

      // Assert
      expect(screen.getByText('Resources')).toBeInTheDocument();
      expect(screen.queryByText('Authorized to access')).not.toBeInTheDocument();
      expect(screen.queryByText('Not authorized')).not.toBeInTheDocument();
    });
  });
});
