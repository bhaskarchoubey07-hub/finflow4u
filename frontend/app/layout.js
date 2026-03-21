import "./globals.css";

export const metadata = {
  title: "LendGrid",
  description: "Marketplace P2P lending platform for borrowers and lenders"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
