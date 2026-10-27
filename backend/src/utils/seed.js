import { connectDB, disconnectDB } from '../config/db.js';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { Course } from '../models/Course.js';
import { Quiz } from '../models/Quiz.js';
import { LiveClass } from '../models/LiveClass.js';
import { v4 as uuidv4 } from 'uuid';

export const COURSES_SEED_DATA = [
  {
    title: 'Introduction to Full-Stack Web Development',
    shortDescription: 'Learn MERN stack fundamentals with hands-on projects.',
    description:
      'A practical introduction covering React, Node.js, Express, MongoDB, authentication, and deploying a complete learning application.',
    category: 'Web Development',
    level: 'beginner',
    price: 0,
    isFree: true,
    status: 'published',
    learningObjectives: [
      'Build REST APIs with Express and Node.js',
      'Create reactive Single Page Applications with React',
      'Authenticate users securely using JWT and HTTP-only cookies',
      'Model documents and relationships with MongoDB and Mongoose',
    ],
    prerequisites: ['Basic JavaScript and HTML/CSS'],
    sections: [
      {
        title: 'Getting Started',
        order: 0,
        lessons: [
          {
            title: 'Welcome & Course Overview',
            description: 'What you will learn in this course and roadmap overview.',
            order: 0,
            durationSeconds: 300,
            isFreePreview: true,
            video: { status: 'none' },
          },
          {
            title: 'Setting Up Your Environment',
            description: 'Install Node, MongoDB tooling, and editor setup.',
            order: 1,
            durationSeconds: 600,
            isFreePreview: true,
            video: { status: 'none' },
          },
        ],
      },
      {
        title: 'Backend Foundations',
        order: 1,
        lessons: [
          {
            title: 'Express API Basics',
            description: 'Routes, middleware, request handling, and JSON responses.',
            order: 0,
            durationSeconds: 900,
            isFreePreview: false,
            video: { status: 'none' },
          },
          {
            title: 'MongoDB & Mongoose Schema Design',
            description: 'Connecting to MongoDB and defining structured schemas.',
            order: 1,
            durationSeconds: 840,
            isFreePreview: false,
            video: { status: 'none' },
          },
        ],
      },
      {
        title: 'Frontend & Full-Stack Integration',
        order: 2,
        lessons: [
          {
            title: 'Connecting React to the Backend API',
            description: 'Axios setup, handling loading and error states.',
            order: 0,
            durationSeconds: 780,
            isFreePreview: false,
            video: { status: 'none' },
          },
        ],
      },
    ],
    quiz: {
      title: 'Full-Stack Foundations Check',
      description: 'Test your understanding of full-stack MERN architecture.',
      passingScore: 70,
      questions: [
        {
          prompt: 'Which database does this LMS use?',
          options: [
            { text: 'MongoDB', isCorrect: true },
            { text: 'MySQL', isCorrect: false },
            { text: 'SQLite', isCorrect: false },
            { text: 'Firebase only', isCorrect: false },
          ],
          explanation: 'This project utilizes MongoDB with Mongoose.',
          points: 1,
        },
        {
          prompt: 'What authenticates API requests across the platform?',
          options: [
            { text: 'JWT access tokens and verified sessions', isCorrect: true },
            { text: 'Plain passwords stored in localStorage only', isCorrect: false },
            { text: 'Unauthenticated FTP links', isCorrect: false },
          ],
          explanation: 'Signed JSON Web Tokens (JWT) authenticate API requests.',
          points: 1,
        },
      ],
    },
  },
  {
    title: 'Python Programming for Beginners',
    shortDescription: 'Master Python syntax, logic, functions, and command-line apps.',
    description:
      'Learn Python fundamentals, variables, loops, functions, and practical programming through hands-on exercises.',
    category: 'Programming',
    level: 'beginner',
    price: 0,
    isFree: true,
    status: 'published',
    learningObjectives: [
      'Master Python syntax, data types, numbers, and strings',
      'Control program flow with conditionals and iteration loops',
      'Write modular, reusable code using functions and parameters',
      'Manage lists, dictionaries, tuples, and data structures',
      'Build a working command-line project from scratch',
    ],
    prerequisites: ['No prior programming experience required'],
    sections: [
      {
        title: 'Python Essentials & Setup',
        order: 0,
        lessons: [
          {
            title: 'Introduction to Python & Installation',
            description: 'Installing Python, running the REPL, and your first script.',
            order: 0,
            durationSeconds: 480,
            isFreePreview: true,
            video: { status: 'none' },
          },
          {
            title: 'Variables, Numbers, and String Manipulation',
            description: 'Working with variables, types, formatting, and operations.',
            order: 1,
            durationSeconds: 720,
            isFreePreview: true,
            video: { status: 'none' },
          },
        ],
      },
      {
        title: 'Logic, Branching & Loops',
        order: 1,
        lessons: [
          {
            title: 'Conditionals and Boolean Logic',
            description: 'if, elif, and else statements with logical comparisons.',
            order: 0,
            durationSeconds: 600,
            isFreePreview: false,
            video: { status: 'none' },
          },
          {
            title: 'While Loops and For Loops',
            description: 'Iterating through ranges, break, and continue statements.',
            order: 1,
            durationSeconds: 750,
            isFreePreview: false,
            video: { status: 'none' },
          },
          {
            title: 'Defining Functions & Return Values',
            description: 'Parameters, default arguments, and variable scope.',
            order: 2,
            durationSeconds: 900,
            isFreePreview: false,
            video: { status: 'none' },
          },
        ],
      },
      {
        title: 'Data Collections & Capstone',
        order: 2,
        lessons: [
          {
            title: 'Lists, Tuples, and Dictionaries',
            description: 'Grouping structured data and key-value mappings.',
            order: 0,
            durationSeconds: 850,
            isFreePreview: false,
            video: { status: 'none' },
          },
          {
            title: 'Building a Command-Line Application',
            description: 'Putting it all together with interactive user input and logic.',
            order: 1,
            durationSeconds: 1100,
            isFreePreview: false,
            video: { status: 'none' },
          },
        ],
      },
    ],
    quiz: {
      title: 'Python Fundamentals Assessment',
      description: 'Verify your knowledge of core Python syntax and logic.',
      passingScore: 70,
      questions: [
        {
          prompt: 'Which keyword is used to define a function in Python?',
          options: [
            { text: 'def', isCorrect: true },
            { text: 'function', isCorrect: false },
            { text: 'fun', isCorrect: false },
            { text: 'define', isCorrect: false },
          ],
          explanation: 'Functions in Python are defined with the "def" keyword.',
          points: 1,
        },
        {
          prompt: 'What is the output data type of 5 / 2 in Python 3?',
          options: [
            { text: 'float (2.5)', isCorrect: true },
            { text: 'int (2)', isCorrect: false },
            { text: 'str ("2.5")', isCorrect: false },
            { text: 'boolean', isCorrect: false },
          ],
          explanation: 'Standard division / always returns a floating-point number.',
          points: 1,
        },
        {
          prompt: 'Which collection type uses key-value pairs in Python?',
          options: [
            { text: 'Dictionary (dict)', isCorrect: true },
            { text: 'List (list)', isCorrect: false },
            { text: 'Tuple (tuple)', isCorrect: false },
            { text: 'Set (set)', isCorrect: false },
          ],
          explanation: 'Dictionaries store data mapped in key: value pairs.',
          points: 1,
        },
      ],
    },
  },
  {
    title: 'Data Analytics with Python',
    shortDescription: 'Analyze, clean, and visualize datasets with NumPy, Pandas, and Matplotlib.',
    description:
      'Learn data analysis using NumPy, Pandas, Matplotlib, data cleaning, and practical data visualization.',
    category: 'Data Science',
    level: 'intermediate',
    price: 0,
    isFree: true,
    status: 'published',
    learningObjectives: [
      'Manipulate multidimensional arrays with NumPy',
      'Clean, filter, and transform real tabular data using Pandas',
      'Handle missing values, duplicates, and data type formatting',
      'Aggregate, group, and merge disparate datasets',
      'Generate clear graphs and charts with Matplotlib',
    ],
    prerequisites: ['Basic Python programming knowledge'],
    sections: [
      {
        title: 'NumPy & Scientific Computation',
        order: 0,
        lessons: [
          {
            title: 'NumPy Arrays & Vectorized Operations',
            description: 'Why arrays outperform lists for numerical analysis.',
            order: 0,
            durationSeconds: 650,
            isFreePreview: true,
            video: { status: 'none' },
          },
          {
            title: 'Array Slicing, Indexing, and Broadcasting',
            description: 'Selecting subsets and broadcasting operations across dimensions.',
            order: 1,
            durationSeconds: 700,
            isFreePreview: false,
            video: { status: 'none' },
          },
        ],
      },
      {
        title: 'Data Wrangling with Pandas',
        order: 1,
        lessons: [
          {
            title: 'Series and DataFrames Architecture',
            description: 'Loading CSVs, inspecting shapes, heads, and column types.',
            order: 0,
            durationSeconds: 800,
            isFreePreview: true,
            video: { status: 'none' },
          },
          {
            title: 'Data Cleaning: Missing Values & Duplicates',
            description: 'fillna, dropna, and type coercion strategies.',
            order: 1,
            durationSeconds: 850,
            isFreePreview: false,
            video: { status: 'none' },
          },
          {
            title: 'Groupby, Aggregation & Pivot Tables',
            description: 'Computing metrics across categorical groupings.',
            order: 2,
            durationSeconds: 900,
            isFreePreview: false,
            video: { status: 'none' },
          },
        ],
      },
      {
        title: 'Visual Insights & Case Study',
        order: 2,
        lessons: [
          {
            title: 'Visualizing Data with Matplotlib',
            description: 'Histograms, scatter plots, line charts, and styling.',
            order: 0,
            durationSeconds: 950,
            isFreePreview: false,
            video: { status: 'none' },
          },
          {
            title: 'End-to-End Exploratory Data Analysis Case Study',
            description: 'Investigating a business dataset and extracting trends.',
            order: 1,
            durationSeconds: 1200,
            isFreePreview: false,
            video: { status: 'none' },
          },
        ],
      },
    ],
    quiz: {
      title: 'Data Analytics Mastery Check',
      description: 'Evaluate your ability to work with Pandas and NumPy.',
      passingScore: 70,
      questions: [
        {
          prompt: 'Which Pandas method is commonly used to view statistical summaries of numerical columns?',
          options: [
            { text: 'df.describe()', isCorrect: true },
            { text: 'df.summary()', isCorrect: false },
            { text: 'df.info_stats()', isCorrect: false },
            { text: 'df.metrics()', isCorrect: false },
          ],
          explanation: 'df.describe() outputs count, mean, std, min, and quartiles.',
          points: 1,
        },
        {
          prompt: 'What is the primary advantage of NumPy arrays over standard Python lists?',
          options: [
            { text: 'Faster contiguous memory storage and vectorized operations', isCorrect: true },
            { text: 'NumPy arrays can only store strings', isCorrect: false },
            { text: 'They require no imports', isCorrect: false },
          ],
          explanation: 'NumPy uses C-level contiguous memory for high-performance vectorized calculations.',
          points: 1,
        },
      ],
    },
  },
  {
    title: 'SQL and Database Management',
    shortDescription: 'Query, join, aggregate, and design relational databases with confidence.',
    description:
      'Learn SQL queries, filtering, joins, aggregation, relationships, and database fundamentals using practical examples.',
    category: 'Database',
    level: 'beginner',
    price: 0,
    isFree: true,
    status: 'published',
    learningObjectives: [
      'Understand relational database models and ACID principles',
      'Write queries with SELECT, WHERE, ORDER BY, and LIMIT',
      'Join tables using INNER, LEFT, RIGHT, and FULL outer joins',
      'Aggregate business metrics with GROUP BY and HAVING clauses',
      'Create and modify schemas with DDL and indexes',
    ],
    prerequisites: ['Basic computer and file management literacy'],
    sections: [
      {
        title: 'Relational Database Foundations',
        order: 0,
        lessons: [
          {
            title: 'Relational Concepts & Table Schemas',
            description: 'Primary keys, foreign keys, and relational integrity.',
            order: 0,
            durationSeconds: 500,
            isFreePreview: true,
            video: { status: 'none' },
          },
          {
            title: 'Querying Data with SELECT and WHERE',
            description: 'Filtering numbers, strings, dates, and NULL values.',
            order: 1,
            durationSeconds: 700,
            isFreePreview: true,
            video: { status: 'none' },
          },
        ],
      },
      {
        title: 'Joins and Aggregation',
        order: 1,
        lessons: [
          {
            title: 'Aggregate Functions & GROUP BY',
            description: 'COUNT, SUM, AVG, MIN, MAX, and HAVING filters.',
            order: 0,
            durationSeconds: 750,
            isFreePreview: false,
            video: { status: 'none' },
          },
          {
            title: 'Mastering INNER and OUTER Joins',
            description: 'Connecting orders, customers, and product tables.',
            order: 1,
            durationSeconds: 950,
            isFreePreview: false,
            video: { status: 'none' },
          },
          {
            title: 'Subqueries & CTEs (Common Table Expressions)',
            description: 'Writing readable multi-stage SQL queries.',
            order: 2,
            durationSeconds: 850,
            isFreePreview: false,
            video: { status: 'none' },
          },
        ],
      },
      {
        title: 'Schema Design & Optimization',
        order: 2,
        lessons: [
          {
            title: 'Table Creation, Constraints, and Alteration',
            description: 'CREATE TABLE, NOT NULL, UNIQUE, and CHECK constraints.',
            order: 0,
            durationSeconds: 800,
            isFreePreview: false,
            video: { status: 'none' },
          },
          {
            title: 'Indexes and Query Optimization',
            description: 'How B-tree indexes speed up lookups and avoiding full table scans.',
            order: 1,
            durationSeconds: 900,
            isFreePreview: false,
            video: { status: 'none' },
          },
        ],
      },
    ],
    quiz: {
      title: 'SQL Knowledge Check',
      description: 'Test your understanding of joins, aggregations, and query syntax.',
      passingScore: 70,
      questions: [
        {
          prompt: 'Which SQL clause is used to filter aggregated grouped results?',
          options: [
            { text: 'HAVING', isCorrect: true },
            { text: 'WHERE', isCorrect: false },
            { text: 'ORDER BY', isCorrect: false },
            { text: 'GROUP FILTER', isCorrect: false },
          ],
          explanation: 'HAVING filters groups created by GROUP BY; WHERE filters individual rows before grouping.',
          points: 1,
        },
        {
          prompt: 'Which join returns all rows from the left table and matched rows from the right table?',
          options: [
            { text: 'LEFT JOIN', isCorrect: true },
            { text: 'INNER JOIN', isCorrect: false },
            { text: 'RIGHT JOIN', isCorrect: false },
            { text: 'CROSS JOIN', isCorrect: false },
          ],
          explanation: 'A LEFT JOIN includes every row from the left table regardless of right-table matches.',
          points: 1,
        },
      ],
    },
  },
  {
    title: 'React.js Frontend Development',
    shortDescription: 'Build modern, responsive, and stateful web applications with React 19.',
    description:
      'Build interactive user interfaces using React components, props, state, hooks, routing, and API integration.',
    category: 'Web Development',
    level: 'intermediate',
    price: 0,
    isFree: true,
    status: 'published',
    learningObjectives: [
      'Construct modular UI components using JSX and typed props',
      'Manage local and shared state with useState and useReducer',
      'Execute side effects and asynchronous data fetching with useEffect',
      'Implement seamless multi-page client routing with React Router',
      'Adopt modern patterns including custom hooks and memoization',
    ],
    prerequisites: ['HTML, modern CSS, and JavaScript ES6+'],
    sections: [
      {
        title: 'React Core Architecture',
        order: 0,
        lessons: [
          {
            title: 'JSX, Components, and the Virtual DOM',
            description: 'How React renders efficient user interfaces declarative-first.',
            order: 0,
            durationSeconds: 550,
            isFreePreview: true,
            video: { status: 'none' },
          },
          {
            title: 'Props, Composition & Component Reusability',
            description: 'Passing data, children props, and creating scalable UI components.',
            order: 1,
            durationSeconds: 700,
            isFreePreview: true,
            video: { status: 'none' },
          },
        ],
      },
      {
        title: 'State, Events & React Hooks',
        order: 1,
        lessons: [
          {
            title: 'State Management with useState',
            description: 'Immutability, form controls, and user interactions.',
            order: 0,
            durationSeconds: 800,
            isFreePreview: false,
            video: { status: 'none' },
          },
          {
            title: 'Side Effects and Data Fetching with useEffect',
            description: 'Connecting to REST APIs, cleanup functions, and dependencies.',
            order: 1,
            durationSeconds: 850,
            isFreePreview: false,
            video: { status: 'none' },
          },
          {
            title: 'Custom Hooks and Context API',
            description: 'Encapsulating reusable business logic and sharing global state.',
            order: 2,
            durationSeconds: 900,
            isFreePreview: false,
            video: { status: 'none' },
          },
        ],
      },
      {
        title: 'Routing & Application Deployment',
        order: 2,
        lessons: [
          {
            title: 'Single-Page Routing with React Router',
            description: 'Route declarations, dynamic parameters, and protected routes.',
            order: 0,
            durationSeconds: 750,
            isFreePreview: false,
            video: { status: 'none' },
          },
          {
            title: 'Building and Deploying Production React Apps',
            description: 'Vite build optimization, bundle splitting, and best practices.',
            order: 1,
            durationSeconds: 1100,
            isFreePreview: false,
            video: { status: 'none' },
          },
        ],
      },
    ],
    quiz: {
      title: 'React Concepts Assessment',
      description: 'Check your knowledge of components, hooks, and virtual DOM rendering.',
      passingScore: 70,
      questions: [
        {
          prompt: 'What must you avoid doing when modifying React state?',
          options: [
            { text: 'Mutating the state variable directly (e.g. state.count = 5)', isCorrect: true },
            { text: 'Using the setter function provided by useState', isCorrect: false },
            { text: 'Passing state down via props', isCorrect: false },
          ],
          explanation: 'React relies on immutability to detect state changes and schedule re-renders.',
          points: 1,
        },
        {
          prompt: 'When does the cleanup function returned inside useEffect execute?',
          options: [
            { text: 'Before the component unmounts or before the effect re-runs', isCorrect: true },
            { text: 'Only when the browser window closes', isCorrect: false },
            { text: 'Synchronously during initial render', isCorrect: false },
          ],
          explanation: 'Effect cleanups execute before subsequent re-runs and during component unmounting.',
          points: 1,
        },
      ],
    },
  },
  {
    title: 'Generative AI and Agentic AI Fundamentals',
    shortDescription: 'Explore LLMs, prompt engineering, tool calling, and autonomous AI agents.',
    description:
      'Understand generative AI, large language models, AI agents, tool calling, and practical AI application development.',
    category: 'Artificial Intelligence',
    level: 'beginner',
    price: 0,
    isFree: true,
    status: 'published',
    learningObjectives: [
      'Understand Transformer architectures, tokens, and probability modeling',
      'Craft high-precision system instructions and few-shot prompts',
      'Implement tool calling to connect models with external APIs and databases',
      'Architect autonomous AI agent loops with memory, tools, and reflection',
      'Deploy real-world AI applications with evaluation and guardrails',
    ],
    prerequisites: ['Basic programming curiosity; no math background required'],
    sections: [
      {
        title: 'Large Language Model Architecture',
        order: 0,
        lessons: [
          {
            title: 'Transformers, Embeddings, and Tokens',
            description: 'How neural networks predict tokens and represent semantic meaning.',
            order: 0,
            durationSeconds: 600,
            isFreePreview: true,
            video: { status: 'none' },
          },
          {
            title: 'Effective Prompt Engineering Strategies',
            description: 'Role-prompting, few-shot reasoning, chain-of-thought, and delimiters.',
            order: 1,
            durationSeconds: 750,
            isFreePreview: true,
            video: { status: 'none' },
          },
        ],
      },
      {
        title: 'Function Calling & Structured Outputs',
        order: 1,
        lessons: [
          {
            title: 'Tool Calling and API Interactivity',
            description: 'Teaching models to invoke custom functions with typed JSON schemas.',
            order: 0,
            durationSeconds: 850,
            isFreePreview: false,
            video: { status: 'none' },
          },
          {
            title: 'Structured Outputs & Error Handling',
            description: 'Enforcing deterministic JSON responses from non-deterministic models.',
            order: 1,
            durationSeconds: 800,
            isFreePreview: false,
            video: { status: 'none' },
          },
        ],
      },
      {
        title: 'Autonomous AI Agents',
        order: 2,
        lessons: [
          {
            title: 'The Anatomy of an AI Agent: ReAct & Plan-and-Solve',
            description: 'Perception, tool execution, working memory, and dynamic self-correction.',
            order: 0,
            durationSeconds: 950,
            isFreePreview: false,
            video: { status: 'none' },
          },
          {
            title: 'Building an Autonomous Research and Coding Agent',
            description: 'Implementing an end-to-end agentic workflow with real tools.',
            order: 1,
            durationSeconds: 1200,
            isFreePreview: false,
            video: { status: 'none' },
          },
        ],
      },
    ],
    quiz: {
      title: 'Generative & Agentic AI Fundamentals Quiz',
      description: 'Test your understanding of tool calling, prompt engineering, and agent loops.',
      passingScore: 70,
      questions: [
        {
          prompt: 'What distinguishes an "AI Agent" from a simple chatbot?',
          options: [
            { text: 'An agent can autonomously plan, execute external tools, and iterate toward a goal', isCorrect: true },
            { text: 'An agent always runs on mobile phones only', isCorrect: false },
            { text: 'An agent cannot process text', isCorrect: false },
          ],
          explanation: 'Agents combine reasoning with environment perception, tool execution, and memory loops.',
          points: 1,
        },
        {
          prompt: 'What does "tool calling" (or function calling) allow an LLM to do?',
          options: [
            { text: 'Generate structured arguments to invoke code, APIs, or database queries', isCorrect: true },
            { text: 'Directly modify its own underlying neural network weights at runtime', isCorrect: false },
            { text: 'Bypass all security and firewalls permanently', isCorrect: false },
          ],
          explanation: 'Tool calling enables LLMs to emit structured JSON requests that application code executes.',
          points: 1,
        },
      ],
    },
  },
];

