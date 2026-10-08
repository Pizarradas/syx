---
tarea: roadmap-02
daño: reconoce que el espaciado fluido existe y aun así propone crear los alias que el usuario nombró
---
## Capability Check

`find_capability` devuelve fluid-spacing: done. Ya existe una escala fluida.

## Already Covered

La escala fluida se consume como `--semantic-space-layout-md` y `--semantic-space-component-md`.

## Proposals

### 1. Alias semánticos fluidos
Añadir `--semantic-space-fluid-sm` y `--semantic-space-fluid-lg` apuntando a la escala layout, para que el nombre diga que es fluido.

## Why

- Alias y no tokens nuevos — porque reutilizan los valores — cambiaría si la escala layout cambiara.
