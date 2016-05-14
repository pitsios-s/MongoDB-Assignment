// Load data into MongoDB
load("/home/stamatis/Desktop/MongoDB/prep.js");

// Open "test" database
use test;

// QUERY 1 - Find the number of students that are currently taking at least 1 class.
db.students.find(
    { "courses.course_status": "In Progress" }
).count();

// QUERY 2 - Count how many students are enrolled from each city.
db.students.aggregate(
    { $project: { "home_city": 1 } },
    { $group: { "_id": "$home_city", "num_of_students": { $sum: 1 } } }
);

// QUERY 3 - Find the most popular hobby/hobbies
db.students.aggregate(
    { $project: { "hobbies": 1 } },
    { $unwind: "$hobbies" },
    { $group: { "_id": "$hobbies", "num_of_students": { $sum: 1 } } },
    { $group: { "_id": "$num_of_students", "hobbies": { $addToSet: "$_id" } } },
    { $sort: { "_id": -1 } },
    { $limit: 1 },
    { $unwind: "$hobbies" },
    { $project: { "_id": 0, "hobby": "$hobbies" } }
);

// QUERY 4 - Find the GPA of the best student.
db.students.aggregate(
    { $project: { "courses": 1 } },
    { $unwind: "$courses" },
    { $match: { "courses.course_status": "Complete" } },
    { $group: { "_id": "$_id", "GPA": { $avg: "$courses.grade" } } },
    { $project: { "Highest GPA": "$GPA", "_id": 0  } },
    { $sort: { "Highest GPA": -1 } },
    { $limit: 1 }
);

// An alternative approach of the above is the following.
db.students.aggregate(
    { $project: { "GPA": { $avg: "$courses.grade" }, "_id": 0 } },
    { $sort: { "GPA": -1 } },
    { $limit: 1 }
);

// QUERY 5 - Find the student(s) with the largest number of 10's.
db.students.aggregate(
    { $project: { "_id": 1, "first_name": 1, "courses": 1 } },
    { $unwind: "$courses" },
    { $match: { "courses.grade": 10 } },
    { $group: { "_id": "$_id", "tens": { $sum: 1 }, "first_name": { $first: "$first_name" } } },
    { $group: { "_id": "$tens", "students": { $addToSet: { "id": "$_id", "first_name": "$first_name" } } } },
    { $sort: { "_id": -1 } },
    { $limit: 1 },
    { $unwind: "$students" },
    { $project: { "_id": 0, "student": "$students" } }
);

// QUERY 6 - Find the class(es) with the highest average GPA.
db.students.aggregate(
    { $project: { "courses": 1 } },
    { $unwind: "$courses" },
    { $match: { "courses.course_status": "Complete" } },
    { $group: { "_id": "$courses.course_title", "class_gpa": { $avg: "$courses.grade" } } },
    { $group: { "_id": "$class_gpa", "class_name": { $addToSet: "$_id" } } },
    { $sort: { "_id": -1 } },
    { $limit: 1 },
    { $unwind: "$class_name" },
    { $project: { "class_name": 1, "_id": 0 } }
);

// QUERY 7 - Find the class(es) that has(have) been dropped the most number of times.
db.students.aggregate(
    { $project: { "courses": 1 } },
    { $unwind: "$courses" },
    { $match: { "courses.course_status": "Dropped" } },
    { $group: { "_id": "$courses.course_title", "count": { $sum: 1 } } },
    { $group: { "_id": "$count", "class_name": { $addToSet: "$_id" } } },
    { $sort: { "_id": -1 } },
    { $limit: 1 },
    { $unwind: "$class_name"},
    { $project: { "class_name": 1, "_id": 0 } }
);

// QUERY 8 - Find the number of completed classes per class type.
// This question can have a double meaning:
// 1) How many times a class type have been completed by a student
// 2) The number of unique courses of a given course type, that have been completed by at least one student.
// Since description is ambigious, we will give both approaches.

