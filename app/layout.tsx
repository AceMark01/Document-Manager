// import type React from "react"
// import type { Metadata } from "next"
// import { Inter } from "next/font/google"
// import "./globals.css"
// import { ThemeProvider } from "@/components/theme-provider"
// import { Sidebar } from "@/components/sidebar"
// import { Footer } from "@/components/footer"
// import { AuthProvider } from "@/components/auth-provider"

// const inter = Inter({ subsets: ["latin"] })

// export const metadata: Metadata = {
//   title: "Document Manager",
//   description: "Manage and share your documents easily",
//   viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
//     generator: 'v0.dev'
// }

// export default function RootLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode
// }>) {
//   // Update the layout structure for proper scrolling
//   return (
//     <html lang="en" className="h-full">
//       <body className={`${inter.className} h-full`}>
//         <ThemeProvider attribute="class" defaultTheme="light">
//           <AuthProvider>
//             <div className="flex h-screen overflow-hidden">
//               <Sidebar />
//               <div className="flex flex-col flex-1 w-full">
//                 <main className="flex-1 overflow-y-auto pb-16">{children}</main>
//                 <Footer />
//               </div>
//             </div>
//           </AuthProvider>
//         </ThemeProvider>
//       </body>
//     </html>
//   )
// }













// app/layout.tsx
import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Sidebar } from "@/components/sidebar"
import { Footer } from "@/components/footer"
import { AuthProvider } from "@/components/auth-provider"
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Document Manager",
  description: "Manage and share your documents easily",
  generator: 'v0.dev'
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} h-full`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light">
          <AuthProvider>
            <div className="flex h-screen overflow-hidden">
              <Sidebar />
              <div className="flex flex-col flex-1 w-full">
                <main className="flex-1 overflow-y-auto pb-16">{children}</main>
                <Footer />
              </div>
            </div>
            <Toaster /> {/* Add this line */}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
