//-------------------- MAP-REDUCE JOB 1 --------------------//

stop_words = ['of', 'and', 'a', 'an', 'the', 'in', 'on', 'for']

var mapFunction1 = function() {

  // Loop for each course of the current student.
  for (var i = 0; i < this.courses.length; i++) {

    // Get the current course's name.
    var key = this.courses[i].course_title;

    // Get each word of the course's title.
    var tokens = key.split(' ');

    // Loop for every word.
    for(var j = 0; j < tokens.length; j++) {

      // If current word is not a stopword, emit it.
      if ( tokens.indexOf(tokens[j].toLowerCase()) < 0 ) {
        emit(tokens[j].toLowerCase(), 1);
      }
    }
  }
};

var reduceFunction1 = function(key, values) {
  return Array.sum(values);
};

db.students.mapReduce(
  mapFunction1,
  reduceFunction1,
  { out: "map_reduce_1" }
);

//----------------------------------------------------------//




//-------------------- MAP-REDUCE JOB 2 --------------------//

var mapFunction2 = function() {

  // Loop for each course of the current student.
  for (var i = 0; i < this.courses.length; i++) {

    // If the status of the current course is "Complete", then emit a new pair.
    if (this.courses[i].course_status == "Complete") {

      // Get the type of the current course.
      var courseType = this.courses[i].course_code.substr(0, 1).toUpperCase();

      // Emit a new key-value pair.
      emit( { 'city': this.home_city, 'course_type': courseType },
            { 'count': 1, 'grade': this.courses[i].grade } );
    }
  }
};

var reduceFunction2 = function(key, values) {

  // Create an object which will keep the count and sum of grades for the current key.
  reducedValue = { 'count': 0, 'grade': 0 };

  for (var i = 0; i < values.length; i++) {
    reducedValue.count += values[i].count;
    reducedValue.grade += values[i].grade;
  }

  return reducedValue;
}

var finalizeFunction2 = function(key, reducedValue) {
  return reducedValue.grade / reducedValue.count;
}

db.students.mapReduce(
  mapFunction2,
  reduceFunction2,
  {
    out: "map_reduce_2",
    finalize: finalizeFunction2
  }
);

//----------------------------------------------------------//
