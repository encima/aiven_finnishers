'use strict';

function noop() { }
function add_location(element, file, line, column, char) {
    element.__svelte_meta = {
        loc: { file, line, column, char }
    };
}
function run(fn) {
    return fn();
}
function blank_object() {
    return Object.create(null);
}
function run_all(fns) {
    fns.forEach(run);
}
function is_function(thing) {
    return typeof thing === 'function';
}
function safe_not_equal(a, b) {
    return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}
function null_to_empty(value) {
    return value == null ? '' : value;
}

function append(target, node) {
    target.appendChild(node);
}
function insert(target, node, anchor) {
    target.insertBefore(node, anchor || null);
}
function detach(node) {
    node.parentNode.removeChild(node);
}
function destroy_each(iterations, detaching) {
    for (let i = 0; i < iterations.length; i += 1) {
        if (iterations[i])
            iterations[i].d(detaching);
    }
}
function element(name) {
    return document.createElement(name);
}
function text(data) {
    return document.createTextNode(data);
}
function space() {
    return text(' ');
}
function listen(node, event, handler, options) {
    node.addEventListener(event, handler, options);
    return () => node.removeEventListener(event, handler, options);
}
function attr(node, attribute, value) {
    if (value == null)
        node.removeAttribute(attribute);
    else
        node.setAttribute(attribute, value);
}
function children(element) {
    return Array.from(element.childNodes);
}
function select_option(select, value) {
    for (let i = 0; i < select.options.length; i += 1) {
        const option = select.options[i];
        if (option.__value === value) {
            option.selected = true;
            return;
        }
    }
}
function select_value(select) {
    const selected_option = select.querySelector(':checked') || select.options[0];
    return selected_option && selected_option.__value;
}
function custom_event(type, detail) {
    const e = document.createEvent('CustomEvent');
    e.initCustomEvent(type, false, false, detail);
    return e;
}

let current_component;
function set_current_component(component) {
    current_component = component;
}

const dirty_components = [];
const binding_callbacks = [];
const render_callbacks = [];
const flush_callbacks = [];
const resolved_promise = Promise.resolve();
let update_scheduled = false;
function schedule_update() {
    if (!update_scheduled) {
        update_scheduled = true;
        resolved_promise.then(flush);
    }
}
function add_render_callback(fn) {
    render_callbacks.push(fn);
}
function flush() {
    const seen_callbacks = new Set();
    do {
        // first, call beforeUpdate functions
        // and update components
        while (dirty_components.length) {
            const component = dirty_components.shift();
            set_current_component(component);
            update(component.$$);
        }
        while (binding_callbacks.length)
            binding_callbacks.pop()();
        // then, once components are updated, call
        // afterUpdate functions. This may cause
        // subsequent updates...
        for (let i = 0; i < render_callbacks.length; i += 1) {
            const callback = render_callbacks[i];
            if (!seen_callbacks.has(callback)) {
                callback();
                // ...so guard against infinite loops
                seen_callbacks.add(callback);
            }
        }
        render_callbacks.length = 0;
    } while (dirty_components.length);
    while (flush_callbacks.length) {
        flush_callbacks.pop()();
    }
    update_scheduled = false;
}
function update($$) {
    if ($$.fragment) {
        $$.update($$.dirty);
        run_all($$.before_update);
        $$.fragment.p($$.dirty, $$.ctx);
        $$.dirty = null;
        $$.after_update.forEach(add_render_callback);
    }
}
const outroing = new Set();
function transition_in(block, local) {
    if (block && block.i) {
        outroing.delete(block);
        block.i(local);
    }
}

