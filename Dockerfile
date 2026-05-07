FROM node:24-alpine AS ui-build
WORKDIR /app

COPY src/main/ui/package*.json ./
RUN npm ci

COPY src/main/ui/ ./
RUN npm run build

FROM eclipse-temurin:21-jdk AS build
WORKDIR /app

COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -q -DskipTests dependency:go-offline

COPY src/main/java src/main/java
COPY src/main/resources src/main/resources
COPY --from=ui-build /app/dist src/main/resources/static
RUN ./mvnw -q -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
