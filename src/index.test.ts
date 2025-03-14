import { doAppBoot } from 'src/libs/startup/app-boot';

jest.mock('src/libs/startup/app-boot');
describe('index.js app root', () => {
  it('bootstraps by calling ', () => {
    // Act
    // simulate index.js script load/execute
    jest.requireActual('src/index');

    // Assert
    expect(doAppBoot).toBeCalledTimes(1);
  });
});
