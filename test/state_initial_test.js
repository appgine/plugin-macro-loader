
var createState = require('../lib/lib/state').default;


exports.initial = function(test) {
	var state = createState();

	state.initial({
		one: 1,
		two: 2,
	});

	test.equal(Object.keys(state).length, 2);
	test.equal(state.one, 1);
	test.equal(state.two, 2);

	state.initial({
		one: 2,
	});

	test.equal(state.one, 2);

	state.one = 3;
	test.equal(state.one, 3);

	state.initial({
		one: 4,
	});

	test.equal(state.one, 3);

	state.initial({
		two: 3,
	});

	test.equal(state.one, 3);
	test.equal(state.two, 3);

	test.done();
}


exports.initialDeep = function(test) {
	var state = createState();

	state.initial({
		status: {
			one: 1,
			two: 2,
		}
	});

	test.equal(state.status.one, 1);
	test.equal(state.status.two, 2);

	state.status.one = 2;

	test.equal(state.status.one, 2);

	state.initial({
		status: {
			one: 3,
			two: 3,
		}
	});

	test.equal(state.status.one, 2);
	test.equal(state.status.two, 3);

	state.initial({
		status: 1,
	});

	test.equal(state.status, 1);

	test.done();
}
