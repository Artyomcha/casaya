import { ProjectsScreen } from '@/components/projects/ProjectsScreen';
import { api, safe } from '@/lib/api';

// Каталог живой: объекты приезжают из фидов агентств постоянно.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Новостройки на Коста-Бланке — Casaya',
  description: 'Obra nueva в провинции Аликанте: сроки сдачи, застройщики, цены от.',
};

export default async function Page() {
  const projects = await safe(api.projects(), []);
  return <ProjectsScreen projects={projects} />;
}
