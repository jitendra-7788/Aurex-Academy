import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lmswlc10';

mongoose.connect(uri).then(async () => {
  const db = mongoose.connection.db;

  // Find first approved instructor
  const instructor = await db.collection('users').findOne({ role: 'instructor', instructorApproved: true });
  if (!instructor) { console.log('No instructor found!'); process.exit(1); }
  console.log('Instructor:', instructor.name, instructor._id.toString());

  // Find first course owned by this instructor (or any published course)
  let course = await db.collection('courses').findOne({ instructor: instructor._id });
  if (!course) {
    course = await db.collection('courses').findOne({});
  }
  if (!course) { console.log('No course found!'); process.exit(1); }
  console.log('Course:', course.title, course._id.toString());

  const now = new Date();

  // Quiz 1 — Web Development Fundamentals (10 questions × 5 marks = 50)
  const quiz1 = {
    _id: new mongoose.Types.ObjectId(),
    title: 'Web Development Fundamentals Quiz',
    description: 'Test your knowledge of core web development concepts including HTML, CSS, and JavaScript.',
    course: course._id,
    lesson: null,
    instructor: instructor._id,
    passingScore: 70,
    timeLimitMinutes: 30,
    maxAttempts: 3,
    isPublished: true,
    questions: [
      {
        _id: new mongoose.Types.ObjectId(),
        prompt: 'What does HTML stand for?',
        options: [
          { _id: new mongoose.Types.ObjectId(), text: 'HyperText Markup Language', isCorrect: true },
          { _id: new mongoose.Types.ObjectId(), text: 'HighText Machine Language', isCorrect: false },
          { _id: new mongoose.Types.ObjectId(), text: 'HyperText and links Markup Language', isCorrect: false },
          { _id: new mongoose.Types.ObjectId(), text: 'None of the above', isCorrect: false },
        ],
        explanation: 'HTML stands for HyperText Markup Language, the standard language for creating web pages.',
        points: 5,
      },
      {
        _id: new mongoose.Types.ObjectId(),
        prompt: 'Which CSS property is used to change the text color of an element?',
        options: [
          { _id: new mongoose.Types.ObjectId(), text: 'fgcolor', isCorrect: false },
          { _id: new mongoose.Types.ObjectId(), text: 'text-color', isCorrect: false },
          { _id: new mongoose.Types.ObjectId(), text: 'color', isCorrect: true },
          { _id: new mongoose.Types.ObjectId(), text: 'font-color', isCorrect: false },
        ],
        explanation: 'The CSS "color" property sets the foreground color of an element\'s text content.',
        points: 5,
      },
      {
        _id: new mongoose.Types.ObjectId(),
        prompt: 'Which of the following is NOT a JavaScript data type?',
        options: [
          { _id: new mongoose.Types.ObjectId(), text: 'String', isCorrect: false },
          { _id: new mongoose.Types.ObjectId(), text: 'Boolean', isCorrect: false },
          { _id: new mongoose.Types.ObjectId(), text: 'Float', isCorrect: true },
          { _id: new mongoose.Types.ObjectId(), text: 'Undefined', isCorrect: false },
        ],
        explanation: 'JavaScript has Number (not Float), String, Boolean, Null, Undefined, Object, and Symbol as data types.',
        points: 5,
      },
      {
        _id: new mongoose.Types.ObjectId(),
        prompt: 'What is the correct way to include an external JavaScript file in HTML?',
        options: [
          { _id: new mongoose.Types.ObjectId(), text: '<script href="script.js">', isCorrect: false },
          { _id: new mongoose.Types.ObjectId(), text: '<script src="script.js"></script>', isCorrect: true },
          { _id: new mongoose.Types.ObjectId(), text: '<javascript src="script.js">', isCorrect: false },
          { _id: new mongoose.Types.ObjectId(), text: '<js file="script.js">', isCorrect: false },
        ],
        explanation: 'The <script> tag with the src attribute is used to include external JavaScript files.',
        points: 5,
      },
      {
        _id: new mongoose.Types.ObjectId(),
        prompt: 'What does CSS stand for?',
        options: [
          { _id: new mongoose.Types.ObjectId(), text: 'Computer Style Sheets', isCorrect: false },
          { _id: new mongoose.Types.ObjectId(), text: 'Cascading Style Sheets', isCorrect: true },
          { _id: new mongoose.Types.ObjectId(), text: 'Creative Style Sheets', isCorrect: false },
          { _id: new mongoose.Types.ObjectId(), text: 'Colorful Style Sheets', isCorrect: false },
        ],
        explanation: 'CSS stands for Cascading Style Sheets, used to style and layout web pages.',
        points: 5,
      },
      {
        _id: new mongoose.Types.ObjectId(),
        prompt: 'Which HTML tag is used to define an unordered list?',
        options: [
          { _id: new mongoose.Types.ObjectId(), text: '<ol>', isCorrect: false },
          { _id: new mongoose.Types.ObjectId(), text: '<list>', isCorrect: false },
          { _id: new mongoose.Types.ObjectId(), text: '<ul>', isCorrect: true },
          { _id: new mongoose.Types.ObjectId(), text: '<dl>', isCorrect: false },
        ],
        explanation: 'The <ul> (unordered list) tag defines a bulleted list. <ol> is for ordered (numbered) lists.',
        points: 5,
      },
      {
        _id: new mongoose.Types.ObjectId(),
        prompt: 'In JavaScript, which keyword is used to declare a constant variable?',
        options: [
          { _id: new mongoose.Types.ObjectId(), text: 'var', isCorrect: false },
          { _id: new mongoose.Types.ObjectId(), text: 'let', isCorrect: false },
          { _id: new mongoose.Types.ObjectId(), text: 'const', isCorrect: true },
          { _id: new mongoose.Types.ObjectId(), text: 'static', isCorrect: false },
        ],
        explanation: '"const" declares a block-scoped, read-only constant. Its value cannot be reassigned.',
        points: 5,
      },
      {
        _id: new mongoose.Types.ObjectId(),
        prompt: 'Which CSS property controls the spacing between elements\' borders and their content?',
        options: [
          { _id: new mongoose.Types.ObjectId(), text: 'margin', isCorrect: false },
          { _id: new mongoose.Types.ObjectId(), text: 'border-spacing', isCorrect: false },
          { _id: new mongoose.Types.ObjectId(), text: 'spacing', isCorrect: false },
          { _id: new mongoose.Types.ObjectId(), text: 'padding', isCorrect: true },
        ],
        explanation: 'The "padding" property sets the space between an element\'s content and its border.',
        points: 5,
      },
      {
        _id: new mongoose.Types.ObjectId(),
        prompt: 'What does the "DOM" stand for in web development?',
        options: [
          { _id: new mongoose.Types.ObjectId(), text: 'Document Object Model', isCorrect: true },
          { _id: new mongoose.Types.ObjectId(), text: 'Data Object Management', isCorrect: false },
          { _id: new mongoose.Types.ObjectId(), text: 'Digital Ordinance Model', isCorrect: false },
          { _id: new mongoose.Types.ObjectId(), text: 'Display Object Module', isCorrect: false },
        ],
        explanation: 'The DOM (Document Object Model) is a programming interface for HTML and XML documents.',
        points: 5,
      },
      {
        _id: new mongoose.Types.ObjectId(),
        prompt: 'Which HTTP method is typically used to submit form data to a server?',
        options: [
          { _id: new mongoose.Types.ObjectId(), text: 'GET', isCorrect: false },
          { _id: new mongoose.Types.ObjectId(), text: 'POST', isCorrect: true },
          { _id: new mongoose.Types.ObjectId(), text: 'PUT', isCorrect: false },
          { _id: new mongoose.Types.ObjectId(), text: 'DELETE', isCorrect: false },
        ],
        explanation: 'POST method sends data in the request body and is the standard way to submit form data.',
        points: 5,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  // Quiz 2 — Full-Stack & Database Concepts (10 questions × 5 marks = 50)
  const quiz2 = {
    _id: new mongoose.Types.ObjectId(),
    title: 'Full-Stack & Database Concepts Quiz',
    description: 'Evaluate your understanding of backend development, REST APIs, Node.js, and MongoDB fundamentals.',
    course: course._id,
    lesson: null,
    instructor: instructor._id,
    passingScore: 70,
    timeLimitMinutes: 30,
    maxAttempts: 3,
    isPublished: true,
    questions: [
      {
        _id: new mongoose.Types.ObjectId(),
        prompt: 'What does REST stand for in RESTful APIs?',
        options: [
          { _id: new mongoose.Types.ObjectId(), text: 'Representational State Transfer', isCorrect: true },
          { _id: new mongoose.Types.ObjectId(), text: 'Remote Execution State Transfer', isCorrect: false },
          { _id: new mongoose.Types.ObjectId(), text: 'Relational Endpoint State Transfer', isCorrect: false },
          { _id: new mongoose.Types.ObjectId(), text: 'Resource Entity State Transfer', isCorrect: false },
        ],
        explanation: 'REST stands for Representational State Transfer, an architectural style for APIs.',
        points: 5,
      },
      {
        _id: new mongoose.Types.ObjectId(),
        prompt: 'Which Node.js module is built-in and used to create a basic HTTP server?',
        options: [
          { _id: new mongoose.Types.ObjectId(), text: 'express', isCorrect: false },
          { _id: new mongoose.Types.ObjectId(), text: 'http', isCorrect: true },
          { _id: new mongoose.Types.ObjectId(), text: 'server', isCorrect: false },
          { _id: new mongoose.Types.ObjectId(), text: 'net', isCorrect: false },
        ],
        explanation: 'Node.js has a built-in "http" module that can be used to create HTTP servers.',
        points: 5,
      },
      {
        _id: new mongoose.Types.ObjectId(),
        prompt: 'In MongoDB, what is a "document"?',
        options: [
          { _id: new mongoose.Types.ObjectId(), text: 'A table row', isCorrect: false },
          { _id: new mongoose.Types.ObjectId(), text: 'A PDF file stored in the database', isCorrect: false },
          { _id: new mongoose.Types.ObjectId(), text: 'A BSON record stored in a collection', isCorrect: true },
          { _id: new mongoose.Types.ObjectId(), text: 'A SQL query result', isCorrect: false },
        ],
        explanation: 'In MongoDB, a document is a BSON (Binary JSON) record stored inside a collection.',
        points: 5,
      },
      {
        _id: new mongoose.Types.ObjectId(),
        prompt: 'Which HTTP status code indicates that a resource was successfully created?',
        options: [
          { _id: new mongoose.Types.ObjectId(), text: '200', isCorrect: false },
          { _id: new mongoose.Types.ObjectId(), text: '201', isCorrect: true },
          { _id: new mongoose.Types.ObjectId(), text: '204', isCorrect: false },
          { _id: new mongoose.Types.ObjectId(), text: '301', isCorrect: false },
        ],
        explanation: 'HTTP 201 Created is returned when a resource has been successfully created on the server.',
        points: 5,
      },
      {
        _id: new mongoose.Types.ObjectId(),
        prompt: 'What is the purpose of middleware in Express.js?',
        options: [
          { _id: new mongoose.Types.ObjectId(), text: 'To store data in the database', isCorrect: false },
          { _id: new mongoose.Types.ObjectId(), text: 'To render HTML templates', isCorrect: false },
          { _id: new mongoose.Types.ObjectId(), text: 'Functions that execute during the request-response cycle', isCorrect: true },
          { _id: new mongoose.Types.ObjectId(), text: 'To manage CSS styles', isCorrect: false },
        ],
        explanation: 'Middleware functions have access to request/response objects and the next function in the cycle.',
        points: 5,
      },
      {
        _id: new mongoose.Types.ObjectId(),
        prompt: 'What is JWT used for in web applications?',
        options: [
          { _id: new mongoose.Types.ObjectId(), text: 'Database querying', isCorrect: false },
          { _id: new mongoose.Types.ObjectId(), text: 'Authentication and information exchange', isCorrect: true },
          { _id: new mongoose.Types.ObjectId(), text: 'File compression', isCorrect: false },
          { _id: new mongoose.Types.ObjectId(), text: 'HTML rendering', isCorrect: false },
        ],
        explanation: 'JSON Web Tokens (JWT) are used for securely transmitting information and authentication.',
        points: 5,
      },
      {
        _id: new mongoose.Types.ObjectId(),
        prompt: 'In Mongoose, what does the "populate()" method do?',
        options: [
          { _id: new mongoose.Types.ObjectId(), text: 'Inserts multiple documents at once', isCorrect: false },
          { _id: new mongoose.Types.ObjectId(), text: 'Replaces ObjectId references with actual document data', isCorrect: true },
          { _id: new mongoose.Types.ObjectId(), text: 'Creates indexes on collections', isCorrect: false },
          { _id: new mongoose.Types.ObjectId(), text: 'Generates seed data', isCorrect: false },
        ],
        explanation: 'populate() replaces specified paths in the document with documents from other collections.',
        points: 5,
      },
      {
        _id: new mongoose.Types.ObjectId(),
        prompt: 'Which of the following is a NoSQL database?',
        options: [
          { _id: new mongoose.Types.ObjectId(), text: 'MySQL', isCorrect: false },
          { _id: new mongoose.Types.ObjectId(), text: 'PostgreSQL', isCorrect: false },
          { _id: new mongoose.Types.ObjectId(), text: 'MongoDB', isCorrect: true },
          { _id: new mongoose.Types.ObjectId(), text: 'SQLite', isCorrect: false },
        ],
        explanation: 'MongoDB is a document-oriented NoSQL database that stores data in flexible JSON-like documents.',
        points: 5,
      },
      {
        _id: new mongoose.Types.ObjectId(),
        prompt: 'What does "npm" stand for?',
        options: [
          { _id: new mongoose.Types.ObjectId(), text: 'Node Package Manager', isCorrect: true },
          { _id: new mongoose.Types.ObjectId(), text: 'New Programming Module', isCorrect: false },
          { _id: new mongoose.Types.ObjectId(), text: 'Node Process Manager', isCorrect: false },
          { _id: new mongoose.Types.ObjectId(), text: 'Nested Package Module', isCorrect: false },
        ],
        explanation: 'npm (Node Package Manager) is the default package manager for Node.js.',
        points: 5,
      },
      {
        _id: new mongoose.Types.ObjectId(),
        prompt: 'What is the purpose of CORS in web development?',
        options: [
          { _id: new mongoose.Types.ObjectId(), text: 'To compress HTTP responses', isCorrect: false },
          { _id: new mongoose.Types.ObjectId(), text: 'To allow or restrict web resources from different origins', isCorrect: true },
          { _id: new mongoose.Types.ObjectId(), text: 'To encrypt database connections', isCorrect: false },
          { _id: new mongoose.Types.ObjectId(), text: 'To cache static assets', isCorrect: false },
        ],
        explanation: 'CORS (Cross-Origin Resource Sharing) controls which origins can access resources on the server.',
        points: 5,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection('quizzes').insertMany([quiz1, quiz2]);
  console.log('\n✅ Successfully inserted 2 quizzes:');
  console.log(`  1. "${quiz1.title}" — 10 questions × 5 pts = 50 marks (ID: ${quiz1._id})`);
  console.log(`  2. "${quiz2.title}" — 10 questions × 5 pts = 50 marks (ID: ${quiz2._id})`);
  console.log(`\n  Linked to course: "${course.title}"`);
  console.log(`  Owned by instructor: ${instructor.name}`);

  mongoose.disconnect();
}).catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
