

export default function createState() {
	const state = {};
	const initial = function(initialState) {
		if ('initial' in initialState) {
			throw new Error('Plugin state does not support initial key.');
		}

		if (state.__proto__!==undefined) {
			state.__proto__ = initialState||{};

		} else if (state.initial.initiated===undefined) {
			state.initial.initiated = true;

			for (var key in initialState) {
				if (initialState.hasOwnProperty(key)) {
					state[key] = initialState[key];
				}
			}
		}
	}

	if (Object.defineProperty) {
		Object.defineProperty(state, 'initial', {
			value: initial,
			enumerable: false,
			writable: false,
		});

	} else {
		state.initial = initial;
	}

	return state;
}
