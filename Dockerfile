# syntax=docker/dockerfile:1

# ---- Stage 1: build the React/Vite frontend ----
FROM node:22-alpine AS frontend-build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json vite.config.ts tailwind.config.ts postcss.config.js components.json ./
COPY client ./client
COPY shared ./shared
RUN npm run build

# ---- Stage 2: build the Spring Boot backend, embedding the frontend build ----
FROM maven:3.9-eclipse-temurin-17 AS backend-build
WORKDIR /app
COPY backend/pom.xml ./
RUN mvn -B dependency:go-offline
COPY backend/src ./src
COPY --from=frontend-build /app/dist/public ./src/main/resources/static
RUN mvn -B clean package -DskipTests

# ---- Stage 3: minimal runtime image ----
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=backend-build /app/target/*.jar app.jar
EXPOSE 8082
ENTRYPOINT ["java", "-jar", "app.jar"]
