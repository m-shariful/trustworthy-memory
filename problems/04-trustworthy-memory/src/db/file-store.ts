import { mkdir, readFile, rename, writeFile } from "node:fs/promises";

import path from "node:path";

export class JsonFileStore<T> {
  constructor(
    private readonly filePath: string,
    private readonly defaultValue: T,
  ) {}

  async read(): Promise<T> {
    try {
      const content = await readFile(this.filePath, "utf8");
      return JSON.parse(content) as T;
    } catch (error: unknown) {
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? (error as { code?: string }).code
          : undefined;

      if (code === "ENOENT") {
        await this.write(this.defaultValue);
        return this.defaultValue;
      }

      throw error;
    }
  }

  async write(value: T): Promise<void> {
    const directory = path.dirname(this.filePath);
    await mkdir(directory, { recursive: true });

    const temporaryPath = `${this.filePath}.tmp`;

    await writeFile(temporaryPath, JSON.stringify(value, null, 2), "utf8");

    await rename(temporaryPath, this.filePath);
  }
}
