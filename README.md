# StrategicTI

StrategicTI es una plataforma web para elaborar un Plan Estratégico de Tecnologías de Información (PETI) de forma guiada, estructurada y trazable.

El sistema funciona como un motor lógico de planificación estratégica: recoge información de la empresa, guía al usuario por diagnósticos estratégicos, calcula resultados mediante matrices y consolida automáticamente la información en un resumen ejecutivo exportable.

## Concepto del Sistema

El sistema se comporta como un asistente secuencial tipo wizard. Cada plan avanza por fases y cada fase valida que la información mínima haya sido completada antes de permitir continuar.

El usuario puede pausar el llenado del PETI, cerrar sesión y retomar posteriormente desde el último estado guardado, conservando la información registrada y los resultados calculados.

## Flujo Principal del PETI

1. Fase de identidad estratégica: registro de empresa, misión, visión, valores, UEN y objetivos.
2. Fase de diagnóstico: análisis FODA, cadena de valor, matriz BCG, cinco fuerzas de Porter y análisis PEST.
3. Fase de formulación: identificación de estrategia competitiva y elaboración de matriz CAME.
4. Fase de consolidación: generación del resumen ejecutivo y exportación del plan.

## Arquitectura

El sistema utilizará una arquitectura hexagonal, también conocida como arquitectura de puertos y adaptadores.

Esta arquitectura permite separar la lógica estratégica del sistema de los detalles externos, como la interfaz web, la base de datos o los mecanismos de exportación.

## Tecnologías Propuestas

El proyecto utilizará un stack web basado en Java, Spring Boot, React y MySQL.

| Componente | Tecnología | Uso en el proyecto |
|---|---|---|
| Lenguaje backend | Java | Implementación de la lógica del PETI, reglas de negocio, casos de uso y cálculos estratégicos. |
| Framework backend | Spring Boot | Construcción de la API REST, configuración del proyecto, seguridad, persistencia e integración con servicios internos. |
| API | REST + JSON | Comunicación entre el frontend y el backend mediante endpoints estructurados. |
| Persistencia | Spring Data JPA + Hibernate | Mapeo de entidades del dominio a tablas relacionales. |
| Base de datos | MySQL | Almacenamiento de empresas, planes, UEN, objetivos, diagnósticos, factores FODA, acciones CAME y usuarios. |
| Seguridad | Spring Security | Autenticación, autorización y control de acceso por usuario. |
| Frontend | React | Construcción de la interfaz web basada en componentes reutilizables. |
| Lenguaje frontend | TypeScript | Tipado de componentes, formularios, respuestas de API y modelos usados en la interfaz. |
| Herramienta frontend | Vite | Creación y ejecución rápida del entorno de desarrollo frontend. |
| Formularios | React Hook Form | Gestión de formularios extensos del PETI con validaciones y control de estado. |
| Validación frontend | Zod | Validación de datos ingresados por el usuario antes de enviarlos al backend. |
| Estilos | Tailwind CSS | Diseño responsivo, consistente y mantenible de la interfaz. |
| Exportación Excel | Apache POI | Generación de archivos Excel del plan o de secciones del PETI. |
| Exportación PDF | OpenPDF o JasperReports | Generación del resumen ejecutivo y del plan completo en formato PDF. |
| Migraciones de base de datos | Flyway | Control de versiones del esquema de base de datos. |
| Pruebas backend | JUnit 5 + Mockito | Pruebas unitarias de casos de uso, servicios de dominio y calculadoras estratégicas. |
| Pruebas frontend | Vitest + React Testing Library | Pruebas de componentes, formularios y flujos principales de la interfaz. |
| Contenedores | Docker Compose | Ejecución local del backend, frontend y base de datos de forma coordinada. |

MySQL se utilizará como sistema gestor de base de datos relacional porque el PETI maneja información estructurada y relaciones claras entre empresa, plan estratégico, unidades de negocio, objetivos, diagnósticos y acciones. Además, se integra adecuadamente con Spring Boot mediante Spring Data JPA e Hibernate.

Spring Boot será responsable de exponer los servicios del sistema a través de una API REST, mientras que React consumirá dichos servicios para presentar al usuario el flujo guiado del PETI.

## Template Inicial

