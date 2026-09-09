export class EmailAlreadyExistsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmailAlreadyExistsError';
  }
}

export class PasswordMismatchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PasswordMismatchError';
  }
}

export class InvalidEmailFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidEmailFormatError';
  }
}

export class InvalidPasswordError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPasswordError';
  }
}

export class CompanyNameRequiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CompanyNameRequiredError';
  }
}

export class HttpError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends HttpError {
  constructor(message = 'Bad Request') {
    super(message, 400);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

export class NotFoundError extends HttpError {
  constructor(message = 'Resource Not Found') {
    super(message, 404);
  }
}

export class ResourceNotFoundError extends NotFoundError {
  constructor(resource: string, id?: string | number) {
    const message = id 
      ? `${resource} with ID ${id} not found` 
      : `${resource} not found`;
    super(message);
  }
}

export class ConflictError extends HttpError {
  constructor(message = 'Conflict') {
    super(message, 409);
  }
}

export class DuplicateResourceError extends ConflictError {
  constructor(message = 'Resource already exists') {
    super(message);
  }
}

export class ValidationError extends BadRequestError {
  errors: Record<string, string[]>;

  constructor(message = 'Validation Error', errors: Record<string, string[]> = {}) {
    super(message);
    this.errors = errors;
  }
}

export class DatabaseError extends HttpError {
  constructor(message = 'Database Error') {
    super(message, 500);
  }
}

export class ServerError extends HttpError {
  constructor(message = 'Internal Server Error') {
    super(message, 500);
  }
}

export class InvalidCredentialsError extends UnauthorizedError {
  constructor(message = 'Invalid email or password') {
    super(message);
  }
}

export class InvalidTokenError extends UnauthorizedError {
  constructor(message = 'Invalid or expired token') {
    super(message);
  }
}
