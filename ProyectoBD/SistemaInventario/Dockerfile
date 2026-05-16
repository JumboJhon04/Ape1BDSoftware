# 1. Etapa de compilación (SDK de .NET 10)
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copiamos la solución apuntando a su ruta real absoluta en tu GitHub
COPY ProyectoBD/SistemaInventario/SistemaInventario.* ./SistemaInventario/

# Copiamos cada archivo .csproj anteponiendo la carpeta contenedora real del repositorio
COPY ProyectoBD/SistemaInventario.API/SistemaInventario.API.csproj ./SistemaInventario.API/
COPY ProyectoBD/SistemaInventario.Aplication/SistemaInventario.Aplication.csproj ./SistemaInventario.Aplication/
COPY ProyectoBD/SistemaInventario.Domain/SistemaInventario.Domain.csproj ./SistemaInventario.Domain/
COPY ProyectoBD/SistemaInventario.Infrastructure/SistemaInventario.Infrastructure.csproj ./SistemaInventario.Infrastructure/

# Restauramos los paquetes NuGet usando la ruta interna del contenedor
RUN dotnet restore SistemaInventario/SistemaInventario.*

# Copiamos todo el contenido del repositorio al contenedor
COPY . .

# Nos movemos a la ruta interna donde quedó la API para compilar el publish
WORKDIR "/src/ProyectoBD/SistemaInventario.API"
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

# 2. Etapa de ejecución (Runtime de .NET 10)
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "SistemaInventario.API.dll"]
