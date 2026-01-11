"use client";

import { useState, useRef } from "react";
import {
  Upload,
  FileSpreadsheet,
  FolderTree,
  Download,
  ChevronRight,
  ArrowLeft,
  Trash2,
  Plus,
  Minus,
  Sun,
  Moon,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";

type Sheet = string;
type Column = string;

interface ColumnGroup {
  columns: string[];
  separator: string;
  groupNumber: number;
  customNameEnabled: boolean;
}

interface ColumnSelection {
  groups: ColumnGroup[];
  groupMappings: {
    combinedValues: string[];
    columnValues: { [columnName: string]: string[] };
    columnFolderNames: {
      [columnName: string]: { [excelValue: string]: string };
    };
  }[];
}

type Step = "upload" | "sheet" | "columns" | "values" | "download";

export default function FolderGenerator() {
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<Sheet>("");
  const [columns, setColumns] = useState<Column[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<ColumnSelection>({
    groups: [],
    groupMappings: [],
  });
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Excel dosyasını yükleyip işleyen fonksiyon
  const handleFileUpload = async (uploadedFile: File) => {
    if (
      !uploadedFile.name.endsWith(".xlsx") &&
      !uploadedFile.name.endsWith(".xls")
    ) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("invalidFileToast"),
      });
      return;
    }

    setFile(uploadedFile);
    setLoading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", uploadedFile);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      const response = await fetch("/api/folder-generator/parse", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) throw new Error("Dosya işlenemedi");

      const data = await response.json();
      setSheets(data.sheets);
      setStep("sheet");
      toast({
        title: t("success"),
        description: t("pagesFoundToast", { count: data.sheets.length }),
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("uploadErrorToast"),
      });
    } finally {
      setLoading(false);
    }
  };

  // Seçilen sheet'teki kolonları getiren fonksiyon
  const handleSheetSelect = async (sheet: Sheet) => {
    setSelectedSheet(sheet);
    setLoading(true);

    try {
      const response = await fetch(
        `/api/folder-generator/parse?sheet=${encodeURIComponent(sheet)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: file?.name }),
        }
      );

      if (!response.ok) throw new Error("Sayfa işlenemedi");

      const data = await response.json();
      setColumns(data.columns);
      setSelectedColumns({ groups: [], groupMappings: [] });
      setStep("columns");
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("sheetProcessingErrorToast"),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddColumnToGroup = (groupIndex: number, column: Column) => {
    // Check if group exists
    if (groupIndex < 0 || groupIndex >= selectedColumns.groups.length) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("createGroupFirstToast"),
      });
      return;
    }

    setSelectedColumns((prev) => {
      const newGroups = [...prev.groups];
      newGroups[groupIndex] = {
        ...newGroups[groupIndex],
        columns: [...newGroups[groupIndex].columns, column],
      };
      return { ...prev, groups: newGroups };
    });
    setColumns((prev) => prev.filter((c) => c !== column));
  };

  // Gruptan kolon çıkaran fonksiyon
  const handleRemoveColumnFromGroup = (groupIndex: number, column: Column) => {
    setSelectedColumns((prev) => {
      const newGroups = [...prev.groups];
      newGroups[groupIndex] = {
        ...newGroups[groupIndex],
        columns: newGroups[groupIndex].columns.filter((c) => c !== column),
      };
      return { ...prev, groups: newGroups };
    });
    setColumns((prev) => [...prev, column].sort());
  };

  // Yeni kolon grubu ekleyen fonksiyon
  const handleAddGroup = () => {
    setSelectedColumns((prev) => ({
      ...prev,
      groups: [
        ...prev.groups,
        {
          columns: [],
          separator: "-",
          groupNumber: prev.groups.length + 1,
          customNameEnabled: false,
        },
      ],
    }));
  };

  // Kolon grubunu silen fonksiyon
  const handleRemoveGroup = (groupIndex: number) => {
    const group = selectedColumns.groups[groupIndex];
    setSelectedColumns((prev) => ({
      ...prev,
      groups: prev.groups.filter((_, i) => i !== groupIndex),
    }));
    setColumns((prev) => [...prev, ...group.columns].sort());
  };

  // Grup ayırıcı karakterini değiştiren fonksiyon
  const handleSeparatorChange = (groupIndex: number, separator: string) => {
    setSelectedColumns((prev) => {
      const newGroups = [...prev.groups];
      newGroups[groupIndex] = {
        ...newGroups[groupIndex],
        separator,
      };
      return { ...prev, groups: newGroups };
    });
  };

  // Özel klasör adı özelliğini açıp kapatan fonksiyon
  const handleCustomNameToggle = (groupIndex: number, enabled: boolean) => {
    setSelectedColumns((prev) => {
      const newGroups = [...prev.groups];
      newGroups[groupIndex] = {
        ...newGroups[groupIndex],
        customNameEnabled: enabled,
      };
      return { ...prev, groups: newGroups };
    });
  };

  // Grup sırasını değiştiren fonksiyon
  const handleMoveGroup = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index > 0) {
      setSelectedColumns((prev) => {
        const newGroups = [...prev.groups];
        [newGroups[index - 1], newGroups[index]] = [
          newGroups[index],
          newGroups[index - 1],
        ];
        return { ...prev, groups: newGroups };
      });
    } else if (
      direction === "down" &&
      index < selectedColumns.groups.length - 1
    ) {
      setSelectedColumns((prev) => {
        const newGroups = [...prev.groups];
        [newGroups[index], newGroups[index + 1]] = [
          newGroups[index + 1],
          newGroups[index],
        ];
        return { ...prev, groups: newGroups };
      });
    }
  };

  // Değerleri düzenleme adımına geçen fonksiyon
  const handleValuesStep = async () => {
    if (selectedColumns.groups.length === 0) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("atLeastOneGroupToast"),
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/folder-generator/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file?.name,
          sheet: selectedSheet,
          groups: selectedColumns.groups,
        }),
      });

      if (!response.ok) throw new Error("Değerler alınamadı");

      const data = await response.json();

      setSelectedColumns((prev) => ({
        ...prev,
        groupMappings: data.groupValues || [],
      }));

      setStep("values");
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("valuesFetchErrorToast"),
      });
    } finally {
      setLoading(false);
    }
  };

  // Klasör adı eşleştirmesini güncelleyen fonksiyon
  const handleMappingChange = (
    groupIndex: number,
    columnName: string | null,
    excelValue: string,
    folderName: string
  ) => {
    setSelectedColumns((prev) => {
      const newGroupMappings = [...prev.groupMappings];

      if (columnName) {
        // Update specific column mapping
        if (!newGroupMappings[groupIndex]) {
          newGroupMappings[groupIndex] = {
            combinedValues: [],
            columnValues: {},
            columnFolderNames: {},
          };
        }
        if (!newGroupMappings[groupIndex].columnFolderNames[columnName]) {
          newGroupMappings[groupIndex].columnFolderNames[columnName] = {};
        }
        newGroupMappings[groupIndex].columnFolderNames[columnName][excelValue] =
          folderName;
      } else {
        // Update combined value mapping
        const index = newGroupMappings[groupIndex]?.combinedValues?.findIndex(
          (v) => v === excelValue
        );
        if (index !== -1) {
          newGroupMappings[groupIndex].combinedValues[index] = folderName;
        }
      }

      return { ...prev, groupMappings: newGroupMappings };
    });
  };

  // ZIP dosyası oluşturan fonksiyon
  const handleGenerateZip = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/folder-generator/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file?.name,
          sheet: selectedSheet,
          groups: selectedColumns.groups,
          groupMappings: selectedColumns.groupMappings,
        }),
      });

      if (!response.ok) throw new Error("ZIP oluşturulamadı");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "folders.zip";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: t("success"),
        description: t("zipDownloadedToast"),
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: t("zipCreationErrorToast"),
      });
    } finally {
      setLoading(false);
    }
  };

  // Tüm state'i sıfırlayan fonksiyon
  const handleReset = () => {
    setStep("upload");
    setFile(null);
    setSheets([]);
    setSelectedSheet("");
    setColumns([]);
    setSelectedColumns({ groups: [], groupMappings: [] });
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Dosya sürükle-bırak olayı
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileUpload(droppedFile);
    }
  };

  // Sürükleme sırasında çağrılan fonksiyon
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  // Sürükleme alanından çıkışta çağrılan fonksiyon
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/20">
      <header className="border-b bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <FolderTree className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold">{t("appTitle")}</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              title={theme === "light" ? t("darkMode") : t("lightMode")}
            >
              {theme === "light" ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setLanguage(language === "tr" ? "en" : "tr")}
              title={
                language === "tr" ? t("switchToEnglish") : t("switchToTurkish")
              }
            >
              <Globe className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              {t("appDescription")}
            </h2>
          </div>

          {step === "upload" && (
            <Card className="border-2 border-dashed">
              <CardContent className="p-12">
                <div
                  className={`flex flex-col items-center justify-center text-center space-y-6 transition-colors ${
                    isDragging ? "bg-primary/5" : ""
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <div
                    className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${
                      isDragging ? "bg-primary/20" : "bg-muted"
                    } transition-colors`}
                  >
                    <Upload
                      className={`w-12 h-12 ${
                        isDragging ? "text-primary" : "text-muted-foreground"
                      }`}
                    />
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold mb-2">
                      {t("uploadFile")}
                    </h2>
                    <p className="text-muted-foreground">{t("dragDrop")}</p>
                  </div>

                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => {
                      const selectedFile = e.target.files?.[0];
                      if (selectedFile) {
                        handleFileUpload(selectedFile);
                      }
                    }}
                    className="max-w-md hidden"
                    id="file-upload"
                  />

                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    size="lg"
                    className="w-full max-w-md"
                  >
                    {loading ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        {t("processing")}
                      </>
                    ) : (
                      <>
                        <FileSpreadsheet className="mr-2 w-5 h-5" />
                        {t("selectColumns")}
                      </>
                    )}
                  </Button>

                  {loading && uploadProgress > 0 && (
                    <div className="w-full max-w-md space-y-2">
                      <Progress value={uploadProgress} />
                      <p className="text-sm text-muted-foreground">
                        {uploadProgress}%
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {step === "sheet" && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setStep("upload")}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <div>
                    <CardTitle>{t("selectSheet")}</CardTitle>
                    <CardDescription>
                      {file?.name} - {sheets.length} {t("pagesFound")}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {sheets.map((sheet) => (
                    <Button
                      key={sheet}
                      variant="outline"
                      className="h-auto p-4 justify-start text-left hover:border-primary"
                      onClick={() => !loading && handleSheetSelect(sheet)}
                      disabled={loading}
                    >
                      <FileSpreadsheet className="mr-3 w-5 h-5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{sheet}</div>
                      </div>
                      <ChevronRight className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {step === "columns" && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setStep("sheet")}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <div>
                    <CardTitle>{t("groupColumns")}</CardTitle>
                    <CardDescription>
                      {t("groupColumnsDescription")}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedColumns.groups.length > 0 && (
                  <Card className="bg-muted/50">
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        {selectedColumns.groups.map((group, groupIndex) => (
                          <div
                            key={groupIndex}
                            className="border rounded-lg p-4 bg-background space-y-3"
                          >
                            <div className="flex items-center gap-3">
                              <Badge
                                variant="outline"
                                className="flex-shrink-0"
                              >
                                {t("level")} {groupIndex + 1}
                              </Badge>
                              <span className="text-sm text-muted-foreground flex-1">
                                {group.columns.length} {t("columns")}
                              </span>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() =>
                                    handleMoveGroup(groupIndex, "up")
                                  }
                                  disabled={groupIndex === 0}
                                  title={t("moveUp")}
                                >
                                  <ArrowLeft className="w-3 h-3 rotate-90" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() =>
                                    handleMoveGroup(groupIndex, "down")
                                  }
                                  disabled={
                                    groupIndex ===
                                    selectedColumns.groups.length - 1
                                  }
                                  title={t("moveDown")}
                                >
                                  <ArrowLeft className="w-3 h-3 -rotate-90" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive"
                                  onClick={() => handleRemoveGroup(groupIndex)}
                                  title={t("deleteGroup")}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <label className="text-sm font-medium whitespace-nowrap">
                                {t("separator")}:
                              </label>
                              <Input
                                value={group.separator}
                                onChange={(e) =>
                                  handleSeparatorChange(
                                    groupIndex,
                                    e.target.value
                                  )
                                }
                                className="flex-1 h-8 text-center"
                                placeholder="-"
                                maxLength={5}
                              />
                            </div>

                            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Switch
                                  id={`custom-name-${groupIndex}`}
                                  checked={group.customNameEnabled}
                                  onCheckedChange={(checked) =>
                                    handleCustomNameToggle(groupIndex, checked)
                                  }
                                />
                                <label
                                  htmlFor={`custom-name-${groupIndex}`}
                                  className="text-sm font-medium cursor-pointer"
                                >
                                  {t("customizeFolders")}
                                </label>
                              </div>
                              {group.customNameEnabled && (
                                <Badge variant="default" className="text-xs">
                                  {t("enabled")}
                                </Badge>
                              )}
                            </div>

                            {group.columns.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {group.columns.map((col) => (
                                  <Badge
                                    key={col}
                                    variant="secondary"
                                    className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                                    onClick={() =>
                                      handleRemoveColumnFromGroup(
                                        groupIndex,
                                        col
                                      )
                                    }
                                    title="Kaldır"
                                  >
                                    {col}
                                    <Minus className="w-3 h-3 ml-1" />
                                  </Badge>
                                ))}
                              </div>
                            )}

                            {group.columns.length === 0 && (
                              <p className="text-sm text-muted-foreground italic">
                                Bu gruba kolon eklemek için aşağıdaki listeden
                                seçin
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-medium text-muted-foreground">
                      {columns.length} kolon mevcut
                    </div>
                    <Button
                      onClick={handleAddGroup}
                      size="sm"
                      variant="outline"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      {t("addNewGroup")}
                    </Button>
                  </div>

                  {columns.length > 0 ? (
                    selectedColumns.groups.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {columns.map((col) => (
                          <Badge
                            key={col}
                            variant="outline"
                            className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                            onClick={() =>
                              handleAddColumnToGroup(
                                selectedColumns.groups.length - 1,
                                col
                              )
                            }
                            title={t("addToLastGroup")}
                          >
                            {col}
                            <Plus className="w-3 h-3 ml-1" />
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {t("createGroupFirst")}
                      </p>
                    )
                  ) : selectedColumns.groups.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      {t("noGroupsYet")}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {t("allColumnsAdded")}
                    </p>
                  )}
                </div>

                <Button
                  onClick={handleValuesStep}
                  disabled={selectedColumns.groups.length === 0 || loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    t("loading")
                  ) : (
                    <>
                      {t("continue")}
                      <ChevronRight className="ml-2 w-4 h-4" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {step === "values" && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setStep("columns")}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <div>
                    <CardTitle>{t("editValues")}</CardTitle>
                    <CardDescription>{t("onlyCustomizable")}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {selectedColumns.groupMappings.map(
                    (groupMapping, groupIndex) => {
                      const group = selectedColumns.groups[groupIndex];
                      if (!group) return null;

                      if (!group.customNameEnabled) return null;

                      return (
                        <Card key={groupIndex} className="bg-muted/50">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-4">
                              <Badge
                                variant="default"
                                className="flex-shrink-0"
                              >
                                Seviye {groupIndex + 1}
                              </Badge>
                              <h3 className="text-lg font-semibold">
                                {group.columns.length === 1
                                  ? group.columns[0]
                                  : `${group.columns.join(" + ")} (${
                                      group.separator || "-"
                                    })`}
                              </h3>
                            </div>

                            <div className="space-y-3 max-h-96 overflow-y-auto">
                              {group.columns.length === 1 ? (
                                // Single column - show individual values
                                <>
                                  {groupMapping.columnValues?.[
                                    group.columns[0]
                                  ]?.map((value, index) => (
                                    <div
                                      key={index}
                                      className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-background rounded-lg border"
                                    >
                                      <div>
                                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                                          {t("excelValue")} ({group.columns[0]})
                                        </label>
                                        <div className="p-2 bg-muted rounded-md text-sm font-medium">
                                          {value}
                                        </div>
                                      </div>
                                      <div>
                                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                                          {t("folderName")}
                                        </label>
                                        <Input
                                          value={
                                            groupMapping.columnFolderNames?.[
                                              group.columns[0]
                                            ]?.[value] || ""
                                          }
                                          onChange={(e) =>
                                            handleMappingChange(
                                              groupIndex,
                                              group.columns[0],
                                              value,
                                              e.target.value
                                            )
                                          }
                                          placeholder="Klasör adı girin"
                                          className="font-medium"
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </>
                              ) : (
                                // Multiple columns - split values and show individual edit fields for each part
                                <>
                                  {Object.entries(
                                    groupMapping.columnValues || {}
                                  ).map(([columnName, values]) => {
                                    if (!values || values.length === 0)
                                      return null;

                                    return (
                                      <div key={columnName} className="mb-4">
                                        <div className="flex items-center gap-2 mb-2">
                                          <Badge
                                            variant="secondary"
                                            className="font-medium"
                                          >
                                            {columnName}
                                          </Badge>
                                        </div>
                                        {values.map((value, valueIndex) => (
                                          <div
                                            key={`${columnName}-${valueIndex}`}
                                            className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-background rounded-lg border"
                                          >
                                            <div>
                                              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                                                {t("excelValue")} ({columnName})
                                              </label>
                                              <div className="p-2 bg-muted rounded-md text-sm font-medium">
                                                {value}
                                              </div>
                                            </div>
                                            <div>
                                              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                                                {t("folderName")}
                                              </label>
                                              <Input
                                                value={
                                                  groupMapping
                                                    .columnFolderNames?.[
                                                    columnName
                                                  ]?.[value] || ""
                                                }
                                                onChange={(e) =>
                                                  handleMappingChange(
                                                    groupIndex,
                                                    columnName,
                                                    value,
                                                    e.target.value
                                                  )
                                                }
                                                placeholder="Klasör adı girin"
                                                className="font-medium"
                                              />
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    );
                                  })}
                                </>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    }
                  )}

                  <div className="flex gap-3">
                    <Button
                      onClick={handleReset}
                      variant="outline"
                      className="flex-1"
                      disabled={loading}
                    >
                      <Trash2 className="mr-2 w-4 h-4" />
                      {t("reset")}
                    </Button>
                    <Button
                      onClick={handleGenerateZip}
                      disabled={loading}
                      className="flex-1"
                      size="lg"
                    >
                      {loading ? (
                        t("creating")
                      ) : (
                        <>
                          <Download className="mr-2 w-4 h-4" />
                          {t("downloadZip")}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <footer className="mt-auto border-t bg-muted/50">
        <div className="p-4 text-center text-sm text-muted-foreground">
          {t("appTitle")} - {t("poweredBy")}
        </div>
      </footer>
    </div>
  );
}
