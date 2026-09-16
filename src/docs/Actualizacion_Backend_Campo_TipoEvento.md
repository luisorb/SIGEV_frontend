# Actualización Backend: nuevo campo "Evento" (tipoEvento) e "Instancia de participación"

> Instrucciones para el equipo de backend.
> **No hay renombres de columnas en esta iteración** (el cambio de la etiqueta "Sufijo" → "Alcance" es exclusivamente visual en el frontend y no modifica el contrato de la API ni la BD).

Fecha: 2026-09-16

---

## 1. Resumen de los cambios

Se ajustó el formulario de crear/editar orden en el frontend:

1. **Nuevo campo seleccionable "Evento"** (propiedad API: `tipoEvento`).
   Contiene los tipos de evento que antes se guardaban en `instanciaParticipacion`:
   - VISITA ATI A BENEFICIARIOS
   - LEVANTAMIENTO DE POLÍGONOS
   - LEVANTAMIENTO LÍNEA BASE
   - JORNADA DE INSCRIPCIÓN
   - OLLA COMUNITARIA
   - CUÑAS Y DIFUSIÓN
   - FERIA DE PROVEEDORES
   - MESA DE TRABAJO
   - MESA INTERINSTITUCIONAL
   - PLAN DE INVERSIÓN
   - ASAMBLEA COMUNITARIA
   - ENTREGA DE ACTIVOS PRODUCTIVOS
   - ENTREGA DE KITS A BENEFICIARIOS
   - ENTREGA DE MAQUINARIA AMARILLA

2. **Campo modificado "Instancia de participación"** (`instanciaParticipacion`).
   Ahora **solo** acepta 4 opciones:
   - CONSEJO PERMANENTE DE DIRECCIÓN
   - CONSEJO ASESOR TERRITORIAL
   - CONSEJO MUNICIPAL DE PLANEACIÓN
   - CONSEJO MUNICIPAL DE EVALUACIÓN Y SEGUIMIENTO

---

## 2. Contrato de API

- **POST /api/v1/events** y **PATCH /api/v1/events/:id** deben aceptar el campo `tipoEvento` (`string`), opcional.
- **GET /api/v1/events** y **GET /api/v1/events/:id** deben devolver `tipoEvento`.
- El campo `instanciaParticipacion` se mantiene con el mismo nombre; **no se elimina**. Solo cambia su dominio de valores (4 consejos).

Ejemplo de payload:

```jsonc
{
  "code": "2026-001",
  "suffix": "",
  "name": "Nombre responsable",
  "programa": "RENHACEMOS",
  "tipoEvento": "MESA DE TRABAJO",              // NUEVO
  "instanciaParticipacion": "CONSEJO MUNICIPAL DE PLANEACIÓN" // solo 4 consejos ahora
}
```

---

## 3. Modelo de datos / entidad

Agregar la propiedad al modelo de la entidad equivalente de `Event`:

- Campo: `tipo_evento`
- Tipo: `VARCHAR(255)`
- Nulable: sí / con valor por defecto vacío
- No es único ni clave.

No se renombra ninguna columna existente.

---

## 4. Migración de base de datos (PostgreSQL)

Existe una migración lista en:

```
src/docs/migraciones/2026-09-16_agregar_campo_tipo_evento.sql
```

La migración:

1. **Agrega** la columna `tipo_evento VARCHAR(255) NOT NULL DEFAULT ''` a la tabla `events`.
2. **Migra datos históricos**: los valores que hoy viven en `instancia_participacion` y que ahora corresponden a tipos de evento se mueven a `tipo_evento`, limpiando `instancia_participacion`.
3. **Opcional/recomendado**: crea restricciones `CHECK` que fuerzan el nuevo dominio:
   - `instancia_participacion` ∈ (los 4 consejos, '')
   - `tipo_evento` ∈ (lista de tipos de evento, '')

> Ajustar el nombre de la tabla si el esquema real usa otro nombre distinto a `events`.

### Ejecución

```bash
psql "$DATABASE_URL" -f src/docs/migraciones/2026-09-16_agregar_campo_tipo_evento.sql
```

O aplicarlo mediante el flujo de migraciones que usen (prisma migrate / flyway / etc.), copiando el contenido del archivo.

---

## 5. Validaciones backend (recomendadas)

- `instanciaParticipacion` (si llega): validar que el valor esté dentro de los 4 consejos permitidos, o vacío.
- `tipoEvento` (si llega): validar que esté dentro de la lista de tipos de evento, o vacío.
- Ambos campos son opcionales; no bloquear creación/edición si vienen vacíos.

---

## 6. Orden de despliegue

1. Aplicar la migración de BD.
2. Desplegar backend con el nuevo campo `tipoEvento` en DTO/respuesta.
3. Desplegar frontend.