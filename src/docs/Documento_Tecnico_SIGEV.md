# SIGEV - Sistema de Gestión de Eventos
## Documento Técnico para el Diseño y Desarrollo de la Solución
**Versión:** 0.1  
**Fecha:** 26 de julio de 2026  
**Estado:** Borrador técnico para validación funcional y tecnológica  

---

## Control del Documento

| Elemento | Descripción |
| :--- | :--- |
| **Nombre** | Documento técnico para el diseño y desarrollo de SIGEV |
| **Versión** | 0.1 |
| **Estado** | Borrador técnico para validación funcional y tecnológica |
| **Fecha** | 26 de julio de 2026 |
| **Base documental** | `SIGEV.html`, `1. SIGEV.html`, `2. SIGEV.html`, `SIGEV_desembolso2.html` |
| **Propósito** | Definir el alcance funcional, las reglas de negocio, los datos, la arquitectura de referencia y los criterios de aceptación de la herramienta |

### Criterio de Interpretación
Los archivos HTML se consideran *dummies* funcionales. Su contenido permite identificar módulos, campos, flujos, cálculos y comportamientos esperados. No constituyen una arquitectura productiva ni una especificación cerrada. El presente documento diferencia los requisitos observados en los prototipos de las condiciones propuestas para llevar la solución a un ambiente institucional, multiusuario, seguro y auditable.

> **Advertencia Funcional:** Existe una diferencia interna en los prototipos respecto de la base utilizada para calcular el Fee Técnico Administrativo de los ítems tarifados. Algunas descripciones indican que se aplica sobre el total sin retenciones y el código operativo lo calcula sobre la base sin impuestos. Esta definición deberá ser validada y aprobada antes de cerrar el motor de cálculo.

---

## Tabla de Contenido

