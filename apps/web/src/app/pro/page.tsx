import { ProScreen } from '@/components/pro/ProScreen';
import { api, safe } from '@/lib/api';

// Каталог живой: объекты приезжают из фидов агентств постоянно.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Casaya Pro — портал для агентств недвижимости',
  description: 'Подключите XML-фид вашей CRM за 15 минут. Базовое размещение бесплатно 12 месяцев.',
};

export default async function Page() {
  const plans = await safe(api.plans(), []);
  return <ProScreen plans={plans} />;
}
