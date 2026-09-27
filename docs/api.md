# API Casaya

База: `http://localhost:4100/api`

## Каталог

| Метод | Путь | Назначение |
|---|---|---|
| GET | `/listings` | выдача; `filter=all\|flat\|house\|sea`, `q`, `minPrice`, `maxPrice`, `bedrooms`, `verifiedOnly`, `take` |
| GET | `/listings/map-pins` | пины для карты поиска |
| GET | `/listings/:idOrSlug` | карточка объекта |
| GET | `/listings/:idOrSlug/similar` | похожие рядом |
| GET | `/projects?year=2027` | новостройки |
| GET | `/projects/:slug` | проект |
| GET | `/cities` | популярные направления |
| GET | `/banks` | предложения банков |
| GET | `/plans` | тарифы Casaya Pro |
| GET | `/services?scope=HOME\|FULL` | сервисный слой сделки |
| GET | `/agencies` | агентства |

Витрина отдаёт только объекты со статусом `PUBLISHED`.

## Расчёты

| Метод | Путь | Тело |
|---|---|---|
| POST | `/mortgage/calculate` | `{ price, downPaymentPercent, termYears, rate? }` |
| POST | `/valuation` | `{ address, kind, area, bedrooms }` |

## Заявки

| Метод | Путь | |
|---|---|---|
| POST | `/leads` | `kind`: `MORTGAGE \| SERVICE \| AGENCY \| LISTING_CONTACT` |
| GET | `/leads?kind=&status=` | список |

## Агентства и фиды

| Метод | Путь | |
|---|---|---|
| POST | `/agencies/register` | регистрация агентства |
| GET | `/agencies/:id/dashboard` | сводка кабинета |
| GET | `/agencies/:id/listings` | инвентарь агентства |
| GET | `/feeds/formats` | поддерживаемые форматы |
| POST | `/feeds/preview` | сухой прогон, в базу не пишет |
| POST | `/feeds` | подключить фид |
| GET | `/feeds?agencyId=` | фиды агентства |
| POST | `/feeds/:id/sync` | синхронизировать сейчас |
| POST | `/feeds/:id/pause` · `/resume` | пауза и возобновление |
| DELETE | `/feeds/:id` | отключить (объекты уходят в архив) |

## Вход и избранное

| Метод | Путь | |
|---|---|---|
| POST | `/auth/request-code` | `{ channel: 'phone'\|'email', identity }`; в dev код возвращается в ответе |
| POST | `/auth/verify` | `{ channel, identity, code }` → `{ token, user }` |
| GET | `/auth/me` | по `Authorization: Bearer <token>` |
| GET | `/favorites` | избранное пользователя |
| POST | `/favorites/:listingId/toggle` | переключить |
| POST | `/favorites/merge` | перенести избранное из localStorage после входа |

Отправка кода заглушена: на проде сюда подключается SMS/email-провайдер.
