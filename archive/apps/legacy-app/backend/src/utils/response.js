const response = {
  success: (res, data, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
      success:   true,
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  },

  created: (res, data, message = 'Created successfully') => {
    return response.success(res, data, message, 201);
  },

  error: (res, message, statusCode = 400, errors = null) => {
    return res.status(statusCode).json({
      success:   false,
      message,
      errors,
      timestamp: new Date().toISOString(),
    });
  },

  unauthorized: (res, message = 'Unauthorized') => {
    return response.error(res, message, 401);
  },

  forbidden: (res, message = 'Access denied') => {
    return response.error(res, message, 403);
  },

  notFound: (res, message = 'Resource not found') => {
    return response.error(res, message, 404);
  },

  paginated: (res, data, pagination) => {
    return res.status(200).json({
      success: true,
      data,
      pagination: {
        page:       pagination.page,
        limit:      pagination.limit,
        total:      pagination.total,
        totalPages: Math.ceil(pagination.total / pagination.limit),
        hasNext:    pagination.page < Math.ceil(pagination.total / pagination.limit),
        hasPrev:    pagination.page > 1,
      },
      timestamp: new Date().toISOString(),
    });
  },
};

module.exports = response;