const globals = (typeof window !== 'undefined' ? window : global);
function mount_component(component, target, anchor) {
    const { fragment, on_mount, on_destroy, after_update } = component.$$;
    fragment.m(target, anchor);
    // onMount happens before the initial afterUpdate
    add_render_callback(() => {
        const new_on_destroy = on_mount.map(run).filter(is_function);
        if (on_destroy) {
            on_destroy.push(...new_on_destroy);
        }
        else {
            // Edge case - component was destroyed immediately,
            // most likely as a result of a binding initialising
            run_all(new_on_destroy);
        }
        component.$$.on_mount = [];
    });
    after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
    if (component.$$.fragment) {
        run_all(component.$$.on_destroy);
        component.$$.fragment.d(detaching);
        // TODO null out other refs, including component.$$ (but need to
        // preserve final state?)
        component.$$.on_destroy = component.$$.fragment = null;
        component.$$.ctx = {};
    }
}
function make_dirty(component, key) {
    if (!component.$$.dirty) {
        dirty_components.push(component);
        schedule_update();
        component.$$.dirty = blank_object();
    }
    component.$$.dirty[key] = true;
}
function init(component, options, instance, create_fragment, not_equal, prop_names) {
    const parent_component = current_component;
    set_current_component(component);
    const props = options.props || {};
    const $$ = component.$$ = {
        fragment: null,
        ctx: null,
        // state
        props: prop_names,
        update: noop,
        not_equal,
        bound: blank_object(),
        // lifecycle
        on_mount: [],
        on_destroy: [],
        before_update: [],
        after_update: [],
        context: new Map(parent_component ? parent_component.$$.context : []),
        // everything else
        callbacks: blank_object(),
        dirty: null
    };
    let ready = false;
    $$.ctx = instance
        ? instance(component, props, (key, ret, value = ret) => {
            if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                if ($$.bound[key])
                    $$.bound[key](value);
                if (ready)
                    make_dirty(component, key);
            }
            return ret;
        })
        : props;
    $$.update();
    ready = true;
    run_all($$.before_update);
    $$.fragment = create_fragment($$.ctx);
    if (options.target) {
        if (options.hydrate) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment.l(children(options.target));
        }
        else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment.c();
        }
        if (options.intro)
            transition_in(component.$$.fragment);
        mount_component(component, options.target, options.anchor);
        flush();
    }
    set_current_component(parent_component);
}
let SvelteElement;
if (typeof HTMLElement !== 'undefined') {
    SvelteElement = class extends HTMLElement {
        constructor() {
            super();
            this.attachShadow({ mode: 'open' });
        }
        connectedCallback() {
            // @ts-ignore todo: improve typings
            for (const key in this.$$.slotted) {
                // @ts-ignore todo: improve typings
                this.appendChild(this.$$.slotted[key]);
            }
        }
        attributeChangedCallback(attr, _oldValue, newValue) {
            this[attr] = newValue;
        }
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            // TODO should this delegate to addEventListener?
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    };
}
class SvelteComponent {
    $destroy() {
        destroy_component(this, 1);
        this.$destroy = noop;
    }
    $on(type, callback) {
        const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
        callbacks.push(callback);
        return () => {
            const index = callbacks.indexOf(callback);
            if (index !== -1)
                callbacks.splice(index, 1);
        };
    }
    $set() {
        // overridden by instance, if it has props
    }
}

function dispatch_dev(type, detail) {
    document.dispatchEvent(custom_event(type, detail));
}
function append_dev(target, node) {
    dispatch_dev("SvelteDOMInsert", { target, node });
    append(target, node);
}
function insert_dev(target, node, anchor) {
    dispatch_dev("SvelteDOMInsert", { target, node, anchor });
    insert(target, node, anchor);
}
function detach_dev(node) {
    dispatch_dev("SvelteDOMRemove", { node });
    detach(node);
}
function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
    const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
    if (has_prevent_default)
        modifiers.push('preventDefault');
    if (has_stop_propagation)
        modifiers.push('stopPropagation');
    dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
    const dispose = listen(node, event, handler, options);
    return () => {
        dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
        dispose();
    };
}
function attr_dev(node, attribute, value) {
    attr(node, attribute, value);
    if (value == null)
        dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
    else
        dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
}
function prop_dev(node, property, value) {
    node[property] = value;
    dispatch_dev("SvelteDOMSetProperty", { node, property, value });
}
function set_data_dev(text, data) {
    data = '' + data;
    if (text.data === data)
        return;
    dispatch_dev("SvelteDOMSetData", { node: text, data });
    text.data = data;
}
class SvelteComponentDev extends SvelteComponent {
    constructor(options) {
        if (!options || (!options.target && !options.$$inline)) {
            throw new Error(`'target' is a required option`);
        }
        super();
    }
    $destroy() {
        super.$destroy();
        this.$destroy = () => {
            console.warn(`Component was already destroyed`); // eslint-disable-line no-console
        };
    }
}

