## Plan

No las migro de una vez: este modo migra una por propuesta, y así cada una se puede revisar y revertir sola.

1. Inventario de las doce con sus usos y su valor resuelto en cada tema.
2. Orden: primero las que tienen un solo uso y un token equivalente exacto; al final las que no tienen equivalente, que pueden necesitar a TOKEN.
3. Cada una sale por `node scripts/propose.js` con su análisis de impacto. La siguiente empieza cuando la anterior se ha fusionado.
