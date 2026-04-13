export class LLMError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'LLMError';
  }
}
