export const validateRequest = (schema, data) => {
  try {
    return schema.parse(data);
  } catch (error) {
    error.name = 'ZodError';
    throw error;
  }
};
