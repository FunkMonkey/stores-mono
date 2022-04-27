import {DynamicReadable} from "./types";
import {constant} from "./constant";

/**
 * Create a simple store which always returns the same result - a {@link DynamicValue} containing value.
 *
 * _Example_:
 * {@codeblock ../stores-dynamic/examples/constant.test.ts#example-constant-value}
 *
 * @category Create Store
 * @param value the constant value of the store
 */
export function constant_value<T>(value: T): DynamicReadable<T> {
    return constant({ value });
}