El repositorio incluye una primera implementación funcional dividida en dos aplicaciones:

```text
src/       API REST en Spring Boot con estructura hexagonal
src/main/ui/  Interfaz web en React, TypeScript y Vite
```

La raíz del proyecto contiene el backend Spring Boot. El frontend React se ubica en `src/main/ui`, dentro de la capa de infraestructura, como adaptador visual del sistema.

El backend expone un primer flujo para consultar el plan actual, registrar identidad estratégica y cerrar la fase inicial. El frontend consume estos endpoints y presenta un tablero PETI con fases, progreso, formulario de empresa y módulos estratégicos base.

La organización interna del backend está documentada con más detalle en [ARCHITECTURE.md](ARCHITECTURE.md).

```text
src/main/java/com/strategicti
├── domain             Reglas y modelos del PETI
├── application        Casos de uso y puertos
└── infrastructure     Adaptadores técnicos
    ├── persistence    Persistencia JPA/MySQL
    └── ui             API REST y frontend React
```

## Ejecución Local

### Todo el sistema con Docker Compose

La forma mas simple de ejecutar el template completo es usar Docker Compose. Este comando levanta MySQL, construye el backend Spring Boot, construye el frontend React y deja todo conectado en una red interna de contenedores.

Requiere tener Docker Desktop instalado y en ejecucion.

```bash
docker compose up --build
```

En Windows PowerShell se usa el mismo comando:

```powershell
docker compose up --build
```

Al finalizar el arranque, la aplicacion queda disponible en:

```text
http://localhost:5173
```

La API del backend queda disponible en:

```text
http://localhost:8080/api/plans/current
```

Para detener los contenedores:

```bash
docker compose down
```

Para borrar tambien la base de datos local creada por Docker:

```bash
docker compose down -v
```

### Demo en Render

Para una demostracion rapida, Render puede desplegar el proyecto como un solo Web Service usando el `Dockerfile` de la raiz. Ese Dockerfile construye la interfaz React, la copia dentro de Spring Boot y publica todo desde una sola URL.

Configuracion sugerida en Render:

```text
New > Web Service
Environment: Docker
Dockerfile Path: Dockerfile
```

No es obligatorio crear MySQL para la demo inicial. El perfil `dev` usa H2 en memoria, por lo que la plantilla funciona sin base de datos externa. Si Render reinicia el servicio, los datos guardados en H2 se pierden.

### Backend con perfil de desarrollo

El perfil `dev` usa H2 en memoria para probar sin instalar MySQL.

```bash
./mvnw spring-boot:run
```

En Windows PowerShell:

```powershell
.\mvnw.cmd spring-boot:run
```

La API quedará disponible en:

```text
http://localhost:8080/api/plans/current
```

### Backend con MySQL

Levante MySQL con Docker Compose:

```bash
docker compose up -d mysql
```

