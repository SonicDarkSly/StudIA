export interface FolderEntry {
  name: string;
  path: string;
  markers: string[];
}

export interface FolderListing {
  path: string;
  parent?: string;
  home: string;
  entries: FolderEntry[];
}

export interface FolderBrowser {
  browse(path?: string): FolderListing;
}

export const FOLDER_BROWSER = Symbol('FOLDER_BROWSER');
