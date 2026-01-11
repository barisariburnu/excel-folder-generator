import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import ExcelJS from "exceljs";

const UPLOAD_DIR = join(process.cwd(), "uploads");
const MAX_FILE_AGE_MS = 60 * 60 * 1000;

async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

async function cleanupOldFiles() {
  if (!existsSync(UPLOAD_DIR)) return;

  const { readdir, stat, unlink } = require("fs/promises");
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

function validateExcelFile(file: File): boolean {
  const fileName = file.name.toLowerCase();
  return fileName.endsWith(".xlsx") || fileName.endsWith(".xls");
}

export async function POST(request: NextRequest) {
  await ensureUploadDir();
  await cleanupOldFiles();

  const contentType = request.headers.get("content-type");
  const searchParams = request.nextUrl.searchParams;
  const sheet = searchParams.get("sheet");

  try {
    if (contentType?.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File;

      if (!file) {
        return NextResponse.json({ error: "Dosya gerekli" }, { status: 400 });
      }

      if (!validateExcelFile(file)) {
        return NextResponse.json(
          { error: "Sadece .xlsx ve .xls dosyaları yüklenebilir" },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filePath = join(UPLOAD_DIR, file.name);
      await writeFile(filePath, buffer);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      const sheets = workbook.worksheets.map((ws) => ws.name);

      return NextResponse.json({
        success: true,
        fileName: file.name,
        sheets,
      });
    } else if (contentType?.includes("application/json")) {
      // Get columns or values based on request body
      const body = await request.json();
      const sheetFromBody = sheet || body.sheet;

      if (sheetFromBody && body.groups && Array.isArray(body.groups)) {
        // Get unique values grouped by group
        const filePath = join(UPLOAD_DIR, body.fileName);
        const groups = body.groups as {
          columns: string[];
          separator: string;
        }[];

        if (!existsSync(filePath)) {
          return NextResponse.json(
            { error: "Dosya bulunamadı" },
            { status: 404 }
          );
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        const worksheet = workbook.getWorksheet(sheetFromBody);

        if (!worksheet) {
          return NextResponse.json(
            { error: "Sayfa bulunamadı" },
            { status: 404 }
          );
        }

        const headerRow = worksheet.getRow(1);
        const headerMap = new Map<string, number>();
        headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
          headerMap.set(String(cell.value).trim(), colNumber);
          headerMap.set(String(cell.value).trim().toLowerCase(), colNumber);
        });

        const groupValues: {
          combinedValues: string[];
          columnValues: { [columnName: string]: string[] };
          columnFolderNames: {
            [columnName: string]: { [excelValue: string]: string };
          };
        }[] = [];

        groups.forEach((group, groupIndex) => {
          const columnIndexMap = new Map<string, number>();
          const columnValues: { [columnName: string]: string[] } = {};
          const combinedSet = new Set<string>();

          group.columns.forEach((columnName) => {
            const colIndex =
              headerMap.get(columnName) ||
              headerMap.get(columnName.toLowerCase());
            if (colIndex !== undefined) {
              columnIndexMap.set(columnName, colIndex);
              columnValues[columnName] = [];
            }
          });

          worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;

            const groupValuesArray: string[] = [];

            group.columns.forEach((columnName) => {
              const colIndex = columnIndexMap.get(columnName);
              if (colIndex !== undefined) {
                const cell = row.getCell(colIndex);
                const value = cell.value;

                if (value !== undefined && value !== null && value !== "") {
                  const strValue = String(value).trim();

                  groupValuesArray.push(strValue);

                  if (!columnValues[columnName].includes(strValue)) {
                    columnValues[columnName].push(strValue);
                  }
                }
              }
            });

            if (groupValuesArray.length > 0) {
              const combined = groupValuesArray.join(group.separator || "-");
              combinedSet.add(combined);
            }
          });

          Object.keys(columnValues).forEach((colName) => {
            columnValues[colName].sort();
          });

          const combinedValues = Array.from(combinedSet).sort();

          groupValues.push({
            combinedValues,
            columnValues,
            columnFolderNames: {},
          });
        });

        return NextResponse.json({
          success: true,
          groupValues,
        });
      } else if (sheetFromBody && body.columns && Array.isArray(body.columns)) {
        const filePath = join(UPLOAD_DIR, body.fileName);
        const columns = body.columns as string[];

        if (!existsSync(filePath)) {
          return NextResponse.json(
            { error: "Dosya bulunamadı" },
            { status: 404 }
          );
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        const worksheet = workbook.getWorksheet(sheetFromBody);

        if (!worksheet) {
          return NextResponse.json(
            { error: "Sayfa bulunamadı" },
            { status: 404 }
          );
        }

        const headerRow = worksheet.getRow(1);
        const headerMap = new Map<number, string>();
        headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
          headerMap.set(colNumber, String(cell.value).trim());
        });

        const columnIndices: number[] = [];
        const missingColumns: string[] = [];

        columns.forEach((colName) => {
          let found = false;
          headerMap.forEach((name, index) => {
            if (name === colName) {
              columnIndices.push(index);
              found = true;
            }
          });
          if (!found) {
            missingColumns.push(colName);
          }
        });

        if (missingColumns.length > 0) {
          return NextResponse.json(
            { error: `Kolonlar bulunamadı: ${missingColumns.join(", ")}` },
            { status: 400 }
          );
        }

        const values: string[][] = columnIndices.map(() => []);

        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return;

          columnIndices.forEach((colIndex, arrayIndex) => {
            const cell = row.getCell(colIndex);
            const value = cell.value;

            if (value !== undefined && value !== null && value !== "") {
              const strValue = String(value).trim();
              if (!values[arrayIndex].includes(strValue)) {
                values[arrayIndex].push(strValue);
              }
            }
          });
        });

        values.forEach((arr) => arr.sort());

        return NextResponse.json({
          success: true,
          values,
        });
      } else if (sheetFromBody && !body.columns && !body.groups) {
        const filePath = join(UPLOAD_DIR, body.fileName || body.file);

        if (!existsSync(filePath)) {
          return NextResponse.json(
            { error: "Dosya bulunamadı" },
            { status: 404 }
          );
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        const worksheet = workbook.getWorksheet(sheetFromBody);

        if (!worksheet) {
          return NextResponse.json(
            { error: "Sayfa bulunamadı" },
            { status: 404 }
          );
        }

        const row = worksheet.getRow(1);
        const headers: string[] = [];
        row.eachCell({ includeEmpty: false }, (cell) => {
          if (cell.value) {
            headers.push(String(cell.value).trim());
          }
        });

        const columns = headers.filter((h) => h && h.trim() !== "");

        return NextResponse.json({
          success: true,
          columns,
        });
      }
    }

    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Dosya işlenirken bir hata oluştu", details: error?.message },
      { status: 500 }
    );
  }
}
