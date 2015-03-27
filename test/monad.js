describe('Monad', function() {
	var assert = require('assert');
	var monad = require('../monad.js');

	describe('creates an identity monad, which', function() {
		var identity = monad(function unit(error, value) {
			if (error) { throw error; }
			return value;
		}, function bind(value, func) {
			return func(null, value);
		});

		it('can be called on a regular function', function() {
			var result = identity(function() {
				return 'test';
			});
			assert.equal(result, 'test');
		});
		it('returns the yielded value', function() {
			var result = identity(function*() {
				return (yield 'test');
			});
			assert.equal(result, 'test');
		});
		it('throws errors thrown inside the generator function', function() {
			var hasThrown = false;
			try {
				identity(function*() {
					throw new Error();
				});
			} catch (e) {
				hasThrown = true;
			}
			assert(hasThrown);
		});
		it('allows to catch errors even when yielding in between', function() {
			function throwIt() {
				throw new Error();
			}

			var hasCaught = false;
			identity(function*() {
				try {
					yield throwIt();
				} catch (e) {
					hasCaught = true;
				}
			});
			assert(hasCaught);
		});
		it('obeys to the monad laws', function() {

		});
	});

	describe('creates an error monad, which', function() {
		var ErrorProto = {};
		function just(value) {
			var res = Object.create(ErrorProto);
			res.value = value;
			return res;
		};
		function fail(error) {
			var res = Object.create(ErrorProto);
			res.error = error;
			return res;
		};
		var error = monad(function unit(error, value) {
			return error ? fail(error) : just(value);
		}, function bind(value, func) {
			return value.error ? value : func(value.error, value.value);
		});

		it('returns a "just" value', function() {
			var result = error(function*() {
				return (yield just('test'));
			});
			assert.equal(result.error, null);
			assert.strictEqual(result.value, 'test');
		});
		it('returns an explicit "fail" value', function() {
			var result = error(function*() {
				return (yield fail(new Error('Explicit')));
			});
			assert(result.error);
			assert.equal(result.error.message, 'Explicit');
			assert.equal(result.value, null);
		});
		it('returns an implicit "fail" value', function() {
			var result = error(function*() {
				throw new Error('Implicit');
			});
			assert(result.error);
			assert.equal(result.error.message, 'Implicit');
			assert.equal(result.value, null);
		});
	});

	describe('creates a maybe monad, which', function() {
		var NOTHING = {};
		var maybe = monad(function unit(error, value) {
			if (error) { throw error; }
			return { just: value };
		}, function bind(value, func) {
			return (value === NOTHING) ? value : func(null, value.just);
		});

		function getProperty(obj, prop) {
			return (prop in obj) ? { just: obj[prop] } : NOTHING;
		}

		it('performs valid actions', function() {
			var data = {
				address: {
					name: 'Name',
					street: 'Street'
				}
			};
			maybe(function*() {
				var address = yield getProperty(data, 'address');
				var name = yield getProperty(address, 'name');
				var street = yield getProperty(address, 'street');
				assert.equal(name, 'Name');
				assert.equal(street, 'Street');
			});
		});
		it('performs invalid actions returning NOTHING', function() {
			var brokenData = {};
			maybe(function*() {
				var address = yield getProperty(brokenData, 'address');
				var name = yield getProperty(address, 'name');
				var street = yield getProperty(address, 'street');
				assert.equal(name, NOTHING);
				assert.equal(street, NOTHING);
			});
		});
	});
});