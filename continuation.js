var monad = require('./index');

function isContinuation(obj) {
	return (typeof obj === 'function');
}

// Continuation monad.
module.exports = monad(
	function unit(error, result) {
		return function(callback) { callback(error, result); };
	},
	function bind(value, func) {
		return function(callback) {
			var done = false;
			function continueNextTick(error, result) {
				if (done) {
					callback(new Error('Callback called twice!'));
					callback = function(error, result) {
						console.log('This would be received by the callback:', error, result);
					};
					return;
				}
				done = true;

				// The *func* call happens before the nextTick (on purpose!)
				var nextTask = func(error, result);
				process.nextTick(function() { nextTask(callback); });
			}

			if (!isContinuation(value)) {
				return continueNextTick(null, value);
			}
			try {
				value(continueNextTick);
			} catch (e) {
				continueNextTick(e);
			}
		}
	}
);
