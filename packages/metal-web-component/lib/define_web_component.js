'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.defineWebComponent = defineWebComponent;

var _metalState = require('metal-state');

var _metalState2 = _interopRequireDefault(_metalState);

var _metal = require('metal');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Register a custom element for a given metal component.
 *
 * @param {String} tagName The tag name to use for this custom element.
 * @param {!function()} Ctor Metal component constructor.
 * @return {void} Nothing.
 */
function defineWebComponent(tagName, Ctor) {
	if (!('customElements' in window)) {
		return;
	}

	var observedAttributes = Object.keys(_metalState2.default.getStateStatic(Ctor));

	var props = (0, _metal.getStaticProperty)(Ctor, 'PROPS', _metalState.mergeState);

	var hasProps = (0, _metal.isObject)(props) && Object.keys(props).length;

	if (hasProps) {
		observedAttributes = Object.keys(props);
	}

	function CustomElement() {
		return Reflect.construct(HTMLElement, [], CustomElement);
	}

	CustomElement.observedAttributes = observedAttributes;

	Object.setPrototypeOf(CustomElement.prototype, HTMLElement.prototype);
	Object.setPrototypeOf(CustomElement, HTMLElement);

	Object.assign(CustomElement.prototype, {
		attributeChangedCallback: function attributeChangedCallback(attrName, oldVal, newVal) {
			if (this.componentHasProps) {
				this.component.props[attrName] = newVal;
			} else {
				this.component[attrName] = newVal;
			}
		},

		connectedCallback: function connectedCallback() {
			var useShadowDOM = this.getAttribute('useShadowDOM') || false;
			var element = this;

			if (useShadowDOM) {
				element = this.attachShadow({
					mode: 'open'
				});
			}

			var opts = {};
			for (var i = 0, l = observedAttributes.length; i < l; i++) {
				opts[observedAttributes[i]] = this.getAttribute(observedAttributes[i]);
			}
			this.component = new Ctor(opts, element);
			this.componentHasProps = hasProps;
			this.componentEventHandler = this.emit.bind(this);

			this.component.on('*', this.componentEventHandler);
		},

		disconnectedCallback: function disconnectedCallback() {
			this.component.off('*', this.componentEventHandler);
			this.component.dispose();
		},

		emit: function emit() {
			for (var _len = arguments.length, data = Array(_len), _key = 0; _key < _len; _key++) {
				data[_key] = arguments[_key];
			}

			var eventData = data.pop();
			var event = new CustomEvent(eventData.type, {
				detail: data
			});
			this.dispatchEvent(event);
		}
	});

	window.customElements.define(tagName, CustomElement);
};

exports.default = defineWebComponent;