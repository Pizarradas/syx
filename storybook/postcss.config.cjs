// Corta la búsqueda ascendente de PostCSS de Vite: sin este fichero, los
// builds de los tres catálogos encuentran el postcss.config.js de la raíz
// del repo, que pide autoprefixer — instalado para el build del sistema,
// no para el sandbox — y en CI revienta con "Cannot find module".
// El CSS que consume el sandbox ya viene compilado; aquí no hay nada que
// postprocesar. (.cjs porque el package.json del sandbox es type: module.)
module.exports = { plugins: [] };
