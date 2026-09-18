import AdminShell from '@/components/admin-shell';import {requireRole} from '@/lib/auth';
export default async function AdminLayout({children}:{children:React.ReactNode}){await requireRole(['admin']);return <AdminShell>{children}</AdminShell>}