1. [Introducción](#1-introducción)
2. [Visión de la Solución](#2-visión-de-la-solución)
3. [Alcance Funcional](#3-alcance-funcional)
4. [Actores, Perfiles y Permisos](#4-actores-perfiles-y-permisos)
5. [Arquitectura Funcional](#5-arquitectura-funcional)
6. [Requisitos Funcionales](#6-requisitos-funcionales)
7. [Reglas de Negocio y Motor de Cálculo](#7-reglas-de-negocio-y-motor-de-cálculo)
8. [Modelo de Información](#8-modelo-de-información)
9. [Flujos Operativos](#9-flujos-operativos)
10. [Integraciones, Importaciones y Exportaciones](#10-integraciones-importaciones-y-exportaciones)
11. [Reportes e Indicadores](#11-reportes-e-indicadores)
12. [Seguridad, Auditoría y Trazabilidad](#12-seguridad-auditoría-y-trazabilidad)
13. [Requisitos No Funcionales](#13-requisitos-no-funcionales)
14. [Arquitectura Tecnológica de Referencia](#14-arquitectura-tecnológica-de-referencia)
15. [Estrategia de Pruebas y Aceptación](#15-estrategia-de-pruebas-y-aceptación)
16. [Fases de Implementación y Entregables](#16-fases-de-implementación-y-entregables)
17. [Supuestos, Dependencias y Decisiones Pendientes](#17-supuestos-dependencias-y-decisiones-pendientes)
* [Anexo A: Matriz Resumida de Entidades](#anexo-a-matriz-resumida-de-entidades)
* [Anexo B: Catálogo Inicial de Estados y Clasificaciones](#anexo-b-catálogo-inicial-de-estados-y-clasificaciones)

---

## 1. Introducción

### 1.1 Propósito
Este documento establece la especificación técnica y funcional inicial para desarrollar **SIGEV** como una aplicación web destinada a registrar, valorar, controlar y hacer seguimiento a eventos. La solución deberá integrar la gestión de solicitudes, la construcción de ofertas económicas, el seguimiento de la ejecución, la consolidación presupuestal, la visualización territorial y la generación de reportes.

### 1.2 Antecedentes
Los prototipos suministrados implementan una aplicación de una sola página (SPA) con almacenamiento local (*localStorage*). En conjunto muestran panel de control, órdenes, ofertas económicas, matriz de ejecución, tablero por estados, mapa de Colombia, parámetros configurables, carga desde Excel, exportación de matrices y respaldo de datos. El prototipo más completo contiene información precargada asociada a un desembolso y permite simular el comportamiento esperado con eventos reales o de prueba.

### 1.3 Objetivo General
Desarrollar una herramienta web centralizada, modular, segura y escalable que permita administrar el ciclo de vida de los eventos y consolidar en tiempo real la información operativa, económica, presupuestal y territorial.

### 1.4 Objetivos Específicos
* Centralizar la información de eventos y sus requerimientos.
* Automatizar los cálculos económicos y tributarios conforme a parámetros autorizados.
* Consolidar la ejecución por evento, desembolso, aliado, estado, territorio y periodo.
* Facilitar el seguimiento operativo mediante estados y trazabilidad de cambios.
* Generar ofertas, matrices y reportes exportables.
* Garantizar control de acceso, auditoría, integridad y respaldo de la información.

### 1.5 Alcance del Documento
La especificación cubre la experiencia funcional, los requisitos del sistema, el modelo conceptual de datos, las reglas de negocio observadas, los flujos operativos, las integraciones de archivos, los controles de seguridad, los atributos de calidad y los entregables mínimos. La selección definitiva de tecnologías deberá realizarse durante el diseño de arquitectura y no deberá alterar los requisitos funcionales aprobados.

---

## 2. Visión de la Solución

### 2.1 Descripción General
SIGEV se concibe como una plataforma web multiusuario que concentra la información de los eventos desde su registro o importación hasta su legalización. Cada evento contiene datos administrativos, ubicación, responsable, aliado, desembolso, estado, esquema de presentación, observaciones e ítems económicos. Los cálculos se actualizan automáticamente y alimentan los paneles, matrices, reportes y consolidados.

### 2.2 Principios de Diseño

| Principio | Aplicación |
| :--- | :--- |
| **Dato único** | La información deberá registrarse una vez y reutilizarse en todos los módulos. |
| **Trazabilidad** | Toda modificación relevante deberá identificar usuario, fecha, valor anterior y valor nuevo. |
| **Parametrización** | Las tasas, catálogos, estados y reglas autorizadas deberán administrarse sin modificar código fuente. |
| **Consistencia** | Los totales mostrados en pantallas, matrices y exportaciones deberán provenir del mismo motor de cálculo. |
| **Usabilidad** | La interfaz deberá facilitar la captura, revisión y consulta de grandes volúmenes de información. |
| **Seguridad** | El acceso y las acciones deberán depender del perfil y de los permisos asignados. |
| **Escalabilidad** | La solución deberá soportar crecimiento de usuarios, eventos, aliados, archivos y reportes. |

### 2.3 Límites Iniciales
La primera versión deberá concentrarse en la gestión de eventos, ítems, cálculos, seguimiento, consolidación y reportes. Las integraciones con sistemas financieros, documentales, contractuales o de identidad institucional podrán implementarse cuando se definan interfaces, responsables, niveles de servicio y reglas de intercambio.

---

## 3. Alcance Funcional

| Módulo | Alcance | Clasificación |
| :--- | :--- | :--- |
| **Panel de control** | Indicadores globales, ejecución por desembolso, distribución por aliado y órdenes recientes. | Observado |
| **Órdenes** | Creación manual, importación desde Excel, consulta, edición y eliminación controlada. | Observado |
| **Detalle del evento** | Datos administrativos, ubicación, estado, esquema, observaciones e ítems. | Observado |
| **Ofertas económicas** | Cálculo por evento, resumen económico y exportación de oferta. | Observado |
| **Matriz de ejecución** | Detalle por ítem y consolidados por desembolso y aliado. | Observado |
| **Tablero de seguimiento** | Visualización tipo Kanban y cambio de estado mediante arrastre. | Observado |
| **Mapa de ejecución** | Ubicación de eventos por municipio o coordenadas sobre mapa de Colombia. | Observado |
| **Parámetros** | Tasas, aliados, colores identificadores y respaldo local. | Observado |
| **Usuarios y permisos** | Autenticación, perfiles, autorización y administración de acceso. | Propuesto para producción |
| **Auditoría** | Registro de cambios, consultas, importaciones, exportaciones y acciones críticas. | Propuesto para producción |
| **Gestión documental** | Adjuntos, soportes, versiones y relación con eventos. | Propuesto para producción |

### 3.1 Alcance Mínimo Viable (MVP)
* Autenticación y administración básica de usuarios.
* Registro manual e importación de órdenes desde los formatos definidos.
* Edición de datos del evento y de sus ítems.
* Motor de cálculo parametrizado y validado.
* Ofertas económicas y matrices exportables.
* Panel de control y consolidados.
* Tablero de estados con historial.
* Mapa de ejecución por municipio y coordenadas.
* Auditoría, respaldo y recuperación.

### 3.2 Funcionalidades Evolutivas
* Integración con directorio institucional para inicio de sesión.
* Integración con sistemas contractuales, financieros o presupuestales.
* Gestión documental avanzada y firma electrónica.
* Notificaciones automáticas por vencimientos, estados o inconsistencias.
* Aplicación móvil o interfaz optimizada para trabajo de campo.
* Analítica avanzada, alertas y proyecciones de ejecución.

---

## 4. Actores, Perfiles y Permisos

| Perfil | Responsabilidad | Alcance de Acceso |
| :--- | :--- | :--- |
| **Administrador funcional** | Gestiona catálogos, tasas, aliados, desembolsos, estados y reglas autorizadas. Consulta auditoría funcional. | Crear, editar, activar e inactivar parámetros. |
| **Administrador técnico** | Administra usuarios, roles, configuración técnica, respaldos y monitoreo. | Acceso técnico controlado sin alterar reglas funcionales no autorizadas. |
| **Operador** | Registra e importa eventos, completa datos, administra ítems y prepara ofertas. | Crear y editar eventos asignados. |
| **Supervisor** | Revisa consistencia, consulta ejecución y cambia estados conforme al flujo aprobado. | Aprobar, observar y devolver registros. |
| **Consulta** | Visualiza paneles, eventos y reportes sin modificar datos. | Solo lectura. |
| **Auditor** | Consulta historial, eventos, cálculos, exportaciones y cambios. | Solo lectura con acceso a trazabilidad. |

### 4.1 Matriz Inicial de Permisos

| Función | Adm. Funcional | Adm. Técnico | Operador | Supervisor | Consulta | Auditor |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Paneles y reportes** | Sí | Sí | Sí | Sí | Sí | Sí |
| **Crear eventos** | Sí | No | Sí | Opcional | No | No |
| **Editar eventos** | Sí | No | Sí | Sí | No | No |
| **Eliminar eventos** | Sí | No | Restringido | Restringido | No | No |
| **Cambiar estado** | Sí | No | Según flujo | Sí | No | No |
| **Modificar tasas** | Sí | No | No | No | No | No |
| **Administrar usuarios** | No | Sí | No | No | No | No |
| **Consultar auditoría** | Sí | Sí | No | Sí | No | Sí |

---

## 5. Arquitectura Funcional

### 5.1 Vista de Capas
* **Usuarios:** Administrador, Operador, Supervisor, Consulta y Auditor.
* **Interfaz Web:** Panel, Órdenes, Detalle, Ofertas, Matrices, Tablero, Mapa y Parámetros.
* **Servicios de Aplicación:** Autenticación, Eventos, Ítems, Cálculos, Seguimiento, Reportes, Importación y Auditoría.
* **Persistencia:** Base de datos transaccional, Almacenamiento de archivos y Repositorio de respaldos.
* **Servicios Transversales:** Seguridad, Monitoreo, Trazas, Notificaciones, Configuración y Recuperación.

### 5.2 Navegación Principal
* **Principal:** Panel
* **Flujo:** Órdenes \| Ofertas económicas \| Matriz de ejecución
* **Seguimiento:** Tablero \| Mapa
* **Ajustes:** Parámetros \| Usuarios \| Auditoría

### 5.3 Comportamiento General de la Interfaz
* La navegación deberá conservar el contexto del usuario y evitar pérdida de información no guardada.
* Las acciones críticas deberán solicitar confirmación y explicar sus consecuencias.
* Los formularios deberán indicar campos obligatorios, errores y reglas de validación.
* Las tablas deberán permitir búsqueda, filtros, ordenamiento y paginación.
* Los valores monetarios deberán mostrarse en formato `es-CO` y conservar precisión en la base de datos.
* La interfaz deberá adaptarse a computadores y tabletas. El uso en teléfono deberá permitir consulta y acciones esenciales.

---

## 6. Requisitos Funcionales

### 6.1 Panel de Control

| Código | Requisito | Origen | Prioridad | Criterio de Aceptación |
| :--- | :--- | :--- | :--- | :--- |
| **RF-PAN-001** | Mostrar el valor total de ejecución y el número total de eventos. | Observado | Alta | Los valores coinciden con la suma de todos los eventos activos. |
| **RF-PAN-002** | Mostrar base más impuestos, Fee Técnico Administrativo e impuestos acumulados. | Observado | Alta | Cada indicador coincide con el motor de cálculo central. |
| **RF-PAN-003** | Consolidar la ejecución por desembolso y mostrar valor, participación y número de eventos. | Observado | Alta | Los datos pueden validarse contra la matriz global. |
| **RF-PAN-004** | Consolidar la ejecución por aliado y mostrar valor, porcentaje, número de eventos y Fee. | Observado | Alta | La participación suma 100% salvo redondeos. |
| **RF-PAN-005** | Mostrar las órdenes recientes con acceso directo al detalle. | Observado | Media | El usuario abre el evento seleccionado desde el panel. |
| **RF-PAN-006** | Aplicar filtros globales por periodo, desembolso, aliado, estado, dependencia y territorio. | Producción | Alta | Todos los indicadores responden al mismo conjunto de filtros. |
| **RF-PAN-007** | Permitir exportar el resumen del panel. | Producción | Media | El reporte conserva filtros, fecha de corte y usuario generador. |

### 6.2 Gestión de Órdenes

| Código | Requisito | Origen | Prioridad | Criterio de Aceptación |
| :--- | :--- | :--- | :--- | :--- |
| **RF-ORD-001** | Crear una orden de manera manual. | Observado | Alta | La orden se guarda y queda disponible para edición. |
| **RF-ORD-002** | Importar órdenes desde archivos `.xlsx` o `.xls`. | Observado | Alta | El sistema procesa archivos válidos y rechaza extensiones no permitidas. |
| **RF-ORD-003** | Reconocer los formatos FOR-EV-ADMO-01 y FOR-EC-ADMO-02. | Observado | Alta | Se extraen metadatos e ítems conforme a la estructura aprobada. |
| **RF-ORD-004** | Presentar una revisión previa de la importación. | Observado | Alta | El usuario revisa evento, responsable, municipio, aliado, desembolso, esquema e ítems antes de confirmar. |
| **RF-ORD-005** | Listar órdenes con evento, responsable, municipio, fecha, aliado, desembolso, esquema, número de ítems y total. | Observado | Alta | La información mostrada coincide con el detalle del evento. |
| **RF-ORD-006** | Permitir buscar, filtrar y ordenar órdenes. | Producción | Alta | La consulta responde en tiempos aceptables y conserva filtros. |
| **RF-ORD-007** | Permitir eliminar una orden mediante confirmación. | Observado | Media | La eliminación respeta permisos y deja registro de auditoría. |
| **RF-ORD-008** | Evitar duplicados mediante una llave funcional configurable. | Producción | Alta | El sistema alerta coincidencias de evento, sufijo y contexto contractual. |
| **RF-ORD-009** | Manejar borrador, importado, validado y otros estados internos de captura. | Producción | Media | El estado interno se diferencia del estado operativo del evento. |

### 6.3 Detalle del Evento e Ítems

| Código | Requisito | Origen | Prioridad | Criterio de Aceptación |
| :--- | :--- | :--- | :--- | :--- |
| **RF-DET-001** | Registrar número de evento, sufijo, asistentes y días. | Observado | Alta | Los campos se guardan y se muestran al volver a abrir la orden. |
| **RF-DET-002** | Registrar responsable, dependencia y fecha del evento. | Observado | Alta | Los datos quedan disponibles en consultas y reportes. |
| **RF-DET-003** | Registrar departamento, municipio y vereda. | Observado | Alta | La ubicación alimenta el módulo de mapa y los filtros territoriales. |
| **RF-DET-004** | Asignar aliado y desembolso. | Observado | Alta | Los consolidados se actualizan de forma inmediata. |
| **RF-DET-005** | Asignar estado de seguimiento. | Observado | Alta | El evento aparece en la columna correspondiente del tablero. |
| **RF-DET-006** | Seleccionar esquema de presentación entre cotización y detalle. | Observado | Alta | La exportación refleja el esquema seleccionado sin alterar los valores calculados. |
| **RF-DET-007** | Registrar latitud, longitud y observaciones. | Observado | Media | Las coordenadas ubican el evento y las observaciones quedan auditadas. |
| **RF-DET-008** | Agregar, editar y eliminar ítems. | Observado | Alta | Los totales se recalculan después de cada cambio. |
| **RF-DET-009** | Registrar descripción, cantidad, valor unitario y carga tributaria por ítem. | Observado | Alta | Cada fila muestra base, impuesto, Fee y total. |
| **RF-DET-010** | Permitir asignar un aliado específico por ítem cuando sea necesario. | Observado parcial | Media | El consolidado usa el aliado del ítem y, en ausencia, el del evento. |
| **RF-DET-011** | Permitir adjuntar soportes y clasificarlos. | Producción | Alta | Los archivos se relacionan con el evento, conservan versión y control de acceso. |

### 6.4 Motor de Cálculo

| Código | Requisito | Origen | Prioridad | Criterio de Aceptación |
| :--- | :--- | :--- | :--- | :--- |
| **RF-CAL-001** | Calcular base como cantidad multiplicada por valor unitario. | Observado | Alta | La operación se realiza con precisión definida y sin errores de redondeo acumulado. |
| **RF-CAL-002** | Clasificar ítems como IVA, impuesto al consumo, pago a terceros o reembolso. | Observado | Alta | Cada clasificación aplica la tasa y el tratamiento autorizado. |
| **RF-CAL-003** | Calcular IVA e impuesto al consumo. | Observado | Alta | Los impuestos coinciden con la tasa vigente para el ítem. |
| **RF-CAL-004** | Calcular Fee de ítems tarifados y Fee de terceros / reembolsos. | Observado | Alta | La base y la tasa utilizadas corresponden a la regla aprobada. |
| **RF-CAL-005** | Calcular IVA sobre el Fee Técnico Administrativo. | Observado | Alta | El impuesto se aplica sobre el Fee calculado. |
| **RF-CAL-006** | Calcular total por ítem y total por evento. | Observado | Alta | El total del evento coincide con la suma de sus ítems. |
| **RF-CAL-007** | Parametrizar tasas y vigencias. | Producción | Alta | Cada cálculo utiliza la tasa vigente según fecha y contexto. |
| **RF-CAL-008** | Conservar la versión de reglas y parámetros utilizada en cada cálculo. | Producción | Alta | Un cálculo histórico puede reproducirse con su configuración original. |
| **RF-CAL-009** | Recalcular de forma controlada cuando cambien datos económicos. | Producción | Alta | El sistema registra causa, usuario y diferencias frente al cálculo anterior. |

### 6.5 Ofertas, Matrices y Reportes

| Código | Requisito | Origen | Prioridad | Criterio de Aceptación |
| :--- | :--- | :--- | :--- | :--- |
| **RF-REP-001** | Mostrar ofertas económicas por evento con base, impuestos, Fee, IVA del Fee y total. | Observado | Alta | Los valores coinciden con el detalle de la orden. |
| **RF-REP-002** | Exportar la oferta económica de un evento a Excel. | Observado | Alta | El archivo contiene identificación, esquema, aliado, desembolso, ítems y totales. |
| **RF-REP-003** | Construir matriz detallada por evento e ítem. | Observado | Alta | La matriz incluye cantidad, valor unitario, carga tributaria, base, impuestos, Fee, total, aliado y desembolso. |
| **RF-REP-004** | Construir matriz global por desembolso y aliado. | Observado | Alta | Los totales coinciden con la suma de la matriz detallada. |
| **RF-REP-005** | Exportar matriz detallada y consolidados a Excel. | Observado | Alta | El libro contiene hojas separadas y encabezados definidos. |
| **RF-REP-006** | Permitir filtros, columnas configurables y descarga de resultados. | Producción | Alta | La exportación conserva los criterios aplicados por el usuario. |
| **RF-REP-007** | Registrar cada exportación en auditoría. | Producción | Media | Se identifica usuario, fecha, reporte y filtros. |

### 6.6 Seguimiento Operativo

| Código | Requisito | Origen | Prioridad | Criterio de Aceptación |
| :--- | :--- | :--- | :--- | :--- |
| **RF-SEG-001** | Clasificar eventos en Abierto, En ejecución, Ejecutado, Cerrado y Legalizado. | Observado | Alta | Cada evento aparece en un único estado. |
| **RF-SEG-002** | Mostrar cantidad y valor acumulado por estado. | Observado | Alta | Los valores coinciden con los eventos de cada columna. |
| **RF-SEG-003** | Mover eventos entre estados mediante arrastre. | Observado | Media | El cambio se guarda y se refleja en el detalle. |
| **RF-SEG-004** | Permitir cambiar el estado desde el detalle. | Observado | Alta | El tablero se actualiza inmediatamente. |
| **RF-SEG-005** | Registrar historial de estado. | Producción | Alta | Se conserva estado anterior, nuevo estado, usuario, fecha y observación. |
| **RF-SEG-006** | Aplicar transiciones y permisos configurables. | Producción | Alta | El sistema impide cambios no autorizados. |
| **RF-SEG-007** | Permitir observaciones, devoluciones y motivos de cambio. | Producción | Alta | Las decisiones quedan asociadas al historial. |

### 6.7 Mapa de Ejecución

| Código | Requisito | Origen | Prioridad | Criterio de Aceptación |
| :--- | :--- | :--- | :--- | :--- |
| **RF-MAP-001** | Mostrar los eventos ubicados y pendientes de ubicación. | Observado | Media | Los contadores coinciden con los registros con coordenadas. |
| **RF-MAP-002** | Ubicar eventos por municipio mediante una base geográfica. | Observado | Media | Los municipios reconocidos asignan latitud y longitud. |
| **RF-MAP-003** | Buscar municipios de Colombia. | Observado | Media | La búsqueda devuelve coincidencias por municipio o departamento. |
| **RF-MAP-004** | Asignar una ubicación a una orden. | Observado | Media | El marcador aparece en el mapa y queda vinculado al evento. |
| **RF-MAP-005** | Abrir el detalle desde el marcador. | Observado | Baja | El usuario accede al evento seleccionado. |
| **RF-MAP-006** | Visualizar marcadores según estado. | Observado | Media | El color del marcador corresponde al catálogo de estados. |
| **RF-MAP-007** | Usar un servicio geográfico oficial o una base administrable. | Producción | Media | La fuente geográfica tiene versión, cobertura y procedimiento de actualización. |

### 6.8 Administración y Configuración

| Código | Requisito | Origen | Prioridad | Criterio de Aceptación |
| :--- | :--- | :--- | :--- | :--- |
| **RF-ADM-001** | Configurar tasas de Fee e IVA sobre Fee. | Observado | Alta | Los cambios se aplican conforme a vigencia y permisos. |
| **RF-ADM-002** | Administrar aliados y colores identificadores. | Observado | Alta | Los aliados pueden crearse, editarse e inactivarse. |
| **RF-ADM-003** | Evitar la eliminación física de catálogos utilizados. | Producción | Alta | Los registros usados se inactivan y conservan historial. |
| **RF-ADM-004** | Exportar e importar respaldo. | Observado local | Media | En producción el respaldo se ejecuta por procedimientos administrados. |
| **RF-ADM-005** | Administrar usuarios, roles y permisos. | Producción | Alta | Las acciones disponibles corresponden al perfil. |
| **RF-ADM-006** | Administrar desembolsos, dependencias, estados y catálogos territoriales. | Producción | Alta | Los catálogos se mantienen con vigencia y auditoría. |

---

## 7. Reglas de Negocio y Motor de Cálculo

### 7.1 Categorías Tributarias Iniciales

| Código Funcional | Tratamiento | Referencia del Prototipo | Efecto |
| :--- | :--- | :--- | :--- |
| **IVA** | Ítem gravado | Tasa de referencia 19% | Genera IVA y Fee de tarifado. |
| **Consumo** | Ítem sujeto a impuesto al consumo | Tasa de referencia 8% | Genera impuesto al consumo y Fee de tarifado. |
| **Tercero** | Pago a terceros no gravado | Tasa tributaria 0% | Genera Fee de terceros. |
| **Reembolso** | Reembolso no gravado | Tasa tributaria 0% | Genera Fee de terceros o reembolsos. |

### 7.2 Fórmulas Observadas

* **Base:** $Base = Cantidad 	imes Valor Unitario$
* **Impuesto:** $Impuesto = IVA + Impuesto al Consumo$
* **Total sin retenciones:** $Total sin retenciones = Base + Impuesto$
* **Fee tarifado:** $Fee tarifado = Base 	imes Tasa de Fee tarifado$ *(según el código operativo del prototipo)*
* **Fee de terceros:** $Fee de terceros = Base 	imes Tasa de Fee de terceros o reembolsos$
* **Fee total:** $Fee total = Fee tarifado + Fee de terceros$
* **IVA del Fee:** $IVA del Fee = Fee total 	imes Tasa de IVA del Fee$
* **Total del ítem:** $Total del ítem = Total sin retenciones + Fee total + IVA del Fee$

> **Decisión pendiente sobre el Fee tarifado:** El código del prototipo aplica el porcentaje sobre la base sin impuestos. Otros comentarios del mismo prototipo indican aplicación sobre el total sin retenciones. La decisión deberá quedar registrada en una matriz de reglas aprobada por el responsable funcional y tributario.

### 7.3 Reglas Generales
* Las tasas deberán administrarse con fecha de inicio, fecha de fin, estado y responsable de aprobación.
* Cada cálculo deberá conservar la versión de parámetros utilizada.
* Los redondeos deberán definirse por concepto y aplicarse de manera uniforme en pantalla, base de datos y exportaciones.
* Los campos cantidad y valor unitario no podrán aceptar valores negativos, salvo que exista una regla de ajuste autorizada.
* Los ítems sin valor podrán registrarse como requerimientos pendientes de valoración.
* El cambio de clasificación tributaria deberá generar un recálculo y un registro de auditoría.
* El esquema de cotización y el esquema de detalle modifican la presentación; no deberán producir resultados económicos distintos cuando usan los mismos datos y reglas.
* Los eventos eliminados deberán manejarse mediante anulación lógica cuando tengan historial, exportaciones o soportes relacionados.
* La asignación de aliado por ítem deberá prevalecer sobre la asignación general del evento para los consolidados que requieran detalle.

### 7.4 Validaciones Mínimas

| Campo o Proceso | Validación |
| :--- | :--- |
| **Evento** | Número obligatorio y formato definido. Validación de posible duplicado. |
| **Sufijo** | Opcional. Deberá participar en la llave funcional cuando exista. |
| **Responsable** | Obligatorio para eventos en validación o estados posteriores. |
| **Ubicación** | Municipio obligatorio cuando el evento tenga ejecución territorial. |
| **Desembolso** | Obligatorio antes de aprobar la oferta o consolidar ejecución. |
| **Aliado** | Obligatorio antes de pasar a ejecución, salvo regla expresa. |
| **Ítems** | Al menos un ítem para generar oferta. |
| **Cantidad** | Número mayor que cero. |
| **Valor unitario** | Número mayor o igual que cero. |
| **Carga tributaria** | Valor perteneciente al catálogo vigente. |
| **Estado** | Transición permitida para el perfil y situación actual. |

---

## 8. Modelo de Información

### 8.1 Entidades Principales

| Entidad | Propósito | Atributos Principales |
| :--- | :--- | :--- |
| **Usuario** | Identidad que accede a la solución. | Identificador, nombre, correo, estado, último acceso. |
| **Rol** | Conjunto de permisos. | Identificador, nombre, descripción, estado. |
| **Evento u orden** | Registro central del proceso. | Número, sufijo, responsable, dependencia, ubicación, fecha, asistentes, días, aliado, desembolso, estado, esquema, observaciones. |
| **Ítem** | Requerimiento económico asociado al evento. | Descripción, cantidad, valor unitario, categoría tributaria, tasa, aliado, valores calculados. |
| **Aliado** | Operador o tercero asignable. | Nombre, código, color, estado, vigencia. |
| **Desembolso** | Agrupador presupuestal o contractual. | Código, nombre, vigencia, valor de referencia, estado. |
| **Parámetro de cálculo** | Tasa o regla vigente. | Tipo, valor, vigencia, versión, aprobación. |
| **Historial de estado** | Trazabilidad del avance. | Estado anterior, estado nuevo, fecha, usuario, motivo. |
| **Importación** | Control de archivos procesados. | Archivo, usuario, fecha, resultado, errores, registros creados. |
| **Exportación** | Control de reportes generados. | Tipo, filtros, usuario, fecha, archivo. |
| **Adjunto** | Soporte documental. | Nombre, tipo, tamaño, versión, ubicación, evento relacionado. |
| **Auditoría** | Registro inmutable de acciones. | Actor, acción, entidad, valor anterior, valor nuevo, fecha, origen. |

### 8.2 Relaciones Conceptual
* **Usuario $ightarrow$ Rol:** Muchos a muchos mediante asignación de roles.
* **Evento $ightarrow$ Ítem:** Uno a muchos.
* **Evento $ightarrow$ Aliado:** Muchos a uno.
* **Ítem $ightarrow$ Aliado:** Muchos a uno y opcional.
* **Evento $ightarrow$ Desembolso:** Muchos a uno.
* **Evento $ightarrow$ Historial de estado:** Uno a muchos.
* **Evento $ightarrow$ Adjunto:** Uno a muchos.
* **Evento $ightarrow$ Importación:** Muchos a uno cuando se crea mediante archivo.
* **Parámetro $ightarrow$ Cálculo:** Uno a muchos mediante versión aplicada.
* **Usuario $ightarrow$ Auditoría:** Uno a muchos.

### 8.3 Consideraciones de Integridad
* Los identificadores internos deberán ser inmutables y diferentes de los códigos funcionales.
* Los valores monetarios deberán almacenarse con precisión suficiente para evitar pérdida por redondeo.
* Los catálogos utilizados en transacciones no deberán eliminarse físicamente.
* La auditoría deberá conservar referencias incluso cuando un registro sea inactivado.
* Los archivos deberán almacenarse fuera de la base transaccional y referenciarse mediante metadatos seguros.
* Las fechas y horas deberán registrarse con zona horaria y presentarse conforme a `America/Bogota`.

---

## 9. Flujos Operativos

### 9.1 Creación Manual de un Evento
1. El usuario selecciona **Nueva orden**.
2. Registra número de evento, sufijo, responsable, municipio, fecha, aliado, desembolso y esquema.
3. El sistema valida campos mínimos y posibles duplicados.
4. El sistema crea el evento en estado de captura y abre el detalle.
5. El usuario completa datos e incorpora ítems.
6. El motor calcula valores y actualiza paneles y matrices.

### 9.2 Importación desde Excel
1. El usuario carga un archivo `.xlsx` o `.xls`.
2. El sistema identifica hojas y estructura.
3. El sistema extrae metadatos e ítems.
4. El sistema clasifica tributariamente los ítems conforme a reglas de importación.
5. El sistema presenta un resumen de revisión con datos detectados y alertas.
6. El usuario corrige o completa los campos requeridos.
7. El sistema guarda el evento, los ítems y el registro de importación.
8. El sistema genera un resultado con registros creados, omitidos y observados.

### 9.3 Actualización del Estado
1. El usuario selecciona o arrastra el evento al estado destino.
2. El sistema valida permisos y transición.
3. Cuando aplique, solicita motivo u observación.
4. El sistema guarda el nuevo estado y crea el historial.
5. El tablero, el panel y los reportes se actualizan.

### 9.4 Generación de Oferta y Matriz
1. El usuario abre un evento o selecciona un reporte.
2. El sistema valida que los datos requeridos estén completos.
3. El motor recupera reglas y parámetros vigentes para el registro.
4. El sistema genera el documento o archivo.
5. La exportación registra usuario, fecha, filtros, versión y resultado.

---

## 10. Integraciones, Importaciones y Exportaciones

### 10.1 Importación de Archivos
El prototipo reconoce hojas asociadas a `FOR-EV-ADMO-01` y `FOR-EC-ADMO-02`, además de estructuras tipo detalle principal. La implementación deberá utilizar plantillas versionadas y reglas de lectura desacopladas del código de interfaz.

* **Formato permitido:** `.xlsx` y `.xls` durante la transición. Se recomienda estandarizar `.xlsx`.
* **Tamaño máximo:** Definido por arquitectura y capacidad operativa.
* **Versionamiento:** Cada plantilla deberá tener código, versión y fecha de vigencia.
* **Validación:** Estructura, tipos de datos, campos obligatorios, duplicados y consistencia económica.
* **Resultado:** Registros creados, actualizados, rechazados y advertencias.
* **Reprocesamiento:** Un archivo no deberá duplicar información al ser procesado nuevamente.
* **Seguridad:** Análisis de tipo, extensión, contenido y código malicioso.

### 10.2 Exportaciones

| Producto | Contenido | Formato Inicial |
| :--- | :--- | :--- |
| **Oferta económica** | Un evento | Excel y, cuando se apruebe, PDF |
| **Matriz detallada** | Eventos e ítems | Excel |
| **Global por desembolso** | Desembolsos y aliados | Excel |
| **Global por aliado** | Aliados y eventos | Excel |
| **Panel ejecutivo** | Indicadores y filtros | Excel o PDF |
| **Auditoría** | Acciones y cambios | Excel o CSV con permisos restringidos |

### 10.3 API e Integraciones Futuras
* La lógica de negocio deberá exponerse mediante servicios internos con contratos versionados.
* Las integraciones deberán autenticarse y registrar trazabilidad de solicitudes y respuestas.
* Los servicios deberán manejar idempotencia para operaciones de creación o actualización.
* Los errores de integración deberán quedar en una cola o estado de reintento administrable.
* No se deberá conectar directamente una interfaz externa a la base de datos de SIGEV.

---

## 11. Reportes e Indicadores

### Indicadores Iniciales
* **Total de ejecución:** Suma del total de eventos incluidos en el filtro.
* **Base más impuestos:** Suma del total sin retenciones.
* **Fee acumulado:** Suma del Fee Técnico Administrativo.
* **Impuestos:** Suma de IVA e impuesto al consumo.
* **Eventos por estado:** Cantidad y valor total en cada estado.
* **Ejecución por desembolso:** Valor, número de eventos y participación.
* **Ejecución por aliado:** Valor, número de eventos, participación, impuestos y Fee.
* **Cobertura territorial:** Eventos por departamento, municipio y condición de georreferenciación.
* **Eventos sin completar:** Registros con campos, aliado, desembolso, ubicación o ítems pendientes.
* **Variaciones:** Diferencias entre versiones de cálculo o cambios relevantes.

### 11.1 Filtros Comunes
Rango de fechas del evento y de registro, número de evento/sufijo, responsable/dependencia, ubicación (departamento, municipio, vereda), aliado, desembolso, estado, esquema de presentación y clasificación tributaria.

### 11.2 Reglas de Reporte
* Cada reporte deberá mostrar fecha de corte, filtros aplicados y usuario generador.
* Los totales deberán conciliar con el motor central y con la matriz detallada.
* La exportación no deberá depender del formato visual de la pantalla.
* Los reportes de gran volumen deberán generarse mediante procesos controlados y notificar su disponibilidad.
* Los datos sensibles deberán ocultarse o limitarse conforme al perfil.

---

## 12. Seguridad, Auditoría y Trazabilidad

| Control | Requisito |
| :--- | :--- |
| **Autenticación** | Inicio de sesión seguro, política de credenciales o integración con identidad institucional. |
| **Autorización** | Permisos por rol, módulo, acción y alcance de datos. |
| **Sesión** | Expiración, cierre seguro, protección frente a secuestro de sesión. |
| **Cifrado** | Tráfico cifrado (HTTPS/TLS) y protección de datos sensibles almacenados. |
| **Auditoría** | Registro de creación, edición, eliminación lógica, cambio de estado, importación, exportación y administración. |
| **Integridad** | Validaciones, transacciones y control de concurrencia. |
| **Archivos** | Validación de tipo, tamaño, contenido, acceso y retención. |
| **Respaldo** | Copias automáticas, retención, restauración y pruebas periódicas. |
| **Monitoreo** | Alertas por fallos, accesos anómalos y degradación del servicio. |
| **Privacidad** | Aplicación de minimización, finalidad, retención y control de acceso. |

### 12.1 Eventos Mínimos de Auditoría
* Inicio y cierre de sesión.
* Creación, edición, anulación y restauración de eventos.
* Creación, edición y eliminación de ítems.
* Cambios de clasificación tributaria, tasas y parámetros.
* Cambios de aliado, desembolso, ubicación y estado.
* Importaciones, reprocesamientos y resultados.
* Exportaciones y descargas.
* Administración de usuarios, roles y permisos.
* Acceso a información restringida.

---

## 13. Requisitos No Funcionales

| Código | Atributo | Requisito | Prioridad | Verificación |
| :--- | :--- | :--- | :--- | :--- |
| **RNF-001** | Disponibilidad | Definir una disponibilidad objetivo y ventanas de mantenimiento aprobadas. | Alta | Monitoreo mensual y reporte de indisponibilidad. |
| **RNF-002** | Rendimiento | Las consultas habituales deberán responder en pocos segundos bajo la carga acordada. | Alta | Pruebas con volumen representativo y percentiles de respuesta. |
| **RNF-003** | Escalabilidad | Aumentar usuarios, eventos y archivos sin rediseño completo. | Alta | Prueba de crecimiento y separación de componentes. |
| **RNF-004** | Seguridad | Buenas prácticas de desarrollo seguro y gestión de vulnerabilidades. | Alta | Análisis de seguridad y cierre de hallazgos críticos. |
| **RNF-005** | Usabilidad | Interfaz consistente, comprensible y que reduzca errores de captura. | Alta | Pruebas con usuarios y tasa de éxito por tarea. |
| **RNF-006** | Accesibilidad | Considerar navegación por teclado, contraste, etiquetas y mensajes comprensibles. | Media | Revisión de criterios de accesibilidad acordados. |
| **RNF-007** | Compatibilidad | Funcionar en navegadores institucionales vigentes. | Alta | Matriz de compatibilidad aprobada. |
| **RNF-008** | Mantenibilidad | Código modular, documentado, probado y sujeto a revisión. | Alta | Cobertura de pruebas, documentación y análisis estático. |
| **RNF-009** | Observabilidad | Generar registros, métricas y alertas. | Alta | Tableros de monitoreo y procedimiento de atención. |
| **RNF-010** | Respaldo | Copias automáticas y restauración probada. | Alta | Prueba documentada de recuperación. |
| **RNF-011** | Recuperación | Definir RPO (pérdida máxima de datos) y RTO (tiempo de recuperación). | Alta | Simulación de contingencia y cumplimiento de objetivos. |
| **RNF-012** | Interoperabilidad | Usar contratos versionados y formatos estándar. | Media | Documentación y pruebas de integración. |
| **RNF-013** | Trazabilidad | Relacionar requisitos con diseño, desarrollo y pruebas. | Alta | Matriz de trazabilidad completa. |
| **RNF-014** | Configurabilidad | Modificar tasas, catálogos y reglas autorizadas sin despliegue. | Alta | Cambio controlado desde administración. |
| **RNF-015** | Localización | Fechas, moneda y textos en configuración `es-CO` y zona `America/Bogota`. | Alta | Validación de formato en pantallas y exportaciones. |
| **RNF-016** | Concurrencia | Prevenir pérdida de cambios cuando dos usuarios editan el mismo registro. | Alta | Control de versión y mensaje de conflicto. |
| **RNF-017** | Retención | Conservar datos y archivos conforme a una tabla de retención aprobada. | Media | Política implementada y verificable. |
| **RNF-018** | Portabilidad | Desplegarse mediante procedimientos reproducibles. | Media | Automatización de construcción y despliegue. |

---

## 14. Arquitectura Tecnológica de Referencia

* **Frontend Web:** Aplicación responsiva con componentes reutilizables, gestión de formularios, tablas, tablero y mapa.
* **Backend de Servicios:** API para usuarios, eventos, ítems, cálculos, estados, parámetros, archivos, reportes y auditoría.
* **Motor de Cálculo:** Componente independiente, versionado y probado que centraliza fórmulas y reglas.
* **Base de Datos:** Motor relacional con transacciones, índices, integridad referencial y respaldo.
* **Almacenamiento de Archivos:** Repositorio seguro para importaciones, exportaciones y soportes.
* **Autenticación:** Proveedor institucional o servicio propio con controles robustos.
* **Reportes:** Servicio de generación de Excel y PDF desacoplado de la interfaz.
* **Mapa:** Componente geográfico con fuente de municipios versionada o servicio autorizado.
* **Auditoría:** Registro central, inmutable y consultable conforme a permisos.
* **Monitoreo:** Registros técnicos, métricas, trazas y alertas.

### 14.1 Ambientes
* **Desarrollo:** Construcción y pruebas técnicas del equipo. Datos ficticios o anonimizados.
* **Pruebas (QA):** Validación funcional, integración, seguridad y rendimiento.
* **Producción:** Operación real con controles, monitoreo, respaldo y gestión de cambios.

### 14.2 Prácticas de Ingeniería
* Repositorio de código con estrategia de ramas (*GitFlow*) y revisión por pares (*Code Review*).
* Integración continua (CI) con compilación, pruebas y análisis de calidad.
* Despliegue automatizado (CD) y trazable por ambiente.
* Gestión de secretos fuera del código fuente.
* Migraciones versionadas de base de datos.
* Documentación de API y decisiones de arquitectura.
* Gestión de dependencias y vulnerabilidades.

---

## 15. Estrategia de Pruebas y Aceptación

### 15.1 Tipos de Prueba
* **Unitarias:** Fórmulas, validadores, transformaciones y reglas.
* **Integración:** Base de datos, archivos, autenticación, reportes y servicios.
* **Funcionales:** Flujos completos por módulo.
* **Regresión:** Verificación de funcionalidades existentes después de cambios.
* **Rendimiento:** Carga, concurrencia, consultas y generación de reportes.
* **Seguridad:** Autenticación, autorización, sesiones, archivos y vulnerabilidades.
* **Usabilidad:** Comprensión, eficiencia y prevención de errores.
* **Aceptación (UAT):** Validación por responsables funcionales con datos representativos.
* **Recuperación:** Restauración de respaldo y operación en contingencia.

### 15.2 Criterios Generales de Aceptación
* Requisitos de prioridad alta con evidencia de prueba aprobada.
* Conciliación total entre pantallas, ofertas, matrices y exportaciones.
* Ausencia de defectos críticos o altos abiertos para puesta en producción.
* Reglas de cálculo aprobadas por el responsable funcional.
* Prueba documentada de restauración de respaldos antes de salir a producción.
* Control de perfiles verificado.
* Entregables técnicos y funcionales actualizados.

---

## 16. Fases de Implementación y Entregables

| Fase | Objetivo | Entregables Principales |
| :--- | :--- | :--- |
| **Fase 1** | Descubrimiento y validación | Matriz de requisitos, reglas de negocio, prototipo navegable, modelo de datos y decisiones pendientes. |
| **Fase 2** | Diseño técnico | Arquitectura, seguridad, API, diseño de base de datos, plan de pruebas y estrategia de despliegue. |
| **Fase 3** | Construcción del núcleo | Usuarios, parámetros, órdenes, detalle, ítems y motor de cálculo. |
| **Fase 4** | Seguimiento y reportes | Panel, ofertas, matrices, tablero, mapa y exportaciones. |
| **Fase 5** | Integración y endurecimiento | Archivos, auditoría, rendimiento, seguridad, respaldo y monitoreo. |
| **Fase 6** | Aceptación y producción | Pruebas de aceptación, capacitación, migración, manuales, despliegue y soporte inicial. |

---

## 17. Supuestos, Dependencias y Decisiones Pendientes

| Decisión | Definición Requerida | Impacto |
| :--- | :--- | :--- |
| **Base del Fee tarifado** | Definir si el porcentaje se aplica sobre la base sin impuestos o sobre el total sin retenciones. | Crítica |
| **Retenciones** | Definir si la herramienta solo muestra valores sin retenciones o debe calcular retenciones adicionales. | Alta |
| **Esquemas de presentación** | Documentar las diferencias exactas entre cotización y detalle. | Alta |
| **Llave del evento** | Definir combinación única de número, sufijo, contrato, vigencia o dependencia. | Alta |
| **Flujo de estados** | Confirmar transiciones permitidas, responsables, devoluciones y requisitos por estado. | Alta |
| **Desembolsos** | Definir catálogo, vigencia, topes, valores contratados y reglas de agotamiento. | Alta |
| **Aliados** | Definir si la asignación puede hacerse por evento, por ítem o mediante distribución porcentual. | Alta |
| **Importación** | Suministrar plantillas oficiales y versiones vigentes de los formatos. | Alta |
| **Documentos** | Definir tipos de soporte, obligatoriedad, tamaño, retención y permisos. | Media |
| **Mapa** | Definir fuente geográfica y nivel requerido para vereda o zona rural. | Media |
| **Reportes** | Aprobar plantillas, encabezados, logos, firmas y formatos de salida. | Media |
| **Usuarios** | Definir fuente de identidad, perfiles, responsables de alta y baja. | Alta |
| **Infraestructura** | Definir nube, centro de datos, dominio, certificados, respaldo y monitoreo. | Alta |
| **Migración** | Definir fuentes históricas, calidad de datos y estrategia de carga inicial. | Media |

---

## Anexo A: Matriz Resumida de Entidades

| Entidad | Creación | Edición | Consulta | Inactivación | Observación |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Usuario** | Sí | Sí | No | No | Auditoría y permisos |
| **Rol** | Sí | Sí | No | No | Administración técnica |
| **Evento** | Sí | Sí | Sí | No | Entidad central |
| **Ítem** | Sí | Sí | Sí | No | Depende del evento |
| **Aliado** | Sí | Sí | No | Sí | Catálogo con vigencia |
| **Desembolso** | Sí | Sí | No | Sí | Catálogo contractual |
| **Parámetro** | Sí | Sí | No | Sí | Versionado y aprobado |
| **Historial de estado** | Automática | No | Sí | No | Inmutable |
| **Importación** | Automática | No | Sí | No | Resultado y errores |
| **Exportación** | Automática | No | Sí | No | Filtros y archivo |
| **Adjunto** | Sí | Sí | Sí | Sí | Versionado |
| **Auditoría** | Automática | No | Sí | No | Acceso restringido |

---

## Anexo B: Catálogo Inicial de Estados y Clasificaciones

### Catálogo de Estados

| Estado | Definición Inicial |
| :--- | :--- |
| **Abierto** | Evento creado o recibido, pendiente de gestión. |
| **En ejecución** | Evento en preparación o desarrollo. |
| **Ejecutado** | Actividad realizada y pendiente de cierre. |
| **Cerrado** | Gestión operativa cerrada y pendiente de legalización cuando aplique. |
| **Legalizado** | Evento con cierre documental y económico completado. |

### Catálogo de Clasificaciones Tributarias

| Clasificación | Definición Inicial |
| :--- | :--- |
| **IVA** | Ítem gravado con IVA. |
| **Consumo** | Ítem sujeto a impuesto al consumo. |
| **Tercero** | Pago a tercero no gravado dentro del prototipo. |
| **Reembolso** | Reembolso no gravado dentro del prototipo. |

---
*Fin del documento técnico SIGEV.*
