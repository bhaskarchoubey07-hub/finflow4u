import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";

const inter = Inter({ subsets: ["latin"], display: 'swap' });

export const metadata = {
  title: "FinFlow | Next-Gen P2P Lending Infrastructure",
  description: "Marketplace P2P lending platform for borrowers and lenders. Access high-yield investments and fair borrowing rates instantly.",
  keywords: ["P2P Lending", "Loans", "Investing", "Borrowing", "Fintech"]
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-background`}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
