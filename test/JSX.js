'use strict';

import dom from 'metal-dom';
import Component from 'metal-component';
import JSX from '../src/JSX';

describe('JSX', function() {
	var component;

	afterEach(function() {
		if (component) {
			component.dispose();
		}
	});

	it('should render contents from component\'s jsx function', function() {
		class TestComponent extends Component {
			render() {
				return <div class="test">Hello World</div>;
			}
		}
		TestComponent.RENDERER = JSX;

		component = new TestComponent();
		assert.strictEqual('DIV', component.element.tagName);
		assert.ok(dom.hasClass(component.element, 'test'));
		assert.strictEqual('Hello World', component.element.textContent);
	});

	it('should not throw error if no jsx function is implemented', function() {
		class TestComponent extends Component {
		}
		TestComponent.RENDERER = JSX;

		component = new TestComponent();
		assert.strictEqual('DIV', component.element.tagName);
		assert.strictEqual('', component.element.textContent);
	});

	it('should attach inline listeners', function() {
		class TestComponent extends Component {
			render() {
				return <div>
					<button data-onclick={this.handleClick.bind(this)}></button>
				</div>;
			}
		}
		TestComponent.prototype.handleClick = sinon.stub();
		TestComponent.RENDERER = JSX;

		component = new TestComponent();
		dom.triggerEvent(component.element.childNodes[0], 'click');
		assert.strictEqual(1, component.handleClick.callCount);
	});

	it('should create and render sub components', function() {
		class ChildComponent extends Component {
			render() {
				return <div class="child">Child</div>;
			}
		}
		ChildComponent.RENDERER = JSX;

		class TestComponent extends Component {
			render() {
				return <div class="test">
					<ChildComponent key="child"></ChildComponent>
				</div>;
			}
		}
		TestComponent.RENDERER = JSX;

		component = new TestComponent();
		var child = component.components.child;
		assert.ok(child);
		assert.strictEqual('DIV', child.element.tagName);
		assert.ok(dom.hasClass(child.element, 'child'));
		assert.strictEqual('Child', child.element.textContent);
		assert.strictEqual(child.element, component.element.childNodes[0]);
	});

	it('should receive data from parent components through "config" property', function() {
		class ChildComponent extends Component {
			render() {
				return <div class="child">{this.config.foo}</div>;
			}
		}
		ChildComponent.RENDERER = JSX;

		class TestComponent extends Component {
			render() {
				return <div class="test">
					<ChildComponent key="child" foo="Foo"></ChildComponent>
				</div>;
			}
		}
		TestComponent.RENDERER = JSX;

		component = new TestComponent();
		var child = component.components.child;
		assert.strictEqual('Foo', child.element.textContent);
	});

	it('should receive and render children from parent components', function() {
		class ChildComponent extends Component {
			render() {
				return <div class="child">{this.config.children}</div>;
			}
		}
		ChildComponent.RENDERER = JSX;

		class TestComponent extends Component {
			render() {
				return (
					<div class="test">
						<ChildComponent key="child">
							<span>Children Test</span>
						</ChildComponent>
					</div>
				);
			}
		}
		TestComponent.RENDERER = JSX;

		component = new TestComponent();
		var child = component.components.child;
		assert.strictEqual(1, child.element.childNodes.length);
		assert.strictEqual('SPAN', child.element.childNodes[0].tagName);
		assert.strictEqual('Children Test', child.element.textContent);
	});

	it('should be able to render only some of the received children', function() {
		class ChildComponent extends Component {
			render() {
				return <div class="child">
					{this.config.children[1]}
				</div>;
			}
		}
		ChildComponent.RENDERER = JSX;

		class TestComponent extends Component {
			render() {
				return (
					<div class="test">
						<ChildComponent key="child">
							<span>Children Test</span>
							<span>Children Test 2</span>
							<span>Children Test 3</span>
						</ChildComponent>
					</div>
				);
			}
		}
		TestComponent.RENDERER = JSX;

		component = new TestComponent();
		var child = component.components.child;
		assert.strictEqual(1, child.element.childNodes.length);
		assert.strictEqual('SPAN', child.element.childNodes[0].tagName);
		assert.strictEqual('Children Test 2', child.element.textContent);
	});

	it('should be able to get the data passed to children', function() {
		class ChildComponent extends Component {
			render() {
				return <div class="child">
					{this.config.children[0].config.foo}
					{this.config.children}
				</div>;
			}
		}
		ChildComponent.RENDERER = JSX;

		class TestComponent extends Component {
			render() {
				return (
					<div class="test">
						<ChildComponent key="child">
							<span foo="foo">Children Test</span>
						</ChildComponent>
					</div>
				);
			}
		}
		TestComponent.RENDERER = JSX;

		component = new TestComponent();
		var child = component.components.child;
		assert.strictEqual(2, child.element.childNodes.length);
		assert.strictEqual('foo', child.element.childNodes[0].textContent);
		assert.strictEqual('SPAN', child.element.childNodes[1].tagName);
		assert.strictEqual('Children Test', child.element.childNodes[1].textContent);
	});

	it('should create and render components via "JSX.render"', function() {
		class TestComponent extends Component {
			render() {
				return <div class="test">{this.config.foo}</div>;
			}
		}
		TestComponent.RENDERER = JSX;

		var container = document.createElement('div');
		component = JSX.render(
			TestComponent,
			{
				foo: 'fooValue'
			},
			container
		);

		assert.ok(component instanceof TestComponent);
		assert.strictEqual(1, container.childNodes.length);
		assert.strictEqual(component.element, container.childNodes[0]);
		assert.strictEqual('DIV', component.element.tagName);
		assert.ok(dom.hasClass(component.element, 'test'));
		assert.strictEqual('fooValue', component.element.textContent);
	});

	it('should render componentless functions via "JSX.render"', function() {
		var fn = config => {
			return <div class="test">{config.foo}</div>;
		}
		var container = document.createElement('div');
		JSX.render(
			fn,
			{
				foo: 'fooValue'
			},
			container
		);

		assert.strictEqual(1, container.childNodes.length);
		assert.strictEqual('DIV', container.childNodes[0].tagName);
		assert.ok(dom.hasClass(container.childNodes[0], 'test'));
		assert.strictEqual('fooValue', container.childNodes[0].textContent);
	});

	it('should render jsx element via "JSX.render"', function() {
		var container = document.createElement('div');
		JSX.render(
			<div class="test">foo</div>,
			null,
			container
		);

		assert.strictEqual(1, container.childNodes.length);
		assert.strictEqual('DIV', container.childNodes[0].tagName);
		assert.ok(dom.hasClass(container.childNodes[0], 'test'));
		assert.strictEqual('foo', container.childNodes[0].textContent);
	});
});
