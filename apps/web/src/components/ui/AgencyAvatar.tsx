import { imageUrl } from '@/lib/api';
import { c } from '@/lib/theme';

interface Props {
  name: string;
  initials: string;
  brandColor: string;
  logoUrl?: string | null;
  size?: number;
  radius?: number;
  fontSize?: number;
}

/**
 * Аватар агентства или продавца.
 *
 * Есть логотип — показываем его, нет — инициалы на фирменном цвете.
 * Так выдача не разъезжается, пока агентства логотипы не загрузили.
 */
export function AgencyAvatar({
  name,
  initials,
  brandColor,
  logoUrl,
  size = 24,
  radius = 7,
  fontSize = 11,
}: Props) {
  if (logoUrl) {
    return (
      <img
        src={imageUrl(logoUrl)}
        alt={name}
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          objectFit: 'cover',
          flexShrink: 0,
          // Светлый логотип на белом фоне иначе сливается с карточкой.
          border: `1px solid ${c.line}`,
          background: c.white,
        }}
      />
    );
  }

  return (
    <span
      aria-label={name}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: brandColor,
        color: c.white,
        display: 'grid',
        placeItems: 'center',
        fontSize,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {initials}
    </span>
  );
}
