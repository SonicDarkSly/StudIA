import { Inject } from '@nestjs/common';
import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import { FOLDER_BROWSER, type FolderBrowser, type FolderListing } from '../../domain/folder-browser.js';

export class BrowseFoldersQuery {
  constructor(readonly path?: string) {}
}

@QueryHandler(BrowseFoldersQuery)
export class BrowseFoldersHandler implements IQueryHandler<BrowseFoldersQuery, FolderListing> {
  constructor(@Inject(FOLDER_BROWSER) private readonly browser: FolderBrowser) {}

  async execute({ path }: BrowseFoldersQuery): Promise<FolderListing> {
    return this.browser.browse(path);
  }
}
