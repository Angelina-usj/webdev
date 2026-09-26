const values = [12, 45, 8, 30, 67];
const above = values.filter(vlaues => values>20).map(values => values * 2);
console.log(above);
const doubled = values.map(values => values *2);
console.log(doubled);

let max = values[0];
values.forEach(function(num){
    if (num > max){
        max = num;
    }
});
console.log(max);

const studentsDetails = [
    { name: 'John', score: 40, subject: 'Maths' },
    { name: 'James', score: 70, subject: 'Science' },
    { name: 'Ian', score: 50, subject: 'Maths' },
    { name: 'David', score: 60, subject: 'Science' },
];

const passedcourse = studentsDetails.filter((student)=>student.score > 50).map((student) => student.name);
console.log(passedcourse);