export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class InvalidStateTransitionError extends DomainError {
  public readonly currentState: string;
  public readonly attemptedAction: string;

  constructor(currentState: string, attemptedAction: string, details?: string) {
    const msg = `Cannot execute action '${attemptedAction}' while attempt is in '${currentState}' state.${
      details ? ` ${details}` : ''
    }`;
    super(msg);
    this.currentState = currentState;
    this.attemptedAction = attemptedAction;
  }
}

export class InvalidSubmissionError extends DomainError {
  public readonly validationErrors: string[];

  constructor(message: string, validationErrors: string[] = []) {
    super(message);
    this.validationErrors = validationErrors;
  }
}

export class InvalidArgumentError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}
