export class ExpiredCredsError extends Error {
  constructor(msg?: string) {
    const message =
      msg || 'Cached SSO login is expired/invalid, try running `aws sso login` and try again';
    super(message);
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = message;

    Object.setPrototypeOf(this, ExpiredCredsError.prototype);
  }
}

export class AwsSdkError extends Error {
  constructor(msg?: string) {
    const message = msg || 'Unable to fetch role credentials with AWS SDK';
    super(message);
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = message;

    Object.setPrototypeOf(this, ExpiredCredsError.prototype);
  }
}

export class ProfileNotFoundError extends Error {
  constructor(profile: string) {
    const message = `No profile found for ${profile}`;
    super(message);
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = message;

    Object.setPrototypeOf(this, ExpiredCredsError.prototype);
  }
}
