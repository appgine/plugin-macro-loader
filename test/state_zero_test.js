
var createState = require('../lib/lib/state').default;


exports.zero = function(test) {
	var state = createState();

	state.initial({
		one: 1,
	}, {
		one: 2,
		two: 2,
	});

	test.equal(state.one, 1);
	test.equal(state.two, 2);

	test.equal(state.isDirty(), true);
	test.equal(state.isDirtyInitial(), false);

	state.resetInitial();

	test.equal(state.one, 1);
	test.equal(state.isDirty(), true);
	test.equal(state.isDirtyInitial(), false);

	state.reset(true);

	test.equal(state.one, 2);
	test.equal(state.isDirty(), false);
	test.equal(state.isDirtyInitial(), true);

	test.done();
}
