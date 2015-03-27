function isGenerator(obj) {
	return (Object.prototype.toString.call(obj) === '[object Generator]');
}

module.exports = function(unit, bind) {
	return function (generatorFunc) {
		return bind(unit(), function() {
			try {
				var gen = generatorFunc();
			} catch (e) {
				return unit(e);
			}

			return isGenerator(gen) ? bind(unit(), send) : unit(null, gen);

			function send(error, result) {
				try {
					var nextResult = error ? gen.throw(error) : gen.next(result);
				} catch (e) {
					return unit(e);
				}

				if (nextResult.done) {
					return unit(null, nextResult.value);
				}
				
				return bind(nextResult.value, send);
			}
		});
	};
}

