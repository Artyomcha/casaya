# Сборка и выполнение API. Два этапа: в образ не должны попасть ни исходники,
# ни средства сборки — только собранный код и прод-зависимости.
FROM node:22-alpine AS build
WORKDIR /app

# Сначала манифесты: слой с зависимостями переиспользуется, пока они не менялись.
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY apps/mobile/package.json apps/mobile/
# Загрузку iOS SDK в postinstall пропускаем: в Linux-образе она бессмысленна.
RUN npm ci --ignore-scripts

COPY apps/api apps/api
RUN npm run prisma:generate --workspace apps/api \
 && npm run build --workspace apps/api

# Зависимости рантайма ставятся отдельно и только для API. Без этого в образ
# уезжают Next, Expo и MapLibre — прод-зависимости соседних приложений,
# серверу не нужные: было 3,2 ГБ.
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY apps/mobile/package.json apps/mobile/
RUN npm ci --omit=dev --ignore-scripts --workspace apps/api --include-workspace-root

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Prisma CLI лежит в прод-зависимостях намеренно: образ применяет миграции
# при старте, схема и код выкатываются вместе.
COPY --from=deps /app/node_modules ./node_modules
# Сгенерированный клиент берём из сборки: npm ci его не создаёт.
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
COPY --from=build /app/apps/api/package.json ./apps/api/
COPY apps/api/public ./apps/api/public

# Пользователь node создан в образе: процесс под root в контейнере не нужен.
RUN chown -R node:node /app
USER node

EXPOSE 4100

# Миграции применяются при старте: схема и код выкатываются вместе.
CMD ["sh", "-c", "npx prisma migrate deploy --schema apps/api/prisma/schema.prisma && node apps/api/dist/main.js"]
