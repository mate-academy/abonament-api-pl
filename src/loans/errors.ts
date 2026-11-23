export class NotFoundError extends Error {
  constructor() {
    super("loan not found");
    this.name = "NotFoundError";
  }
}

export class LimitReachedError extends Error {
  readonly code = "LIMIT_REACHED";
  constructor() {
    super("renewal limit reached");
    this.name = "LimitReachedError";
  }
}
