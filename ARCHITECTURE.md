# Arquitectura del Backend

El backend sigue una arquitectura hexagonal, separando las reglas del PETI de los detalles técnicos.

```text
com.strategicti
|-- domain
|   |-- model        Entidades, enums y objetos del dominio
|   `-- service      Reglas puras del PETI
|-- application
|   |-- ports        Contratos de entrada/salida
|   |-- service      Casos de uso
|   `-- usecase      Comandos y respuestas de aplicación
`-- infrastructure
    |-- persistence
    |   |-- adapter     Implementación de puertos de persistencia
    |   |-- entity      Entidades JPA
    |   |-- factory     Creación y transformación entre dominio y entidades JPA
    |   `-- repository  Repositorios Spring Data
    `-- ui
        |-- controller  Endpoints REST
        |-- error       Manejo de errores de API
        `-- frontend    Código React en src/main/ui
```

## Regla de Dependencias

Las dependencias deben apuntar hacia adentro:

```text
infrastructure -> application -> domain
```

El dominio no debe conocer la base de datos, controladores REST, Spring MVC ni detalles de interfaz.

## Dónde Agregar Nuevas Funciones

- Una nueva regla estratégica o calculadora debe ir en `domain`.
- Un nuevo flujo del sistema debe ir en `application/service`.
- Un nuevo contrato requerido por la aplicación debe ir en `application/ports`.
- Una tabla o repositorio de MySQL debe ir en `infrastructure/persistence`.
- Una transformación entre dominio y entidad JPA debe ir en `infrastructure/persistence/factory`.
- Un endpoint REST consumido por el frontend debe ir en `infrastructure/ui/controller`.

## Infraestructura

La capa `infrastructure` se divide en dos grupos principales:

- `persistence`: adaptador de salida hacia la base de datos. Incluye entidades JPA, repositorios Spring Data, factories y adaptadores que implementan los puertos de aplicación.
- `ui`: adaptador de entrada hacia el sistema. Contiene la API REST y el frontend React ubicado en `src/main/ui`.
