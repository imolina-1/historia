# Historia de España · 2.º de Bachillerato (PAU)

Web de estudio para Historia de España de 2.º de Bachillerato (Comunidad de Madrid): textos y fuentes históricas con clave de corrección, personajes, cronología, generador de exámenes tipo PAU, juegos, taller de estudio y progreso personal.

No necesita servidor ni compilación: es una página estática (`index.html` + `data.json` + `img/` + `fonts/`).

## Publicar con GitHub Pages

1. Crea un repositorio nuevo (por ejemplo `historia-espana`). Con la cuenta gratuita debe ser **público**.
2. Sube todo el contenido de esta carpeta a la raíz del repositorio. Con la web de GitHub solo se pueden subir 100 archivos cada vez, así que es más cómodo usar **GitHub Desktop** o `git`:
   ```
   git init
   git add .
   git commit -m "Historia de España PAU"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/historia-espana.git
   git push -u origin main
   ```
3. En el repositorio: **Settings → Pages → Build and deployment → Deploy from a branch → `main` / `(root)` → Save**.
4. En uno o dos minutos la web estará en `https://TU_USUARIO.github.io/historia-espana/`.

El archivo `.nojekyll` evita que GitHub procese la carpeta con Jekyll.

## Privacidad

- No hay cuentas, cookies, analítica ni servidores propios. El progreso, las notas, los exámenes guardados y las partidas se guardan **en el navegador de cada alumno** (`localStorage`).
- Las tipografías están incluidas en `fonts/` (licencia SIL OFL): la web no hace peticiones a Google.
- Cada alumno puede exportar e importar una copia de su progreso desde «Mi estudio».
- El «Informe para el profesor» es un archivo que el alumno decide descargar y entregar; no incluye sus notas ni lo que escribe en el Taller. El panel del profesor (`#profe`) lo procesa en el navegador, sin subir nada.
- La página lleva `noindex`, para pedir a los buscadores que no la indexen. No es una garantía: una web de GitHub Pages es pública para quien tenga el enlace.

## Derechos y revisión antes de hacerla pública

- Cada fuente conserva su procedencia (campo `src`/`ref` en `data.json`). Las marcadas en «Lo que falta» y las de la lista `verificar` conviene revisarlas antes de difundir la web.
- Las claves de corrección («Con los apuntes») proceden de los apuntes del centro. Si la web es pública, conviene contar con el visto bueno del colegio.

## Contenido

- `data.json`: documentos, epígrafes, temas, personajes, hitos y claves. Se edita con cualquier editor de texto.
- `img/`: una imagen por fuente (`A01a.jpg`, `B83.jpg`…) y retratos (`p-nombre.jpg`).

## Código de clase y panel del profesor

- **Exámenes → Código de clase:** al generar un examen se puede copiar un código; quien lo pegue obtiene exactamente el mismo examen.
- **Mi estudio → Informe para el profesor** y **`#profe`:** el alumno descarga su informe en `.json`; el profesor carga varios en el panel y ve el mapa de calor por temas.
