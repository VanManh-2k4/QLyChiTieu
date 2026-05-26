export function validateBody(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });
    if (error) {
      console.error("VALIDATION ERROR (BODY):", error.details);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.message,
        details: error.details.map((d) => d.message),
      });
    }
    req.body = value;
    next();
  };
}

export function validateQuery(schema) {
  return (req, res, next) => {
    console.log("VALIDATE QUERY - RAW QUERY:", req.query);
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });
    if (error) {
      console.error("VALIDATION ERROR (QUERY):", error.details);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.message,
        details: error.details.map((d) => d.message),
      });
    }
    console.log("VALIDATE QUERY - VALIDATED VALUE:", value);
    req.validatedQuery = value;
    next();
  };
}

export function validateParams(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });
    if (error) {
      console.error("VALIDATION ERROR (PARAMS):", error.details);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.message,
        details: error.details.map((d) => d.message),
      });
    }
    req.params = value;
    next();
  };
}
