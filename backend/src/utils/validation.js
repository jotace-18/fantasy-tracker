// backend/src/utils/validation.js
// Validación ligera sin dependencias externas.

function isString(value) {
  return typeof value === 'string' || value instanceof String;
}

function stringRule(opts = {}) {
  return { type: 'string', ...opts };
}

function numberRule(opts = {}) {
  return { type: 'number', ...opts };
}

function validateValue(value, rule, key) {
  const errors = [];
  if (rule.required && (value === undefined || value === null || value === '')) {
    errors.push(`${key} es requerido`);
    return errors;
  }
  if (value === undefined || value === null) return errors; // no más validaciones

  switch (rule.type) {
    case 'string':
      if (!isString(value)) {
        errors.push(`${key} debe ser string`);
        break;
      }
      if (rule.trim) value = value.trim();
      if (rule.min && value.length < rule.min) errors.push(`${key} longitud mínima ${rule.min}`);
      if (rule.max && value.length > rule.max) errors.push(`${key} longitud máxima ${rule.max}`);
      if (rule.pattern && !rule.pattern.test(value)) errors.push(`${key} formato inválido`);
      break;
    case 'number':
      if (typeof value !== 'number' || Number.isNaN(value)) {
        errors.push(`${key} debe ser número`);
        break;
      }
      if (rule.min !== undefined && value < rule.min) errors.push(`${key} min ${rule.min}`);
      if (rule.max !== undefined && value > rule.max) errors.push(`${key} max ${rule.max}`);
      break;
    default:
      errors.push(`Tipo no soportado para ${key}`);
  }
  return errors;
}

function validateObject(obj, schema) {
  const errors = {};
  for (const key of Object.keys(schema)) {
    const rule = schema[key];
    const fieldErrors = validateValue(obj[key], rule, key);
    if (fieldErrors.length) errors[key] = fieldErrors;
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

module.exports = {
  validateObject,
  rules: {
    string: stringRule,
    number: numberRule,
  },
  /**
   * requireFields(obj, [fields]) -> null | 'mensaje'
   * Uso rápido para endpoints simples sin schema completo.
   */
  requireFields(obj, fields) {
    for (const f of fields) {
      if (obj[f] === undefined || obj[f] === null || obj[f] === '') {
        return `Campo requerido: ${f}`;
      }
    }
    return null;
  }
};
