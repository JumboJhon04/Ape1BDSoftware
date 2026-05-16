# 1. Etapa de compilación
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Salimos de SistemaInventario para buscar la solución y los proyectos (.csproj)
COPY ../*.sln ./
COPY ../src/Presentation/WebApi/WebApi.csproj ./src/Presentation/WebApi/
COPY ../src/Core/Application/Application.csproj ./src/Core/Application/
COPY ../src/Core/Domain/Domain.csproj ./src/Core/Domain/
COPY ../src/Infrastructure/Infrastructure.csproj ./src/Infrastructure/

# Restauramos dependencias de toda la solución
RUN dotnet restore

# Copiamos todo el resto del código subiendo un nivel
COPY ../ ./

# Nos movemos a la ruta interna dentro del contenedor para compilar el publish
WORKDIR "/src/src/Presentation/WebApi"
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

# 2. Etapa de ejecución
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

# Asegúrate de que WebApi.dll sea el nombre exacto de tu ejecutable compilado
ENTRYPOINT ["dotnet", "WebApi.dll"]