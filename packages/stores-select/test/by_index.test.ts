import {expect, it} from "vitest";
import {by_index} from "../src";

it('should access child elements', function () {
    const original = [1];

    const selector_0 = by_index<typeof original, keyof typeof original & number, (typeof original)[0]>(0);

    expect(selector_0.get(original)).toBe(1);
    expect(selector_0.update(original, 2)).to.deep.equal([2]);
    expect(selector_0.update(original, 1)).toBe(original);

    const selector_1 = by_index<typeof original, keyof typeof original & number, (typeof original)[0]>(1);

    expect(() => selector_1.get(original)).toThrow('index not found');
    expect(selector_1.update(original, 2)).to.deep.equal([1,2]);

    const selector_1_def = by_index<typeof original, keyof typeof original & number, (typeof original)[0]>(1, () => 42);
    expect(selector_1_def.get(original)).toBe(42);

    expect(original, 'original should not be mutated').to.deep.equal([1]);
});
