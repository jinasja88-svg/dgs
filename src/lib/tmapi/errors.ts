export class TmapiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public apiCode?: number
  ) {
    super(message);
    this.name = 'TmapiError';
  }
}

export class TmapiRateLimitError extends TmapiError {
  constructor() {
    super('TMAPI rate limit exceeded', 439);
    this.name = 'TmapiRateLimitError';
  }
}

export class TmapiAuthError extends TmapiError {
  constructor(statusCode: number) {
    super('TMAPI authentication failed', statusCode);
    this.name = 'TmapiAuthError';
  }
}
