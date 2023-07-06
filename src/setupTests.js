jest.mock('src/configStore', () => ({
  loadedConfigStore: { current: { jest: true } },
}));
