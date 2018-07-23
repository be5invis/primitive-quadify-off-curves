/*
Copyright 2018 Renzhi Li (aka. Belleve Invis)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

	http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { autoQuadifyCurve, Curve, DerivableFunction, Point2d } from "./functional";
import mix from "./mix";

function bez3(a: number, b: number, c: number, d: number, t: number): number {
	const ab = mix(a, b, t);
	const bc = mix(b, c, t);
	const cd = mix(c, d, t);
	const abc = mix(ab, bc, t);
	const bcd = mix(bc, cd, t);
	return mix(abc, bcd, t);
}

function bezT3(P0: number, P1: number, P2: number, P3: number, t: number) {
	return (
		-3 * (1 - t) * (1 - t) * P0 +
		3 * (1 - t) * (1 - t) * P1 -
		6 * t * (1 - t) * P1 -
		3 * t * t * P2 +
		6 * t * (1 - t) * P2 +
		3 * t * t * P3
	);
}

export class CubicBezierCurve implements Curve {
	a: Point2d;
	b: Point2d;
	c: Point2d;
	d: Point2d;

	constructor(a: Point2d, b: Point2d, c: Point2d, d: Point2d) {
		this.a = a;
		this.b = b;
		this.c = c;
		this.d = d;
	}

	eval(t) {
		return {
			x: bez3(this.a.x, this.b.x, this.c.x, this.d.x, t),
			y: bez3(this.a.y, this.b.y, this.c.y, this.d.y, t)
		};
	}

	derivative(t) {
		return {
			x: bezT3(this.a.x, this.b.x, this.c.x, this.d.x, t),
			y: bezT3(this.a.y, this.b.y, this.c.y, this.d.y, t)
		};
	}
}

export class Reparametrized<T> implements Curve {
	curve: Curve;
	fn: DerivableFunction;
	constructor(c: Curve, fn: DerivableFunction) {
		this.curve = c;
		this.fn = fn;
	}
	eval(t) {
		return this.curve.eval(this.fn.eval(t));
	}
	derivative(t) {
		const d = this.curve.derivative(this.fn.eval(t));
		const dF = this.fn.derivative(t);
		return { x: d.x * dF, y: d.y * dF };
	}
}

export function autoQuadify(
	c: Curve,
	allowError: number = 0.1,
	maxSegments: number = 32,
	maxDistanceTestPoints = 128
) {
	return autoQuadifyCurve(c, allowError, maxSegments, maxDistanceTestPoints);
}
export { autoQuadifyCurve, quadifyCurve } from "./functional";