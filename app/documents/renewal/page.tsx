"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Download,
  FileText,
  Mail,
  MoreHorizontal,
  Search,
  Smartphone,
  User,
  Briefcase,
  Users,
  Plus,
  RefreshCw,
  Image as ImageIcon,
  Loader2,
  Check,
  X as XIcon,
} from "lucide-react";
import Link from "next/link";
import { toast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface Document {
  id: number;
  timestamp: string;
  serialNo: string;
  name: string;
  documentType: string;
  category: string;
  company: string;
  tags: string[];
  personName: string;
  needsRenewal: boolean;
  renewalDate: string;
  imageUrl: string;
  email: string;
  mobile: string;
  image2Url: string;
  image3Url: string;
  image4Url: string;
  subCategory: string;
  sourceSheet: string;
}

const formatDateToDDMMYYYY = (dateString: string): string => {
  if (!dateString) return "";

  try {
    // Handle case where date includes time (format: "dd/MM/yyyy HH:mm")
    if (dateString.match(/^\d{1,2}\/\d{1,2}\/\d{4} \d{1,2}:\d{1,2}$/)) {
      const [datePart, timePart] = dateString.split(" ");
      return `${datePart} ${timePart}`; // Return both date and time parts
    }

    let date: Date;

    if (dateString.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
      const parts = dateString.split("/");
      date = new Date(
        parseInt(parts[2]),
        parseInt(parts[1]) - 1,
        parseInt(parts[0])
      );
    } else {
      date = new Date(dateString);
    }

    if (isNaN(date.getTime())) {
      const parts = dateString.split("/");
      if (parts.length === 3) {
        date = new Date(
          parseInt(parts[2]),
          parseInt(parts[1]) - 1,
          parseInt(parts[0])
        );
        if (isNaN(date.getTime())) {
          return dateString;
        }
      } else {
        return dateString;
      }
    }

    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
};

const formatDateTimeDisplay = (dateString: string): string => {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      return dateString;
    }

    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");

    if (hours === "00" && minutes === "00" && seconds === "00") {
      const now = new Date();
      return `${day}/${month}/${year} || ${now
        .getHours()
        .toString()
        .padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now
          .getSeconds()
          .toString()
          .padStart(2, "0")}`;
    }

    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
};

const formatImageUrl = (url: string): string => {
  if (!url) return "";
  if (url.includes("uc?export=view")) return url;
  if (url.includes("drive.google.com/file/d/")) {
    const fileId = url.split("/file/d/")[1].split("/")[0];
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }
  return url;
};

const handleShareWhatsApp = async (number: string) => {
  try {
    setIsLoading(true);

    // Create FormData
    const formData = new FormData();
    formData.append("action", "shareViaWhatsApp");
    formData.append("recipientNumber", number);
    formData.append(
      "documents",
      JSON.stringify(
        selectedDocuments.map((doc) => ({
          id: doc.id.toString(),
          name: doc.name,
          serialNo: doc.serialNo,
          documentType: doc.documentType,
          category: doc.category,
          imageUrl: doc.imageUrl,
          sourceSheet: doc.sourceSheet,
        }))
      )
    );

    const response = await fetch(
      "https://script.google.com/macros/s/AKfycbxPsSSePFSXwsRFgRNYv4xUn205zI4hgeW04CTaqK7p3InSM1TKFCmTBqM5bNFZfHOIJA/exec",
      {
        method: "POST",
        body: formData,
      }
    );

    const textResponse = await response.text();
    console.log("Full response:", textResponse);

    toast({
      title: "Success",
      description: "WhatsApp message sent successfully!",
    });
    setSelectedDocs([]);
    return true;
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    toast({
      title: "Error",
      description: "Network error. Please check your connection.",
      variant: "destructive",
    });
    return false;
  } finally {
    setIsLoading(false);
  }
};

const handleDownloadDocument = (imageUrl: string, documentName: string) => {
  if (!imageUrl) {
    toast({
      title: "No image available",
      description: "This document doesn't have an image to download",
      variant: "destructive",
    });
    return;
  }

  let downloadUrl = imageUrl;

  if (imageUrl.includes("drive.google.com")) {
    const fileId = imageUrl.match(/[-\w]{25,}/)?.[0];
    if (fileId) {
      downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    }
  }

  const link = document.createElement("a");
  link.href = downloadUrl;
  link.setAttribute(
    "download",
    `${documentName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.jpg` ||
    "document.jpg"
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  toast({
    title: "Download started",
    description: `Downloading ${documentName}`,
  });
};

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="h-12 w-12 text-[#7569F6] animate-spin" />
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-700 mb-2">
          Loading Documents
        </h3>
        <p className="text-sm text-gray-500">
          Please wait while we fetch your documents...
        </p>
      </div>
    </div>
  </div>
);

export default function DocumentsList() {
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn, userRole, userName } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [mounted, setMounted] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<DocumentFilter>("Renewal");
  const [tempRenewalTime, setTempRenewalTime] = useState<string>("");
  const [editingRenewalDoc, setEditingRenewalDoc] = useState<Document | null>(
    null
  );
  const [tempRenewalDate, setTempRenewalDate] = useState<Date | undefined>(
    undefined
  );
  const [tempNeedsRenewal, setTempNeedsRenewal] = useState<boolean>(false);

  const [editingDocId, setEditingDocId] = useState<number | null>(null);
  const [tempDocName, setTempDocName] = useState("");
  const [tempDocType, setTempDocType] = useState("");
  const [tempCategory, setTempCategory] = useState("");
  const [tempPersonName, setTempPersonName] = useState("");
  const [tempSubCategory, setTempSubCategory] = useState("");

  const [tempDocImage, setTempDocImage] = useState<File | null>(null);
  const [tempDocImage2, setTempDocImage2] = useState<File | null>(null);
  const [tempDocImage3, setTempDocImage3] = useState<File | null>(null);
  const [tempDocImage4, setTempDocImage4] = useState<File | null>(null);

  const [imagePopup, setImagePopup] = useState<{ open: boolean; url: string }>({
    open: false,
    url: "",
  });

  const isRenewalExpired = (renewalDate: string): boolean => {
    if (!renewalDate) return false;

    try {
      // Split date and time if present
      const [datePart, timePart] = renewalDate.split(" ");
      let dateParts: number[];

      if (datePart.includes("/")) {
        dateParts = datePart.split("/").map(Number);
      } else {
        dateParts = datePart.split("-").map(Number);
        if (dateParts.length === 3) {
          dateParts = [dateParts[2], dateParts[1], dateParts[0]];
        }
      }

      if (dateParts.length !== 3) return false;

      const renewalDateObj = new Date(
        dateParts[2],
        dateParts[1] - 1,
        dateParts[0]
      );

      // If time is included, add it to the date
      if (timePart) {
        const [hours, minutes] = timePart.split(":").map(Number);
        renewalDateObj.setHours(hours, minutes, 0, 0);
      }

      const today = new Date();
      return renewalDateObj < today;
    } catch (error) {
      console.error("Error parsing renewal date:", error);
      return false;
    }
  };

  const isRenewalToday = (renewalDate: string): boolean => {
    if (!renewalDate) return false;

    try {
      const [datePart, timePart] = renewalDate.split(" ");
      let dateParts: number[];

      if (datePart.includes("/")) {
        dateParts = datePart.split("/").map(Number);
      } else {
        dateParts = datePart.split("-").map(Number);
        if (dateParts.length === 3) {
          dateParts = [dateParts[2], dateParts[1], dateParts[0]];
        }
      }

      if (dateParts.length !== 3) return false;

      const renewalDateObj = new Date(
        dateParts[2],
        dateParts[1] - 1,
        dateParts[0]
      );

      // If time is included, add it to the date
      if (timePart) {
        const [hours, minutes] = timePart.split(":").map(Number);
        renewalDateObj.setHours(hours, minutes, 0, 0);
      }

      const today = new Date();
      const todayStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );
      const todayEnd = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + 1
      );

      return renewalDateObj >= todayStart && renewalDateObj < todayEnd;
    } catch (error) {
      console.error("Error parsing renewal date:", error);
      return false;
    }
  };

  const getRenewalStatus = (
    renewalDate: string
  ): "upcoming" | "today" | "overdue" => {
    if (!renewalDate) return "upcoming";

    try {
      const [datePart, timePart] = renewalDate.split(" ");
      let dateParts: number[];

      if (datePart.includes("/")) {
        dateParts = datePart.split("/").map(Number);
      } else {
        dateParts = datePart.split("-").map(Number);
        if (dateParts.length === 3) {
          dateParts = [dateParts[2], dateParts[1], dateParts[0]];
        }
      }

      if (dateParts.length !== 3) return "upcoming";

      const renewalDateObj = new Date(
        dateParts[2],
        dateParts[1] - 1,
        dateParts[0]
      );

      if (timePart) {
        const [hours, minutes] = timePart.split(":").map(Number);
        renewalDateObj.setHours(hours, minutes, 0, 0);
      }

      const today = new Date();
      const todayStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );
      const todayEnd = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + 1
      );

      if (renewalDateObj < todayStart) return "overdue";
      if (renewalDateObj >= todayStart && renewalDateObj < todayEnd)
        return "today";
      return "upcoming";
    } catch (error) {
      console.error("Error parsing renewal date:", error);
      return "upcoming";
    }
  };

  const handleViewImage = (url: string) => {
    try {
      let imageUrl = formatImageUrl(url);
      window.open(imageUrl, "_blank");
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not open image",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    setMounted(true);
    fetchDocuments(); // Always fetch on mount if logged in
  }, [isLoggedIn, router]);


  const fetchDocuments = async () => {
    // Only show loading if it's the initial load
    if (documents.length === 0) {
      setIsLoading(true);
    }
    try {
      const docsResponse = await fetch(
        "https://script.google.com/macros/s/AKfycbxPsSSePFSXwsRFgRNYv4xUn205zI4hgeW04CTaqK7p3InSM1TKFCmTBqM5bNFZfHOIJA/exec?sheet=Documents"
      );
      const docsData = await docsResponse.json();

      let docs = [];
      if (docsData.success && docsData.data) {
        docs = docsData.data
          .slice(1)
          .filter(
            (doc: any[]) =>
              !doc[15] || !doc[15].toString().toLowerCase().includes("deleted")
          )
          .map((doc: any[], index: number) => ({
            id: index + 1,
            timestamp: doc[0]
              ? new Date(doc[0]).toISOString()
              : new Date().toISOString(),
            serialNo: doc[1] || "",
            name: doc[2] || "",
            documentType: doc[3] || "Personal",
            category: doc[4] || "",
            company: doc[5] || "",
            tags: doc[6]
              ? String(doc[6])
                .split(",")
                .map((tag: string) => tag.trim())
              : [],
            personName: doc[7] || "",
            needsRenewal: doc[8] === "TRUE" || doc[8] === "Yes" || false,
            renewalDate: formatDateToDDMMYYYY(doc[9] || ""),
            imageUrl: doc[11] || "",
            image2Url: doc[17] || "",
            image3Url: doc[18] || "",
            image4Url: doc[19] || "",
            email: doc[12] || "",
            mobile: doc[13] ? String(doc[13]) : "",
            subCategory: doc[15] || "",
            sourceSheet: "Documents",
          }))
          .filter(
            (doc: Document) =>
              userRole?.toLowerCase() === "admin" ||
              doc.personName?.toLowerCase() === userName?.toLowerCase()
          );

        docs.sort(
          (a: Document, b: Document) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      }

      setDocuments(docs);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast({
        title: "Error",
        description: "Failed to fetch documents",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          const result = reader.result as string;
          const base64Data = result.split(",")[1];
          resolve(base64Data);
        };
        reader.onerror = (error) => reject(error);
      });

      const formData = new FormData();
      formData.append("action", "uploadFile");
      formData.append("fileName", file.name);
      formData.append("mimeType", file.type);
      formData.append("folderId", "14gmh9fiQuacCztSMu7Uts0e3AtSlXQYx");
      formData.append("base64Data", base64String);

      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbxPsSSePFSXwsRFgRNYv4xUn205zI4hgeW04CTaqK7p3InSM1TKFCmTBqM5bNFZfHOIJA/exec",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success || !result.fileUrl) {
        throw new Error(result.message || "Upload failed");
      }

      return formatImageUrl(result.fileUrl);
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, slot: number) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (slot === 1) setTempDocImage(file);
      else if (slot === 2) setTempDocImage2(file);
      else if (slot === 3) setTempDocImage3(file);
      else if (slot === 4) setTempDocImage4(file);
    }
  };

  const uploadFileToGoogleDrive = async (file: File): Promise<string> => {
    const scriptUrl = "https://script.google.com/macros/s/AKfycbxPsSSePFSXwsRFgRNYv4xUn205zI4hgeW04CTaqK7p3InSM1TKFCmTBqM5bNFZfHOIJA/exec";

    try {
      const base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          const result = reader.result as string;
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = error => reject(error);
      });

      const formData = new FormData();
      formData.append('action', 'uploadFile');
      formData.append('fileName', file.name);
      formData.append('mimeType', file.type);
      formData.append('folderId', '14gmh9fiQuacCztSMu7Uts0e3AtSlXQYx');
      formData.append('base64Data', base64String);

      const response = await fetch(scriptUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.fileUrl) {
        return result.fileUrl;
      } else {
        throw new Error(result.error || "File upload failed");
      }
    } catch (error) {
      console.error("File upload error:", error);
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleUpdateDocument = async (docId: number) => {
    setIsLoading(true);
    try {
      const docToUpdate = documents.find((doc) => doc.id === docId);
      if (!docToUpdate) {
        toast({
          title: "Error",
          description: "Document not found",
          variant: "destructive",
        });
        return;
      }

      let updatedImageUrl = docToUpdate.imageUrl;
      let updatedImage2Url = docToUpdate.image2Url;
      let updatedImage3Url = docToUpdate.image3Url;
      let updatedImage4Url = docToUpdate.image4Url;

      // Upload new images if provided
      if (tempDocImage) {
        updatedImageUrl = await uploadFileToGoogleDrive(tempDocImage);
      }
      if (tempDocImage2) {
        updatedImage2Url = await uploadFileToGoogleDrive(tempDocImage2);
      }
      if (tempDocImage3) {
        updatedImage3Url = await uploadFileToGoogleDrive(tempDocImage3);
      }
      if (tempDocImage4) {
        updatedImage4Url = await uploadFileToGoogleDrive(tempDocImage4);
      }

      // Format current renewal date properly for sheet if it exists
      const formattedRenewalDate = tempRenewalDate
        ? `${tempRenewalDate.getDate().toString().padStart(2, "0")}/${(tempRenewalDate.getMonth() + 1).toString().padStart(2, "0")}/${tempRenewalDate.getFullYear()}${tempRenewalTime ? " " + tempRenewalTime : ""}`
        : "";

      const formData = new FormData();
      formData.append("action", "updateDocument");
      formData.append("sheetName", docToUpdate.sourceSheet);
      formData.append("serialNo", docToUpdate.serialNo);

      // Document fields with explicit column mapping
      formData.append("documentName", tempDocName);
      formData.append("documentNameColumn", "2"); // Column C

      formData.append("documentType", tempDocType);
      formData.append("documentTypeColumn", "3"); // Column D

      formData.append("category", tempCategory);
      formData.append("categoryColumn", "4"); // Column E

      formData.append("personName", tempPersonName);
      formData.append("personNameColumn", "7"); // Column H

      formData.append("subCategory", tempSubCategory);
      formData.append("subCategoryColumn", "15"); // Column P

      // Images
      formData.append("imageUrl", updatedImageUrl);
      formData.append("imageUrlColumn", "11"); // Column L

      formData.append("image2Url", updatedImage2Url);
      formData.append("image2UrlColumn", "17"); // Column R

      formData.append("image3Url", updatedImage3Url);
      formData.append("image3UrlColumn", "18"); // Column S

      formData.append("image4Url", updatedImage4Url);
      formData.append("image4UrlColumn", "19"); // Column T

      // Renewal data with explicit column mapping
      formData.append("renewalDate", formattedRenewalDate);
      formData.append("renewalDateColumn", "9"); // Column J (0-indexed)

      formData.append("needsRenewal", tempNeedsRenewal ? "Yes" : "No");
      formData.append("needsRenewalColumn", "8"); // Column I (0-indexed)

      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbxPsSSePFSXwsRFgRNYv4xUn205zI4hgeW04CTaqK7p3InSM1TKFCmTBqM5bNFZfHOIJA/exec",
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: "Document updated successfully",
        });

        // Refetch documents to ensure frontend reflects actual sheet data
        await fetchDocuments();
      } else {
        throw new Error(result.error || result.message || "Failed to update document");
      }
    } catch (error) {
      console.error("Error updating document:", error);
      toast({
        title: "Error",
        description: `Failed to update document: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setEditingDocId(null);
      resetTempStates();
      setIsLoading(false);
    }
  };

  const resetTempStates = () => {
    setTempDocName("");
    setTempDocType("");
    setTempCategory("");
    setTempPersonName("");
    setTempSubCategory("");
    setTempDocImage(null);
    setTempDocImage2(null);
    setTempDocImage3(null);
    setTempDocImage4(null);
    setTempNeedsRenewal(false);
    setTempRenewalDate(undefined);
    setTempRenewalTime("");
  };

  const handleEditRenewalClick = (doc: Document) => {
    setEditingDocId(doc.id);
    setTempDocName(doc.name);
    setTempDocType(doc.documentType);
    setTempCategory(doc.category);
    setTempPersonName(doc.personName);
    setTempSubCategory(doc.subCategory);
    setTempNeedsRenewal(doc.needsRenewal);

    // Parse the existing renewal date and time
    if (doc.renewalDate) {
      const [datePart, timePart] = doc.renewalDate.split(" ");

      // Parse the date part (DD/MM/YYYY)
      if (datePart) {
        const [day, month, year] = datePart.split("/");
        setTempRenewalDate(new Date(`${year}-${month}-${day}`));
      }

      // Set the time part if it exists
      if (timePart) {
        setTempRenewalTime(timePart);
      }
    }

    setTempDocImage(null);
    setTempDocImage2(null);
    setTempDocImage3(null);
    setTempDocImage4(null);
  };

  const handleCancelEdit = () => {
    setEditingDocId(null);
    resetTempStates();
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.documentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(doc.email).toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(doc.mobile).toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.serialNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );

    if (!doc.needsRenewal || !doc.renewalDate) {
      return false; // Skip documents that don't need renewal or have no renewal date
    }

    try {
      // Parse the renewal date
      const [datePart, timePart] = doc.renewalDate.split(" ");
      let dateParts: number[];

      if (datePart.includes("/")) {
        dateParts = datePart.split("/").map(Number);
      } else {
        dateParts = datePart.split("-").map(Number);
        if (dateParts.length === 3) {
          dateParts = [dateParts[2], dateParts[1], dateParts[0]]; // Convert from YYYY-MM-DD to DD-MM-YYYY
        }
      }

      if (dateParts.length !== 3) return false;

      const renewalDate = new Date(
        dateParts[2],
        dateParts[1] - 1,
        dateParts[0]
      );

      // If time is included, add it to the date
      if (timePart) {
        const [hours, minutes] = timePart.split(":").map(Number);
        renewalDate.setHours(hours, minutes, 0, 0);
      }

      const today = new Date();
      const todayStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );
      const todayEnd = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + 1
      );

      if (currentFilter === "Renewal") {
        return matchesSearch;
      } else if (currentFilter === "Overdue") {
        return matchesSearch && renewalDate < todayStart;
      } else if (currentFilter === "Upcoming") {
        return matchesSearch && renewalDate > todayEnd;
      } else if (currentFilter === "Today") {
        return (
          matchesSearch && renewalDate >= todayStart && renewalDate < todayEnd
        );
      }
      return matchesSearch;
    } catch (error) {
      console.error("Error parsing renewal date:", error);
      return false;
    }
  });

  const selectedDocuments = documents.filter((doc) =>
    selectedDocs.includes(doc.id)
  );

  const handleCheckboxChange = (id: number) => {
    setSelectedDocs((prev) =>
      prev.includes(id) ? prev.filter((docId) => docId !== id) : [...prev, id]
    );
  };

  const handleFilterChange = (value: DocumentFilter) => {
    setCurrentFilter(value);
    const newSearchParams = new URLSearchParams(searchParams.toString());
    if (value === "All") {
      newSearchParams.delete("filter");
    } else {
      newSearchParams.set("filter", value);
    }
    router.replace(`?${newSearchParams.toString()}`, { scroll: false });
    // No loading state change here
  };

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    setMounted(true);

    if (documents.length === 0) {
      fetchDocuments();
    }
  }, [isLoggedIn, router]);

  useEffect(() => {
    const filter = searchParams.get("filter") as DocumentFilter;
    if (filter) {
      setCurrentFilter(filter);
    }
  }, [searchParams]);

  if (!mounted || !isLoggedIn) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 pt-16 md:pt-8 max-w-[1200px] mx-auto">
      <Toaster />

      {/* Edit Document Dialog */}
      <Dialog
        open={!!editingDocId}
        onOpenChange={(open) => !open && handleCancelEdit()}
      >
        <DialogContent className="sm:max-w-[800px] h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-2xl font-bold text-indigo-800 flex items-center">
              <FileText className="h-6 w-6 mr-2 text-indigo-600" />
              Edit Document Details
            </DialogTitle>
            <DialogDescription>
              Update information for Serial No:{" "}
              <span className="font-mono font-bold text-indigo-600">
                {documents.find((d) => d.id === editingDocId)?.serialNo}
              </span>
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="general" className="flex-1 flex flex-col min-h-0">
            <div className="px-6 border-b">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">General Info</TabsTrigger>
                <TabsTrigger value="contact">Contact & Renewal</TabsTrigger>
                <TabsTrigger value="images">Images</TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1 p-6">
              <TabsContent value="general" className="mt-0 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Document Name</Label>
                    <Input
                      id="edit-name"
                      value={tempDocName}
                      onChange={(e) => setTempDocName(e.target.value)}
                      placeholder="e.g., Driver's License"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-type">Document Type</Label>
                    <Select
                      value={tempDocType}
                      onValueChange={setTempDocType}
                    >
                      <SelectTrigger id="edit-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Personal">Personal</SelectItem>
                        <SelectItem value="Company">Company</SelectItem>
                        <SelectItem value="Director">Director</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-category">Category</Label>
                    <Input
                      id="edit-category"
                      value={tempCategory}
                      onChange={(e) => setTempCategory(e.target.value)}
                      placeholder="e.g., Identity, Vehicle"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-subcategory">Sub-Category</Label>
                    <Input
                      id="edit-subcategory"
                      value={tempSubCategory}
                      onChange={(e) => setTempSubCategory(e.target.value)}
                      placeholder="e.g., Secondary type"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-person">Entity Name</Label>
                    <Input
                      id="edit-person"
                      value={tempPersonName}
                      onChange={(e) => setTempPersonName(e.target.value)}
                      placeholder="Name of person/entity"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="contact" className="mt-0 space-y-6">
                <Card className="p-4 border-dashed bg-indigo-50/30">
                  <div className="flex items-center justify-between mb-4">
                    <div className="space-y-0.5">
                      <Label className="text-base font-semibold text-indigo-900">
                        Renewal Settings
                      </Label>
                      <p className="text-sm text-indigo-600/70">
                        Enable this to track expiration
                      </p>
                    </div>
                    <Switch
                      checked={tempNeedsRenewal}
                      onCheckedChange={setTempNeedsRenewal}
                    />
                  </div>

                  {tempNeedsRenewal && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-2">
                        <Label>Renewal Date</Label>
                        <DatePicker
                          value={tempRenewalDate}
                          onChange={setTempRenewalDate}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Time (optional)</Label>
                        <Input
                          type="time"
                          value={tempRenewalTime}
                          onChange={(e) => setTempRenewalTime(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="images" className="mt-0 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((slot) => {
                    const currentDoc = documents.find((d) => d.id === editingDocId);
                    const existingUrl = slot === 1 ? currentDoc?.imageUrl :
                      slot === 2 ? currentDoc?.image2Url :
                        slot === 3 ? currentDoc?.image3Url :
                          currentDoc?.image4Url;
                    const tempFile = slot === 1 ? tempDocImage :
                      slot === 2 ? tempDocImage2 :
                        slot === 3 ? tempDocImage3 :
                          tempDocImage4;

                    return (
                      <div key={slot} className="space-y-2">
                        <Label className="flex justify-between">
                          Image {slot}
                          {existingUrl && (
                            <Badge variant="outline" className="text-[10px] h-4">Existing</Badge>
                          )}
                        </Label>
                        <div className="relative group aspect-video rounded-lg border-2 border-dashed border-indigo-200 bg-indigo-50/30 flex flex-col items-center justify-center overflow-hidden transition-all hover:border-indigo-400">
                          {tempFile ? (
                            <div className="relative w-full h-full">
                              <img
                                src={URL.createObjectURL(tempFile)}
                                alt={`Slot ${slot}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    if (slot === 1) setTempDocImage(null);
                                    else if (slot === 2) setTempDocImage2(null);
                                    else if (slot === 3) setTempDocImage3(null);
                                    else if (slot === 4) setTempDocImage4(null);
                                  }}
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                          ) : existingUrl ? (
                            <div className="relative w-full h-full">
                              <img
                                src={existingUrl}
                                alt={`Slot ${slot}`}
                                className="w-full h-full object-cover opacity-60"
                              />
                              <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => window.open(existingUrl, "_blank")}
                                  className="shadow-sm"
                                >
                                  View Current
                                </Button>
                                <Label
                                  htmlFor={`upload-${slot}`}
                                  className="cursor-pointer bg-white/80 hover:bg-white px-3 py-1 rounded-md text-sm font-medium transition-colors"
                                >
                                  Replace New
                                </Label>
                              </div>
                            </div>
                          ) : (
                            <Label
                              htmlFor={`upload-${slot}`}
                              className="flex flex-col items-center cursor-pointer text-indigo-400 group-hover:text-indigo-600"
                            >
                              <Plus className="h-8 w-8 mb-2" />
                              <span className="text-sm font-medium">Add Image</span>
                            </Label>
                          )}
                        </div>
                        <input
                          id={`upload-${slot}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageChange(e, slot)}
                        />
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
            </ScrollArea>

            <DialogFooter className="p-6 border-t mt-auto">
              <Button
                variant="outline"
                onClick={handleCancelEdit}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={() => editingDocId && handleUpdateDocument(editingDocId)}
                disabled={isLoading}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white min-w-[120px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </Tabs>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="mr-2 text-[#7569F6] hover:text-[#935DF6] hover:bg-[#7569F6]/10"
          >
            <Link href="/">
              <>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </>
            </Link>
          </Button>
          <h1 className="text-xl md:text-2xl font-bold text-[#7569F6] flex items-center">
            <RefreshCw className="h-6 w-6 mr-2 text-[#7569F6]" />
            Renewal Documents
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search documents..."
              className="pl-8 border-gray-300 focus:border-[#7569F6] focus:ring-[#7569F6]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select
              onValueChange={handleFilterChange}
              value={currentFilter}
            // No disabled state (filters work instantly)
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Renewal">Needs Renewal</SelectItem>
                <SelectItem value="Overdue">Overdue</SelectItem>
                <SelectItem value="Today">Today</SelectItem>
                <SelectItem value="Upcoming">Upcoming</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              className="border-[#7569F6] text-[#7569F6] hover:bg-[#7569F6]/10 hover:text-[#7569F6]"
              asChild
            >
              <Link href="/documents/add">
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New
                </>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="hidden md:block">
            <Card className="shadow-sm border-[#7569F6]/20">
              <CardHeader className="bg-[#7569F6]/5 border-b border-[#7569F6]/20 p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base md:text-lg text-[#7569F6] flex items-center">
                    <RefreshCw className="h-5 w-5 mr-2 text-[#7569F6] flex-shrink-0" />
                    {currentFilter === "Renewal"
                      ? "Documents Needing Renewal"
                      : currentFilter === "Overdue"
                        ? "Overdue Renewals"
                        : currentFilter === "Today"
                          ? "Renewals Due Today"
                          : "Upcoming Renewals"}
                  </CardTitle>
                  {currentFilter === "Renewal" && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-[#935DF6] mr-1"></div>
                        <span className="text-xs">Upcoming</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-yellow-400 mr-1"></div>
                        <span className="text-xs">Today</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
                        <span className="text-xs">Overdue</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-[#7569F6]/5">
                      <TableRow>
                        <TableHead className="text-right p-2 md:p-4">
                          Actions
                        </TableHead>
                        <TableHead className="p-2 md:p-4">Serial No</TableHead>
                        <TableHead className="p-2 md:p-4">
                          Document Name
                        </TableHead>
                        <TableHead className="hidden md:table-cell p-2 md:p-4">
                          Document Type
                        </TableHead>
                        <TableHead className="hidden md:table-cell p-2 md:p-4">
                          Category
                        </TableHead>
                        <TableHead className="hidden md:table-cell p-2 md:p-4">
                          Name
                        </TableHead>
                        <TableHead className="hidden lg:table-cell p-2 md:p-4">
                          Entry Date
                        </TableHead>
                        <TableHead className="hidden md:table-cell p-2 md:p-4">
                          Renewal
                        </TableHead>
                        <TableHead className="hidden md:table-cell p-2 md:p-4">
                          Image
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDocuments.length > 0 ? (
                        filteredDocuments.map((doc) => (
                          <TableRow
                            key={doc.id}
                            className="hover:bg-[#7569F6]/5"
                          >
                            <TableCell className="text-right p-2 md:p-4">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-[#7569F6] hover:bg-[#7569F6]/10"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Open menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="border-[#7569F6]/20"
                                >
                                  <DropdownMenuItem
                                    className="cursor-pointer text-[#7569F6] hover:bg-[#7569F6]/10"
                                    onClick={() =>
                                      handleDownloadDocument(
                                        doc.imageUrl,
                                        doc.name
                                      )
                                    }
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                  </DropdownMenuItem>
                                  {userRole?.toLowerCase() === "admin" &&
                                    isRenewalExpired(doc.renewalDate) && (
                                      <DropdownMenuItem
                                        className="cursor-pointer text-[#7569F6] hover:bg-[#7569F6]/10"
                                        onClick={() =>
                                          handleEditRenewalClick(doc)
                                        }
                                      >
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Update Renewal
                                      </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                            <TableCell className="p-2 md:p-4 font-mono text-sm">
                              {doc.serialNo || "-"}
                            </TableCell>
                            <TableCell className="p-2 md:p-4">
                              <div className="flex items-center min-w-0">
                                {doc.category === "Personal" ? (
                                  <User className="h-4 w-4 mr-2 text-[#7569F6] flex-shrink-0" />
                                ) : doc.category === "Company" ? (
                                  <Briefcase className="h-4 w-4 mr-2 text-[#5477F6] flex-shrink-0" />
                                ) : (
                                  <Users className="h-4 w-4 mr-2 text-[#935DF6] flex-shrink-0" />
                                )}
                                <div className="min-w-0">
                                  <div className="font-medium truncate text-sm md:text-base">
                                    {doc.name}
                                  </div>
                                  <div className="md:hidden text-xs text-gray-500 truncate">
                                    {doc.serialNo} • {doc.category} •{" "}
                                    {doc.company}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell p-2 md:p-4">
                              {doc.documentType || "-"}
                            </TableCell>
                            <TableCell className="hidden md:table-cell p-2 md:p-4">
                              <Badge
                                className={`${doc.category === "Personal"
                                  ? "bg-[#7569F6]/10 text-[#7569F6]"
                                  : doc.category === "Company"
                                    ? "bg-[#5477F6]/10 text-[#5477F6]"
                                    : "bg-[#935DF6]/10 text-[#935DF6]"
                                  }`}
                              >
                                {doc.category || "N/A"}
                              </Badge>
                            </TableCell>
                            {/* <TableCell className="hidden md:table-cell p-2 md:p-4">
                              {doc.company || "-"}
                            </TableCell> */}
                            <TableCell className="hidden md:table-cell p-2 md:p-4">
                              {doc.personName || "-"}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell p-2 md:p-4 font-mono text-sm">
                              {doc.timestamp
                                ? formatDateTimeDisplay(doc.timestamp)
                                : "-"}
                            </TableCell>
                            <TableCell className="hidden md:table-cell p-2 md:p-4">
                              {doc.needsRenewal ? (
                                <div className="flex items-center">
                                  <Badge
                                    className={`${getRenewalStatus(doc.renewalDate) ===
                                      "overdue"
                                      ? "bg-red-100 text-red-800" // Expired
                                      : getRenewalStatus(doc.renewalDate) ===
                                        "today"
                                        ? "bg-yellow-100 text-yellow-800" // Today
                                        : "bg-[#935DF6]/10 text-[#935DF6]" // Upcoming
                                      } flex items-center gap-1`}
                                  >
                                    <RefreshCw className="h-3 w-3" />
                                    <span className="font-mono text-xs">
                                      {doc.renewalDate
                                        ? doc.renewalDate.includes(" ")
                                          ? doc.renewalDate
                                          : `${doc.renewalDate} 00:00`
                                        : "Required"}
                                    </span>
                                  </Badge>
                                </div>
                              ) : (
                                <span className="text-gray-500 text-sm">-</span>
                              )}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell p-2 md:p-4">
                              <div className="flex flex-wrap gap-1">
                                {doc.imageUrl && (
                                  <button
                                    type="button"
                                    onClick={() => handleViewImage(doc.imageUrl)}
                                    className="inline-block"
                                    title="Image 1"
                                  >
                                    <ImageIcon className="h-5 w-5 text-[#5477F6] hover:text-[#935DF6]" />
                                  </button>
                                )}
                                {doc.image2Url && (
                                  <button
                                    type="button"
                                    onClick={() => handleViewImage(doc.image2Url)}
                                    className="inline-block"
                                    title="Image 2"
                                  >
                                    <ImageIcon className="h-5 w-5 text-blue-600 hover:text-blue-800" />
                                  </button>
                                )}
                                {doc.image3Url && (
                                  <button
                                    type="button"
                                    onClick={() => handleViewImage(doc.image3Url)}
                                    className="inline-block"
                                    title="Image 3"
                                  >
                                    <ImageIcon className="h-5 w-5 text-green-600 hover:text-green-800" />
                                  </button>
                                )}
                                {doc.image4Url && (
                                  <button
                                    type="button"
                                    onClick={() => handleViewImage(doc.image4Url)}
                                    className="inline-block"
                                    title="Image 4"
                                  >
                                    <ImageIcon className="h-5 w-5 text-purple-600 hover:text-purple-800" />
                                  </button>
                                )}
                                {!doc.imageUrl && !doc.image2Url && !doc.image3Url && !doc.image4Url && (
                                  <span className="text-xs text-gray-400">No images</span>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={13}
                            className="text-center py-8 text-gray-500"
                          >
                            {searchTerm || currentFilter !== "All" ? (
                              <>No documents found matching your criteria.</>
                            ) : (
                              <>
                                <div className="flex flex-col items-center justify-center py-8">
                                  <FileText className="h-12 w-12 text-gray-300 mb-4" />
                                  <p className="mb-4">No documents found.</p>
                                  <Button
                                    className="bg-[#7569F6] hover:bg-[#935DF6]"
                                    asChild
                                  >
                                    <Link href="/documents/add">
                                      <>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add New Document
                                      </>
                                    </Link>
                                  </Button>
                                </div>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:hidden mt-4">
            {filteredDocuments.length > 0 && (
              <div className="space-y-3">
                {filteredDocuments.map((doc) => (
                  <Card
                    key={doc.id}
                    className="shadow-sm overflow-hidden border-[#7569F6]/20"
                  >
                    <div
                      className={`p-3 border-l-4 ${doc.category === "Personal"
                        ? "border-l-[#7569F6]"
                        : doc.category === "Company"
                          ? "border-l-[#5477F6]"
                          : "border-l-[#935DF6]"
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center min-w-0">
                          {doc.category === "Personal" ? (
                            <User className="h-5 w-5 mr-2 text-[#7569F6] flex-shrink-0" />
                          ) : doc.category === "Company" ? (
                            <Briefcase className="h-5 w-5 mr-2 text-[#5477F6] flex-shrink-0" />
                          ) : (
                            <Users className="h-5 w-5 mr-2 text-[#935DF6] flex-shrink-0" />
                          )}
                          <div className="min-w-0">
                            <div className="font-medium truncate text-sm">
                              {doc.name}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              Serial: {doc.serialNo || "N/A"} • {doc.category} •{" "}
                              {doc.documentType}
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-[#7569F6] hover:bg-[#7569F6]/10"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="border-[#7569F6]/20"
                          >
                            <DropdownMenuItem
                              className="cursor-pointer text-[#7569F6] hover:bg-[#7569F6]/10"
                              onClick={() =>
                                handleDownloadDocument(doc.imageUrl, doc.name)
                              }
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            {userRole?.toLowerCase() === "admin" &&
                              isRenewalExpired(doc.renewalDate) && (
                                <DropdownMenuItem
                                  className="cursor-pointer text-[#7569F6] hover:bg-[#7569F6]/10"
                                  onClick={() => handleEditRenewalClick(doc)}
                                >
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Update Renewal
                                </DropdownMenuItem>
                              )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="mt-2 pl-10">
                        <div className="text-xs text-gray-500 truncate font-mono">
                          {doc.timestamp
                            ? formatDateTimeDisplay(doc.timestamp)
                            : "No Date"}
                        </div>
                        {doc.email && (
                          <div className="text-xs text-gray-500 truncate">
                            {doc.email}
                          </div>
                        )}
                        {doc.mobile && (
                          <div className="text-xs text-gray-500 truncate">
                            {doc.mobile}
                          </div>
                        )}
                        {doc.needsRenewal && (
                          <Badge
                            className={`${getRenewalStatus(doc.renewalDate) === "overdue"
                              ? "bg-red-100 text-red-800" // Expired
                              : getRenewalStatus(doc.renewalDate) === "today"
                                ? "bg-yellow-100 text-yellow-800" // Today
                                : "bg-[#935DF6]/10 text-[#935DF6]" // Upcoming
                              } flex items-center gap-1 mt-2`}
                          >
                            <RefreshCw className="h-3 w-3" />
                            <span className="font-mono text-xs">
                              {doc.renewalDate
                                ? doc.renewalDate.includes(" ")
                                  ? doc.renewalDate
                                  : `${doc.renewalDate} 00:00`
                                : "Required"}
                            </span>
                          </Badge>
                        )}
                        <div className="flex flex-wrap gap-2 mt-1">
                          {doc.imageUrl && (
                            <button
                              onClick={() => handleViewImage(doc.imageUrl)}
                              className="flex items-center text-xs text-[#5477F6]"
                            >
                              <ImageIcon className="h-3 w-3 mr-1" />
                              Img1
                            </button>
                          )}
                          {doc.image2Url && (
                            <button
                              onClick={() => handleViewImage(doc.image2Url)}
                              className="flex items-center text-xs text-blue-500"
                            >
                              <ImageIcon className="h-3 w-3 mr-1" />
                              Img2
                            </button>
                          )}
                          {doc.image3Url && (
                            <button
                              onClick={() => handleViewImage(doc.image3Url)}
                              className="flex items-center text-xs text-green-500"
                            >
                              <ImageIcon className="h-3 w-3 mr-1" />
                              Img3
                            </button>
                          )}
                          {doc.image4Url && (
                            <button
                              onClick={() => handleViewImage(doc.image4Url)}
                              className="flex items-center text-xs text-purple-500"
                            >
                              <ImageIcon className="h-3 w-3 mr-1" />
                              Img4
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
