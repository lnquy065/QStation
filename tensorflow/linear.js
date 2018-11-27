const tf = require('@tensorflow/tfjs');


var fbc = fibonacci(24);
// console.log(fbc);

var xs = tf.tensor1d( fbc.slice(0, fbc.length-1));
var ys = tf.tensor1d( fbc.slice(1));


const xmin = xs.min();
const xmax = xs.max();
const xrange = xmax.sub(xmin);
function norm(x) {
    return x.sub(xmin).div(xrange);
}

xsNorm = norm(xs);
ysNorm = norm(ys);

xsNorm.print();
ysNorm.print();

const a = tf.variable( tf.scalar(Math.random()));
const b = tf.variable( tf.scalar( Math.random() ));



function predict(x) {
    return tf.tidy( () => {
        return a.mul(x).add(b);
    })
}

function loss(predictions, labels) {
    return predictions.sub(labels).square().mean();
}

const learningRate = 0.5;
const optimizer = tf.train.sgd(learningRate);

const numIterations = 10000;
const errors = []
for (let iter = 0; iter < numIterations; iter++) {
    optimizer.minimize(() => {
        const predsYs = predict(xsNorm);
        const e = loss(predsYs, ysNorm);
        errors.push(e.dataSync())
        return e
    });
}

xTest = tf.tensor1d([2, 354224848179262000000]);
predict(xTest).print();

a.print()
b.print()

//Tao day fibonacci
function fibonacci(num){
    var a = 1, b = 0, temp;
    var seq = []
    while (num > 0){
        temp = a;
        a = a + b;
        b = temp;
        seq.push(b)
        num--;
    }
    return seq;
}