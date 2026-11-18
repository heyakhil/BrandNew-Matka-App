export class MatkaRulesError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MatkaRulesError';
  }
}
