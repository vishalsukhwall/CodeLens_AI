import JSZip from 'jszip';
import { CodeFile, LanguageType } from '../types/legacy';

export function detectLanguage(fileName: string): LanguageType {
  const ext = fileName.toLowerCase().split('.').pop() || '';
  switch (ext) {
    case 'java':
      return 'java';
    case 'sql':
      return 'sql';
    case 'py':
      return 'python';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'cs':
      return 'csharp';
    default:
      return 'text';
  }
}

/**
 * Parses multi-file pasted code containing delimiters like:
 * === FILE: UserAuthSchema.sql ===
 * ...code...
 * === FILE: LoanInterestEngine.java ===
 * ...code...
 */
export function parsePastedFiles(rawInput: string): CodeFile[] {
  if (!rawInput.trim()) return [];

  const delimiterPattern = /(?:^|\n)(?:===|---|###)\s*(?:FILE:\s*)?([^\n\r=]+?)\s*(?:===|---|###)\s*(?:\r?\n|$)/gi;
  const matches = Array.from(rawInput.matchAll(delimiterPattern));

  if (matches.length === 0) {
    // Single file pasted without delimiter
    const lines = rawInput.split(/\r?\n/);
    return [
      {
        id: 'pasted-snippet-1',
        name: 'PastedLegacySource.txt',
        path: 'src/PastedLegacySource.txt',
        language: 'text',
        content: rawInput,
        lineCount: lines.length,
        sizeBytes: new Blob([rawInput]).size,
      },
    ];
  }

  const files: CodeFile[] = [];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const fileName = match[1].trim();
    const startIndex = (match.index ?? 0) + match[0].length;
    const endIndex = i + 1 < matches.length ? (matches[i + 1].index ?? rawInput.length) : rawInput.length;
    const content = rawInput.substring(startIndex, endIndex).trim();
    const lines = content.split(/\r?\n/);

    files.push({
      id: `pasted-${i + 1}-${fileName.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
      name: fileName,
      path: fileName.includes('/') || fileName.includes('\\') ? fileName : `src/${fileName}`,
      language: detectLanguage(fileName),
      content,
      lineCount: lines.length,
      sizeBytes: new Blob([content]).size,
    });
  }

  return files;
}

/**
 * Ingests a list of files from standard input or drag-and-drop,
 * unpacking any .zip archives using JSZip.
 */
export async function ingestUploadedFiles(files: FileList | File[]): Promise<CodeFile[]> {
  const resultFiles: CodeFile[] = [];
  const fileArray = Array.from(files);

  for (const file of fileArray) {
    const isZip = file.name.endsWith('.zip') || file.type.includes('zip');

    if (isZip) {
      try {
        const zip = new JSZip();
        const loadedZip = await zip.loadAsync(file);

        for (const [relativePath, zipEntry] of Object.entries(loadedZip.files)) {
          if (zipEntry.dir) continue;
          // Ignore binary, hidden or build artifacts
          if (
            relativePath.startsWith('__MACOSX') ||
            relativePath.includes('.git/') ||
            relativePath.endsWith('.class') ||
            relativePath.endsWith('.jar') ||
            relativePath.endsWith('.pyc') ||
            relativePath.endsWith('.DS_Store')
          ) {
            continue;
          }

          const content = await zipEntry.async('string');
          const fileName = relativePath.split('/').pop() || relativePath;
          const lines = content.split(/\r?\n/);

          resultFiles.push({
            id: `zip-${resultFiles.length + 1}-${fileName.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
            name: fileName,
            path: relativePath,
            language: detectLanguage(fileName),
            content,
            lineCount: lines.length,
            sizeBytes: new Blob([content]).size,
          });
        }
      } catch (err) {
        console.error('Failed to unpack zip file:', file.name, err);
      }
    } else {
      // Regular text/code file
      try {
        const content = await file.text();
        const lines = content.split(/\r?\n/);

        resultFiles.push({
          id: `upload-${resultFiles.length + 1}-${file.name.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
          name: file.name,
          path: (file as any).webkitRelativePath || file.name,
          language: detectLanguage(file.name),
          content,
          lineCount: lines.length,
          sizeBytes: file.size,
        });
      } catch (err) {
        console.error('Failed to read file:', file.name, err);
      }
    }
  }

  return resultFiles;
}
