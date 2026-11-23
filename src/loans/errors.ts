export class NotFoundError extends Error {
  constructor() {
    super("loan not found");
    this.name = "NotFoundError";
  }
}
