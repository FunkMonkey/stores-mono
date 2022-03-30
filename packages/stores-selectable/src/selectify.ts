import {derive, is_writable, Readable, Trigger, Writable} from "@crikey/stores-base";
import {ReadOrWrite, ResolveSelector, Selectable, TraverseDelete, TraverseGet, TraverseUpdate} from "./types";
import {traverse_get} from "./traverse-get";
import {traverse_update} from "./traverse-update";
import {traverse_delete} from "./traverse-delete";
import {resolve_selector} from "./resolve-selector";

export interface SelectableOptions<T, P> {
    traverse_get: TraverseGet<T, P>;
    traverse_update: TraverseUpdate<T, P>;
    traverse_delete: TraverseDelete<T, P>;
    resolve_selector: ResolveSelector<P>;
}

const default_options: SelectableOptions<any, PropertyKey> = {
    traverse_get,
    traverse_update,
    traverse_delete,
    resolve_selector
}

export function selectify<T, S extends Readable<T>>(trigger: Trigger<any>, store: S & Readable<T>): Selectable<T, S, PropertyKey>;
export function selectify<T, S extends Readable<T>, P>(trigger: Trigger<any>, store: S & Readable<T>, options: SelectableOptions<T, P>): Selectable<T, S, P>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function selectify<T, S extends Readable<T>, P>(trigger: Trigger<any>, store: S & Readable<T>, options?: SelectableOptions<T, P>): Selectable<T, S, P> {
    const readOnly: Readable<T> = store;
    const readWrite: Writable<T> = <Writable<T>><unknown>store;

    if (!options)
        options = <SelectableOptions<T,P>><unknown>default_options;

    const my_traverse_get = options.traverse_get;
    const my_traverse_update = options.traverse_update;
    const my_traverse_delete = options.traverse_delete;
    const my_resolve_selector = options.resolve_selector;

    function select<D>(this:void, selector: (v: T) => D): Selectable<D,ReadOrWrite<D,S>, P>;
    function select<D>(this:void, segment: P & Exclude<P, Function> & Exclude<P, any[]>): Selectable<D,ReadOrWrite<D,S>, P>;
    function select<D>(this:void, absPath: P[], relative?: number | undefined): Selectable<D,ReadOrWrite<D,S>, P>;

    function select<D>(this:void, first: (P & Exclude<P, Function> & Exclude<P, any[]>) | P[] | ((v: T) => D), relative?: number): Selectable<D, ReadOrWrite<D,S>, P> {
        const rootPath: readonly P[] = (() => {
            if (typeof first === 'function')
                return my_resolve_selector(<(v: T) => D>first);

            if (!Array.isArray(first))
                return [first];

            if (relative !== undefined && relative !== 0)
                throw new RangeError(); // root path cannot be relative

            return first;
        })();

        const selectRo = (root: T): D =>
            <D>my_traverse_get(root, rootPath);

        const updateRw = (root: T, update: (old_value: D) => D): T =>
            my_traverse_update(root, rootPath, update);

        const deleteRw = (root: T): T =>
            my_traverse_delete(root, rootPath);

        // set the sub-store value
        function subSet(new_sub_value: D) {
            readWrite.update((old_root_value: T) => updateRw(old_root_value, () => new_sub_value));
        }

        // update the sub-store value
        function subUpdate(updater: (old_value: D) => D) {
            readWrite.update((old_root_value: T) => updateRw(old_root_value, old_sub_value => updater(old_sub_value)));
        }

        // update the sub-store value
        function subDelete() {
            readWrite.update((old_root_value: T) => deleteRw(old_root_value));
        }

        // subscribe
        const { subscribe: subSubscribe } = derive(
            trigger,
            readOnly,
            (new_root_value) => selectRo(new_root_value)
        );

        // create sub-sub-store
        function subSelect<V>(selector: (v: D) => V): Selectable<V,ReadOrWrite<V,S>, P>;
        function subSelect<V>(segment: P & Exclude<P, Function> & Exclude<P, any[]>): Selectable<V,ReadOrWrite<V,S>, P>;
        function subSelect<V>(path: P[], relative?: number | undefined): Selectable<V,ReadOrWrite<V,S>, P>;

        function subSelect<V>(first: (P & Exclude<P, Function> & Exclude<P, any[]>) | P[] | ((v: D) => V), relative?: number): Selectable<V,ReadOrWrite<V,S>, P> {
            const subPath = (() => {
                if (typeof first === 'function')
                    return [...rootPath, ...my_resolve_selector(<(v: D) => V>first)];

                if (!Array.isArray(first))
                    return [...rootPath, first];

                if (relative !== undefined && (
                    relative < 0 ||
                    !Number.isSafeInteger(relative) ||
                    relative > rootPath.length
                ))
                    throw new RangeError();

                return [...rootPath.slice(0, rootPath.length - (relative ?? rootPath.length)), ...first];
            })();

            return select<V>(subPath);
        }

        const selectableStore = is_writable(store)
        ? {
            set: subSet,
            update: subUpdate,
            // always included for writable stores, but may be hidden by typescript if the type cannot be made undefined
            delete: subDelete,
            subscribe: subSubscribe,
            select: subSelect,
            path: rootPath
        }
        : {
            subscribe: subSubscribe,
            select: subSelect,
            path: rootPath
        };

        return <Selectable<D, ReadOrWrite<D,S>, P>><unknown>selectableStore;
    }

    function delete_(this:void) {
        readWrite.set(<never>undefined);
    }

    const selectableStore = is_writable(store)
    ? {
        ...store,
        select,
        path: <readonly PropertyKey[]>[],
        // always included for writable stores, but may be hidden by typescript if the type cannot be made undefined
        delete: delete_
    }
    : {
        ...store,
        select,
        path: <readonly PropertyKey[]>[],
    };

    return <Selectable<T,S, P>><unknown>selectableStore;
}
