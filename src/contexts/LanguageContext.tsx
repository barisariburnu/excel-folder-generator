"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "tr" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

const translations: Record<Language, Record<string, string>> = {
  tr: {
    appTitle: "Excel'den Klasör Oluşturucu",
    appDescription:
      "Excel dosyasından klasör yapısı oluşturup ZIP olarak indirin",
    uploadFile: "Excel Dosyası Yükle",
    dragDrop: "Dosyayı buraya sürükleyin veya tıklayın",
    selectSheet: "Sayfa Seç",
    selectColumns: "Kolonları Seç",
    columnHierarchy: "Kolon Hiyerarşisi",
    viewValues: "Değerleri Görüntüle",
    editValues: "Değerleri Düzenleyin",
    customizeFolders: "Klasör adlarını özelleştir",
    reset: "Sıfırla",
    downloadZip: "ZIP İndir",
    onlyCustomizable:
      'Sadece "Klasör adlarını özelleştir" seçeneği etkinleştirilmiş grupları düzenleyin',
    level: "Seviye",
    fileName: "Dosya Adı",
    uploadSuccess: "Dosya başarıyla yüklendi",
    uploadError: "Dosya yüklenirken hata oluştu",
    fileRequired: "Dosya gerekli",
    sheetRequired: "Sayfa gerekli",
    invalidFile: "Sadece .xlsx ve .xls dosyaları yüklenebilir",
    columnsRequired: "En az bir kolon gerekli",
    groupsRequired: "En az bir grup gerekli",
    folderGenerated: "Klasörler başarıyla oluşturuldu",
    folderError: "Klasörler oluşturulurken hata oluştu",
    processing: "İşleniyor...",
    column: "Kolon",
    addGroup: "Grup Ekle",
    removeGroup: "Grubu Kaldır",
    separator: "Ayırıcı",
    customizeFoldersTitle: "Klasör adlarını özelleştir",
    customizeFolderName: "Klasör adı özelleştirme seçeneği",
    groupColumns: "Kolonları Gruplayın",
    groupColumnsDescription:
      "Klasör hiyerarşisini oluşturacak kolon gruplarını burada oluşturun",
    moveUp: "Yukarı taşı",
    moveDown: "Aşağı taşı",
    addNewGroup: "Yeni Grup Ekle",
    createGroupFirst: "Önce bir grup oluşturun",
    noGroupsYet:
      'Henüz hiç grup oluşturulmadı. "Yeni Grup Ekle" butonuna tıklayarak başlayın.',
    columns: "kolon",
    deleteGroup: "Grubu sil",
    enabled: "Etkin",
    addToLastGroup: "Son gruba ekle",
    loading: "Yükleniyor...",
    continue: "Devam Et",
    allColumnsAdded: "Tüm kolonlar gruplara eklendi.",
    back: "Geri",
    excelValue: "Excel Değeri",
    folderName: "Klasör Adı",
    creating: "Oluşturuluyor...",
    darkMode: "Karanlık Mod",
    lightMode: "Aydınlık Mod",
    switchToEnglish: "İngilizce'ye geç",
    switchToTurkish: "Türkçe'ye geç",
    error: "Hata",
    success: "Başarılı",
    pagesFound: "{count} sayfa bulundu",
    fileProcessingError: "Dosya işlenirken bir hata oluştu",
    sheetProcessingError: "Sayfa işlenirken bir hata oluştu",
    atLeastOneGroup: "En az bir kolon grubu oluşturun",
    valuesFetchError: "Değerler alınırken bir hata oluştu",
    zipDownloaded: "ZIP dosyası indirildi",
    zipCreationError: "ZIP oluşturulurken bir hata oluştu",
    poweredBy: "@barisariburnu tarafından desteklenmektedir",
    invalidFileToast:
      "Lütfen geçerli bir Excel dosyası (.xlsx veya .xls) yükleyin",
    uploadSuccessToast: "Dosya başarıyla yüklendi",
    pagesFoundToast: "{count} sayfa bulundu",
    uploadErrorToast: "Dosya işlenirken bir hata oluştu",
    sheetProcessingErrorToast: "Sayfa işlenirken bir hata oluştu",
    createGroupFirstToast: "Önce bir grup oluşturun",
    atLeastOneGroupToast: "En az bir kolon grubu oluşturun",
    valuesFetchErrorToast: "Değerler alınırken bir hata oluştu",
    zipDownloadedToast: "ZIP dosyası indirildi",
    zipCreationErrorToast: "ZIP oluşturulurken bir hata oluştu",
  },
  en: {
    appTitle: "Excel to Folder Generator",
    appDescription:
      "Create folder structure from Excel file and download as ZIP",
    uploadFile: "Upload Excel File",
    dragDrop: "Drag and drop file here or click",
    selectSheet: "Select Sheet",
    selectColumns: "Select Columns",
    columnHierarchy: "Column Hierarchy",
    viewValues: "View Values",
    editValues: "Edit Values",
    customizeFolders: "Customize folder names",
    reset: "Reset",
    downloadZip: "Download ZIP",
    onlyCustomizable:
      'Only edit groups with "Customize folder names" option enabled',
    level: "Level",
    fileName: "File Name",
    uploadSuccess: "File uploaded successfully",
    uploadError: "Error uploading file",
    fileRequired: "File is required",
    sheetRequired: "Sheet is required",
    invalidFile: "Only .xlsx and .xls files can be uploaded",
    columnsRequired: "At least one column is required",
    groupsRequired: "At least one group is required",
    folderGenerated: "Folders created successfully",
    folderError: "Error creating folders",
    processing: "Processing...",
    column: "Column",
    addGroup: "Add Group",
    removeGroup: "Remove Group",
    separator: "Separator",
    customizeFoldersTitle: "Customize folder names",
    customizeFolderName: "Customize folder name option",
    groupColumns: "Group Columns",
    groupColumnsDescription:
      "Create column groups that will build the folder hierarchy here",
    moveUp: "Move up",
    moveDown: "Move down",
    addNewGroup: "Add New Group",
    createGroupFirst: "Create a group first",
    noGroupsYet:
      'No groups created yet. Start by clicking the "Add New Group" button.',
    columns: "columns",
    deleteGroup: "Delete group",
    enabled: "Enabled",
    addToLastGroup: "Add to last group",
    loading: "Loading...",
    continue: "Continue",
    allColumnsAdded: "All columns have been added to groups.",
    back: "Back",
    excelValue: "Excel Value",
    folderName: "Folder Name",
    creating: "Creating...",
    darkMode: "Dark Mode",
    lightMode: "Light Mode",
    switchToEnglish: "Switch to English",
    switchToTurkish: "Switch to Turkish",
    error: "Error",
    success: "Success",
    pagesFound: "{count} pages found",
    fileProcessingError: "An error occurred while processing the file",
    sheetProcessingError: "An error occurred while processing the sheet",
    atLeastOneGroup: "Create at least one column group",
    valuesFetchError: "An error occurred while fetching values",
    zipDownloaded: "ZIP file downloaded",
    zipCreationError: "An error occurred while creating ZIP",
    poweredBy: "Powered by @barisariburnu",
    invalidFileToast: "Please upload a valid Excel file (.xlsx or .xls)",
    uploadSuccessToast: "File uploaded successfully",
    pagesFoundToast: "{count} pages found",
    uploadErrorToast: "An error occurred while processing the file",
    sheetProcessingErrorToast: "An error occurred while processing the sheet",
    createGroupFirstToast: "Create a group first",
    atLeastOneGroupToast: "Create at least one column group",
    valuesFetchErrorToast: "An error occurred while fetching values",
    zipDownloadedToast: "ZIP file downloaded",
    zipCreationErrorToast: "An error occurred while creating ZIP",
  },
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("tr");

  useEffect(() => {
    const saved = localStorage.getItem("language") as Language;
    if (saved && (saved === "tr" || saved === "en")) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    let text = translations[language][key] || key;
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        text = text.replace(`{${param}}`, String(value));
      });
    }
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
