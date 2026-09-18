import AppShell from '@/components/app-shell';import {requireRole} from '@/lib/auth';
export default async function PartnerLayout({children}:{children:React.ReactNode}){return <AppShell role={(await requireRole(['recovery_partner'])).role}>{children}</AppShell>}
