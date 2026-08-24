import './globals.css'
export const metadata = { title: 'TheKPIHub', description: 'Master your KPIs' }
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
