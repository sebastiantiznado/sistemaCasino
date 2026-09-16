# Sistema Casino

Sistema web para gestionar jugadores, saldos, puestos de apuesta y movimientos.

## Tecnologías

- HTML, CSS y JavaScript
- Node.js + Express
- PostgreSQL

## Estructura

```text
public/
  index.html
  css/style.css
  js/app.js
database/
  schema.sql
server.js
package.json
.env.example
```

## Ejecutar

1. Instalar Node.js.
2. Clonar el repositorio.
3. Ejecutar `npm install`.
4. Copiar `.env.example` a `.env` y configurar `DATABASE_URL` cuando PostgreSQL esté disponible.
5. Ejecutar `npm start`.
6. Abrir `http://localhost:3000`.

## Estado actual

La primera etapa contiene el panel visual y la estructura inicial de PostgreSQL. La siguiente etapa conectará jugadores, puestos, movimientos y operaciones de saldo al backend.
