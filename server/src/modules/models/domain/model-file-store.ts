export interface ModelFileStore {
  remove(path: string): Promise<void>;
}

export const MODEL_FILE_STORE = Symbol('MODEL_FILE_STORE');
