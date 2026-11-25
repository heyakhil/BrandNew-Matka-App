import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@royal_club_auth_token';

let memoryToken: string | null = null;

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function getWebStorage(): StorageLike | null {
  try {
    const scope = globalThis as unknown as { localStorage?: StorageLike };
    return scope.localStorage ?? null;
  } catch {
    return null;
  }
}

export async function getAuthToken(): Promise<string | null> {
  try {
    const webStorage = getWebStorage();
    if (webStorage) {
      const webToken = webStorage.getItem(TOKEN_KEY);
      if (webToken) {
        return webToken;
      }
    }
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    return token ?? memoryToken;
  } catch {
    return memoryToken;
  }
}

export async function setAuthToken(token: string): Promise<void> {
  memoryToken = token;
  try {
    const webStorage = getWebStorage();
    if (webStorage) {
      webStorage.setItem(TOKEN_KEY, token);
    }
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Fallback to in-memory cache
  }
}

export async function removeAuthToken(): Promise<void> {
  memoryToken = null;
  try {
    const webStorage = getWebStorage();
    if (webStorage) {
      webStorage.removeItem(TOKEN_KEY);
    }
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch {
    // Fallback to in-memory cache
  }
}
