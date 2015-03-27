# node-monad
Monad do-notation for Node.js using harmony generators.

Here an example of a maybe monad:

```javascript
var monad = require('node-monad');

var NOTHING = {};
var maybe = monad(function unit(error, value) {
	if (error) { throw error; }
	return { just: value };
}, function bind(value, func) {
	return (value === NOTHING) ? value : func(null, value.just);
});
```

You can use it in a do-notation like style:

```javascript
// helper function returning a Maybe value ({ just: value } or NOTHING)
function getProperty(obj, prop) {
	return (prop in obj) ? { just: obj[prop] } : NOTHING;
}

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
	console.log(name); // 'Name'
	console.log(street); // 'Street'
});

var brokenData = {};
maybe(function*() {
	var address = yield getProperty(brokenData, 'address');
	var name = yield getProperty(address, 'name');
	var street = yield getProperty(address, 'street');
	console.log(name === NOTHING); // true
	console.log(street === NOTHING); // true
});
```
