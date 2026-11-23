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

export class HoldExistsError extends Error {
  readonly code = "HOLD_EXISTS";
  constructor() {
    super("book has an active hold");
    this.name = "HoldExistsError";
  }
}

export class OverdueLoansError extends Error {
  readonly code = "OVERDUE_LOANS";
  constructor() {
    super("reader has overdue loans");
    this.name = "OverdueLoansError";
  }
}
