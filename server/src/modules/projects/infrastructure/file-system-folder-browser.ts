import { Injectable } from '@nestjs/common';
import { existsSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, isAbsolute, join } from 'node:path';
import type { FolderBrowser, FolderEntry, FolderListing } from '../domain/folder-browser.js';
import { InvalidProjectFolderError, PROJECT_MARKERS } from '../domain/project.js';

const MAX_FOLDER_ENTRIES = 400;
const HIDDEN = new Set(['node_modules', 'Library', 'AppData', '$RECYCLE.BIN', 'System Volume Information']);

@Injectable()
export class FileSystemFolderBrowser implements FolderBrowser {
  browse(raw?: string): FolderListing {
    const home = homedir();
    const input = raw?.trim() || home;
    if (!isAbsolute(input)) throw new InvalidProjectFolderError('Chemin complet attendu.');
    let path: string;
    try {
      path = realpathSync(input);
      if (!statSync(path).isDirectory()) throw new Error();
    } catch {
      throw new InvalidProjectFolderError(`Dossier introuvable : ${input}`);
    }
    let names: string[];
    try {
      names = readdirSync(path);
    } catch {
      throw new InvalidProjectFolderError(`Dossier illisible : ${path}`);
    }
    const entries: FolderEntry[] = [];
    for (const name of names.sort((a, b) => a.localeCompare(b))) {
      if (name.startsWith('.') || HIDDEN.has(name)) continue;
      const full = join(path, name);
      try {
        if (!statSync(full).isDirectory()) continue;
      } catch {
        continue;
      }
      entries.push({ name, path: full, markers: PROJECT_MARKERS.filter((m) => existsSync(join(full, m))) });
      if (entries.length >= MAX_FOLDER_ENTRIES) break;
    }
    const parent = dirname(path);
    return { path, parent: parent === path ? undefined : parent, home, entries };
  }
}
