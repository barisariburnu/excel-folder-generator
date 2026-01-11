import { NextRequest, NextResponse } from "next/server";
import { mkdir, rm, readdir, stat, unlink } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import ExcelJS from "exceljs";
import archiver from "archiver";

const UPLOAD_DIR = join(process.cwd(), "uploads");
const TEMP_DIR = join(process.cwd(), "temp-folders");
const MAX_FILE_AGE_MS = 60 * 60 * 1000;

async function cleanupOldFiles() {
  if (!existsSync(UPLOAD_DIR)) return;

  const files = await readdir(UPLOAD_DIR);

  for (const file of files) {
    const filePath = join(UPLOAD_DIR, file);
    try {
      const stats = await stat(filePath);
      const age = Date.now() - stats.mtimeMs;

      if (age > MAX_FILE_AGE_MS) {
        await unlink(filePath);
      }
    } catch (error) {
      console.error(`Error cleaning up file ${file}:`, error);
    }
  }
}

function toTitleCase(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

interface ColumnGroup {
  columns: string[];
  separator: string;
  groupNumber: number;
  customNameEnabled: boolean;
}

async function createFolders(basePath: string, structure: Map<string, any>) {
  for (const [folderName, subStructure] of structure.entries()) {
    const folderPath = join(basePath, folderName);
    await mkdir(folderPath, { recursive: true });

    if (subStructure instanceof Map && subStructure.size > 0) {
      await createFolders(folderPath, subStructure);
    }
  }
}

export async function POST(request: NextRequest) {
  await cleanupOldFiles();

  const body = await request.json();
  const { fileName, sheet, groups, groupMappings } = body;

  if (!fileName || !sheet || !groups || !Array.isArray(groups)) {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  if (groups.length === 0) {
    return NextResponse.json(
      { error: "En az bir grup gerekli" },
      { status: 400 }
    );
  }

  // Create temp directory
  if (existsSync(TEMP_DIR)) {
    await rm(TEMP_DIR, { recursive: true, force: true });
  }
  await mkdir(TEMP_DIR, { recursive: true });

  try {
    const filePath = join(UPLOAD_DIR, fileName);

    if (!existsSync(filePath)) {
      return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 404 });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.getWorksheet(sheet);

    if (!worksheet) {
      return NextResponse.json({ error: "Sayfa bulunamadı" }, { status: 404 });
    }

    // Get headers from first row
    const headerRow = worksheet.getRow(1);
    const headerMap = new Map<string, number>();
    headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      headerMap.set(String(cell.value).trim(), colNumber);
      headerMap.set(String(cell.value).trim().toLowerCase(), colNumber);
    });

    // Build folder structure based on column groups with mappings
    const folderStructure = new Map<string, any>();

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header row

      let currentLevel = folderStructure;

      groups.forEach((group: ColumnGroup, groupIndex: number) => {
        const columnValues: string[] = [];
        const groupMapping = groupMappings?.[groupIndex];

        // Get values from all columns in this group
        group.columns.forEach((columnName) => {
          const colIndex =
            headerMap.get(columnName) ||
            headerMap.get(columnName.toLowerCase());
          if (colIndex) {
            const cell = row.getCell(colIndex);
            const rawValue = cell.value;

            if (
              rawValue !== undefined &&
              rawValue !== null &&
              rawValue !== ""
            ) {
              columnValues.push(String(rawValue).trim());
            }
          }
        });

        if (columnValues.length === 0) {
          return;
        }

        let folderName = columnValues.join(group.separator || "-");

        folderName = toTitleCase(folderName);

        if (group.customNameEnabled && groupMapping?.columnFolderNames) {
          const customParts: string[] = [];

          group.columns.forEach((columnName, colIdx) => {
            const originalValue = columnValues[colIdx];
            const mappedValue =
              groupMapping.columnFolderNames[columnName]?.[originalValue];

            if (mappedValue) {
              customParts.push(toTitleCase(mappedValue));
            } else {
              customParts.push(toTitleCase(originalValue));
            }
          });

          folderName = customParts.join(group.separator || "-");
        }

        if (!currentLevel.has(folderName)) {
          currentLevel.set(folderName, new Map());
        }

        // Move to next level for nesting (unless this is the last group)
        if (groupIndex < groups.length - 1) {
          currentLevel = currentLevel.get(folderName);
        }
      });
    });

    await createFolders(TEMP_DIR, folderStructure);

    return new Promise<NextResponse>((resolve, reject) => {
      const chunks: Buffer[] = [];
      const archive = archiver("zip", {
        zlib: { level: 9 },
      });

      archive.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
      });

      archive.on("end", () => {
        const zipBuffer = Buffer.concat(chunks);
        const response = new NextResponse(zipBuffer, {
          status: 200,
          headers: {
            "Content-Type": "application/zip",
            "Content-Disposition": 'attachment; filename="folders.zip"',
            "Content-Length": zipBuffer.length.toString(),
          },
        });

        // Cleanup temp directory
        rm(TEMP_DIR, { recursive: true, force: true }).catch(console.error);

        resolve(response);
      });

      archive.on("error", (err: Error) => {
        rm(TEMP_DIR, { recursive: true, force: true }).catch(console.error);
        resolve(
          NextResponse.json(
            { error: "ZIP oluşturulurken hata oluştu" },
            { status: 500 }
          )
        );
      });

      // Add directory to archive
      archive.directory(TEMP_DIR, false);
      archive.finalize();
    });
  } catch (error) {
    // Cleanup temp directory
    if (existsSync(TEMP_DIR)) {
      rm(TEMP_DIR, { recursive: true, force: true }).catch(console.error);
    }

    return NextResponse.json(
      { error: "Dosya oluşturulurken bir hata oluştu" },
      { status: 500 }
    );
  }
}
