import { sidebarSections } from 'src/pages/library/Showcase';

describe('Showcase', () => {
  it('matches on tags', () => {
    // Arrange
    const workspace = {
      tags: {
        items: ['google cloud platform'],
      },
    };
    // Act
    // We only need to test one sidebar section because they all have identical matching behavior
    const matchWorkspaceByTag = sidebarSections[0].matchBy(workspace, 'google cloud platform');
    // Assert
    expect(matchWorkspaceByTag).toBeTruthy();
  });
});
