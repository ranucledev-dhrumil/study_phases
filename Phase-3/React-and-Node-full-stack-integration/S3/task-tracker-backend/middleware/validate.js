function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const error = new Error(
        result.error.issues.map((issue) => issue.message).join(", ")
      );

      error.statusCode = 400;
      return next(error);
    }

    req.body = result.data;
    next();
  };
}

export default validate;