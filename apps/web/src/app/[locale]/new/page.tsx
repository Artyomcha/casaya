import { notFound } from 'next/navigation';
import { getDictionary } from '@/i18n/getDictionary';
import { isLocale } from '@/i18n/locales';
import { ProjectsScreen } from '@/components/projects/ProjectsScreen';
import { api, safe } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return { title: `${dict.projects.title} — Casaya` };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const [dict, projects] = await Promise.all([getDictionary(locale), safe(api.projects(), [])]);

  return <ProjectsScreen dict={dict} locale={locale} projects={projects} />;
}
