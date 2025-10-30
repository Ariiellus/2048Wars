/**
 * Maybe monad for handling nullable values safely
 * Eliminates the need for explicit null/undefined checks
 */

export type Maybe<T> =
  | { hasValue: true; value: T }
  | { hasValue: false };

/**
 * Create a Maybe with a value
 */
export const some = <T>(value: T): Maybe<T> => ({
  hasValue: true,
  value,
});

/**
 * Create an empty Maybe
 */
export const none = <T>(): Maybe<T> => ({
  hasValue: false,
});

/**
 * Create a Maybe from a nullable value
 */
export const fromNullable = <T>(value: T | null | undefined): Maybe<T> => {
  if (value === null || value === undefined) {
    return none();
  }
  return some(value);
};

/**
 * Transform the value inside a Maybe
 */
export const map = <T, U>(maybe: Maybe<T>, fn: (value: T) => U): Maybe<U> => {
  if (maybe.hasValue) {
    return some(fn(maybe.value));
  }
  return none();
};

/**
 * Chain Maybe-returning functions
 */
export const flatMap = <T, U>(
  maybe: Maybe<T>,
  fn: (value: T) => Maybe<U>
): Maybe<U> => {
  if (maybe.hasValue) {
    return fn(maybe.value);
  }
  return none();
};

/**
 * Filter a Maybe based on a predicate
 */
export const filter = <T>(
  maybe: Maybe<T>,
  predicate: (value: T) => boolean
): Maybe<T> => {
  if (maybe.hasValue && predicate(maybe.value)) {
    return maybe;
  }
  return none();
};

/**
 * Execute different code paths based on presence of value
 */
export const match = <T, R>(
  maybe: Maybe<T>,
  patterns: {
    some: (value: T) => R;
    none: () => R;
  }
): R => {
  if (maybe.hasValue) {
    return patterns.some(maybe.value);
  }
  return patterns.none();
};

/**
 * Get the value or throw an error
 */
export const unwrap = <T>(maybe: Maybe<T>): T => {
  if (maybe.hasValue) {
    return maybe.value;
  }
  throw new Error("Called unwrap on a none value");
};

/**
 * Get the value or return a default
 */
export const unwrapOr = <T>(maybe: Maybe<T>, defaultValue: T): T => {
  if (maybe.hasValue) {
    return maybe.value;
  }
  return defaultValue;
};

/**
 * Get the value or compute a default lazily
 */
export const unwrapOrElse = <T>(maybe: Maybe<T>, fn: () => T): T => {
  if (maybe.hasValue) {
    return maybe.value;
  }
  return fn();
};

/**
 * Check if Maybe has a value
 */
export const isSome = <T>(maybe: Maybe<T>): maybe is { hasValue: true; value: T } => {
  return maybe.hasValue;
};

/**
 * Check if Maybe is empty
 */
export const isNone = <T>(maybe: Maybe<T>): maybe is { hasValue: false } => {
  return !maybe.hasValue;
};

/**
 * Convert Maybe to an array (0 or 1 element)
 */
export const toArray = <T>(maybe: Maybe<T>): T[] => {
  if (maybe.hasValue) {
    return [maybe.value];
  }
  return [];
};

/**
 * Combine two Maybes into a tuple
 */
export const zip = <T, U>(a: Maybe<T>, b: Maybe<U>): Maybe<[T, U]> => {
  if (a.hasValue && b.hasValue) {
    return some([a.value, b.value]);
  }
  return none();
};

/**
 * Return the first Maybe that has a value
 */
export const or = <T>(a: Maybe<T>, b: Maybe<T>): Maybe<T> => {
  if (a.hasValue) {
    return a;
  }
  return b;
};

/**
 * Execute a side effect if Maybe has a value
 */
export const tap = <T>(maybe: Maybe<T>, fn: (value: T) => void): Maybe<T> => {
  if (maybe.hasValue) {
    fn(maybe.value);
  }
  return maybe;
};
