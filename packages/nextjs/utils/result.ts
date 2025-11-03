/**
 * Result monad for type-safe error handling
 * Use this instead of throwing exceptions for predictable error handling
 */

export type Result<T, E> = { success: true; value: T } | { success: false; error: E };

/**
 * Create a successful Result
 */
export const ok = <T, E = never>(value: T): Result<T, E> => ({
  success: true,
  value,
});

/**
 * Create a failed Result
 */
export const err = <T = never, E = unknown>(error: E): Result<T, E> => ({
  success: false,
  error,
});

/**
 * Transform the value inside a successful Result
 */
export const map = <T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> => {
  if (result.success) {
    return ok(fn(result.value));
  }
  return result;
};

/**
 * Transform the error inside a failed Result
 */
export const mapErr = <T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> => {
  if (!result.success) {
    return err(fn(result.error));
  }
  return result;
};

/**
 * Chain Result-returning functions
 */
export const flatMap = <T, U, E>(result: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E> => {
  if (result.success) {
    return fn(result.value);
  }
  return result;
};

/**
 * Execute different code paths based on success/failure
 */
export const match = <T, E, R>(
  result: Result<T, E>,
  patterns: {
    ok: (value: T) => R;
    err: (error: E) => R;
  },
): R => {
  if (result.success) {
    return patterns.ok(result.value);
  }
  return patterns.err(result.error);
};

/**
 * Get the value or throw an error
 */
export const unwrap = <T, E>(result: Result<T, E>): T => {
  if (result.success) {
    return result.value;
  }
  throw new Error(`Called unwrap on an error Result: ${JSON.stringify(result.error)}`);
};

/**
 * Get the value or return a default
 */
export const unwrapOr = <T, E>(result: Result<T, E>, defaultValue: T): T => {
  if (result.success) {
    return result.value;
  }
  return defaultValue;
};

/**
 * Check if Result is successful
 */
export const isOk = <T, E>(result: Result<T, E>): result is { success: true; value: T } => {
  return result.success;
};

/**
 * Check if Result is a failure
 */
export const isErr = <T, E>(result: Result<T, E>): result is { success: false; error: E } => {
  return !result.success;
};

/**
 * Wrap a synchronous function in a Result (catches exceptions)
 */
export const tryCatch = <T, E = Error>(fn: () => T): Result<T, E> => {
  try {
    return ok(fn());
  } catch (error) {
    return err(error as E);
  }
};

/**
 * Wrap an async function in a Result (catches exceptions)
 */
export const asyncTryCatch = async <T, E = Error>(fn: () => Promise<T>): Promise<Result<T, E>> => {
  try {
    const value = await fn();
    return ok(value);
  } catch (error) {
    return err(error as E);
  }
};

/**
 * Combine multiple Results into a single Result
 * Returns the first error encountered, or all values if all succeed
 */
export const combine = <T, E>(results: Result<T, E>[]): Result<T[], E> => {
  const values: T[] = [];

  for (const result of results) {
    if (!result.success) {
      return result;
    }
    values.push(result.value);
  }

  return ok(values);
};

/**
 * Convert a nullable value to a Result
 */
export const fromNullable = <T, E>(value: T | null | undefined, error: E): Result<T, E> => {
  if (value === null || value === undefined) {
    return err(error);
  }
  return ok(value);
};
