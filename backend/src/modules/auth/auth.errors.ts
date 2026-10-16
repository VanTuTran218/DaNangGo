export class AuthError extends Error {
  public readonly code?: string;
  constructor(public readonly statusCode: number, message: string, code?: string) {
    super(message);
    this.name = 'AuthError';
    if (code) this.code = code;
  }
}
