/**
 * Light local checks + Groq validation result handling.
 */
export function assertExtractShape(model) {
  if (!model || typeof model !== "object") {
    throw new Error("Extract model must be an object");
  }
  if (!Array.isArray(model.exchanges)) {
    throw new Error('Extract model must include an "exchanges" array');
  }
  for (const [i, ex] of model.exchanges.entries()) {
    if (!ex || typeof ex !== "object") {
      throw new Error(`exchanges[${i}] must be an object`);
    }
    if (typeof ex.user_message !== "string") {
      throw new Error(`exchanges[${i}].user_message must be a string`);
    }
    if (typeof ex.assistant_reply !== "string") {
      throw new Error(`exchanges[${i}].assistant_reply must be a string`);
    }
  }
}

export function resolveValidatedModel(validation, fallbackModel) {
  if (!validation || typeof validation !== "object") {
    return fallbackModel;
  }
  if (validation.valid === false) {
    if (validation.corrected_model) {
      return validation.corrected_model;
    }
    const errors = Array.isArray(validation.errors)
      ? validation.errors.join("; ")
      : "validation failed";
    throw new Error(`Groq validation failed: ${errors}`);
  }
  return validation.corrected_model || fallbackModel;
}