Ejecute Spring Boot con el perfil `mysql`:

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=mysql
```

En Windows PowerShell:

```powershell
.\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=mysql
```

### Frontend

```bash
cd src/main/ui
npm install
npm run dev
```

En Windows PowerShell, si `npm` está bloqueado por políticas de ejecución:

```powershell
cd src/main/ui
npm.cmd install
npm.cmd run dev
```

La interfaz quedará disponible en:

```text
http://localhost:5173
```

### Capa de Dominio

Contiene las entidades principales y las reglas de negocio del PETI.

Aquí se ubican elementos como Empresa, Plan Estratégico, UEN, Objetivo Estratégico, Diagnóstico, Factor FODA, Acción CAME y las calculadoras estratégicas.

Las calculadoras deben ser componentes puros encargados de procesar datos y devolver resultados, clasificaciones o conclusiones. Por ejemplo:

- cálculo de posición en matriz BCG;
- evaluación del perfil competitivo en Porter;
- cálculo de resultados PEST;
- clasificación de fortalezas, oportunidades, debilidades y amenazas;
- determinación de la estrategia predominante.

### Capa de Aplicación

Contiene los casos de uso del sistema. Coordina el flujo entre la interfaz, el dominio y la persistencia.

Ejemplos de casos de uso:

- registrar información de empresa;
- avanzar fase del PETI;
- calcular matriz BCG;
- generar diagnóstico Porter;
- elaborar matriz CAME;
- generar resumen ejecutivo;
- exportar plan completo.

### Capa de Infraestructura

Contiene los adaptadores externos del sistema.

Incluye `persistence`, donde se ubican entidades JPA, repositorios, factories y adaptadores de conexión con base de datos; y `ui`, donde se ubican los controladores REST, manejo de errores y el frontend React del sistema.

## Alcance

El sistema se limita a la gestión de información, procesamiento de datos y cálculo de diagnósticos estratégicos para la elaboración del PETI.

No interactúa con hardware físico, redes empresariales, periféricos, sensores ni sistemas de auditoría técnica automática. Toda la información del entorno debe ser ingresada manualmente por el usuario.

## Requerimientos Funcionales

### RF-01. Registrar información general de la empresa

El sistema debe permitir ingresar y editar los datos básicos de la empresa, como nombre, rubro, descripción, fecha de elaboración y responsables del Plan Estratégico de Tecnologías de Información.

### RF-02. Gestionar identidad estratégica

El sistema debe permitir registrar, editar y consultar la misión, visión y valores de la empresa, ya que estos elementos sirven como base para el desarrollo del PETI.

### RF-03. Gestionar Unidades Estratégicas de Negocio y objetivos

El sistema debe permitir registrar Unidades Estratégicas de Negocio, objetivos estratégicos y objetivos específicos, manteniendo la relación entre ellos.

### RF-04. Controlar el flujo del PETI por fases

El sistema debe guiar al usuario mediante un proceso secuencial, mostrando el avance del plan, validando la información obligatoria, bloqueando fases pendientes y permitiendo continuar desde el último estado guardado.

### RF-05. Elaborar análisis FODA

El sistema debe permitir registrar fortalezas, oportunidades, debilidades y amenazas, ya sea de forma manual o a partir de los resultados obtenidos en los diagnósticos estratégicos.

### RF-06. Realizar autodiagnóstico de cadena de valor

El sistema debe permitir evaluar las actividades internas de la empresa mediante preguntas o criterios de valoración, generando resultados que ayuden a identificar fortalezas y debilidades.

### RF-07. Realizar análisis de matriz BCG

El sistema debe permitir evaluar productos o servicios según ventas, crecimiento del mercado y participación relativa, clasificándolos dentro de la matriz BCG.

### RF-08. Realizar análisis de las cinco fuerzas de Porter

El sistema debe permitir evaluar el microentorno competitivo de la empresa y generar conclusiones sobre el nivel de atractivo, presión o rivalidad del sector.

### RF-09. Realizar análisis PEST

El sistema debe permitir evaluar factores políticos, económicos, sociales, tecnológicos y ambientales que afectan a la empresa, generando oportunidades y amenazas relevantes.

### RF-10. Identificar la estrategia competitiva

El sistema debe cruzar los factores FODA mediante matrices FO, FA, DO y DA para determinar la estrategia predominante: ofensiva, defensiva, de reorientación o de supervivencia.

### RF-11. Elaborar matriz CAME y acciones estratégicas

El sistema debe permitir definir acciones para corregir debilidades, afrontar amenazas, mantener fortalezas y explotar oportunidades, vinculándolas con objetivos, UEN o proyectos de TI.

### RF-12. Generar y exportar el PETI

El sistema debe consolidar automáticamente la información registrada en un resumen ejecutivo editable y permitir exportar el plan completo en un formato presentable, como PDF, Excel o documento editable.

## Requerimientos No Funcionales

1. La interfaz debe estar disponible en español.
2. El sistema debe ser accesible desde un navegador web sin requerir instalación local.
3. El sistema debe guardar automáticamente el progreso del usuario.
4. La interfaz debe tener diseño responsivo para computadoras y dispositivos móviles.
5. El tiempo de carga esperado debe ser menor a 3 segundos en condiciones normales.
6. El sistema debe soportar múltiples usuarios o proyectos simultáneos.
7. El sistema debe contar con acceso seguro mediante usuario y contraseña.
8. La disponibilidad mínima esperada del sistema debe ser de 95%.
9. El sistema debe ser compatible con navegadores modernos como Chrome, Firefox y Edge.
10. El sistema debe ser escalable para agregar nuevas secciones o diagnósticos en el futuro.
