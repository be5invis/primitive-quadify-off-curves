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

import * as math from "mathjs";
import { minDistanceToQuad } from "./estimate";
import mix from "./mix";

export interface Point2d {
	x: number;
	y: number;
}
function X(n: number) {
	return n * 2;
}
function Y(n: number) {
	return n * 2 + 1;
}

export interface Derivable<T> {
	eval(t: number): T;
	derivative(t: number): T;
}

export type Curve = Derivable<Point2d>;
export type DerivableFunction = Derivable<number>;

function findIntersection(p1: Point2d, d1: Point2d, d2: Point2d, p2: Point2d): Point2d {
	const det = d2.x * d1.y - d2.y * d1.x;
	const numU = (p2.y - p1.y) * d2.x - (p2.x - p1.x) * d2.y;
	const numV = (p2.y - p1.y) * d1.x - (p2.x - p1.x) * d1.y;

	if (Math.abs(det) < 1e-6) {
		if (
			Math.abs(numU) < 1e-12 &&
			Math.abs(numV) < 1e-12 &&
			numU * det <= 0 &&
			numV * det >= 0
		) {
			return {
				x: (p1.x + p2.x) / 2,
				y: (p1.y + p2.y) / 2
			};
		} else {
			return null;
		}
	}
	const u = numU / det;
	const v = numV / det;
	if (u <= 0 || v >= 0) return null;
	return {
		x: p1.x + d1.x * u,
		y: p1.y + d1.y * u
	};
}

export function quadifyCurve(c: Curve, n: number = 1): Point2d[] {
	if (n <= 0) return [];

	if (n === 1) {
		const m = findIntersection(c.eval(0), c.derivative(0), c.derivative(1), c.eval(1));
		if (m) return [m];
		else return null;
	}

	const start = c.eval(0);
	const end = c.eval(1);

	const nArguments = 2 * n;
	const matrix: number[][] = [];
	const results: number[] = [];

	for (let j = 0; j < nArguments; j++) {
		matrix[j] = [];
		results[j] = 0;
		for (let k = 0; k < nArguments; k++) {
			matrix[j][k] = 0;
		}
	}
	const { x: leftTX, y: leftTY } = c.derivative(0);
	const { x: rightTX, y: rightTY } = c.derivative(1);
	const dScale = 1 / (2 * n);

	matrix[0][X(0)] = 1;
	matrix[0][Y(0)] = 0;
	results[0] = start.x + leftTX * dScale;
	matrix[2][X(0)] = 0;
	matrix[2][Y(0)] = 1;
	results[2] = start.y + leftTY * dScale;

	matrix[1][X(n - 1)] = 1;
	matrix[1][Y(n - 1)] = 0;
	results[1] = end.x - rightTX * dScale;
	matrix[3][X(n - 1)] = 0;
	matrix[3][Y(n - 1)] = 1;
	results[3] = end.y - rightTY * dScale;

	// Inner knots
	for (let j = 1; j < n - 1; j++) {
		const mixBefore = 1 / 8,
			mixHere = 3 / 4,
			mixNext = 1 / 8;
		const { x: cx, y: cy } = c.eval((j + 1 / 2) / n);
		matrix[X(j + 1)][X(j - 1)] = mixBefore;
		matrix[X(j + 1)][X(j)] = mixHere;
		matrix[X(j + 1)][X(j + 1)] = mixNext;
		results[X(j + 1)] = cx;
		matrix[Y(j + 1)][Y(j - 1)] = mixBefore;
		matrix[Y(j + 1)][Y(j)] = mixHere;
		matrix[Y(j + 1)][Y(j + 1)] = mixNext;
		results[Y(j + 1)] = cy;
	}

	const rs = <number[][]>math.lusolve(matrix, results);
	const points = [];
	for (let j = 0; j < n; j++) {
		points[j] = { x: rs[X(j)][0], y: rs[Y(j)][0] };
	}
	return points;
}

function estimateError(c: Curve, offPoints: Point2d[], N: number) {
	let curves: number[][] = [];
	for (let j = 0; j < offPoints.length; j++) {
		const z = offPoints[j];
		const pointBefore: Point2d =
			j > 0
				? {
						x: mix(z.x, offPoints[j - 1].x, 1 / 2),
						y: mix(z.y, offPoints[j - 1].y, 1 / 2)
				  }
				: c.eval(0);
		const pointAfter: Point2d =
			j < offPoints.length - 1
				? {
						x: mix(z.x, offPoints[j + 1].x, 1 / 2),
						y: mix(z.y, offPoints[j + 1].y, 1 / 2)
				  }
				: c.eval(1);
		curves.push([pointBefore.x, pointBefore.y, z.x, z.y, pointAfter.x, pointAfter.y]);
	}
	let squareDist = 0;
	for (let j = 1; j < N; j++) {
		let minDistSofar = 1e9;
		const { x: zx, y: zy } = c.eval(j / N);
		for (const c of curves) {
			const dist = minDistanceToQuad(zx, zy, c[0], c[1], c[2], c[3], c[4], c[5]);
			if (dist < minDistSofar) minDistSofar = dist;
		}
		squareDist += minDistSofar;
	}
	return squareDist / N;
}

export function autoQuadifyCurve(c: Curve, allowError, maxSegments, samples: number): Point2d[] {
	let results = null;
	for (let s = 1; s <= maxSegments; s++) {
		try {
			let offPoints = quadifyCurve(c, s);
			if (!offPoints || !offPoints.length) continue;
			let err = estimateError(c, offPoints, samples);
			if (err < allowError) return offPoints;
			results = offPoints;
		} catch (e) {}
	}
	return results;
}
