export enum ErrorCode {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  BAD_REQUEST = "BAD_REQUEST",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  INTERNAL_ERROR = "INTERNAL_ERROR",
}

/** Classe base para todos os erros de negócio da aplicação. */
export class HttpException extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly errorCode: ErrorCode,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class BadRequestException extends HttpException {
  constructor(message = "Requisição inválida", details?: unknown) {
    super(message, 400, ErrorCode.BAD_REQUEST, details);
  }
}

export class ValidationException extends HttpException {
  constructor(details: unknown, message = "Dados inválidos") {
    super(message, 422, ErrorCode.VALIDATION_ERROR, details);
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message = "Não autenticado") {
    super(message, 401, ErrorCode.UNAUTHORIZED);
  }
}

export class ForbiddenException extends HttpException {
  constructor(message = "Acesso negado") {
    super(message, 403, ErrorCode.FORBIDDEN);
  }
}

export class NotFoundException extends HttpException {
  constructor(message = "Recurso não encontrado") {
    super(message, 404, ErrorCode.NOT_FOUND);
  }
}

export class ConflictException extends HttpException {
  constructor(message = "Conflito com o estado atual do recurso") {
    super(message, 409, ErrorCode.CONFLICT);
  }
}

export class InternalException extends HttpException {
  constructor(message = "Erro interno do servidor", details?: unknown) {
    super(message, 500, ErrorCode.INTERNAL_ERROR, details);
  }
}
