# `primitive-quadify-off-curves`

Converts arbitrary smooth curve to quadratic TT quadratic points.

## Usage

```typescript
import { 
    autoQuadifyCurve,
    Reparametrized,
    Circle,
    Slice
} from "primitive-quadify-off-curves"

autoQuadifyCurve(new Reparametrized(new Circle(0, 0, 100), new Slice(0, Math.PI * 2)), 1)
autoQuadifyCurve(new CubicBezier(a, b, c, d), 1)
```

### `quadifyCurve`(c: Curve, `nPoints`: number)

Quadify a curve with `nPoints` off-points produced. Would return `null` or throw an error if quadify failed.

### `autoQuadifyCurve`(c: Curve, error: number = 1, maxSegments: number = 32, maxDistanceTestPoints: number = 128)

Quadify a curve with an error. The points used would be automatically decided using the error, and not going above `maxSegments` points.

An alias being `autoQuadify`.

### Interfaces

```typescript
interface Derivable<T> {
	eval(t: number): T;
	derivative(t: number): T;
}
type Curve = Derivable<Point2d>;
type DerivableFunction = Derivable<number>;
```

### Predefined curves and derivable functions

- `CubicBezier`
- `Circle`
- `Reparametrized`: Reparametrize a curve with a derivable function.
- `Slice`: Derivable Function for slicing curves. Usually combined with `Reparametrized`