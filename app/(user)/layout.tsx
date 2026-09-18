import AppShell from '@/components/app-shell';import {requireRole} from '@/lib/auth';
export default async function UserLayout({children}:{children:React.ReactNode}){const {role}=await requireRole(['supplier_farmer','supplier_market']);return <AppShell role={role}>{children}</AppShell>}
