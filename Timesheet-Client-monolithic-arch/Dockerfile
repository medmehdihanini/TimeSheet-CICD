# Multi-stage build Dockerfile
FROM eclipse-temurin:17-jdk AS build
WORKDIR /app

# Copy Maven wrapper and pom.xml first for better caching
COPY mvnw mvnw.cmd pom.xml ./
COPY .mvn .mvn

# Make Maven wrapper executable and fix line endings
RUN chmod +x mvnw && sed -i 's/\r$//' mvnw

# Download dependencies (this layer will be cached if pom.xml doesn't change)
RUN ./mvnw dependency:go-offline -B

# Copy source code
COPY src ./src

# Build the application
RUN ./mvnw clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:17-jre
EXPOSE 8083
COPY --from=build /app/target/timesheetclient-0.0.1-SNAPSHOT.jar timesheetclient.jar
ENTRYPOINT ["java","-jar","-Dspring.profiles.active=docker","timesheetclient.jar"]