/* src/SvelteTable.svelte generated by Svelte v3.12.0 */
const { Object: Object_1 } = globals;

const file = "src/SvelteTable.svelte";

function get_each_context_1(ctx, list, i) {
	const child_ctx = Object_1.create(ctx);
	child_ctx.col = list[i];
	return child_ctx;
}

function get_each_context(ctx, list, i) {
	const child_ctx = Object_1.create(ctx);
	child_ctx.row = list[i];
	return child_ctx;
}

function get_each_context_2(ctx, list, i) {
	const child_ctx = Object_1.create(ctx);
	child_ctx.col = list[i];
	return child_ctx;
}

function get_each_context_4(ctx, list, i) {
	const child_ctx = Object_1.create(ctx);
	child_ctx.option = list[i];
	return child_ctx;
}

function get_each_context_3(ctx, list, i) {
	const child_ctx = Object_1.create(ctx);
	child_ctx.col = list[i];
	return child_ctx;
}

// (77:1) {#if showFilterHeader}
function create_if_block_1(ctx) {
	var tr;

	let each_value_3 = ctx.columns;

	let each_blocks = [];

	for (let i = 0; i < each_value_3.length; i += 1) {
		each_blocks[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
	}

	const block = {
		c: function create() {
			tr = element("tr");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}
			attr_dev(tr, "class", "svelte-5jx64d");
			add_location(tr, file, 77, 2, 1684);
		},

		m: function mount(target, anchor) {
			insert_dev(target, tr, anchor);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(tr, null);
			}
		},

		p: function update(changed, ctx) {
			if (changed.filterValues || changed.columns || changed.undefined || changed.filterSettings) {
				each_value_3 = ctx.columns;

				let i;
				for (i = 0; i < each_value_3.length; i += 1) {
					const child_ctx = get_each_context_3(ctx, each_value_3, i);

					if (each_blocks[i]) {
						each_blocks[i].p(changed, child_ctx);
					} else {
						each_blocks[i] = create_each_block_3(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(tr, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}
				each_blocks.length = each_value_3.length;
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach_dev(tr);
			}

			destroy_each(each_blocks, detaching);
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_1.name, type: "if", source: "(77:1) {#if showFilterHeader}", ctx });
	return block;
}

// (81:5) {#if filterValues[col.key] !== undefined}
function create_if_block_2(ctx) {
	var select, option, dispose;

	let each_value_4 = ctx.filterValues[ctx.col.key];

	let each_blocks = [];

	for (let i = 0; i < each_value_4.length; i += 1) {
		each_blocks[i] = create_each_block_4(get_each_context_4(ctx, each_value_4, i));
	}

	function select_change_handler() {
		ctx.select_change_handler.call(select, ctx);
	}

	const block = {
		c: function create() {
			select = element("select");
			option = element("option");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}
			option.__value = ctx.undefined;
			option.value = option.__value;
			add_location(option, file, 82, 7, 1832);
			if (ctx.filterSettings[ctx.col.key] === void 0) add_render_callback(select_change_handler);
			attr_dev(select, "class", "svelte-5jx64d");
			add_location(select, file, 81, 6, 1779);
			dispose = listen_dev(select, "change", select_change_handler);
		},

		m: function mount(target, anchor) {
			insert_dev(target, select, anchor);
			append_dev(select, option);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(select, null);
			}

			select_option(select, ctx.filterSettings[ctx.col.key]);
		},

		p: function update(changed, new_ctx) {
			ctx = new_ctx;
			if (changed.filterValues || changed.columns) {
				each_value_4 = ctx.filterValues[ctx.col.key];

				let i;
				for (i = 0; i < each_value_4.length; i += 1) {
					const child_ctx = get_each_context_4(ctx, each_value_4, i);

					if (each_blocks[i]) {
						each_blocks[i].p(changed, child_ctx);
					} else {
						each_blocks[i] = create_each_block_4(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(select, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}
				each_blocks.length = each_value_4.length;
			}

			if ((changed.filterSettings || changed.columns)) select_option(select, ctx.filterSettings[ctx.col.key]);
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach_dev(select);
			}

			destroy_each(each_blocks, detaching);

			dispose();
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_2.name, type: "if", source: "(81:5) {#if filterValues[col.key] !== undefined}", ctx });
	return block;
}

// (84:8) {#each filterValues[col.key] as option}
function create_each_block_4(ctx) {
	var option, t_value = ctx.option.name + "", t, option_value_value;

	const block = {
		c: function create() {
			option = element("option");
			t = text(t_value);
			option.__value = option_value_value = ctx.option.value;
			option.value = option.__value;
			add_location(option, file, 84, 8, 1924);
		},

		m: function mount(target, anchor) {
			insert_dev(target, option, anchor);
			append_dev(option, t);
		},

		p: function update(changed, ctx) {
			if ((changed.filterValues || changed.columns) && t_value !== (t_value = ctx.option.name + "")) {
				set_data_dev(t, t_value);
			}

			if ((changed.filterValues || changed.columns) && option_value_value !== (option_value_value = ctx.option.value)) {
				prop_dev(option, "__value", option_value_value);
			}

			option.value = option.__value;
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach_dev(option);
			}
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block_4.name, type: "each", source: "(84:8) {#each filterValues[col.key] as option}", ctx });
	return block;
}

// (79:4) {#each columns as col}
function create_each_block_3(ctx) {
	var th, t;

	var if_block = (ctx.filterValues[ctx.col.key] !== ctx.undefined) && create_if_block_2(ctx);

	const block = {
		c: function create() {
			th = element("th");
			if (if_block) if_block.c();
			t = space();
			add_location(th, file, 79, 5, 1721);
		},

		m: function mount(target, anchor) {
			insert_dev(target, th, anchor);
			if (if_block) if_block.m(th, null);
			append_dev(th, t);
		},

		p: function update(changed, ctx) {
			if (ctx.filterValues[ctx.col.key] !== ctx.undefined) {
				if (if_block) {
					if_block.p(changed, ctx);
				} else {
					if_block = create_if_block_2(ctx);
					if_block.c();
					if_block.m(th, t);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach_dev(th);
			}

			if (if_block) if_block.d();
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block_3.name, type: "each", source: "(79:4) {#each columns as col}", ctx });
	return block;
}

// (97:4) {#if sortKey === col.key}
function create_if_block(ctx) {
	var t_value = ctx.sortOrder === 1 ? '▲' : '▼' + "", t;

	const block = {
		c: function create() {
			t = text(t_value);
		},

		m: function mount(target, anchor) {
			insert_dev(target, t, anchor);
		},

		p: function update(changed, ctx) {
			if ((changed.sortOrder) && t_value !== (t_value = ctx.sortOrder === 1 ? '▲' : '▼' + "")) {
				set_data_dev(t, t_value);
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach_dev(t);
			}
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block.name, type: "if", source: "(97:4) {#if sortKey === col.key}", ctx });
	return block;
}

// (94:3) {#each columns as col}
function create_each_block_2(ctx) {
	var th, t0_value = ctx.col.title + "", t0, t1, t2, th_class_value, dispose;

	var if_block = (ctx.sortKey === ctx.col.key) && create_if_block(ctx);

	function click_handler() {
		return ctx.click_handler(ctx);
	}

	const block = {
		c: function create() {
			th = element("th");
			t0 = text(t0_value);
			t1 = space();
			if (if_block) if_block.c();
			t2 = space();
			attr_dev(th, "class", th_class_value = "" + null_to_empty([(ctx.col.sortable ? 'isSortable' : '' ),(ctx.col.headerClass !== ctx.undefined && ctx.col.headerClass)].join(' ')) + " svelte-5jx64d");
			add_location(th, file, 94, 4, 2092);
			dispose = listen_dev(th, "click", click_handler);
		},

		m: function mount(target, anchor) {
			insert_dev(target, th, anchor);
			append_dev(th, t0);
			append_dev(th, t1);
			if (if_block) if_block.m(th, null);
			append_dev(th, t2);
		},

		p: function update(changed, new_ctx) {
			ctx = new_ctx;
			if ((changed.columns) && t0_value !== (t0_value = ctx.col.title + "")) {
				set_data_dev(t0, t0_value);
			}

			if (ctx.sortKey === ctx.col.key) {
				if (if_block) {
					if_block.p(changed, ctx);
				} else {
					if_block = create_if_block(ctx);
					if_block.c();
					if_block.m(th, t2);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}

			if ((changed.columns) && th_class_value !== (th_class_value = "" + null_to_empty([(ctx.col.sortable ? 'isSortable' : '' ),(ctx.col.headerClass !== ctx.undefined && ctx.col.headerClass)].join(' ')) + " svelte-5jx64d")) {
				attr_dev(th, "class", th_class_value);
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach_dev(th);
			}

			if (if_block) if_block.d();
			dispose();
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block_2.name, type: "each", source: "(94:3) {#each columns as col}", ctx });
	return block;
}

// (105:4) {#each columns as col}
function create_each_block_1(ctx) {
	var td, raw_value = ctx.col.renderValue ? ctx.col.renderValue(ctx.row) : ctx.col.value(ctx.row) + "", td_class_value;

	const block = {
		c: function create() {
			td = element("td");
			attr_dev(td, "class", td_class_value = "" + null_to_empty((ctx.col.class !== ctx.undefined && ctx.col.class)) + " svelte-5jx64d");
			add_location(td, file, 105, 5, 2420);
		},

		m: function mount(target, anchor) {
			insert_dev(target, td, anchor);
			td.innerHTML = raw_value;
		},

		p: function update(changed, ctx) {
			if ((changed.columns || changed.c_rows) && raw_value !== (raw_value = ctx.col.renderValue ? ctx.col.renderValue(ctx.row) : ctx.col.value(ctx.row) + "")) {
				td.innerHTML = raw_value;
			}

			if ((changed.columns) && td_class_value !== (td_class_value = "" + null_to_empty((ctx.col.class !== ctx.undefined && ctx.col.class)) + " svelte-5jx64d")) {
				attr_dev(td, "class", td_class_value);
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach_dev(td);
			}
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block_1.name, type: "each", source: "(105:4) {#each columns as col}", ctx });
	return block;
}

// (103:1) {#each c_rows as row}
function create_each_block(ctx) {
	var tr, t;

	let each_value_1 = ctx.columns;

	let each_blocks = [];

	for (let i = 0; i < each_value_1.length; i += 1) {
		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
	}

	const block = {
		c: function create() {
			tr = element("tr");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t = space();
			add_location(tr, file, 103, 2, 2383);
		},

		m: function mount(target, anchor) {
			insert_dev(target, tr, anchor);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(tr, null);
			}

			append_dev(tr, t);
		},

		p: function update(changed, ctx) {
			if (changed.columns || changed.undefined || changed.c_rows) {
				each_value_1 = ctx.columns;

				let i;
				for (i = 0; i < each_value_1.length; i += 1) {
					const child_ctx = get_each_context_1(ctx, each_value_1, i);

					if (each_blocks[i]) {
						each_blocks[i].p(changed, child_ctx);
					} else {
						each_blocks[i] = create_each_block_1(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(tr, t);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}
				each_blocks.length = each_value_1.length;
			}
		},

		d: function destroy(detaching) {
			if (detaching) {
				detach_dev(tr);
			}

			destroy_each(each_blocks, detaching);
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block.name, type: "each", source: "(103:1) {#each c_rows as row}", ctx });
	return block;
}

function create_fragment(ctx) {
	var table, t0, tr, t1;

	var if_block = (ctx.showFilterHeader) && create_if_block_1(ctx);

	let each_value_2 = ctx.columns;

	let each_blocks_1 = [];

	for (let i = 0; i < each_value_2.length; i += 1) {
		each_blocks_1[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
	}

	let each_value = ctx.c_rows;

	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
	}

	const block = {
		c: function create() {
			table = element("table");
			if (if_block) if_block.c();
			t0 = space();
			tr = element("tr");

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].c();
			}

			t1 = space();

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}
			add_location(tr, file, 92, 1, 2057);
			attr_dev(table, "class", "svelte-5jx64d");
			add_location(table, file, 75, 0, 1650);
		},

		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},

		m: function mount(target, anchor) {
			insert_dev(target, table, anchor);
			if (if_block) if_block.m(table, null);
			append_dev(table, t0);
			append_dev(table, tr);

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].m(tr, null);
			}

			append_dev(table, t1);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(table, null);
			}
		},

		p: function update(changed, ctx) {
			if (ctx.showFilterHeader) if_block.p(changed, ctx);

			if (changed.columns || changed.undefined || changed.sortKey || changed.sortOrder) {
				each_value_2 = ctx.columns;

				let i;
				for (i = 0; i < each_value_2.length; i += 1) {
					const child_ctx = get_each_context_2(ctx, each_value_2, i);

					if (each_blocks_1[i]) {
						each_blocks_1[i].p(changed, child_ctx);
					} else {
						each_blocks_1[i] = create_each_block_2(child_ctx);
						each_blocks_1[i].c();
						each_blocks_1[i].m(tr, null);
					}
				}

				for (; i < each_blocks_1.length; i += 1) {
					each_blocks_1[i].d(1);
				}
				each_blocks_1.length = each_value_2.length;
			}

			if (changed.columns || changed.undefined || changed.c_rows) {
				each_value = ctx.c_rows;

				let i;
				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(changed, child_ctx);
					} else {
						each_blocks[i] = create_each_block(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(table, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}
				each_blocks.length = each_value.length;
			}
		},

		i: noop,
		o: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach_dev(table);
			}

			if (if_block) if_block.d();

			destroy_each(each_blocks_1, detaching);

			destroy_each(each_blocks, detaching);
		}
	};
	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment.name, type: "component", source: "", ctx });
	return block;
}

