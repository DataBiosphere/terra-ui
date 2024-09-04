import {
  BucketLifecycleSetting,
  modifyFirstBucketDeletionRule,
  removeFirstBucketDeletionRule,
  WorkspaceSetting,
} from 'src/workspaces/SettingsModal/utils';

describe('disableFirstBucketDeletionRule', () => {
  it('returns an empty array', async () => {
    // Assert
    expect(removeFirstBucketDeletionRule([])).toEqual([]);
  });

  it('returns original settings if no bucket lifecyle setting', async () => {
    // Act
    const otherSetting: WorkspaceSetting = {
      settingType: 'OtherSetting',
    };
    const result = removeFirstBucketDeletionRule([otherSetting]);

    // Assert
    expect(result).toEqual([otherSetting]);
  });

  it('removes the first delete rule (of multiple) in the first bucket lifecycle setting', async () => {
    // Act
    const otherSetting: WorkspaceSetting = {
      settingType: 'OtherSetting',
    };
    const firstDeleteSetting: BucketLifecycleSetting = {
      settingType: 'GcpBucketLifecycle',
      config: {
        rules: [
          {
            action: {
              actionType: 'Delete',
            },
            conditions: {
              age: 1,
              matchesPrefix: [],
            },
          },
          {
            action: {
              actionType: 'Delete',
            },
            conditions: {
              age: 2,
              matchesPrefix: [],
            },
          },
          {
            action: {
              actionType: 'OtherAction',
            },
          },
        ],
      },
    };
    const secondDeleteSetting: BucketLifecycleSetting = {
      settingType: 'GcpBucketLifecycle',
      config: {
        rules: [
          {
            action: {
              actionType: 'Delete',
            },
            conditions: {
              age: 0,
              matchesPrefix: [],
            },
          },
        ],
      },
    };
    const result = removeFirstBucketDeletionRule([otherSetting, firstDeleteSetting, secondDeleteSetting]);

    // Assert
    expect(result).toEqual([
      {
        settingType: 'GcpBucketLifecycle',
        config: {
          rules: [
            {
              action: {
                actionType: 'Delete',
              },
              conditions: {
                age: 2,
                matchesPrefix: [],
              },
            },
            {
              action: {
                actionType: 'OtherAction',
              },
            },
          ],
        },
      },
      secondDeleteSetting,
      otherSetting, // The implementation puts other settings at the end
    ]);
  });

  it('removes the first delete rule in the first bucket lifecycle setting', async () => {
    // Act
    const otherSetting: WorkspaceSetting = {
      settingType: 'OtherSetting',
    };
    const firstDeleteSetting: BucketLifecycleSetting = {
      settingType: 'GcpBucketLifecycle',
      config: {
        rules: [
          {
            action: {
              actionType: 'OtherAction',
            },
          },
          {
            action: {
              actionType: 'Delete',
            },
            conditions: {
              age: 1,
              matchesPrefix: [],
            },
          },
        ],
      },
    };
    const secondDeleteSetting: BucketLifecycleSetting = {
      settingType: 'GcpBucketLifecycle',
      config: {
        rules: [
          {
            action: {
              actionType: 'Delete',
            },
            conditions: {
              age: 0,
              matchesPrefix: [],
            },
          },
        ],
      },
    };
    const result = removeFirstBucketDeletionRule([otherSetting, firstDeleteSetting, secondDeleteSetting]);

    // Assert
    expect(result).toEqual([
      {
        settingType: 'GcpBucketLifecycle',
        config: {
          rules: [
            {
              action: {
                actionType: 'OtherAction',
              },
            },
          ],
        },
      },
      secondDeleteSetting,
      otherSetting, // The implementation puts other settings at the end
    ]);
  });
});

describe('modifyFirstBucketDeletionRule', () => {
  it('adds a new setting to an empty array', async () => {
    // Arrange
    const newSetting: BucketLifecycleSetting = {
      settingType: 'GcpBucketLifecycle',
      config: {
        rules: [
          {
            action: {
              actionType: 'Delete',
            },
            conditions: {
              age: 1,
              matchesPrefix: [],
            },
          },
        ],
      },
    };
    // Act
    const result = modifyFirstBucketDeletionRule([], 1, []);

    // Assert
    expect(result).toEqual([newSetting]);
  });

  it('adds a new setting in the case of no existing delete bucket lifecycle', async () => {
    // Arrange
    const originalSettings = [
      {
        settingType: 'OtherSetting',
      },
      {
        settingType: 'GcpBucketLifecycle',
        config: {
          rules: [
            {
              action: {
                actionType: 'OtherAction',
              },
            },
          ],
        },
      },
      {
        settingType: 'GcpBucketLifecycle',
        config: {
          rules: [
            {
              action: {
                actionType: 'SecondOtherAction',
              },
            },
          ],
        },
      },
    ];

    // Act
    const result = modifyFirstBucketDeletionRule(originalSettings, 1, ['a/', 'b/']);

    // Assert
    expect(result).toEqual([
      {
        settingType: 'GcpBucketLifecycle',
        config: {
          rules: [
            {
              action: {
                actionType: 'Delete',
              },
              conditions: {
                age: 1,
                matchesPrefix: ['a/', 'b/'],
              },
            },
            {
              action: {
                actionType: 'OtherAction',
              },
            },
          ],
        },
      },
      {
        settingType: 'GcpBucketLifecycle',
        config: {
          rules: [
            {
              action: {
                actionType: 'SecondOtherAction',
              },
            },
          ],
        },
      },
      {
        settingType: 'OtherSetting', // Algorithm concats other settings at the end
      },
    ]);
  });

  it('modifies the first delete rule found', async () => {
    // Arrange
    const originalSettings = [
      {
        settingType: 'OtherSetting',
      },
      {
        settingType: 'GcpBucketLifecycle',
        config: {
          rules: [
            {
              action: {
                actionType: 'Delete',
              },
              conditions: {
                age: 0,
                matchesPrefix: [],
              },
            },
            {
              action: {
                actionType: 'Delete',
              },
              conditions: {
                age: 1,
                matchesPrefix: ['a/', 'b/'],
              },
            },
            {
              action: {
                actionType: 'OtherAction',
              },
            },
          ],
        },
      },
      {
        settingType: 'GcpBucketLifecycle',
        config: {
          rules: [
            {
              action: {
                actionType: 'Delete',
              },
              conditions: {
                age: 0,
                matchesPrefix: [],
              },
            },
          ],
        },
      },
    ];

    // Act
    const result = modifyFirstBucketDeletionRule(originalSettings, 365, ['submissions/']);

    // Assert
    expect(result).toEqual([
      {
        settingType: 'GcpBucketLifecycle',
        config: {
          rules: [
            {
              action: {
                actionType: 'Delete',
              },
              conditions: {
                age: 365,
                matchesPrefix: ['submissions/'],
              },
            },
            {
              action: {
                actionType: 'Delete',
              },
              conditions: {
                age: 1,
                matchesPrefix: ['a/', 'b/'],
              },
            },
            {
              action: {
                actionType: 'OtherAction',
              },
            },
          ],
        },
      },
      {
        settingType: 'GcpBucketLifecycle',
        config: {
          rules: [
            {
              action: {
                actionType: 'Delete',
              },
              conditions: {
                age: 0,
                matchesPrefix: [],
              },
            },
          ],
        },
      },
      {
        settingType: 'OtherSetting', // Algorithm concats other settings at the end
      },
    ]);
  });
});
