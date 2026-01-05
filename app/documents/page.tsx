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
  Share2,
  Smartphone,
  Trash2,
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
import { EmailShareDialog } from "@/components/email-share-dialog";
import { WhatsAppShareDialog } from "@/components/whatsapp-share-dialog";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  sourceSheet: string;
  isDeleted: boolean;
  // NEW: Additional image URLs
  image2Url: string;
  image3Url: string;
  image4Url: string;
  subCategory: string;
}

type DocumentFilter = "All" | "Personal" | "Company" | "Director" | "Renewal";

const formatDateToDDMMYYYY = (dateString: string): string => {
  if (!dateString) return "";

  try {
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

    return `${day}/${month}/${year} || ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
};

const formatImageUrl = (url: string): string => {
  if (!url) return "";
  if (url.includes("uc?export=view")) return url;

  let fileId = "";
  if (url.includes("drive.google.com/file/d/")) {
    fileId = url.split("/file/d/")[1].split("/")[0];
  } else if (url.includes("id=")) {
    const matches = url.match(/[?&]id=([^&]+)/);
    if (matches && matches[1]) {
      fileId = matches[1];
    }
  } else if (url.length > 20 && !url.includes("/") && !url.includes(".")) {
    // Likely a direct file ID
    fileId = url;
  }

  if (fileId) {
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }
  return url;
};

const isDatePastToday = (dateString: string): boolean => {
  if (!dateString) return false;

  try {
    // Parse the date in DD/MM/YYYY HH:mm format
    const [datePart, timePart] = dateString.split(" ");
    const [day, month, year] = datePart.split("/").map(Number);

    const renewalDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time part for accurate comparison

    return renewalDate < today;
  } catch (error) {
    console.error("Error comparing dates:", error);
    return false;
  }
};

const LoadingSpinner = () => (
  <div className="absolute inset-0 flex items-center justify-center z-10 bg-white">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn, userRole, userName } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [shareMethod, setShareMethod] = useState<"email" | "whatsapp" | "both" | null>(
    null
  );
  const [documentTypes, setDocumentTypes] = useState<string[]>([]);
  const [whatsappPopupOpen, setWhatsappPopupOpen] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>("All");
  const [mounted, setMounted] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<DocumentFilter>("All");
  const [editingRenewalDocId, setEditingRenewalDocId] = useState<number | null>(
    null
  );
  const [tempRenewalDate, setTempRenewalDate] = useState<Date | undefined>(
    undefined
  );
  const [tempNeedsRenewal, setTempNeedsRenewal] = useState<boolean>(false);
  const [emailData, setEmailData] = useState({
    to: "",
    cc: "",
    name: "",
    subject: "",
    message: "",
  });
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);

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

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    setMounted(true);
    setCurrentUserRole(userRole);
    setCurrentUserName(userName);

    const search = searchParams.get("search");
    if (search) {
      setSearchTerm(search);
    }

    const filter = searchParams.get("filter") as DocumentFilter;
    if (filter && ["Personal", "Company", "Director", "Renewal"].includes(filter)) {
      setCurrentFilter(filter);
    }

    // Only fetch documents if we haven't loaded them yet
    if (documents.length === 0) {
      fetchDocuments();
    }
  }, [isLoggedIn, router, searchParams, userRole, userName]);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const [documentsResponse, renewalsResponse, masterResponse] =
        await Promise.all([
          fetch(
            "https://script.google.com/macros/s/AKfycbxPsSSePFSXwsRFgRNYv4xUn205zI4hgeW04CTaqK7p3InSM1TKFCmTBqM5bNFZfHOIJA/exec?sheet=Documents"
          ),
          fetch(
            "https://script.google.com/macros/s/AKfycbxPsSSePFSXwsRFgRNYv4xUn205zI4hgeW04CTaqK7p3InSM1TKFCmTBqM5bNFZfHOIJA/exec?sheet=Updated Renewal"
          ),
          fetch(
            "https://script.google.com/macros/s/AKfycbxPsSSePFSXwsRFgRNYv4xUn205zI4hgeW04CTaqK7p3InSM1TKFCmTBqM5bNFZfHOIJA/exec?sheet=Master"
          ),
        ]);

      const [documentsData, renewalsData, masterData] = await Promise.all([
        documentsResponse.json(),
        renewalsResponse.json(),
        masterResponse.json(),
      ]);

      // Process document types from Master sheet
      if (masterData.success && masterData.data) {
        const types = masterData.data
          .slice(1)
          .map((row: any[]) => row[0])
          .filter((type: string) => type)
          .filter((value: string, index: number, self: string[]) =>
            self.indexOf(value) === index
          );
        setDocumentTypes(types);
      }

      let allDocs: Document[] = [];
      const serialNoMap = new Map<string, Document>();

      // Helper function to process and merge documents
      const processDocument = (doc: Document) => {
        if (!doc.serialNo) {
          allDocs.push(doc);
          return;
        }

        const existingDoc = serialNoMap.get(doc.serialNo);
        if (existingDoc) {
          const existingDate = new Date(existingDoc.timestamp);
          const newDate = new Date(doc.timestamp);

          if (newDate > existingDate) {
            const mergedDoc: Document = {
              ...existingDoc,
              ...doc,
              timestamp: doc.timestamp,
              tags: [...new Set([...existingDoc.tags, ...doc.tags])],
              name: doc.name || existingDoc.name,
              documentType: doc.documentType || existingDoc.documentType,
              category: doc.category || existingDoc.category,
              company: doc.company || existingDoc.company,
              personName: doc.personName || existingDoc.personName,
              needsRenewal: doc.needsRenewal || existingDoc.needsRenewal,
              renewalDate: doc.renewalDate || existingDoc.renewalDate,
              imageUrl: doc.imageUrl || existingDoc.imageUrl,
              email: doc.email || existingDoc.email,
              mobile: doc.mobile || existingDoc.mobile,
              image2Url: doc.image2Url || existingDoc.image2Url,
              image3Url: doc.image3Url || existingDoc.image3Url,
              image4Url: doc.image4Url || existingDoc.image4Url,
              subCategory: doc.subCategory || existingDoc.subCategory,
            };

            serialNoMap.set(doc.serialNo, mergedDoc);
            const index = allDocs.findIndex((d) => d.id === existingDoc.id);
            if (index !== -1) {
              allDocs[index] = mergedDoc;
            }
          }
        } else {
          serialNoMap.set(doc.serialNo, doc);
          allDocs.push(doc);
        }
      };

      // Process Documents sheet - UPDATED to get additional images
      if (documentsData.success && documentsData.data) {
        const documentsSheetData = documentsData.data
          .slice(1)
          .map((doc: any[], index: number) => {
            const isDeleted =
              doc[14] &&
              (doc[14] === "DELETED" ||
                doc[14] === "Deleted" ||
                doc[14] === "deleted");

            return {
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
              imageUrl: doc[11] || "", // Column L - Image1
              email: doc[12] || "",
              mobile: doc[13] ? String(doc[13]) : "",
              sourceSheet: "Documents",
              isDeleted: isDeleted,
              // NEW: Fetch additional images based on your header
              image2Url: doc[17] || "", // Column R - Image2
              image3Url: doc[18] || "", // Column S - Image3
              image4Url: doc[19] || "", // Column T - Image4
              subCategory: doc[15] || "", // Column P - Sub Category
            };
          })
          .filter((doc) => !doc.isDeleted);

        documentsSheetData.forEach(processDocument);
      }

      // Process Updated Renewal sheet - UPDATED to get additional images
      if (renewalsData.success && renewalsData.data) {
        const renewalDocs = renewalsData.data
          .slice(1)
          .map((doc: any[], index: number) => {
            const renewalInfo = doc[9] || "";
            let needsRenewal = false;
            let renewalDate = "";

            if (renewalInfo) {
              const parsedDate = new Date(renewalInfo);
              if (!isNaN(parsedDate.getTime())) {
                needsRenewal = true;
                renewalDate = formatDateToDDMMYYYY(renewalInfo);
              } else {
                needsRenewal =
                  renewalInfo === "TRUE" ||
                  renewalInfo === "Yes" ||
                  renewalInfo === "Requires Renewal" ||
                  renewalInfo.toLowerCase().includes("renew");
              }
            }

            const isDeleted =
              doc[14] &&
              (doc[14] === "DELETED" ||
                doc[14] === "Deleted" ||
                doc[14] === "deleted");

            return {
              id: index + 1000000,
              timestamp: doc[0]
                ? new Date(doc[0]).toISOString()
                : new Date().toISOString(),
              serialNo: doc[1] || "",
              name: doc[3] || "",
              documentType: "Renewal",
              category: doc[5] || "",
              company: doc[6] || "",
              tags: doc[7]
                ? String(doc[7])
                  .split(",")
                  .map((tag: string) => tag.trim())
                : [],
              personName: doc[10] || "",
              needsRenewal: needsRenewal,
              renewalDate: renewalDate,
              imageUrl: doc[13] || "", // Column N - Image1 (in Renewal sheet)
              email: doc[11] || "",
              mobile: doc[12] ? String(doc[12]) : "",
              sourceSheet: "Updated Renewal",
              isDeleted: isDeleted,
              // NEW: Fetch additional images for Renewal sheet
              image2Url: doc[14] || "", // Column O - Image2
              image3Url: doc[15] || "", // Column P - Image3
              image4Url: doc[16] || "", // Column Q - Image4
              subCategory: "", // Sub category is usually not in Renewal sheet
            };
          })
          .filter((doc) => !doc.isDeleted);

        renewalDocs.forEach(processDocument);
      }

      allDocs.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      allDocs = allDocs.map((doc, index) => ({ ...doc, id: index + 1 }));

      // If user is admin, show all documents
      if (userRole && userRole.toString().toLowerCase() === "admin") {
        setDocuments(allDocs);
        return;
      }

      // For non-admin users, filter documents by their name
      if (userName) {
        allDocs = allDocs.filter(
          (doc) =>
            doc.personName &&
            doc.personName.toLowerCase() === userName.toLowerCase()
        );
      }

      setDocuments(allDocs);
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

  const handleDeleteDocument = async (docId: number) => {
    try {
      setIsLoading(true);
      const docToDelete = documents.find((doc) => doc.id === docId);
      if (!docToDelete) {
        toast({
          title: "Error",
          description: "Document not found",
          variant: "destructive",
        });
        return;
      }

      // Create FormData for more reliable data sending
      const formData = new FormData();
      formData.append("action", "markDeleted");
      formData.append("sheetName", docToDelete.sourceSheet);
      formData.append("serialNo", docToDelete.serialNo);
      formData.append("timestamp", docToDelete.timestamp);
      formData.append("deletionMarker", "DELETED");

      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbxPsSSePFSXwsRFgRNYv4xUn205zI4hgeW04CTaqK7p3InSM1TKFCmTBqM5bNFZfHOIJA/exec",
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();

      if (result.success) {
        // Update local state to reflect deletion
        setDocuments((prevDocs) => prevDocs.filter((doc) => doc.id !== docId));
        setSelectedDocs((prevSelected) =>
          prevSelected.filter((id) => id !== docId)
        );

        toast({
          title: "Success",
          description: "Document marked as deleted",
        });
      } else {
        throw new Error(result.message || "Failed to mark document as deleted");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete document",
        variant: "destructive",
      });
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

    // Extract file ID from Google Drive URL
    const fileId = imageUrl.match(/[-\w]{25,}/)?.[0];

    if (!fileId) {
      // Fallback to direct download if not a Google Drive URL
      const link = document.createElement("a");
      link.href = imageUrl;
      link.setAttribute(
        "download",
        `${documentName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.jpg` ||
        "document.jpg"
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Use Google Drive's download URL
      window.open(
        `https://drive.google.com/uc?export=download&id=${fileId}`,
        "_blank",
        "noopener,noreferrer"
      );
    }

    toast({
      title: "Download started",
      description: `Downloading ${documentName}`,
    });
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

      // Format renewal date properly for sheet
      const formattedRenewalDate = tempRenewalDate ?
        formatDateToDDMMYYYY(tempRenewalDate.toISOString()) : "";

      const formData = new FormData();
      formData.append("action", "updateDocument");
      formData.append("sheetName", docToUpdate.sourceSheet);
      formData.append("serialNo", docToUpdate.serialNo);

      const isRenewalSheet = docToUpdate.sourceSheet === "Updated Renewal";

      // Document fields with explicit column mapping
      formData.append("documentName", tempDocName);
      formData.append("documentNameColumn", isRenewalSheet ? "3" : "2"); // Col D for Renewal, Col C for Documents

      formData.append("documentType", tempDocType);
      formData.append("documentTypeColumn", isRenewalSheet ? "4" : "3"); // No Type in Renewal really, but mapping Col E as placeholder

      formData.append("category", tempCategory);
      formData.append("categoryColumn", isRenewalSheet ? "5" : "4"); // Column F for Renewal, Column E for Documents

      formData.append("personName", tempPersonName);
      formData.append("personNameColumn", isRenewalSheet ? "10" : "7"); // Column K for Renewal, Column H for Documents

      formData.append("subCategory", tempSubCategory);
      formData.append("subCategoryColumn", "15"); // Column P (Assuming same for now, or N/A)

      // Images
      formData.append("imageUrl", updatedImageUrl);
      formData.append("imageUrlColumn", isRenewalSheet ? "13" : "11"); // Column N for Renewal, Column L for Documents

      formData.append("image2Url", updatedImage2Url);
      formData.append("image2UrlColumn", isRenewalSheet ? "14" : "17"); // Column O for Renewal, Column R for Documents

      formData.append("image3Url", updatedImage3Url);
      formData.append("image3UrlColumn", isRenewalSheet ? "15" : "18"); // Column P for Renewal, Column S for Documents

      formData.append("image4Url", updatedImage4Url);
      formData.append("image4UrlColumn", isRenewalSheet ? "16" : "19"); // Column Q for Renewal, Column T for Documents

      // Renewal data with explicit column mapping
      formData.append("renewalDate", formattedRenewalDate);
      formData.append("renewalDateColumn", "9"); // Column J in both (usually)

      formData.append("needsRenewal", tempNeedsRenewal ? "Yes" : "No");
      formData.append("needsRenewalColumn", "8"); // Column I in both (usually)

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
  };

  const handleCancelEdit = () => {
    setEditingDocId(null);
    resetTempStates();
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

  const handleEditClick = (doc: Document) => {
    setEditingDocId(doc.id);
    setTempDocName(doc.name);
    setTempDocType(doc.documentType);
    setTempCategory(doc.category);
    setTempPersonName(doc.personName || "");
    setTempSubCategory(doc.subCategory || "");
    setTempNeedsRenewal(doc.needsRenewal);
    setTempRenewalDate(
      doc.renewalDate
        ? new Date(doc.renewalDate.split("/").reverse().join("-"))
        : undefined
    );
    setTempDocImage(null);
    setTempDocImage2(null);
    setTempDocImage3(null);
    setTempDocImage4(null);
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

  const filteredDocuments = documents
    .filter((doc) => !doc.isDeleted)
    .filter((doc) => {
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

      const matchesFilter =
        currentFilter === "All" ||
        (currentFilter === "Renewal" && doc.needsRenewal) ||
        doc.category === currentFilter;

      const matchesDocumentType =
        selectedDocumentType === "All" ||
        doc.documentType === selectedDocumentType;

      return matchesSearch && matchesFilter && matchesDocumentType;
    });

  const selectedDocuments = documents.filter((doc) =>
    selectedDocs.includes(doc.id)
  );

  const handleCheckboxChange = (id: number) => {
    setSelectedDocs((prev) =>
      prev.includes(id) ? prev.filter((docId) => docId !== id) : [...prev, id]
    );
  };

  // Modified email share button click handler with auto-fill functionality
  const handleEmailShareClick = () => {
    if (selectedDocs.length === 0) {
      toast({
        title: "No documents selected",
        description: "Please select at least one document to share",
        variant: "destructive",
      });
      return;
    }
    // Do not autofill any email fields
    setEmailData({
      to: "",
      name: "",
      subject: "",
      message: "",
    });
    setShareMethod("email");
  };

  // WhatsApp share button click handler
  const handleWhatsAppShareClick = () => {
    if (selectedDocs.length === 0) {
      toast({
        title: "No documents selected",
        description: "Please select at least one document to share",
        variant: "destructive",
      });
      return;
    }

    // Do not autofill any mobile number fields
    setWhatsappNumber("");
    setShareMethod("whatsapp");
  };

  // Share both button click handler
  const handleShareBothClick = () => {
    if (selectedDocs.length === 0) {
      toast({
        title: "No documents selected",
        description: "Please select at least one document to share",
        variant: "destructive",
      });
      return;
    }

    setEmailData({
      to: "",
      cc: "",
      name: "",
      subject: "",
      message: "",
    });
    setWhatsappNumber(""); // Do not autofill mobile number
    setShareMethod("both");
  };

  const handleShareEmail = async (emailData: {
    to: string;
    cc: string;
    name: string;
    subject: string;
    message: string;
  }) => {
    try {
      setIsLoading(true);

      // Create FormData
      const formData = new FormData();
      formData.append("action", "shareViaEmail");
      formData.append("recipientEmail", emailData.to);
      formData.append("recipientName", emailData.name || "");
      formData.append("subject", emailData.subject);
      formData.append("message", emailData.message);
      // Add CC field
      if (emailData.cc) {
        formData.append("cc", emailData.cc);
      }
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
            image2Url: doc.image2Url,
            image3Url: doc.image3Url,
            image4Url: doc.image4Url,
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

      // Just assume success if we get any response
      toast({
        title: "Success",
        description: "Email sent successfully!",
      });
      setSelectedDocs([]);
      return true;
    } catch (error) {
      console.error("Error sending email:", error);
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

  const handleShareWhatsApp = async (number: string) => {
    try {
      setIsLoading(true);

      // Format the number properly (remove all non-digit characters)
      const formattedNumber = number.replace(/\D/g, '');

      // Create FormData
      const formData = new FormData();
      formData.append("action", "shareViaWhatsApp");
      formData.append("recipientNumber", formattedNumber);

      // Include all document details plus the recipient number
      const documentsData = selectedDocuments.map((doc) => ({
        id: doc.id.toString(),
        name: doc.name,
        serialNo: doc.serialNo,
        documentType: doc.documentType,
        category: doc.category,
        imageUrl: doc.imageUrl,
        image2Url: doc.image2Url,
        image3Url: doc.image3Url,
        image4Url: doc.image4Url,
        sourceSheet: doc.sourceSheet,
      }));

      formData.append("documents", JSON.stringify(documentsData));

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
          description: `WhatsApp message prepared for ${formattedNumber}`,
        });
        return true;
      } else {
        throw new Error(result.message || "Failed to share via WhatsApp");
      }
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to share via WhatsApp",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareBoth = async (data: {
    emailData: {
      to: string;
      name: string;
      subject: string;
      message: string;
    };
    whatsappNumber: string;
  }) => {
    const emailSuccess = await handleShareEmail(data.emailData);
    const whatsappSuccess = await handleShareWhatsApp(data.whatsappNumber);

    if (emailSuccess && whatsappSuccess) {
      toast({
        title: "Success",
        description: "Documents shared via both email and WhatsApp!",
      });
    }
  };

  const handleFilterChange = (value: string) => {
    setCurrentFilter(value as DocumentFilter);
    const newSearchParams = new URLSearchParams(searchParams.toString());
    if (value === "All") {
      newSearchParams.delete("filter");
    } else {
      newSearchParams.set("filter", value);
    }
    router.push(`?${newSearchParams.toString()}`);
  };

  const handleEditRenewalClick = (doc: Document) => {
    setEditingRenewalDocId(doc.id);
    setTempRenewalDate(
      doc.renewalDate
        ? new Date(doc.renewalDate.split("/").reverse().join("-"))
        : undefined
    );
    setTempNeedsRenewal(doc.needsRenewal);
  };

  if (!mounted || !isLoggedIn) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 pt-16 md:pt-8 w-full max-w-[1600px] mx-auto bg-gradient-to-b from-indigo-50 to-white flex flex-col">
      <Toaster />

      {/* Fixed header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4 sticky top-0  z-10 py-2 border-b border-indigo-100">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="mr-2 text-indigo-700 hover:text-indigo-800 hover:bg-indigo-50"
          >
            <Link href="/">
              <>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </>
            </Link>
          </Button>
          <h1 className="text-xl md:text-2xl font-bold text-indigo-800 flex items-center">
            <FileText className="h-6 w-6 mr-2 text-indigo-600" />
            All Documents
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
          <Select
            onValueChange={(value) => setSelectedDocumentType(value)}
            value={selectedDocumentType}
            disabled={isLoading || documentTypes.length === 0}
          >
            <SelectTrigger className="w-[180px] border-indigo-300 focus:ring-indigo-500">
              <SelectValue placeholder="Document Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Document Types</SelectItem>
              {documentTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-indigo-500" />
            <Input
              placeholder="Search documents..."
              className="pl-8 border-indigo-300 focus:border-indigo-500 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select
              onValueChange={handleFilterChange}
              value={currentFilter}
              disabled={isLoading}
            >
              <SelectTrigger className="w-[180px] border-indigo-300 focus:ring-indigo-500">
                <SelectValue placeholder="Filter by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Documents</SelectItem>
                <SelectItem value="Personal">Personal</SelectItem>
                <SelectItem value="Company">Company</SelectItem>
                <SelectItem value="Director">Director</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2 flex-1 sm:flex-none">
              {currentUserRole?.toLowerCase() === "admin" && (
                <>
                  <Button
                    size="sm"
                    disabled={selectedDocs.length === 0 || isLoading}
                    onClick={handleEmailShareClick}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white flex-1 sm:flex-none"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Email</span>
                    <span className="sm:hidden">Email</span>
                  </Button>
                  <Button
                    size="sm"
                    disabled={selectedDocs.length === 0 || isLoading}
                    onClick={handleWhatsAppShareClick}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white flex-1 sm:flex-none"
                  >
                    <Smartphone className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">WhatsApp</span>
                    <span className="sm:hidden">WA</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        {isLoading && documents.length === 0 ? (
          <LoadingSpinner />
        ) : (
          <Card className="shadow-sm h-full flex flex-col border border-indigo-100 w-full">
            <CardHeader className="bg-indigo-50 border-b border-indigo-100 p-4 md:p-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base md:text-lg text-indigo-800 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-indigo-600 flex-shrink-0" />
                  {currentFilter === "All"
                    ? "All Documents"
                    : `${currentFilter} Documents`}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-indigo-300 text-indigo-700 hover:bg-white hover:text-indigo-800"
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
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-auto w-full">
              <Table className="w-full">
                <TableHeader className="bg-indigo-50 sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="w-12 p-2 md:p-4">
                      <Checkbox
                        checked={
                          selectedDocs.length > 0 &&
                          selectedDocs.length === filteredDocuments.length
                        }
                        onCheckedChange={() => {
                          if (selectedDocs.length === filteredDocuments.length) {
                            setSelectedDocs([]);
                          } else {
                            setSelectedDocs(filteredDocuments.map((doc) => doc.id));
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead className="w-20 p-2 md:p-4">Actions</TableHead>
                    <TableHead className="w-24 p-2 md:p-4">Serial No</TableHead>
                    <TableHead className="min-w-[180px] p-2 md:p-4">
                      Document Name
                    </TableHead>
                    <TableHead className="min-w-[120px] p-2 md:p-4">
                      Document Type
                    </TableHead>
                    <TableHead className="min-w-[100px] hidden md:table-cell p-2 md:p-4">
                      Category
                    </TableHead>
                    <TableHead className="min-w-[120px] hidden md:table-cell p-2 md:p-4">
                      Name
                    </TableHead>
                    <TableHead className="min-w-[180px] hidden md:table-cell p-2 md:p-4">
                      Renewal
                    </TableHead>
                    <TableHead className="w-24 hidden lg:table-cell p-2 md:p-4">
                      Images
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.length > 0 ? (
                    filteredDocuments.map((doc) => (
                      <TableRow
                        key={doc.id}
                        className="hover:bg-indigo-50/50"
                      >
                        <TableCell className="p-2 md:p-4">
                          <Checkbox
                            checked={selectedDocs.includes(doc.id)}
                            onCheckedChange={() =>
                              handleCheckboxChange(doc.id)
                            }
                          />
                        </TableCell>

                        <TableCell className="text-right p-2 md:p-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-indigo-600 hover:bg-indigo-50"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="border-indigo-100"
                            >
                              <DropdownMenuItem
                                className="cursor-pointer text-indigo-700 hover:bg-indigo-50"
                                onClick={() => handleEditClick(doc)}
                              >
                                <FileText className="h-4 w-4 mr-2 text-indigo-500" />
                                Edit
                              </DropdownMenuItem>
                              {currentUserRole?.toLowerCase() ===
                                "admin" && (
                                  <>
                                    <DropdownMenuItem
                                      className="cursor-pointer text-indigo-700 hover:bg-indigo-50"
                                      onClick={() => {
                                        if (selectedDocs.length === 0) {
                                          setSelectedDocs([doc.id]);
                                        }
                                        setEmailData({
                                          to: "",
                                          name: "",
                                          subject: "",
                                          message: "",
                                        });
                                        setShareMethod("email");
                                      }}
                                    >
                                      <Mail className="h-4 w-4 mr-2 text-indigo-500" />
                                      Email
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="cursor-pointer text-indigo-700 hover:bg-indigo-50"
                                      onClick={() => {
                                        if (selectedDocs.length === 0) {
                                          setSelectedDocs([doc.id]);
                                        }
                                        setWhatsappNumber("");
                                        setShareMethod("whatsapp");
                                      }}
                                    >
                                      <Smartphone className="h-4 w-4 mr-2 text-indigo-500" />
                                      WhatsApp
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="cursor-pointer text-indigo-700 hover:bg-indigo-50"
                                      onClick={() => {
                                        if (selectedDocs.length === 0) {
                                          setSelectedDocs([doc.id]);
                                        }
                                        setEmailData({
                                          to: "",
                                          name: "",
                                          subject: "",
                                          message: "",
                                        });
                                        setWhatsappNumber("");
                                        setShareMethod("both");
                                      }}
                                    >
                                      <Share2 className="h-4 w-4 mr-2 text-indigo-500" />
                                      Share Both
                                    </DropdownMenuItem>
                                  </>
                                )}
                              <DropdownMenuItem
                                className="cursor-pointer text-indigo-700 hover:bg-indigo-50"
                                onClick={() =>
                                  handleDownloadDocument(
                                    doc.imageUrl,
                                    doc.name
                                  )
                                }
                              >
                                <Download className="h-4 w-4 mr-2 text-indigo-500" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="cursor-pointer text-red-600 hover:bg-red-50 focus:text-red-600"
                                onClick={() => handleDeleteDocument(doc.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>

                        <TableCell className="p-2 md:p-4 font-mono text-sm">
                          {doc.serialNo || "-"}
                        </TableCell>
                        <TableCell className="p-2 md:p-4">
                          <div className="flex items-center min-w-0">
                            {doc.category === "Personal" ? (
                              <User className="h-4 w-4 mr-2 text-indigo-500 flex-shrink-0" />
                            ) : doc.category === "Company" ? (
                              <Briefcase className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0" />
                            ) : (
                              <Users className="h-4 w-4 mr-2 text-purple-500 flex-shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                              <div>
                                <div className="font-medium truncate text-sm md:text-base">
                                  {doc.name}
                                </div>
                                <div className="md:hidden text-xs text-gray-500 truncate">
                                  {doc.serialNo} • {doc.category} • {doc.company}
                                </div>
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="p-2 md:p-4">
                          <Badge
                            variant="outline"
                            className="text-xs bg-indigo-50 text-indigo-700"
                          >
                            {doc.documentType || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell p-2 md:p-4">
                          <Badge
                            className={`${doc.category === "Personal"
                              ? "bg-indigo-100 text-indigo-800"
                              : doc.category === "Company"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-purple-100 text-purple-800"
                              }`}
                          >
                            {doc.category || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell p-2 md:p-4">
                          {doc.personName || "-"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell p-2 md:p-4">
                          {doc.needsRenewal ? (
                            <div className="flex items-center">
                              <Badge
                                className={`flex items-center gap-1 ${isDatePastToday(doc.renewalDate)
                                  ? "bg-red-100 text-red-800"
                                  : "bg-amber-100 text-amber-800"
                                  }`}
                              >
                                <RefreshCw className="h-3 w-3" />
                                <span
                                  className={`font-mono text-xs ${isDatePastToday(doc.renewalDate)
                                    ? "text-red-600"
                                    : ""
                                    }`}
                                >
                                  {doc.renewalDate || "RENEWAL"}
                                </span>
                              </Badge>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell p-2 md:p-4">
                          <div className="flex flex-wrap gap-1">
                            {doc.imageUrl && (
                              <a
                                href={doc.imageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block"
                                title="Image 1"
                              >
                                <ImageIcon className="h-5 w-5 text-indigo-600 hover:text-indigo-800" />
                              </a>
                            )}
                            {doc.image2Url && (
                              <a
                                href={doc.image2Url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block"
                                title="Image 2"
                              >
                                <ImageIcon className="h-5 w-5 text-blue-600 hover:text-blue-800" />
                              </a>
                            )}
                            {doc.image3Url && (
                              <a
                                href={doc.image3Url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block"
                                title="Image 3"
                              >
                                <ImageIcon className="h-5 w-5 text-green-600 hover:text-green-800" />
                              </a>
                            )}
                            {doc.image4Url && (
                              <a
                                href={doc.image4Url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block"
                                title="Image 4"
                              >
                                <ImageIcon className="h-5 w-5 text-purple-600 hover:text-purple-800" />
                              </a>
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
                        colSpan={12}
                        className="text-center py-8 text-gray-500"
                      >
                        {searchTerm || currentFilter !== "All" ? (
                          <>No documents found matching your criteria.</>
                        ) : (
                          <>
                            <div className="flex flex-col items-center justify-center py-8">
                              <FileText className="h-12 w-12 text-indigo-200 mb-4" />
                              <p className="mb-4">No documents found.</p>
                              <Button
                                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
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
            </CardContent>
          </Card>
        )}
      </div>

      {/* Mobile view */}
      <div className="md:hidden mt-4">
        {filteredDocuments.length > 0 && (
          <div className="space-y-3">
            {filteredDocuments.map((doc) => (
              <Card
                key={doc.id}
                className="shadow-sm overflow-hidden border-indigo-100"
              >
                <div
                  className={`p-3 border-l-4 ${doc.category === "Personal"
                    ? "border-l-indigo-500"
                    : doc.category === "Company"
                      ? "border-l-blue-500"
                      : "border-l-purple-500"
                    } flex items-center justify-between`}
                >
                  <div className="flex items-center min-w-0">
                    <Checkbox
                      checked={selectedDocs.includes(doc.id)}
                      onCheckedChange={() => handleCheckboxChange(doc.id)}
                      className="mr-3"
                    />
                    {doc.category === "Personal" ? (
                      <User className="h-5 w-5 mr-2 text-indigo-500 flex-shrink-0" />
                    ) : doc.category === "Company" ? (
                      <Briefcase className="h-5 w-5 mr-2 text-blue-500 flex-shrink-0" />
                    ) : (
                      <Users className="h-5 w-5 mr-2 text-purple-500 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      {editingDocId === doc.id ? (
                        <div className="space-y-2">
                          <Input
                            value={tempDocName}
                            onChange={(e) => setTempDocName(e.target.value)}
                            className="text-sm"
                            placeholder="Document name"
                          />
                          <Input
                            value={tempPersonName}
                            onChange={(e) => setTempPersonName(e.target.value)}
                            className="text-sm"
                            placeholder="Person name"
                          />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageChange(e, doc.id)}
                            className="text-xs"
                          />
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => handleUpdateDocument(doc.id)}
                              className="h-7 px-2 border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                              disabled={isLoading}
                            >
                              <Check className="h-3 w-3 mr-1" /> Save
                            </Button>
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={handleCancelEdit}
                              className="h-7 px-2 text-indigo-700 hover:bg-indigo-50"
                              disabled={isLoading}
                            >
                              <XIcon className="h-3 w-3 mr-1" /> Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="font-medium truncate text-sm">
                            {doc.name}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            Serial: {doc.serialNo || "N/A"} • {doc.category}
                          </div>
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
                              className={`mt-1 text-xs flex items-center gap-1 w-fit ${isDatePastToday(doc.renewalDate)
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-800"
                                }`}
                            >
                              <RefreshCw className="h-3 w-3" />
                              <span
                                className={`font-mono ${isDatePastToday(doc.renewalDate)
                                  ? "text-red-600"
                                  : ""
                                  }`}
                              >
                                {doc.renewalDate || "Required"}
                              </span>
                            </Badge>
                          )}
                          {/* Mobile view for multiple images */}
                          <div className="flex flex-wrap gap-2 mt-1">
                            {doc.imageUrl && (
                              <button
                                onClick={() => window.open(doc.imageUrl, "_blank")}
                                className="flex items-center text-xs text-indigo-500"
                              >
                                <ImageIcon className="h-3 w-3 mr-1" />
                                Img1
                              </button>
                            )}
                            {doc.image2Url && (
                              <button
                                onClick={() => window.open(doc.image2Url, "_blank")}
                                className="flex items-center text-xs text-blue-500"
                              >
                                <ImageIcon className="h-3 w-3 mr-1" />
                                Img2
                              </button>
                            )}
                            {doc.image3Url && (
                              <button
                                onClick={() => window.open(doc.image3Url, "_blank")}
                                className="flex items-center text-xs text-green-500"
                              >
                                <ImageIcon className="h-3 w-3 mr-1" />
                                Img3
                              </button>
                            )}
                            {doc.image4Url && (
                              <button
                                onClick={() => window.open(doc.image4Url, "_blank")}
                                className="flex items-center text-xs text-purple-500"
                              >
                                <ImageIcon className="h-3 w-3 mr-1" />
                                Img4
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-indigo-600 hover:bg-indigo-50"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="border-indigo-100"
                    >
                      <DropdownMenuItem
                        className="cursor-pointer text-indigo-700 hover:bg-indigo-50"
                        onClick={() => handleEditClick(doc)}
                      >
                        <FileText className="h-4 w-4 mr-2 text-indigo-500" />
                        Edit
                      </DropdownMenuItem>
                      {currentUserRole?.toLowerCase() === "admin" && (
                        <>
                          <DropdownMenuItem
                            className="cursor-pointer text-indigo-700 hover:bg-indigo-50"
                            onClick={() => {
                              if (selectedDocs.length === 0) {
                                setSelectedDocs([doc.id]);
                              }
                              setEmailData({
                                to: "",
                                name: "",
                                subject: "",
                                message: "",
                              });
                              setShareMethod("email");
                            }}
                          >
                            <Mail className="h-4 w-4 mr-2 text-indigo-500" />
                            Email
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer text-indigo-700 hover:bg-indigo-50"
                            onClick={() => {
                              if (selectedDocs.length === 0) {
                                setSelectedDocs([doc.id]);
                              }
                              setWhatsappNumber("");
                              setShareMethod("whatsapp");
                            }}
                          >
                            <Smartphone className="h-4 w-4 mr-2 text-indigo-500" />
                            WhatsApp
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer text-indigo-700 hover:bg-indigo-50"
                            onClick={() => {
                              if (selectedDocs.length === 0) {
                                setSelectedDocs([doc.id]);
                              }
                              setEmailData({
                                to: "",
                                name: "",
                                subject: "",
                                message: "",
                              });
                              setWhatsappNumber("");
                              setShareMethod("both");
                            }}
                          >
                            <Share2 className="h-4 w-4 mr-2 text-indigo-500" />
                            Share Both
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuItem
                        className="cursor-pointer text-indigo-700 hover:bg-indigo-50"
                        onClick={() =>
                          handleDownloadDocument(doc.imageUrl, doc.name)
                        }
                      >
                        <Download className="h-4 w-4 mr-2 text-indigo-500" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer text-red-600 hover:bg-red-50 focus:text-red-600"
                        onClick={() => handleDeleteDocument(doc.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Document Dialog */}
      <Dialog open={editingDocId !== null} onOpenChange={(open) => !open && handleCancelEdit()}>
        <DialogContent className="sm:max-w-4xl max-h-[95vh] flex flex-col p-0 overflow-hidden border-indigo-100 shadow-xl">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl font-bold text-indigo-800 flex items-center">
              <FileText className="h-6 w-6 mr-2 text-indigo-600" />
              Edit Document: {documents.find(d => d.id === editingDocId)?.serialNo}
            </DialogTitle>
            <DialogDescription>
              Update document information and attachments. Changes will be saved to the sheet.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="general" className="flex-1 flex flex-col overflow-hidden mt-4">
            <div className="px-6">
              <TabsList className="grid grid-cols-3 bg-indigo-50/50 p-1">
                <TabsTrigger value="general" className="data-[state=active]:bg-white data-[state=active]:text-indigo-700">General Info</TabsTrigger>
                <TabsTrigger value="contact" className="data-[state=active]:bg-white data-[state=active]:text-indigo-700">Contact & Renewal</TabsTrigger>
                <TabsTrigger value="images" className="data-[state=active]:bg-white data-[state=active]:text-indigo-700">Images</TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1 p-6">
              <TabsContent value="general" className="space-y-4 mt-0 outline-none">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-indigo-700 font-medium">Document Name</Label>
                    <Input
                      value={tempDocName}
                      onChange={(e) => setTempDocName(e.target.value)}
                      className="border-indigo-200 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-indigo-700 font-medium">Document Type</Label>
                    <Select value={tempDocType} onValueChange={setTempDocType}>
                      <SelectTrigger className="border-indigo-200">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {documentTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-indigo-700 font-medium">Category</Label>
                    <Select value={tempCategory} onValueChange={setTempCategory}>
                      <SelectTrigger className="border-indigo-200">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Personal">Personal</SelectItem>
                        <SelectItem value="Company">Company</SelectItem>
                        <SelectItem value="Director">Director</SelectItem>
                      </SelectContent>
                    </Select>
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

              <TabsContent value="contact" className="space-y-6 mt-0 outline-none">
                <div className="p-4 bg-indigo-50/50 rounded-lg border border-indigo-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-indigo-900 font-semibold">Needs Renewal</Label>
                      <p className="text-xs text-indigo-600">Enable if this document has an expiration date</p>
                    </div>
                    <Switch
                      checked={tempNeedsRenewal}
                      onCheckedChange={setTempNeedsRenewal}
                    />
                  </div>

                  {tempNeedsRenewal && (
                    <div className="space-y-2 pt-2 border-t border-indigo-100">
                      <Label className="text-indigo-700 font-medium">Renewal Date</Label>
                      <DatePicker
                        value={tempRenewalDate}
                        onChange={setTempRenewalDate}
                        className="w-full border-indigo-200"
                      />
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="images" className="space-y-6 mt-0 outline-none">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map((slot) => {
                    const doc = documents.find(d => d.id === editingDocId);
                    const currentUrl = slot === 1 ? doc?.imageUrl :
                      slot === 2 ? doc?.image2Url :
                        slot === 3 ? doc?.image3Url :
                          doc?.image4Url;
                    const tempFile = slot === 1 ? tempDocImage :
                      slot === 2 ? tempDocImage2 :
                        slot === 3 ? tempDocImage3 :
                          tempDocImage4;

                    return (
                      <div key={slot} className="space-y-3 p-4 border border-indigo-100 rounded-lg bg-white shadow-sm">
                        <Label className="text-indigo-700 font-bold flex items-center justify-between">
                          Image #{slot}
                          {currentUrl && <Badge variant="outline" className="text-[10px] h-4">Existing</Badge>}
                        </Label>

                        <div className="aspect-video relative rounded-md border border-dashed border-indigo-200 bg-indigo-50/30 flex items-center justify-center overflow-hidden">
                          {tempFile ? (
                            <div className="text-xs text-indigo-600 font-medium px-2 text-center">
                              {tempFile.name}
                            </div>
                          ) : currentUrl ? (
                            <img src={formatImageUrl(currentUrl)} alt={`Slot ${slot}`} className="object-cover w-full h-full" />
                          ) : (
                            <ImageIcon className="h-8 w-8 text-indigo-200" />
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageChange(e, slot as 1 | 2 | 3 | 4)}
                            className="text-xs border-indigo-100 cursor-pointer h-8 file:mr-2 file:bg-indigo-50 file:text-indigo-700 file:border-0"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <DialogFooter className="p-6 pt-2 bg-indigo-50/30 border-t border-indigo-100">
            <Button variant="ghost" onClick={handleCancelEdit} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={() => editingDocId && handleUpdateDocument(editingDocId)}
              disabled={isLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[100px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EmailShareDialog
        open={shareMethod === "email"}
        onOpenChange={(open) => !open && setShareMethod(null)}
        emailData={emailData}
        setEmailData={setEmailData}
        selectedDocuments={selectedDocuments}
        onShare={handleShareEmail}
      />

      <WhatsAppShareDialog
        open={shareMethod === "whatsapp"}
        onOpenChange={(open) => !open && setShareMethod(null)}
        whatsappNumber={whatsappNumber}
        setWhatsappNumber={setWhatsappNumber}
        selectedDocuments={selectedDocuments}
        onShare={handleShareWhatsApp}
      />

      {/* Share Both Dialog */}
      <Dialog
        open={shareMethod === "both"}
        onOpenChange={(open) => !open && setShareMethod(null)}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Share Documents via Email and WhatsApp</DialogTitle>
            <DialogDescription>
              Fill in the details to share the selected documents via both
              email and WhatsApp.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="name" className="text-right">
                Recipient Name
              </label>
              <Input
                id="name"
                value={emailData.name}
                onChange={(e) =>
                  setEmailData({ ...emailData, name: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="email" className="text-right">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={emailData.to}
                onChange={(e) =>
                  setEmailData({ ...emailData, to: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="mobile" className="text-right">
                WhatsApp Number
              </label>
              <Input
                id="mobile"
                type="tel"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="subject" className="text-right">
                Subject
              </label>
              <Input
                id="subject"
                value={emailData.subject}
                onChange={(e) =>
                  setEmailData({ ...emailData, subject: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="message" className="text-right">
                Message
              </label>
              <textarea
                id="message"
                value={emailData.message}
                onChange={(e) =>
                  setEmailData({ ...emailData, message: e.target.value })
                }
                className="col-span-3 min-h-[100px] border rounded-md p-2"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <label className="text-right pt-2">Documents</label>
              <div className="col-span-3 space-y-2">
                {selectedDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-indigo-500" />
                    <span className="text-sm">{doc.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => {
                handleShareBoth({
                  emailData,
                  whatsappNumber,
                });
                setShareMethod(null);
              }}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
            >
              Share Both
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}