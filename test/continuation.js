describe('Continuation monad', function() {
	var assert = require('assert');
	var cont = require('../continuation.js');

	it('runs a trivial function', function(done) {
		cont(function() {})(function(error) {
			assert.ifError(error);
			done();
		});
	});
	it('calls the function immediately', function(done) {
		var called = false;
		cont(function() {
			called = true;
		})(function(error) {
			assert.ifError(error);
			done();
		});

		assert(called);
	});
	it('does not call the callback immediately', function(done) {
		var called = false;
		cont(function() {
		})(function(error) {
			called = true;

			assert.ifError(error);
			done();
		});

		assert(!called);
	});
	it('passes an error thrown in the function on to the callback', function(done) {
		cont(function() {
			throw new Error('Explicit');
		})(function(error) {
			assert.notEqual(error, null);
			assert.equal(error.message, 'Explicit');
			done();
		});
	});
	it('passes the result of the function on to the callback', function(done) {
		cont(function() {
			return 'test';
		})(function(error, result) {
			assert.ifError(error);
			assert.equal(result, 'test');
			done();
		});
	});

	it('runs a trivial generator function', function(done) {
		cont(function*() {})(function(error) {
			assert.ifError(error);
			done();
		});
	});
	it('does not start the generator immediately', function(done) {
		var called = false;
		cont(function*() {
			called = true;
		})(function(error) {
			assert.ifError(error);
			done();
		});

		assert(!called);
	});
	it('passes an error thrown in the generator on to the callback', function(done) {
		cont(function*() {
			throw new Error('Explicit');
		})(function(error) {
			assert.notEqual(error, null);
			assert.equal(error.message, 'Explicit');
			done();
		});
	});
	it('passes the result of the generator on to the callback', function(done) {
		cont(function*() {
			return 'test';
		})(function(error, result) {
			assert.ifError(error);
			assert.equal(result, 'test');
			done();
		});
	});
	it('executes the generator with a yield inside', function(done) {
		var finished = false;
		cont(function*() {
			var test = yield 'test';
			finished = true;
		})(function(error, result) {
			assert.ifError(error);
			assert(finished);
			done();
		});
	});
	it('executes the generator with two yields inside', function(done) {
		var finished = false;
		cont(function*() {
			var test1 = yield 'test1';
			var test2 = yield 'test2';
			finished = true;
		})(function(error, result) {
			assert.ifError(error);
			assert(finished);
			done();
		});
	});
	it('allows to yield a regular value', function(done) {
		cont(function*() {
			var test = yield 'test';
			assert.equal(test, 'test');
		})(function(error, result) {
			assert.ifError(error);
			done();
		});
	});
	it('executes an asynchronous task via yield', function(done) {
		var called = false;
		function asyncTask(callback) {
			called = true;
			callback();
		}
		cont(function*() {
			yield asyncTask;
		})(function(error, result) {
			assert.ifError(error);
			assert(called);
			done();
		});
	});
	it('allows to yield the result of a continuation', function(done) {
		function task(callback) {
			callback(null, 'test');
		}
		cont(function*() {
			var test = yield task;
			assert.equal(test, 'test');
		})(function(error, result) {
			assert.ifError(error);
			done();
		});
	});
	it('allows to yield the result of a continuation created by itself', function(done) {
		var task = cont(function() { return 'test'; });
		cont(function*() {
			var test = yield task;
			assert.equal(test, 'test');
		})(function(error, result) {
			assert.ifError(error);
			done();
		});
	});
	it('can be nested', function(done) {
		cont(function*() {
			var test = yield cont(function*() {
				return (yield cont(function() {
					return 'test';
				}));
			});
			assert.equal(test, 'test');
		})(function(error, result) {
			assert.ifError(error);
			done();
		});
	});
	it('executes two tasks asynchronously', function(done) {
		function wait(millis) {
			return function(callback) {
				setTimeout(function() { callback(); }, millis);
			};
		}

		var called1 = false;
		var called2 = false;

		cont(function*() {
			yield wait(20);
			called1 = true;
		})(function(error, result) {
			assert.ifError(error);
			assert(called1);
			assert(called2);
			done();
		});

		cont(function*() {
			yield wait(1);
			assert(!called1);
			called2 = true;
		})(function(error, result) {
			assert.ifError(error);
		});
	});
});