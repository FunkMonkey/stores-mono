import { expect, it } from 'vitest'
import {Invalidator, readOnly, Subscriber, Unsubscriber, Updater, Writable} from '../src';

it('should remove everything but the subscribe method', () => {
    const store: Writable<number> = {
        subscribe(run: Subscriber<number>, _invalidate?: Invalidator): Unsubscriber {
            run(1);
            return () => {};
        },
        set(_value: number) {
        },
        update(_updater: Updater<number>) {
        }
    }

    const roStore = readOnly(store);

    expect(Object.keys(roStore)).to.deep.equal(['subscribe']);
    expect(roStore.subscribe).toBe(store.subscribe);
})
