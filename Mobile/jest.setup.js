const mockStorage = new Map();

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async (key) => mockStorage.get(key) ?? null),
    setItem: jest.fn(async (key, value) => {
      mockStorage.set(key, String(value));
    }),
    removeItem: jest.fn(async (key) => {
      mockStorage.delete(key);
    }),
    clear: jest.fn(async () => {
      mockStorage.clear();
    }),
  },
  getItem: jest.fn(async (key) => mockStorage.get(key) ?? null),
  setItem: jest.fn(async (key, value) => {
    mockStorage.set(key, String(value));
  }),
  removeItem: jest.fn(async (key) => {
    mockStorage.delete(key);
  }),
  clear: jest.fn(async () => {
    mockStorage.clear();
  }),
}));

jest.mock('react-native-safe-area-context', () =>
  jest.requireActual('react-native-safe-area-context/jest/mock').default,
);

jest.mock('@react-native-firebase/messaging', () => ({
  __esModule: true,
  default: () => ({
    getToken: jest.fn().mockResolvedValue('mock-fcm-token'),
    requestPermission: jest.fn().mockResolvedValue(1),
    subscribeToTopic: jest.fn().mockResolvedValue(undefined),
    unsubscribeFromTopic: jest.fn().mockResolvedValue(undefined),
    onMessage: jest.fn(() => jest.fn()),
    onTokenRefresh: jest.fn(() => jest.fn()),
    onNotificationOpenedApp: jest.fn(() => jest.fn()),
    getInitialNotification: jest.fn().mockResolvedValue(null),
    setBackgroundMessageHandler: jest.fn(),
  }),
  getMessaging: jest.fn(() => ({
    app: { name: '[DEFAULT]' },
  })),
  getToken: jest.fn().mockResolvedValue('mock-fcm-token'),
  requestPermission: jest.fn().mockResolvedValue(1),
  subscribeToTopic: jest.fn().mockResolvedValue(undefined),
  unsubscribeFromTopic: jest.fn().mockResolvedValue(undefined),
  onMessage: jest.fn(() => jest.fn()),
  onTokenRefresh: jest.fn(() => jest.fn()),
  onNotificationOpenedApp: jest.fn(() => jest.fn()),
  getInitialNotification: jest.fn().mockResolvedValue(null),
  setBackgroundMessageHandler: jest.fn(),
  AuthorizationStatus: {
    NOT_DETERMINED: -1,
    DENIED: 0,
    AUTHORIZED: 1,
    PROVISIONAL: 2,
  },
}));

jest.mock('@react-native-firebase/app', () => ({
  __esModule: true,
  default: {
    initializeApp: jest.fn(),
    app: jest.fn(),
    apps: [],
  },
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
  getApp: jest.fn(),
}));
