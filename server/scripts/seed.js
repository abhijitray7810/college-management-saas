#!/usr/bin/env node

/**
 * College Management SaaS - Complete Seed Script
 * 
 * Creates realistic demo data for the institutional structure:
 * - 1 SUPER_ADMIN
 * - 2 HODs (ADMIN role)
 * - 8-10 teachers
 * - 40-60 students
 * - 1 building with 3 floors, rooms
 * - CSE and ECE departments
 * - 4 batches per department (years 1-4)
 * - 2 sections per batch (A, B)
 * - Subjects assigned to batches
 * - Teachers assigned to subjects
 * - Time slots
 * - Teacher availability
 */

import { db } from '../src/db/index.js';
import * as schema from '../src/db/schema/index.js';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

const SALT_ROUNDS = 10;

// Helper to hash passwords
async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// Helper to generate random availability
function generateAvailability(teacherId, timeSlots) {
  const availability = [];
  
  // Group time slots by day
  const slotsByDay = {};
  for (const slot of timeSlots) {
    if (!slotsByDay[slot.day]) {
      slotsByDay[slot.day] = [];
    }
    slotsByDay[slot.day].push(slot);
  }
  
  const days = Object.keys(slotsByDay);
  // Most teachers available 4-5 days
  const availableDays = days.slice(0, 4 + Math.floor(Math.random() * 2));
  
  for (const day of availableDays) {
    const daySlots = slotsByDay[day];
    // Pick 4-6 consecutive slots
    const numSlots = 4 + Math.floor(Math.random() * 3);
    const startIdx = Math.floor(Math.random() * Math.max(1, daySlots.length - numSlots + 1));
    
    for (let i = startIdx; i < Math.min(startIdx + numSlots, daySlots.length); i++) {
      availability.push({
        teacherId,
        timeSlotId: daySlots[i].id,
        status: 'AVAILABLE',
      });
    }
  }
  
  return availability;
}

