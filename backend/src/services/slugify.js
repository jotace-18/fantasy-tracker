// backend/src/services/slugify.js
module.exports = function slugify(str) {
  return String(str)
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // elimina acentos (Boyé -> Boye)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // quita símbolos
    .trim()
    .replace(/\s+/g, "-")         // espacios -> guiones
    .replace(/-+/g, "-");
};
// "Lucas Boyé" -> "lucas-boye"
