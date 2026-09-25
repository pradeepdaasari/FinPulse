# Stage 1: Build Angular frontend
FROM node:22-alpine AS frontend
WORKDIR /app/pulse-ui
COPY src/pulse-ui/package*.json ./
RUN npm ci
COPY src/pulse-ui/ ./
RUN npx ng build --configuration production

# Stage 2: Build .NET backend
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS backend
WORKDIR /app
COPY src/Pulse.Core/Pulse.Core.csproj Pulse.Core/
COPY src/Pulse.Api/Pulse.Api.csproj Pulse.Api/
RUN dotnet restore Pulse.Api/Pulse.Api.csproj
COPY src/Pulse.Core/ Pulse.Core/
COPY src/Pulse.Api/ Pulse.Api/
RUN dotnet publish Pulse.Api/Pulse.Api.csproj -c Release -o /publish

# Stage 3: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=backend /publish ./
COPY --from=frontend /app/pulse-ui/dist/pulse-ui/browser ./wwwroot/
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "Pulse.Api.dll"]
