import './globals.css';

export const metadata = {
  title: 'Igloo Motion Site',
  description: '3D Interactive Igloo Experience',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