async function seed() {
  console.log('🌱 Starting seed process...\n');
  
  try {
    // Use transaction for atomic operations
    await db.transaction(async (tx) => {
      
      // ============================================
      // 1. CREATE USERS
      // ============================================
      console.log('👤 Creating users...');
      
      const usersData = [
        // SUPER_ADMIN
        { name: 'Super Admin', email: 'superadmin@college.edu', password: 'SuperAdmin@123', role: 'SUPER_ADMIN' },
        // HODs
        { name: 'Dr. Rajesh Kumar', email: 'hod.cse@college.edu', password: 'HodCse@123', role: 'ADMIN' },
        { name: 'Dr. Priya Sharma', email: 'hod.ece@college.edu', password: 'HodEce@123', role: 'ADMIN' },
        // Teachers (CSE Department)
        { name: 'Prof. Amit Singh', email: 'amit.singh@college.edu', password: 'Teacher@123', role: 'TEACHER' },
        { name: 'Prof. Sunita Gupta', email: 'sunita.gupta@college.edu', password: 'Teacher@123', role: 'TEACHER' },
        { name: 'Prof. Vikram Patel', email: 'vikram.patel@college.edu', password: 'Teacher@123', role: 'TEACHER' },
        { name: 'Prof. Neha Reddy', email: 'neha.reddy@college.edu', password: 'Teacher@123', role: 'TEACHER' },
        { name: 'Prof. Arun Kumar', email: 'arun.kumar@college.edu', password: 'Teacher@123', role: 'TEACHER' },
        // Teachers (ECE Department)
        { name: 'Prof. Meera Iyer', email: 'meera.iyer@college.edu', password: 'Teacher@123', role: 'TEACHER' },
        { name: 'Prof. Suresh Menon', email: 'suresh.menon@college.edu', password: 'Teacher@123', role: 'TEACHER' },
        { name: 'Prof. Deepika Shah', email: 'deepika.shah@college.edu', password: 'Teacher@123', role: 'TEACHER' },
        { name: 'Prof. Ravi Nair', email: 'ravi.nair@college.edu', password: 'Teacher@123', role: 'TEACHER' },
      ];

      const createdUsers = [];
      for (const userData of usersData) {
        const [user] = await tx.insert(schema.users).values({
          name: userData.name,
          email: userData.email,
          passwordHash: await hashPassword(userData.password),
          role: userData.role,
        }).returning();
        createdUsers.push({ ...user, originalRole: userData.role });
        console.log(`  ✓ ${userData.role}: ${userData.name} (${userData.email})`);
      }

      const superAdmin = createdUsers.find(u => u.originalRole === 'SUPER_ADMIN');
      const hodCse = createdUsers.find(u => u.email === 'hod.cse@college.edu');
      const hodEce = createdUsers.find(u => u.email === 'hod.ece@college.edu');
      const teachers = createdUsers.filter(u => u.originalRole === 'TEACHER');

      // ============================================
      // 2. CREATE DEPARTMENTS
      // ============================================
      console.log('\n🏛️ Creating departments...');
      
      const [cseDept] = await tx.insert(schema.departments).values({
        code: 'CSE',
        name: 'Computer Science and Engineering',
        description: 'Department of Computer Science and Engineering',
        hodId: hodCse.id,
      }).returning();
      
      const [eceDept] = await tx.insert(schema.departments).values({
        code: 'ECE',
        name: 'Electronics and Communication Engineering',
        description: 'Department of Electronics and Communication Engineering',
        hodId: hodEce.id,
      }).returning();
      
      console.log(`  ✓ CSE (HOD: ${hodCse.name})`);
      console.log(`  ✓ ECE (HOD: ${hodEce.name})`);

      // ============================================
      // 3. CREATE INFRASTRUCTURE (Building → Floors)
      // ============================================
      console.log('\n🏢 Creating infrastructure...');
      
      const [mainBuilding] = await tx.insert(schema.buildings).values({
        name: 'Academic Block A',
        code: 'BLD-A',
        address: 'Main Campus, College Road',
        description: 'Primary academic building housing CSE and ECE departments',
        isActive: 'true',
      }).returning();
      
      console.log(`  ✓ Building: ${mainBuilding.name}`);

      // Create 3 floors
      const floorsData = [
        { buildingId: mainBuilding.id, floorNumber: 0, name: 'Ground Floor', departmentId: null },
        { buildingId: mainBuilding.id, floorNumber: 1, name: 'First Floor', departmentId: cseDept.id },
        { buildingId: mainBuilding.id, floorNumber: 2, name: 'Second Floor', departmentId: eceDept.id },
      ];

      const createdFloors = [];
      for (const floorData of floorsData) {
        const [floor] = await tx.insert(schema.floors).values(floorData).returning();
        createdFloors.push(floor);
        console.log(`  ✓ Floor ${floor.floorNumber}: ${floor.name}`);
      }

      // ============================================
      // 4. CREATE ROOMS
      // ============================================
      console.log('\n🚪 Creating rooms...');
      
      const roomTypes = ['CLASSROOM', 'CLASSROOM', 'CLASSROOM', 'CLASSROOM', 'CLASSROOM', 'LAB', 'LAB'];
      const createdRooms = [];
      
      for (const floor of createdFloors) {
        for (let i = 0; i < roomTypes.length; i++) {
          const roomType = roomTypes[i];
          const roomCode = `${floor.floorNumber}${String(i + 1).padStart(2, '0')}`;
          const [room] = await tx.insert(schema.rooms).values({
            floorId: floor.id,
            code: roomCode,
            name: roomType === 'LAB' ? `Lab ${roomCode}` : `Room ${roomCode}`,
            type: roomType,
            capacity: roomType === 'LAB' ? 30 : 60,
            hasProjector: true,
            hasAc: floor.floorNumber > 0,
            isActive: true,
          }).returning();
          createdRooms.push(room);
        }
      }
      
      console.log(`  ✓ Created ${createdRooms.length} rooms (${createdRooms.filter(r => r.type === 'CLASSROOM').length} classrooms, ${createdRooms.filter(r => r.type === 'LAB').length} labs)`);

      // ============================================
      // 5. CREATE TEACHER PROFILES
      // ============================================
      console.log('\n👨‍🏫 Creating teacher profiles...');
      
      const cseTeachers = teachers.slice(0, 5);
      const eceTeachers = teachers.slice(5, 10);
      const designations = ['Assistant Professor', 'Associate Professor', 'Professor'];
      const specializations = {
        cse: ['AI/ML', 'Data Science', 'Cybersecurity', 'Web Development', 'Database Systems'],
        ece: ['VLSI Design', 'Signal Processing', 'Embedded Systems', 'Communication', 'IoT'],
      };

      const createdTeachers = [];
      
      for (let i = 0; i < cseTeachers.length; i++) {
        const [teacher] = await tx.insert(schema.teachers).values({
          userId: cseTeachers[i].id,
          departmentId: cseDept.id,
          employeeId: `CSE${String(i + 1).padStart(3, '0')}`,
          designation: designations[Math.floor(Math.random() * designations.length)],
          specialization: specializations.cse[i],
          qualification: 'Ph.D. in Computer Science',
          experienceYears: 2 + Math.floor(Math.random() * 15),
          joinDate: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), 1),
        }).returning();
        createdTeachers.push({ ...teacher, user: cseTeachers[i], dept: 'CSE' });
      }
      
      for (let i = 0; i < eceTeachers.length; i++) {
        const [teacher] = await tx.insert(schema.teachers).values({
          userId: eceTeachers[i].id,
          departmentId: eceDept.id,
          employeeId: `ECE${String(i + 1).padStart(3, '0')}`,
          designation: designations[Math.floor(Math.random() * designations.length)],
          specialization: specializations.ece[i],
          qualification: 'Ph.D. in Electronics',
          experienceYears: 2 + Math.floor(Math.random() * 15),
          joinDate: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), 1),
        }).returning();
        createdTeachers.push({ ...teacher, user: eceTeachers[i], dept: 'ECE' });
      }
      
      console.log(`  ✓ Created ${createdTeachers.length} teachers (${cseTeachers.length} CSE, ${eceTeachers.length} ECE)`);

      // ============================================
      // 6. CREATE BATCHES (4 per department)
      // ============================================
      console.log('\n📚 Creating batches...');
      
      const currentYear = new Date().getFullYear();
      const academicYear = `${currentYear}-${currentYear + 1}`;
      const createdBatches = [];
      
      for (const dept of [cseDept, eceDept]) {
        for (let year = 1; year <= 4; year++) {
          const [batch] = await tx.insert(schema.batches).values({
            departmentId: dept.id,
            year,
            academicYear,
            name: `${dept.code} ${year}${ordinalSuffix(year)} Year (${academicYear})`,
            description: `${year}${ordinalSuffix(year)} Year ${dept.code} Batch`,
            isActive: 'true',
          }).returning();
          createdBatches.push({ ...batch, department: dept });
          console.log(`  ✓ ${batch.name}`);
        }
      }

      // ============================================
      // 7. CREATE SECTIONS (2 per batch)
      // ============================================
      console.log('\n📋 Creating sections...');
      
      const createdSections = [];
      for (const batch of createdBatches) {
        for (const sectionName of ['A', 'B']) {
          const [section] = await tx.insert(schema.sections).values({
            batchId: batch.id,
            name: sectionName,
            capacity: 60,
            isActive: 'true',
          }).returning();
          createdSections.push({ ...section, batch });
        }
      }
      
      console.log(`  ✓ Created ${createdSections.length} sections (2 per batch)`);

      // ============================================
      // 8. CREATE STUDENTS & ASSIGN TO SECTIONS
      // ============================================
      console.log('\n🎓 Creating students...');
      
      const studentNames = [
        'Rahul Verma', 'Priya Patel', 'Amit Shah', 'Sneha Reddy', 'Vikram Rao',
        'Neha Gupta', 'Arjun Kumar', 'Divya Iyer', 'Karthik Nair', 'Ananya Menon',
        'Rohan Sharma', 'Kavya Singh', 'Aditya Joshi', 'Meera Desai', 'Nikhil Bansal',
        'Pooja Choudhary', 'Siddharth Jain', 'Ritu Malhotra', 'Tarun Agarwal', 'Shreya Pillai',
        'Varun Khanna', 'Isha Saxena', 'Rajeshwari Bose', 'Deepak Mishra', 'Swati Ghosh',
        'Mohit Chakraborty', 'Tanvi Kapoor', 'Pranav Shetty', 'Zara Khan', 'Yash Mehta',
        'Simran Kaur', 'Harish Tiwari', 'Fatima Begum', 'Gaurav Pandey', 'Bhavna Yadav',
        'Chetan Dubey', 'Lakshmi Prasad', 'Manoj Hegde', 'Juhi Chawla', 'Dev Anand',
      ];
      
      const createdStudents = [];
      let studentIndex = 0;
      
      // Distribute students across sections (5 students per section)
      for (const section of createdSections) {
        const sectionStudents = [];
        for (let i = 0; i < 5 && studentIndex < studentNames.length; i++) {
          const name = studentNames[studentIndex++];
          const enrollment = `ENR${currentYear}${String(studentIndex).padStart(4, '0')}`;
          const roll = `${section.batch.department.code}${section.batch.year}${section.name}${String(i + 1).padStart(2, '0')}`;
          
          // Create user first
          const [user] = await tx.insert(schema.users).values({
            name,
            email: `${name.toLowerCase().replace(/\s/g, '.')}@student.college.edu`,
            passwordHash: await hashPassword('Student@123'),
            role: 'STUDENT',
          }).returning();
          
          // Create student profile
          const [student] = await tx.insert(schema.students).values({
            userId: user.id,
            rollNumber: roll,
            enrollmentNumber: enrollment,
            batchId: section.batchId,
            admissionDate: new Date(currentYear - section.batch.year + 1, 6, 1),
            guardianName: `Parent of ${name}`,
            guardianContact: `+91${9000000000 + Math.floor(Math.random() * 999999999)}`,
          }).returning();
          
          // Assign to section
          await tx.insert(schema.studentSections).values({
            studentId: student.id,
            sectionId: section.id,
            batchId: section.batchId,
            isActive: 'true',
          });
          
          createdStudents.push({ ...student, user, section });
          sectionStudents.push(name);
        }
        console.log(`  ✓ Section ${section.batch.department.code}-${section.batch.year}${section.name}: ${sectionStudents.join(', ')}`);
      }

      // ============================================
      // 9. CREATE SUBJECTS
      // ============================================
      console.log('\n📖 Creating subjects...');
      
      const cseSubjects = [
        { code: 'CS101', name: 'Programming Fundamentals', credits: 4, isLab: true, hoursPerWeek: 4 },
        { code: 'CS102', name: 'Data Structures', credits: 4, isLab: true, hoursPerWeek: 4 },
        { code: 'CS201', name: 'Database Systems', credits: 3, isLab: true, hoursPerWeek: 4 },
        { code: 'CS202', name: 'Computer Networks', credits: 3, isLab: true, hoursPerWeek: 3 },
        { code: 'CS301', name: 'Machine Learning', credits: 4, isLab: true, hoursPerWeek: 4 },
        { code: 'CS302', name: 'Web Development', credits: 3, isLab: true, hoursPerWeek: 3 },
      ];
      
      const eceSubjects = [
        { code: 'EC101', name: 'Digital Electronics', credits: 4, isLab: true, hoursPerWeek: 4 },
        { code: 'EC102', name: 'Signals and Systems', credits: 4, isLab: false, hoursPerWeek: 3 },
        { code: 'EC201', name: 'Microprocessors', credits: 3, isLab: true, hoursPerWeek: 4 },
        { code: 'EC202', name: 'Communication Systems', credits: 3, isLab: true, hoursPerWeek: 3 },
        { code: 'EC301', name: 'VLSI Design', credits: 4, isLab: true, hoursPerWeek: 4 },
        { code: 'EC302', name: 'Embedded Systems', credits: 3, isLab: true, hoursPerWeek: 3 },
      ];

      const createdSubjects = [];
      
      for (const subj of cseSubjects) {
        const [subject] = await tx.insert(schema.subjects).values({
          departmentId: cseDept.id,
          code: subj.code,
          name: subj.name,
          credits: subj.credits,
          isLab: subj.isLab,
          hoursPerWeek: subj.hoursPerWeek,
        }).returning();
        createdSubjects.push({ ...subject, dept: 'CSE' });
        console.log(`  ✓ ${subj.code}: ${subj.name} (${subj.hoursPerWeek}h/week)`);
      }
      
      for (const subj of eceSubjects) {
        const [subject] = await tx.insert(schema.subjects).values({
          departmentId: eceDept.id,
          code: subj.code,
          name: subj.name,
          credits: subj.credits,
          isLab: subj.isLab,
          hoursPerWeek: subj.hoursPerWeek,
        }).returning();
        createdSubjects.push({ ...subject, dept: 'ECE' });
        console.log(`  ✓ ${subj.code}: ${subj.name} (${subj.hoursPerWeek}h/week)`);
      }

      // ============================================
      // 10. ASSIGN SUBJECTS TO BATCHES
      // ============================================
      console.log('\n🔗 Assigning subjects to batches...');
      
      const cseBatchSubjects = [];
      const eceBatchSubjects = [];
      
      // Assign 4-5 subjects to each batch (rotate subjects across years)
      for (const batch of createdBatches.filter(b => b.department.code === 'CSE')) {
        const yearIndex = batch.year - 1;
        const subjectsForBatch = [
          createdSubjects.find(s => s.code === 'CS101'),
          createdSubjects.find(s => s.code === 'CS102'),
          createdSubjects.find(s => s.code === 'CS201'),
          createdSubjects.find(s => s.code === 'CS202'),
          createdSubjects.find(s => s.code === 'CS301'),
        ].filter(Boolean);
        
        for (const subject of subjectsForBatch.slice(0, 4 + yearIndex % 2)) {
          const [assignment] = await tx.insert(schema.batchSubjects).values({
            batchId: batch.id,
            subjectId: subject.id,
            hoursPerWeek: subject.hoursPerWeek,
            isActive: 'true',
          }).returning();
          cseBatchSubjects.push({ ...assignment, batch, subject });
        }
      }
      
      for (const batch of createdBatches.filter(b => b.department.code === 'ECE')) {
        const yearIndex = batch.year - 1;
        const subjectsForBatch = [
          createdSubjects.find(s => s.code === 'EC101'),
          createdSubjects.find(s => s.code === 'EC102'),
          createdSubjects.find(s => s.code === 'EC201'),
          createdSubjects.find(s => s.code === 'EC202'),
          createdSubjects.find(s => s.code === 'EC301'),
        ].filter(Boolean);
        
        for (const subject of subjectsForBatch.slice(0, 4 + yearIndex % 2)) {
          const [assignment] = await tx.insert(schema.batchSubjects).values({
            batchId: batch.id,
            subjectId: subject.id,
            hoursPerWeek: subject.hoursPerWeek,
            isActive: 'true',
          }).returning();
          eceBatchSubjects.push({ ...assignment, batch, subject });
        }
      }
      
      console.log(`  ✓ Assigned ${cseBatchSubjects.length + eceBatchSubjects.length} subject-batch combinations`);

      // ============================================
      // 11. ASSIGN TEACHERS TO SUBJECTS
      // ============================================
      console.log('\n👨‍🏫 Assigning teachers to subjects...');
      
      const createdTeacherSubjects = [];
      
      // CSE: Assign teachers to subjects
      const cseTeacherList = createdTeachers.filter(t => t.dept === 'CSE');
      const cseSubjectList = createdSubjects.filter(s => s.dept === 'CSE');
      
      for (let i = 0; i < cseSubjectList.length; i++) {
        const teacherIndex = i % cseTeacherList.length;
        const [assignment] = await tx.insert(schema.teacherSubjects).values({
          teacherId: cseTeacherList[teacherIndex].id,
          subjectId: cseSubjectList[i].id,
        }).returning();
        createdTeacherSubjects.push({
          ...assignment,
          teacher: cseTeacherList[teacherIndex],
          subject: cseSubjectList[i],
        });
      }
      
      // ECE: Assign teachers to subjects
      const eceTeacherList = createdTeachers.filter(t => t.dept === 'ECE');
      const eceSubjectList = createdSubjects.filter(s => s.dept === 'ECE');
      
      for (let i = 0; i < eceSubjectList.length; i++) {
        const teacherIndex = i % eceTeacherList.length;
        const [assignment] = await tx.insert(schema.teacherSubjects).values({
          teacherId: eceTeacherList[teacherIndex].id,
          subjectId: eceSubjectList[i].id,
        }).returning();
        createdTeacherSubjects.push({
          ...assignment,
          teacher: eceTeacherList[teacherIndex],
          subject: eceSubjectList[i],
        });
      }
      
      for (const ts of createdTeacherSubjects) {
        console.log(`  ✓ ${ts.teacher.user.name} → ${ts.subject.code}`);
      }

      // ============================================
      // 12. CREATE TIME SLOTS
      // ============================================
      console.log('\n⏰ Creating time slots...');
      
      const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
      const timeRanges = [
        { start: '08:00', end: '09:00', slot: 1 },
        { start: '09:00', end: '10:00', slot: 2 },
        { start: '10:00', end: '11:00', slot: 3 },
        { start: '11:00', end: '12:00', slot: 4 },
        { start: '13:00', end: '14:00', slot: 5 },
        { start: '14:00', end: '15:00', slot: 6 },
        { start: '15:00', end: '16:00', slot: 7 },
        { start: '16:00', end: '17:00', slot: 8 },
      ];

      const createdTimeSlots = [];
      for (const day of days) {
        for (const range of timeRanges) {
          const [slot] = await tx.insert(schema.timeSlots).values({
            day,
            startTime: range.start,
            endTime: range.end,
            slotNumber: range.slot,
            isActive: true,
          }).returning();
          createdTimeSlots.push(slot);
        }
      }
      
      console.log(`  ✓ Created ${createdTimeSlots.length} time slots (${days.length} days × ${timeRanges.length} slots)`);

      // ============================================
      // 13. ADD TEACHER AVAILABILITY
      // ============================================
      console.log('\n📅 Adding teacher availability...');

      let availabilityCount = 0;
      for (const teacher of createdTeachers) {
        const availability = generateAvailability(teacher.id, createdTimeSlots);
        for (const av of availability) {
          await tx.insert(schema.teacherAvailabilities).values(av);
          availabilityCount++;
        }
        console.log(`  ✓ ${teacher.user.name}: ${availability.length} availability slots`);
      }
      
      console.log(`\n🎉 SEED COMPLETED SUCCESSFULLY!`);
      console.log(`\n📊 Summary:`);
      console.log(`   • ${usersData.length} users (1 SUPER_ADMIN, 2 HODs, 10 teachers, ${studentNames.length} students)`);
      console.log(`   • 2 departments (CSE, ECE)`);
      console.log(`   • 1 building with 3 floors and ${createdRooms.length} rooms`);
      console.log(`   • ${createdBatches.length} batches (4 per department)`);
      console.log(`   • ${createdSections.length} sections (2 per batch)`);
      console.log(`   • ${createdSubjects.length} subjects`);
      console.log(`   • ${createdTeacherSubjects.length} teacher-subject assignments`);
      console.log(`   • ${createdTimeSlots.length} time slots`);
      console.log(`   • ${availabilityCount} availability entries`);
      
      console.log(`\n🔑 Login Credentials:`);
      console.log(`   • Super Admin: superadmin@college.edu / SuperAdmin@123`);
      console.log(`   • HOD CSE: hod.cse@college.edu / HodCse@123`);
      console.log(`   • HOD ECE: hod.ece@college.edu / HodEce@123`);
      console.log(`   • Teachers: <email> / Teacher@123`);
      console.log(`   • Students: <email> / Student@123`);
    });
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Seed failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Helper function for ordinal suffix
function ordinalSuffix(num) {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}

// Run seed
seed();