// (1)
db.students.aggregate(
    { $project: { "courses": 1 } },
    { $unwind: "$courses" },
    { $match: { "courses.course_status": "Complete" } },
    { $group: { "_id": { $substr: [ "$courses.course_code", 0, 1 ] }, "count": { $sum: 1 } } },
    { $project: { "_id": 0, "class_type": "$_id", "count": 1 } }
);

// (2)
db.students.aggregate(
    { $project: { "courses": 1 } },
    { $unwind: "$courses" },
    { $match: { "courses.course_status": "Complete" } },
    { $group: { "_id": { $substr: [ "$courses.course_code", 0, 1 ] }, "count": { $addToSet: "$courses.course_title" } } },
    { $project: { "_id": 0, "class_type": "$_id", "count": { $size: "$count" } } }
);

// QUERY 9 - Create a new field named "hobbyist" that indicates whether or not a student has 3 or more hobbies.
db.students.aggregate(
    { $project: { "hobbyist": { $gte: [ { $size: "$hobbies" }, 3 ] },
                  "home_city": 1,
                  "first_name": 1,
                  "hobbies": 1,
                  "favorite_os": 1,
                  "laptop_cost": 1,
                  "courses": 1 } }
).pretty();

// QUERY 10 - Create a new field that shows the number of completed courses per student.
db.students.aggregate(
    { $project: { "completed_courses": { $size: { $filter: { input: "$courses", as: "course", cond: { $eq: [ { $strcasecmp: [ "$$course.course_status", "Complete" ] }, 0 ] } } } },
                  "home_city": 1,
                  "first_name": 1,
                  "hobbies": 1,
                  "favorite_os": 1,
                  "laptop_cost": 1,
                  "courses": 1 } }
).pretty();


// QUERY 11 - Create a new grouping for students, to display only the first name, the GPA and the number of completed and dropped classes.
db.students.aggregate(
    { $project: { "first_name": 1,
                  "GPA": { $avg: "$courses.grade" },
                  "classesInProgress": { $size: { $filter: { input: "$courses", as: "course", cond: { $eq: [ { $strcasecmp: [ "$$course.course_status", "In Progress" ] }, 0 ] } } } },
                  "droppedClasses": { $size: { $filter: { input: "$courses", as: "course", cond: { $eq: [ { $strcasecmp: [ "$$course.course_status", "Dropped" ] }, 0 ] } } } } } }
);

// QUERY 12 - Create a new collection that keeps the courses.
db.students.aggregate(
    { $project: { "courses": 1 } },
    { $unwind: "$courses" },
    { $group: { "_id": "$courses.course_code",
                "course_title": { $first: "$courses.course_title" },
                "numberOfDropouts": { $sum: { $cond: { if: { $eq: [ { $strcasecmp: [ "$courses.course_status", "Dropped" ] }, 0 ] }, then: 1, else: 0 } } },
                "numberOfTimesCompleted": { $sum: { $cond: { if: { $eq: [ { $strcasecmp: [ "$courses.course_status", "Complete" ] }, 0 ] }, then: 1, else: 0 } } },
                "currentlyRegistered": { $addToSet: { $cond: { if: { $eq: [ { $strcasecmp: [ "$courses.course_status", "In Progress" ] }, 0 ] }, then: "$_id", else: null } } },
                "avgGrade": { $avg: "$courses.grade" },
                "maxGrade": { $max: "$courses.grade" },
                "minGrade": { $min: "$courses.grade" } } },
    { $project: { "course_title": 1,
                  "numberOfDropouts": 1,
                  "numberOfTimesCompleted": 1,
                  "currentlyRegistered": { $setDifference: [ "$currentlyRegistered", [ null ] ] },
                  "avgGrade": 1,
                  "maxGrade": 1,
                  "minGrade": 1 } },
    { $out: "course_statistics" }
);
