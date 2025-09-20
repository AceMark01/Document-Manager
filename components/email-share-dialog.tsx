"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface EmailShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  emailData: {
    to: string
    cc: string // Add this
    name: string
    subject: string
    message: string
  }
  setEmailData: React.Dispatch<
    React.SetStateAction<{
      to: string
      cc: string // Add this
      name: string
      subject: string
      message: string
    }>
  >
  selectedDocuments: Array<{
    id: number
    name: string
    serialNo: string
    documentType: string
    category: string
  }>
  onShare: (emailData: {
    to: string
    cc: string // Add this
    name: string
    subject: string
    message: string
  }) => Promise<void>
}

export function EmailShareDialog({
  open,
  onOpenChange,
  emailData,
  setEmailData,
  selectedDocuments,
  onShare,
}: EmailShareDialogProps) {
  const [isSending, setIsSending] = useState(false)

  const handleShare = async () => {
    if (!emailData.to || !emailData.subject || !emailData.message) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      })
      return
    }

    setIsSending(true)
    try {
      await onShare(emailData)
      toast({
        title: "Success",
        description: "Documents shared successfully and record saved",
      })
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to share documents",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#407FF6]">Share Documents via Email</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Recipient Name</Label>
              <Input
                id="name"
                placeholder="Enter recipient's name"
                value={emailData.name}
                onChange={(e) => setEmailData({ ...emailData, name: e.target.value })}
                className="border-gray-300 focus:border-[#5477F6] focus:ring-[#5477F6]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address*</Label>
              <Input
                id="email"
                placeholder="Enter recipient's email"
                type="email"
                required
                value={emailData.to}
                onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
                className="border-gray-300 focus:border-[#5477F6] focus:ring-[#5477F6]"
              />
            </div>

            {/* Add CC input field */}
            <div className="space-y-2">
              <Label htmlFor="cc">CC (Optional)</Label>
              <Input
                id="cc"
                placeholder="Enter CC email address"
                type="email"
                value={emailData.cc || ""}
                onChange={(e) => setEmailData({ ...emailData, cc: e.target.value })}
                className="border-gray-300 focus:border-[#5477F6] focus:ring-[#5477F6]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject*</Label>
              <Input
                id="subject"
                placeholder="Enter email subject"
                required
                value={emailData.subject}
                onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                className="border-gray-300 focus:border-[#5477F6] focus:ring-[#5477F6]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message*</Label>
              <Textarea
                id="message"
                placeholder="Enter your message"
                required
                value={emailData.message}
                onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
                className="border-gray-300 focus:border-[#5477F6] focus:ring-[#5477F6]"
                rows={4}
              />
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-[#5477F6]">Selected Documents:</p>
            <div className="mt-2 max-h-32 overflow-y-auto border rounded-md p-2">
              <ul className="space-y-1">
                {selectedDocuments.map((doc) => (
                  <li key={doc.id} className="text-sm flex items-center">
                    <FileText className="h-3 w-3 mr-2 text-gray-500 flex-shrink-0" />
                    <span className="truncate">{doc.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <DialogClose asChild>
            <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100 w-full sm:w-auto">
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={handleShare}
            disabled={!emailData.to || !emailData.subject || !emailData.message || isSending}
            className="bg-gradient-to-r from-[#407FF6] to-[#A555F7] hover:from-[#5477F6] hover:to-[#935DF6] text-white w-full sm:w-auto"
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              "Share Documents"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}