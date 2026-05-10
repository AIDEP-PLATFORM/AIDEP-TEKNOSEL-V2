import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  set: async (key: string, value: string) => {
    await AsyncStorage.setItem(key, value);
  },
  getString: async (key: string): Promise<string | null> => {
    return AsyncStorage.getItem(key);
  },
  delete: async (key: string) => {
    await AsyncStorage.removeItem(key);
  },
};
