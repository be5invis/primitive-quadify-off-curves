const math: any = require("mathjs/core").create();
math.import(require("mathjs/lib/type/matrix"));
math.import(require("mathjs/lib/function/algebra/solver/lusolve"));
export default math;
