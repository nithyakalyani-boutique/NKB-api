FROM node:24.20.0-bookworm-slim AS build
WORKDIR /workspace
RUN npm install --global pnpm@10.34.7
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY api/package.json ./api/package.json
COPY client/package.json ./client/package.json
RUN pnpm install --frozen-lockfile
COPY api ./api
RUN DATABASE_URL=postgresql://build:build@localhost/build pnpm --filter @nkb/api db:generate
RUN pnpm --filter @nkb/api build
RUN pnpm --filter @nkb/api deploy --prod --legacy /release
FROM node:24.20.0-bookworm-slim AS runtime
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4000
WORKDIR /app
COPY --from=build --chown=node:node /release ./
USER node
EXPOSE 4000
CMD ["node","dist/main.js"]
