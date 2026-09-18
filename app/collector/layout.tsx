import AppShell from '@/components/app-shell';import {requireRole} from '@/lib/auth';
export default async function CollectorLayout({children}:{children:React.ReactNode}){return <AppShell role={(await requireRole(['collector'])).role}>{children}</AppShell>}
