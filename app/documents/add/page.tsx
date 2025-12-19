"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  FileText,
  Plus,
  Trash2,
  Upload,
  RefreshCw,
  Loader2,
  ImageIcon,
  X,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { useDocuments, type DocumentType } from "@/components/document-context";
import { toast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Switch } from "@/components/ui/switch";

type FileRow = {
  id: number;
  name: string;
  type: string;
  subCategory: string;
  documentType: DocumentType;
  files: File[];
  entityName: string;
  needsRenewal: boolean;
  renewalDate: string;
  renewalTime: string;
};

export default function AddDocument() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [documentTypesFromSheet, setDocumentTypesFromSheet] = useState<string[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const defaultCategoryOptions = ["Personal", "Company", "Director"];

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    fetchMasterData();
  }, [isLoggedIn, router]);

  const fetchMasterData = async () => {
    try {
      const scriptUrl =
        "https://script.google.com/macros/s/AKfycbxPsSSePFSXwsRFgRNYv4xUn205zI4hgeW04CTaqK7p3InSM1TKFCmTBqM5bNFZfHOIJA/exec";
      const response = await fetch(`${scriptUrl}?sheet=Master&action=fetch`);

      if (!response.ok) {
        throw new Error(`Failed to fetch master data: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        console.warn("Master sheet response error, falling back to defaults:", result?.error);
        setDocumentTypesFromSheet([]);
        setCategoryOptions(defaultCategoryOptions);
        return;
      }

      const rows: string[][] = result.data;

      const types = rows
        .slice(1)
        .map((r: string[]) => (r[0] ?? "").toString().trim())
        .filter((v: string) => v);

      const cats = rows
        .slice(1)
        .map((r: string[]) => (r[1] ?? "").toString().trim())
        .filter((v: string) => v);

      setDocumentTypesFromSheet(Array.from(new Set(types)));
      const uniqueCats = Array.from(new Set(cats));
      if (uniqueCats.length >= 1) {
        const merged = Array.from(new Set([...defaultCategoryOptions, ...uniqueCats]));
        setCategoryOptions(merged);
      } else {
        setCategoryOptions(defaultCategoryOptions);
      }
    } catch (err) {
      console.error("Error fetching master data:", err);
      toast({
        title: "Error",
        description: "Failed to load document types and categories. Using defaults.",
        variant: "destructive",
      });
      setDocumentTypesFromSheet([]);
      setCategoryOptions(defaultCategoryOptions);
    } finally {
      setIsLoading(false);
    }
  };

  const [multipleFiles, setMultipleFiles] = useState<FileRow[]>([
    {
      id: Date.now(),
      name: "",
      type: "",
      subCategory: "",
      documentType: "Personal",
      files: [],
      entityName: "",
      needsRenewal: false,
      renewalDate: "",
      renewalTime: "",
    },
  ]);

  const formatDateToDDMMYYYY = (dateString: string): string => {
    if (!dateString) return "";

    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  const handleMultipleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      const updatedFiles = [...multipleFiles];
      
      const existingFiles = new Set(
        updatedFiles[index].files.map(f => `${f.name}_${f.size}`)
      );
      
      const newFiles = selectedFiles.filter(file => 
        !existingFiles.has(`${file.name}_${file.size}`)
      );
      
      updatedFiles[index] = {
        ...updatedFiles[index],
        files: [...updatedFiles[index].files, ...newFiles],
      };
      
      setMultipleFiles(updatedFiles);
      
      e.target.value = '';
    }
  };

  const handleRemoveSingleFile = (rowIndex: number, fileIndex: number) => {
    const updatedFiles = [...multipleFiles];
    updatedFiles[rowIndex].files.splice(fileIndex, 1);
    setMultipleFiles(updatedFiles);
  };

  const handleClearAllFiles = (rowIndex: number) => {
    const updatedFiles = [...multipleFiles];
    updatedFiles[rowIndex] = {
      ...updatedFiles[rowIndex],
      files: [],
    };
    setMultipleFiles(updatedFiles);
  };

  const handleMultipleInputChange = (
    index: number,
    field:
      | "name"
      | "type"
      | "subCategory"
      | "documentType"
      | "entityName"
      | "renewalDate"
      | "renewalTime",
    value: string
  ) => {
    const updatedFiles = [...multipleFiles];
    updatedFiles[index] = {
      ...updatedFiles[index],
      [field]: value,
    };
    setMultipleFiles(updatedFiles);
  };

  const handleRenewalToggle = (index: number, value: boolean) => {
    const updatedFiles = [...multipleFiles];
    updatedFiles[index] = {
      ...updatedFiles[index],
      needsRenewal: value,
    };
    setMultipleFiles(updatedFiles);
  };

  const addFileRow = () => {
    setMultipleFiles([
      ...multipleFiles,
      {
        id: Date.now() + Math.floor(Math.random() * 1000),
        name: "",
        type: "",
        subCategory: "",
        documentType: "Personal",
        files: [],
        entityName: "",
        needsRenewal: false,
        renewalDate: "",
        renewalTime: "",
      },
    ]);
  };

  const removeFileRow = (id: number) => {
    if (multipleFiles.length > 1) {
      setMultipleFiles(multipleFiles.filter((file) => file.id !== id));
    }
  };

  const getSerialPrefix = (documentType: DocumentType): string => {
    switch (documentType) {
      case "Personal":
        return "PN";
      case "Company":
        return "CN";
      case "Director":
        return "DN";
      default:
        return "DN";
    }
  };

  const uploadFilesOneByOne = async (filesInput: File[]): Promise<string[]> => {
    const scriptUrl = "https://script.google.com/macros/s/AKfycbxPsSSePFSXwsRFgRNYv4xUn205zI4hgeW04CTaqK7p3InSM1TKFCmTBqM5bNFZfHOIJA/exec";
    const uploadedUrls: string[] = [];

    for (let i = 0; i < filesInput.length; i++) {
      const file = filesInput[i];
      
      try {
        console.log(`📤 Uploading file ${i + 1}/${filesInput.length}: ${file.name} (${(file.size/1024).toFixed(1)} KB)`);
        
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]);
          };
          reader.onerror = (error) => reject(error);
        });

        const formData = new FormData();
        formData.append("action", "uploadImage");
        formData.append("folderId", "14gmh9fiQuacCztSMu7Uts0e3AtSlXQYx");
        formData.append("fileName", file.name);
        formData.append("base64Data", base64Data);
        formData.append("mimeType", file.type);

        console.log(`📝 Sending upload request for ${file.name}`);
        const response = await fetch(scriptUrl, {
          method: "POST",
          body: formData,
        });

        console.log(`📨 Upload response status: ${response.status}`);
        
        if (!response.ok) {
          console.error(`❌ Upload failed with status: ${response.status}`);
          uploadedUrls.push("");
          continue;
        }

        const result = await response.json();
        console.log(`📊 Upload response for ${file.name}:`, result);
        
        if (result.success && result.fileUrl) {
          uploadedUrls.push(result.fileUrl);
          console.log(`✅ File ${i + 1} uploaded successfully: ${result.fileUrl}`);
        } else {
          console.warn(`⚠️ File ${i + 1} upload failed:`, result.error);
          uploadedUrls.push("");
        }

      } catch (error) {
        console.error(`❌ Failed to upload file ${i + 1} (${file.name}):`, error);
        uploadedUrls.push("");
      }
    }

    console.log("📋 Final uploaded URLs:", uploadedUrls.filter(url => url).length, "successful out of", filesInput.length);
    return uploadedUrls;
  };

  const uploadMultipleFilesToGoogleDrive = async (
    filesInput: File[]
  ): Promise<string[]> => {
    if (filesInput.length === 0) {
      return [];
    }
    return await uploadFilesOneByOne(filesInput);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const scriptUrl = "https://script.google.com/macros/s/AKfycbxPsSSePFSXwsRFgRNYv4xUn205zI4hgeW04CTaqK7p3InSM1TKFCmTBqM5bNFZfHOIJA/exec";

      const totalFiles = multipleFiles.reduce((total, doc) => total + doc.files.length, 0);
      if (totalFiles === 0) {
        toast({
          title: "Warning",
          description: "Please upload at least one image for your documents.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const serialResponse = await fetch(`${scriptUrl}?action=getNextSerials`);
      if (!serialResponse.ok) {
        throw new Error(`Failed to fetch serial numbers: ${serialResponse.status}`);
      }

      const serialData = await serialResponse.json();
      if (!serialData.success) {
        throw new Error(serialData.error || "Failed to get next serial numbers");
      }

      let nextPersonal = serialData.nextSerials.personal;
      let nextCompany = serialData.nextSerials.company;
      let nextDirector = serialData.nextSerials.director;

      const now = new Date();
      const day = String(now.getDate()).padStart(2, "0");
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const timestamp = `${day}/${month}/${year} ${hours}:${minutes}`;

      for (let i = 0; i < multipleFiles.length; i++) {
        const documentRow = multipleFiles[i];
        
        console.log(`📄 Processing document ${i + 1}: ${documentRow.name}`);
        
        let uploadedUrls: string[] = [];
        if (documentRow.files.length > 0) {
          uploadedUrls = await uploadMultipleFilesToGoogleDrive(documentRow.files);
          console.log(`🖼️ Uploaded URLs for document ${i + 1}:`, uploadedUrls);
        }

        let serialNumber = "";
        const prefix = getSerialPrefix(documentRow.documentType);

        if (documentRow.documentType === "Personal") {
          serialNumber = `${prefix}-${String(nextPersonal).padStart(3, "0")}`;
          nextPersonal++;
        } else if (documentRow.documentType === "Company") {
          serialNumber = `${prefix}-${String(nextCompany).padStart(3, "0")}`;
          nextCompany++;
        } else if (documentRow.documentType === "Director") {
          serialNumber = `${prefix}-${String(nextDirector).padStart(3, "0")}`;
          nextDirector++;
        }

        const renewalDateTime = documentRow.needsRenewal && documentRow.renewalDate && documentRow.renewalTime
          ? `${formatDateToDDMMYYYY(documentRow.renewalDate)} ${documentRow.renewalTime}`
          : "";

        const totalSizeMB = documentRow.files.reduce((total, file) => total + file.size, 0) / 1024 / 1024;

        // CORRECTED ROW DATA STRUCTURE BASED ON YOUR HEADER
        const rowData = [
          timestamp,                              // A (0) - Timestamp
          serialNumber,                           // B (1) - Serial No
          documentRow.name,                       // C (2) - Document name
          documentRow.type,                       // D (3) - Document Type
          documentRow.documentType,               // E (4) - Category
          "",                                     // F (5) - Company/Department
          "",                                     // G (6) - Tags
          documentRow.entityName,                 // H (7) - Name
          documentRow.needsRenewal ? "Yes" : "No", // I (8) - Need Renewal
          renewalDateTime,                        // J (9) - Renewal Date
          `${totalSizeMB.toFixed(2)} MB`,         // K (10) - Total file size (EMPTY in header, but we're using it)
          uploadedUrls[0] || "",                  // L (11) - Image #1
          "",                                     // M (12) - Email
          "",                                     // N (13) - Mobile
          "",                                     // O (14) - Delete marker
          documentRow.subCategory,                // P (15) - Sub Category
          "",                                     // Q (16) - Renewal Filter
          uploadedUrls[1] || "",                  // R (17) - Image2
          uploadedUrls[2] || "",                  // S (18) - Image3
          uploadedUrls[3] || "",                  // T (19) - Image4
        ];

        // Add extra images if more than 4
        for (let j = 4; j < uploadedUrls.length; j++) {
          rowData.push(uploadedUrls[j] || "");
        }

        console.log(`📊 Row data for document ${i + 1}:`, rowData);
        console.log(`🔢 Total columns: ${rowData.length}`);
        console.log(`🖼️ Image URLs to insert:`, uploadedUrls.filter(url => url));

        // Use URLSearchParams for better compatibility
        const urlParams = new URLSearchParams();
        urlParams.append("sheetName", "Documents");
        urlParams.append("action", "insert");
        urlParams.append("rowData", JSON.stringify(rowData));

        console.log(`📤 Sending data to Google Sheets...`);
        
        const response = await fetch(scriptUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: urlParams.toString(),
        });

        console.log(`📨 Response status: ${response.status}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Failed to insert document: ${response.status}`, errorText);
          throw new Error(`Failed to insert document: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log(`📋 Insert response for document ${i + 1}:`, result);

        if (!result.success) {
          throw new Error(result.error || `Document ${i + 1} submission failed`);
        }
        
        console.log(`✅ Document ${i + 1} added successfully!`);
      }

      // Update serial numbers
      const updateSerialResponse = await fetch(
        `${scriptUrl}?action=updateSerials&personal=${nextPersonal}&company=${nextCompany}&director=${nextDirector}`
      );
      
      if (updateSerialResponse.ok) {
        const updateResult = await updateSerialResponse.json();
        if (!updateResult.success) {
          console.warn("⚠️ Failed to update serial numbers:", updateResult.error);
        }
      }

      toast({
        title: "Success",
        description: `${multipleFiles.length} document(s) with ${totalFiles} image(s) added successfully.`,
      });

      // Reset form
      setMultipleFiles([{
        id: Date.now(),
        name: "",
        type: "",
        subCategory: "",
        documentType: "Personal",
        files: [],
        entityName: "",
        needsRenewal: false,
        renewalDate: "",
        renewalTime: "",
      }]);

      setTimeout(() => {
        router.push("/documents");
      }, 1500);
      
    } catch (error) {
      console.error("❌ Submission error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  const getEntityLabel = (documentType: DocumentType): string => {
    switch (documentType) {
      case "Personal":
        return "Person Name";
      case "Company":
        return "Company Name";
      case "Director":
        return "Director Name";
      default:
        return "Entity Name";
    }
  };

  const getEntityPlaceholder = (documentType: DocumentType): string => {
    switch (documentType) {
      case "Personal":
        return "Enter person name";
      case "Company":
        return "Enter company name";
      case "Director":
        return "Enter director name";
      default:
        return "Enter name";
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'txt':
        return '📃';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'webp':
        return '🖼️';
      default:
        return '📎';
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 pt-16 md:pt-8 max-w-[1600px] mx-auto bg-gray-50 min-h-screen">
      <Toaster />
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="mr-2 text-blue-700 hover:text-blue-800 hover:bg-blue-50"
        >
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">
          Add New Documents
        </h1>
      </div>

      <div className="max-w-5xl mx-auto">
        <Card className="shadow-sm border border-gray-200">
          <form onSubmit={handleSubmit}>
            <CardHeader className="bg-white border-b p-4 md:p-6">
              <CardTitle className="text-base md:text-lg text-gray-800 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0" />
                Document Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-4 md:p-6 bg-gray-50">
              {multipleFiles.map((fileItem, index) => (
                <div
                  key={fileItem.id}
                  className="p-3 md:p-4 border rounded-lg bg-white relative shadow-sm"
                >
                  <div className="absolute right-2 top-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFileRow(fileItem.id)}
                      disabled={multipleFiles.length === 1}
                      className="h-8 w-8 p-0 text-gray-500 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </div>

                  <h3 className="font-medium mb-3 md:mb-4 text-gray-700 pr-8">
                    Document #{index + 1}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-3 md:mb-4">
                    <div className="space-y-2">
                      <Label htmlFor={`name-${index}`} className="text-sm font-medium text-gray-700">
                        Document Name *
                      </Label>
                      <Input
                        id={`name-${index}`}
                        placeholder="Enter document name"
                        value={fileItem.name}
                        onChange={(e) => handleMultipleInputChange(index, "name", e.target.value)}
                        required
                        className="border-gray-300 text-sm bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`type-${index}`} className="text-sm font-medium text-gray-700">
                        Document Type *
                      </Label>
                      <Select
                        value={fileItem.type}
                        onValueChange={(value) => handleMultipleInputChange(index, "type", value)}
                        required
                      >
                        <SelectTrigger id={`type-${index}`} className="border-gray-300 text-sm bg-white">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {documentTypesFromSheet.length > 0 ? (
                            documentTypesFromSheet.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="General">General</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`document-type-${index}`} className="text-sm font-medium text-gray-700">
                        Category *
                      </Label>
                      <Select
                        value={fileItem.documentType}
                        onValueChange={(value: DocumentType) => {
                          const updatedFiles = [...multipleFiles];
                          updatedFiles[index] = {
                            ...updatedFiles[index],
                            documentType: value,
                            entityName: "",
                          };
                          setMultipleFiles(updatedFiles);
                        }}
                        required
                      >
                        <SelectTrigger id={`document-type-${index}`} className="border-gray-300 text-sm bg-white">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categoryOptions.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`sub-category-${index}`} className="text-sm font-medium text-gray-700">
                        Sub Category
                      </Label>
                      <Input
                        id={`sub-category-${index}`}
                        placeholder="Enter sub category"
                        value={fileItem.subCategory}
                        onChange={(e) => handleMultipleInputChange(index, "subCategory", e.target.value)}
                        className="border-gray-300 text-sm bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 mb-3 md:mb-4">
                    <Label htmlFor={`entity-name-${index}`} className="text-sm font-medium text-gray-700">
                      {getEntityLabel(fileItem.documentType)}
                    </Label>
                    <Input
                      id={`entity-name-${index}`}
                      placeholder={getEntityPlaceholder(fileItem.documentType)}
                      value={fileItem.entityName}
                      onChange={(e) => handleMultipleInputChange(index, "entityName", e.target.value)}
                      className="border-gray-300 text-sm bg-white"
                      required
                    />
                  </div>

                  <div className="border-t pt-3 mt-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <RefreshCw className="h-4 w-4 text-blue-500" />
                        <Label htmlFor={`needs-renewal-${index}`} className="text-sm font-medium text-gray-700">
                          Document Needs Renewal
                        </Label>
                      </div>
                      <Switch
                        id={`needs-renewal-${index}`}
                        checked={fileItem.needsRenewal}
                        onCheckedChange={(checked) => handleRenewalToggle(index, checked)}
                      />
                    </div>

                    {fileItem.needsRenewal && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mt-3">
                        <div className="space-y-2">
                          <Label htmlFor={`renewal-date-${index}`} className="text-sm font-medium text-gray-700">
                            Renewal Date *
                          </Label>
                          <Input
                            id={`renewal-date-${index}`}
                            type="date"
                            value={fileItem.renewalDate}
                            onChange={(e) => handleMultipleInputChange(index, "renewalDate", e.target.value)}
                            className="border-gray-300 text-sm bg-white"
                            required={fileItem.needsRenewal}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`renewal-time-${index}`} className="text-sm font-medium text-gray-700">
                            Renewal Time *
                          </Label>
                          <Input
                            id={`renewal-time-${index}`}
                            type="time"
                            value={fileItem.renewalTime}
                            onChange={(e) => handleMultipleInputChange(index, "renewalTime", e.target.value)}
                            className="border-gray-300 text-sm bg-white"
                            required={fileItem.needsRenewal}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-3 mt-3">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`file-${index}`} className="text-sm font-medium text-gray-700 flex items-center">
                          <ImageIcon className="h-4 w-4 mr-2" />
                          Upload Multiple Images *
                        </Label>
                        {fileItem.files.length > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleClearAllFiles(index)}
                            className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Clear All
                          </Button>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-3">
                        <Input
                          id={`file-${index}`}
                          type="file"
                          multiple
                          accept="image/*,.pdf,.doc,.docx,.txt"
                          onChange={(e) => handleMultipleFileChange(e, index)}
                          required={fileItem.files.length === 0}
                          className="border-gray-300 text-sm bg-white"
                        />
                        
                        {fileItem.files.length > 0 && (
                          <div className="mt-2 p-3 bg-blue-50 rounded-md border border-blue-200">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-medium text-blue-800">
                                📸 {fileItem.files.length} image(s) selected
                              </p>
                              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                Total: {(fileItem.files.reduce((total, file) => total + file.size, 0) / 1024 / 1024).toFixed(2)} MB
                              </span>
                            </div>
                            
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {fileItem.files.map((file, fileIndex) => (
                                <div 
                                  key={fileIndex} 
                                  className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 hover:bg-gray-50"
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <span className="text-lg">{getFileIcon(file.name)}</span>
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-xs font-medium text-gray-700 truncate">
                                        #{fileIndex + 1}: {file.name}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {(file.size / 1024).toFixed(1)} KB • {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                                      </span>
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveSingleFile(index, fileIndex)}
                                    className="h-6 w-6 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
                                  >
                                    <X className="h-3 w-3" />
                                    <span className="sr-only">Remove</span>
                                  </Button>
                                </div>
                              ))}
                            </div>
                            
                            <div className="mt-3 pt-2 border-t border-blue-200">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                <div className="text-gray-600">
                                  <span className="font-medium">Storage Columns:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">L (Image #1)</span>
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">R (Image2)</span>
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">S (Image3)</span>
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">T (Image4)</span>
                                    {fileItem.files.length > 4 && (
                                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                                        +{fileItem.files.length - 4} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-gray-600">
                                  <span className="font-medium">Tip:</span>
                                  <div className="mt-1">
                                    • Click "Choose File" to add more images
                                    <br />
                                    • Drag & drop also supported
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addFileRow}
                className="w-full border-dashed border-2 border-blue-300 text-blue-700 hover:bg-blue-50 h-12"
              >
                <Plus className="mr-2 h-4 w-4 flex-shrink-0" /> Add Another Document
              </Button>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-between gap-3 border-t bg-white p-4 md:p-6">
              <Button
                variant="outline"
                type="button"
                onClick={() => router.push("/")}
                className="border-gray-300 text-gray-700 hover:bg-gray-100 w-full sm:w-auto order-2 sm:order-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto order-1 sm:order-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4 flex-shrink-0" />
                    Submit Documents ({multipleFiles.length})
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}