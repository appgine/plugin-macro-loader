
import isEqual from 'lodash/fp/isEqual'
import isPlainObject from 'lodash/fp/isPlainObject'


export default function createState() {
	const state = {};

	if (Object.defineProperty) {
		Object.defineProperty(state, 'initial', {
			value: createInitial(state),
			enumerable: false,
			writable: false,
		});

	} else {
		state.initial = createInitial(state);
	}

	return state;
}


function createInitial(state) {
	const pointers = [];
	const sources = [];
	const source = {};

	return function(initialState) {
		initial(state, initialState, source, pointers, sources);
	}
}


function initial(state, initialState, source, pointers, sources) {
	if (isPlainObject(initialState)===false) {
		throw new Error('Initial state has to be object.');

	} else if ('initial' in initialState) {
		throw new Error('Plugin state does not support initial key.');
	}

	if (process.env.NODE_ENV==='production') {
		if (state.initial.initiated===undefined) {
			state.initial.initiated = true;

			for (var key in initialState) {
				if (initialState.hasOwnProperty(key) && state[key]===undefined) {
					state[key] = initialState[key];
				}
			}
		}

	} else {
		extendObject(state, initialState, source, pointers, sources);
	}
}


function extendObject(state, initialState, source, pointers, sources) {
	Object.keys(initialState).forEach(function(key) {
		extend(key, state, initialState, source, pointers, sources);
	});

	Object.keys(state).forEach(function(key) {
		if (initialState[key]===undefined && isEqual(state[key], source[key])) {
			delete state[key];
			delete initialState[key];
		}
	});
}


function extendArray(state, initialState, source, pointers, sources) {
	for (let i=0; i<initialState.length; i++) {
		extend(i, state, initialState, source, pointers, sources);
	}

	if (state.length>initialState.length && state.length===source.length) {
		let equal = true;
		for (i; i<state.length; i++) {
			equal = equal && isEqual(state[i], source[i]);
		}

		if (equal) {
			state.splice(initialState.length);
			source.splice(initialState.length);
		}
	}
}


function extend(key, state, initialState, source, pointers, sources) {
	const index = pointers.indexOf(state[key]);

	if (index!==-1) {
		if (isPlainObject(state[key]) && isPlainObject(initialState[key])) {
			extendObject(state[key], initialState[key], sources[index], pointers, sources);

		} else if (Array.isArray(state[key]) && Array.isArray(initialState[key])) {
			extendArray(state[key], initialState[key], sources[index], pointers, sources);

		} else {
			state[key] = undefined;
		}
	}

	if (state[key]===undefined) {
		if (isPlainObject(initialState[key])) {
			const _source = {};
			state[key] = {};
			pointers.push(state[key]);
			sources.push(_source);
			extendObject(state[key], initialState[key], _source, pointers, sources);

		} else if (Array.isArray(initialState[key])) {
			const _source = [];
			state[key] = [];
			pointers.push(state[key]);
			sources.push(_source);
			extendArray(state[key], initialState[key], _source, pointers, sources);

		} else {
			state[key] = initialState[key];
			source[key] = initialState[key];
		}

	} else if (state[key]===source[key]) {
		source[key] = initialState[key];
		state[key] = initialState[key];
	}
}
