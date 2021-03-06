import mix from "./mix";

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

function quadSolve(a: number, b: number, c: number) {
	// a*x^2 + b*x + c = 0
	if (a === 0) {
		return b === 0 ? [] : [-c / b];
	}
	let D = b * b - 4 * a * c;
	if (D < 0) {
		return [];
	} else if (D === 0) {
		return [-b / (2 * a)];
	}
	let DSqrt = Math.sqrt(D);
	return [(-b - DSqrt) / (2 * a), (-b + DSqrt) / (2 * a)];
}

function cubicRoot(x: number) {
	return x < 0 ? -Math.pow(-x, 1 / 3) : Math.pow(x, 1 / 3);
}

function cubicSolve(a: number, b: number, c: number, d: number) {
	// a*x^3 + b*x^2 + c*x + d = 0
	if (a === 0) {
		return quadSolve(b, c, d);
	}
	// solve using Cardan's method, which is described in paper of R.W.D. Nickals
	// http://www.nickalls.org/dick/papers/maths/cubic1993.pdf (doi:10.2307/3619777)
	let xn = -b / (3 * a); // point of symmetry x coordinate
	let yn = ((a * xn + b) * xn + c) * xn + d; // point of symmetry y coordinate
	let deltaSq = (b * b - 3 * a * c) / (9 * a * a); // delta^2
	let hSq = 4 * a * a * Math.pow(deltaSq, 3); // h^2
	let D3 = yn * yn - hSq;
	if (D3 > 0) {
		// 1 real root
		let D3Sqrt = Math.sqrt(D3);
		return [xn + cubicRoot((-yn + D3Sqrt) / (2 * a)) + cubicRoot((-yn - D3Sqrt) / (2 * a))];
	} else if (D3 === 0) {
		// 2 real roots
		let delta1 = cubicRoot(yn / (2 * a));
		return [xn - 2 * delta1, xn + delta1];
	}
	// 3 real roots
	let theta = Math.acos(-yn / Math.sqrt(hSq)) / 3;
	let delta = Math.sqrt(deltaSq);
	return [
		xn + 2 * delta * Math.cos(theta),
		xn + 2 * delta * Math.cos(theta + (Math.PI * 2) / 3),
		xn + 2 * delta * Math.cos(theta + (Math.PI * 4) / 3)
	];
}

function cubicSolveT(e3: number, e2: number, e1: number, e0: number) {
	const as = cubicSolve(e3, e2, e1, e0);
	const r = [0, 1];
	for (const x of as) if (x > 0 && x < 1) r.push(x);
	return r;
}

function bez2(a: number, b: number, c: number, t: number) {
	return mix(mix(a, b, t), mix(b, c, t), t);
}

export function minDistanceToQuad(
	zx: number,
	zy: number,
	ax: number,
	ay: number,
	bx: number,
	by: number,
	cx: number,
	cy: number
): number {
	const aax = ax + cx - 2 * bx;
	const aay = ay + cy - 2 * by;
	const bbx = 2 * (bx - ax);
	const bby = 2 * (by - ay);
	const e3 = 2 * (aax * aax + aay * aay);
	const e2 = 3 * (aax * bbx + aay * bby);
	const e1 = bbx * bbx + bby * bby + 2 * (aax * (ax - zx) + aay * (ay - zy));
	const e0 = (ax - zx) * bbx + (ay - zy) * bby;

	let candidates = cubicSolveT(e3, e2, e1, e0);

	let minDistance = 1e9;
	for (const t of candidates) {
		const tx = bez2(ax, bx, cx, t);
		const ty = bez2(ay, by, cy, t);
		const distance = (tx - zx) * (tx - zx) + (ty - zy) * (ty - zy);
		if (distance < minDistance) minDistance = distance;
	}
	return minDistance;
}