function instance($$self, $$props, $$invalidate) {
	let { columns, rows } = $$props;
	
	let sortOrder = 1;
	let sortKey = "";
	let sortBy = r => "";
	let showFilterHeader = columns.some(c => c.filterOptions !== undefined);
	let filterValues = {};
	let filterSettings = {};
	let columnByKey = {};
	columns.forEach(col => {
	  $$invalidate('columnByKey', columnByKey[col.key] = col, columnByKey);
	});

	const calculateFilterValues = () => {
	  $$invalidate('filterValues', filterValues = {});
	  columns.forEach(c => {
	    if (typeof c.filterOptions === "function") {
	      $$invalidate('filterValues', filterValues[c.key] = c.filterOptions(rows), filterValues);
	    } else if (Array.isArray(c.filterOptions)) {
	      $$invalidate('filterValues', filterValues[c.key] = [...c.filterOptions], filterValues);
	    }
	  });
	};

	const handleSort = col => {
	  if (col.sortable === true && typeof col.value === "function") {
	    if (sortKey === col.key) {
	      $$invalidate('sortOrder', sortOrder = sortOrder === 1 ? -1 : 1);
	    } else {
	      $$invalidate('sortOrder', sortOrder = 1);
	      $$invalidate('sortKey', sortKey = col.key);
	      $$invalidate('sortBy', sortBy = r => col.value(r));
	    }
	  }
	};

	if (showFilterHeader) {
	  calculateFilterValues();
	}

	const writable_props = ['columns', 'rows'];
	Object_1.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<SvelteTable> was created with unknown prop '${key}'`);
	});

	function select_change_handler({ col }) {
		filterSettings[col.key] = select_value(this);
		$$invalidate('filterSettings', filterSettings);
		$$invalidate('columns', columns);
		$$invalidate('filterValues', filterValues);
		$$invalidate('undefined', undefined);
	}

	const click_handler = ({ col }) => handleSort(col);

	$$self.$set = $$props => {
		if ('columns' in $$props) $$invalidate('columns', columns = $$props.columns);
		if ('rows' in $$props) $$invalidate('rows', rows = $$props.rows);
	};

	$$self.$capture_state = () => {
		return { columns, rows, sortOrder, sortKey, sortBy, showFilterHeader, filterValues, filterSettings, columnByKey, c_rows };
	};

	$$self.$inject_state = $$props => {
		if ('columns' in $$props) $$invalidate('columns', columns = $$props.columns);
		if ('rows' in $$props) $$invalidate('rows', rows = $$props.rows);
		if ('sortOrder' in $$props) $$invalidate('sortOrder', sortOrder = $$props.sortOrder);
		if ('sortKey' in $$props) $$invalidate('sortKey', sortKey = $$props.sortKey);
		if ('sortBy' in $$props) $$invalidate('sortBy', sortBy = $$props.sortBy);
		if ('showFilterHeader' in $$props) $$invalidate('showFilterHeader', showFilterHeader = $$props.showFilterHeader);
		if ('filterValues' in $$props) $$invalidate('filterValues', filterValues = $$props.filterValues);
		if ('filterSettings' in $$props) $$invalidate('filterSettings', filterSettings = $$props.filterSettings);
		if ('columnByKey' in $$props) $$invalidate('columnByKey', columnByKey = $$props.columnByKey);
		if ('c_rows' in $$props) $$invalidate('c_rows', c_rows = $$props.c_rows);
	};

	let c_rows;

	$$self.$$.update = ($$dirty = { rows: 1, filterSettings: 1, columnByKey: 1, sortBy: 1, sortOrder: 1 }) => {
		if ($$dirty.rows || $$dirty.filterSettings || $$dirty.columnByKey || $$dirty.sortBy || $$dirty.sortOrder) { $$invalidate('c_rows', c_rows = rows
			  .filter(r =>
			    Object.keys(filterSettings).every(f => {
			      // console.log(f, filterSettings[f], columnByKey[f])
			      let ret =  (
			        filterSettings[f] === undefined ||
			        filterSettings[f] === columnByKey[f].filterValue(r)
						);
						return ret;
			    })
			  )
			  .map(r => ({ ...r, $sortOn: sortBy(r) }))
			  .sort((a, b) => {
			    if (a.$sortOn > b.$sortOn) return sortOrder;
			    else if (a.$sortOn < b.$sortOn) return -sortOrder;
			    return 0;
			  })); }
	};

	return {
		columns,
		rows,
		sortOrder,
		sortKey,
		showFilterHeader,
		filterValues,
		filterSettings,
		handleSort,
		undefined,
		c_rows,
		select_change_handler,
		click_handler
	};
}

class SvelteTable extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance, create_fragment, safe_not_equal, ["columns", "rows"]);
		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "SvelteTable", options, id: create_fragment.name });

		const { ctx } = this.$$;
		const props = options.props || {};
		if (ctx.columns === undefined && !('columns' in props)) {
			console.warn("<SvelteTable> was created without expected prop 'columns'");
		}
		if (ctx.rows === undefined && !('rows' in props)) {
			console.warn("<SvelteTable> was created without expected prop 'rows'");
		}
	}

	get columns() {
		throw new Error("<SvelteTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set columns(value) {
		throw new Error("<SvelteTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get rows() {
		throw new Error("<SvelteTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set rows(value) {
		throw new Error("<SvelteTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

module.exports = SvelteTable;
//# sourceMappingURL=SvelteTable.js.map
