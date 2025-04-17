/**
 * Database Seed Script for Learn Bridge Application
 * 
 * This script creates sample users (students, tutors, admins) in the database.
 * Run this script with Node.js in your backend environment.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Student = require('../models/Student.model');
const Tutor = require('../models/Tutor.model');
const Admin = require('../models/Admin.model');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/learnbridge')
  .then(() => console.log('MongoDB connected for seeding...'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Hash password helper function
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Random data helpers
const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)];
const getRandomItems = (array, count) => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Sample data
const subjects = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science',
  'History', 'Geography', 'English Literature', 'Spanish', 'French',
  'Economics', 'Business Studies', 'Accounting', 'Statistics', 'Calculus',
  'Algebra', 'Geometry', 'Art History', 'Music Theory', 'Psychology'
];

const countries = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'India',
  'Germany', 'France', 'Spain', 'Italy', 'Japan', 'Brazil', 'Mexico',
  'South Africa', 'Nigeria', 'Egypt', 'Singapore', 'New Zealand'
];

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const timeSlots = [
  { startTime: '08:00', endTime: '10:00' },
  { startTime: '10:00', endTime: '12:00' },
  { startTime: '12:00', endTime: '14:00' },
  { startTime: '14:00', endTime: '16:00' },
  { startTime: '16:00', endTime: '18:00' },
  { startTime: '18:00', endTime: '20:00' },
  { startTime: '20:00', endTime: '22:00' }
];

const learningGoals = [
  'Improve grades in school',
  'Prepare for university entrance exams',
  'Learn new skills for career advancement',
  'Develop better study habits',
  'Understand difficult concepts',
  'Pass professional certification',
  'Enhance knowledge in specific subject',
  'Build confidence in academic abilities',
  'Catch up on missed coursework',
  'Get ahead in curriculum'
];

const educationBackgrounds = [
  'Ph.D. in Mathematics from Stanford University',
  'Master\'s in Physics from MIT',
  'Bachelor\'s in Computer Science from Harvard',
  'Master\'s in English Literature from Oxford',
  'Bachelor\'s in Economics from LSE',
  'Ph.D. in Chemistry from UC Berkeley',
  'Master\'s in History from Cambridge',
  'Bachelor\'s in Psychology from Yale',
  'Master\'s in Electrical Engineering from Georgia Tech',
  'Bachelor\'s in Business Administration from Wharton'
];

// Generate random users
const seedDatabase = async () => {
  try {
    // Clear existing data - be careful with this in production!
    await mongoose.connection.dropDatabase();
    console.log('Cleared existing database');

    const hashedPassword = await hashPassword('password123'); // Same password for all test users

    // Create students
    const students = [];
    for (let i = 1; i <= 10; i++) {
      const learningGoalsCount = getRandomInt(1, 3);
      const preferredSubjectsCount = getRandomInt(1, 5);
      
      const student = new Student({
        name: `Student ${i}`,
        email: `student${i}@example.com`,
        password: hashedPassword,
        role: 'student',
        country: getRandomItem(countries),
        bio: `I am a student looking for help with various subjects. I'm particularly interested in ${getRandomItem(subjects)} and ${getRandomItem(subjects)}.`,
        learningGoals: getRandomItems(learningGoals, learningGoalsCount),
        preferredSubjects: getRandomItems(subjects, preferredSubjectsCount)
      });
      
      await student.save();
      students.push(student);
    }
    console.log(`Created ${students.length} students`);

    // Create tutors
    const tutors = [];
    for (let i = 1; i <= 5; i++) {
      const expertiseCount = getRandomInt(1, 3);
      const availabilityCount = getRandomInt(2, 5);
      
      // Generate random availability slots
      const availability = [];
      const usedDayTimes = new Set();
      
      for (let j = 0; j < availabilityCount; j++) {
        const day = getRandomItem(days);
        const timeSlot = getRandomItem(timeSlots);
        const slotKey = `${day}-${timeSlot.startTime}`;
        
        if (!usedDayTimes.has(slotKey)) {
          availability.push({
            day,
            startTime: timeSlot.startTime,
            endTime: timeSlot.endTime
          });
          usedDayTimes.add(slotKey);
        }
      }
      
      const tutor = new Tutor({
        name: `Tutor ${i}`,
        email: `tutor${i}@example.com`,
        password: hashedPassword,
        role: 'tutor',
        country: getRandomItem(countries),
        bio: `Experienced tutor specializing in ${getRandomItem(subjects)}. I have been teaching for ${getRandomInt(1, 15)} years and love helping students achieve their goals.`,
        expertise: getRandomItems(subjects, expertiseCount),
        availability,
        hourlyRate: getRandomInt(20, 100),
        education: getRandomItem(educationBackgrounds),
        experience: getRandomInt(1, 15)
      });
      
      await tutor.save();
      tutors.push(tutor);
    }
    console.log(`Created ${tutors.length} tutors`);

    // Create admins
    const admins = [];
    for (let i = 1; i <= 2; i++) {
      const admin = new Admin({
        name: `Admin ${i}`,
        email: `admin${i}@example.com`,
        password: hashedPassword,
        role: 'admin',
        country: getRandomItem(countries),
        bio: 'Platform administrator',
        permissions: ['user_management', 'content_moderation', 'platform_analytics', 'full_access'],
        adminLevel: i === 1 ? 'super' : 'junior'
      });
      
      await admin.save();
      admins.push(admin);
    }
    console.log(`Created ${admins.length} admins`);

    console.log('\nDatabase seeding completed successfully!');
    console.log(`Total users created: ${students.length + tutors.length + admins.length}`);
    console.log('\nYou can use these credentials to login:');
    console.log('Student: student1@example.com / password123');
    console.log('Tutor: tutor1@example.com / password123');
    console.log('Admin: admin1@example.com / password123');
    
    // Create some relationships between students and tutors (this would be done via sessions/enrollments in a real app)
    console.log('\nTest data is ready for the Learn Bridge application!');
    
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
};

seedDatabase();