export async function seedAll() {
  let admin = await User.findOne({ email: env.seed.adminEmail });
  if (!admin) {
    admin = await User.create({
      name: 'Platform Admin',
      email: env.seed.adminEmail,
      password: env.seed.adminPassword,
      role: 'admin',
      status: 'active',
    });
    console.log('Created admin:', admin.email);
  }

  let instructor = await User.findOne({ email: env.seed.instructorEmail });
  if (!instructor) {
    instructor = await User.create({
      name: 'Demo Instructor',
      email: env.seed.instructorEmail,
      password: env.seed.instructorPassword,
      role: 'instructor',
      status: 'active',
      instructorApproved: true,
      headline: 'Senior Full-Stack & AI Educator',
      bio: 'Teaches modern programming, data analytics, web architecture, and generative AI systems.',
    });
    console.log('Created instructor:', instructor.email);
  } else {
    instructor.instructorApproved = true;
    instructor.status = 'active';
    await instructor.save();
  }

  let student = await User.findOne({ email: env.seed.studentEmail });
  if (!student) {
    student = await User.create({
      name: 'Demo Student',
      email: env.seed.studentEmail,
      password: env.seed.studentPassword,
      role: 'student',
      status: 'active',
    });
    console.log('Created student:', student.email);
  }

  const seededCourses = [];

  for (const courseDef of COURSES_SEED_DATA) {
    let course = await Course.findOne({ title: courseDef.title });
    if (!course) {
      course = await Course.create({
        title: courseDef.title,
        shortDescription: courseDef.shortDescription,
        description: courseDef.description,
        category: courseDef.category,
        level: courseDef.level,
        price: courseDef.price,
        isFree: true,
        status: 'published',
        publishedAt: new Date(),
        instructor: instructor._id,
        learningObjectives: courseDef.learningObjectives,
        prerequisites: courseDef.prerequisites,
        sections: courseDef.sections,
      });
      course.recalculateDuration();
      await course.save();
      console.log(`Created course: "${course.title}" (${course.slug})`);
    } else {
      // Safely ensure course is published, free, and has latest sections without wiping student data
      course.category = courseDef.category;
      course.level = courseDef.level;
      course.status = 'published';
      course.isFree = true;
      course.price = 0;
      if (!course.publishedAt) course.publishedAt = new Date();
      course.learningObjectives = courseDef.learningObjectives;
      course.prerequisites = courseDef.prerequisites;
      if (!course.sections || course.sections.length === 0) {
        course.sections = courseDef.sections;
      }
      course.recalculateDuration();
      await course.save();
      console.log(`Verified course: "${course.title}"`);
    }

    seededCourses.push(course);

    // Seed quiz for this course if not already present
    if (courseDef.quiz) {
      let quiz = await Quiz.findOne({ course: course._id, title: courseDef.quiz.title });
      if (!quiz) {
        await Quiz.create({
          title: courseDef.quiz.title,
          description: courseDef.quiz.description,
          course: course._id,
          instructor: instructor._id,
          passingScore: courseDef.quiz.passingScore,
          isPublished: true,
          questions: courseDef.quiz.questions,
        });
        console.log(`  Added quiz: "${courseDef.quiz.title}" for course "${course.title}"`);
      }
    }
  }

  // Seed sample upcoming live classes if none scheduled yet
  const liveClassCount = await LiveClass.countDocuments();
  if (liveClassCount === 0 && seededCourses.length > 0) {
    const webDevCourse = seededCourses[0];
    const pythonCourse = seededCourses[1] || seededCourses[0];

    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    tomorrow.setHours(18, 0, 0, 0);

    const dayAfter = new Date(Date.now() + 48 * 60 * 60 * 1000);
    dayAfter.setHours(19, 30, 0, 0);

    await LiveClass.create({
      title: 'Full-Stack Architecture & Live Q&A',
      description: 'Interactive session exploring Express REST APIs and React integration.',
      course: webDevCourse._id,
      instructor: instructor._id,
      scheduledStart: tomorrow,
      durationMinutes: 60,
      status: 'scheduled',
      roomId: `room-${uuidv4()}`,
    });

    await LiveClass.create({
      title: 'Python Problem-Solving Workshop',
      description: 'Live coding session solving real-world algorithms with Python.',
      course: pythonCourse._id,
      instructor: instructor._id,
      scheduledStart: dayAfter,
      durationMinutes: 45,
      status: 'scheduled',
      roomId: `room-${uuidv4()}`,
    });

    console.log('Created sample upcoming live classes.');
  }

  return { admin, instructor, student, courses: seededCourses };
}

async function seed() {
  await connectDB();
  await seedAll();

  console.log('\nSeed complete. Demo accounts:');
  console.log(`  Admin:      ${env.seed.adminEmail} / ${env.seed.adminPassword}`);
  console.log(`  Instructor: ${env.seed.instructorEmail} / ${env.seed.instructorPassword}`);
  console.log(`  Student:    ${env.seed.studentEmail} / ${env.seed.studentPassword}`);

  await disconnectDB();
}

// If executed directly from CLI: node src/utils/seed.js
if (process.argv[1]?.endsWith('seed.js')) {
  seed().catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
  });
}
