import {noop, Readable, Subscriber, Unsubscriber} from "@crikey/stores-base";

/**
 * Create a simple store which always returns the same value upon subscription
 * @param value the constant value of the store
 */
export function constant<T>(value: T): Readable<T> {
    return {
        subscribe(run: Subscriber<T>): Unsubscriber {
            run(value);
            return noop;
        }
    }
}
