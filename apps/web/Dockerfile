# Сборка и выполнение портала. Next собирается в самодостаточный выпуск,
# поэтому в рантайм-образ не попадают ни исходники, ни node_modules.
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY apps/mobile/package.json apps/mobile/
RUN npm ci --ignore-scripts

COPY apps/web apps/web
# Адрес API на этапе сборки нужен клиентскому коду: NEXT_PUBLIC_* вшивается
# в бандл, подменить его переменной окружения в рантайме уже нельзя.
ARG NEXT_PUBLIC_API_URL=http://localhost:4100/api
ARG NEXT_PUBLIC_GOOGLE_MAPS_KEY=
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_GOOGLE_MAPS_KEY=$NEXT_PUBLIC_GOOGLE_MAPS_KEY
RUN npm run build --workspace apps/web

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public

RUN chown -R node:node /app
USER node

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
