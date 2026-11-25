# BAC 2027 — Free Mathematics Educational Platform

## 1. Project overview

Build a complete, modern, premium educational platform dedicated exclusively to mathematics courses for Algerian Baccalaureate 2027 students.

Reference platform:
https://prof-issam-math-zoom.pages.dev/

The platform must be completely free for students but remain private and accessible only through accounts created by the administrator.

Students cannot register themselves.

The platform must allow students to attend live Zoom classes, watch recorded mathematics courses, access educational documents, solve exercises and prepare for their Baccalaureate examination without leaving the website.

Do not implement payments, subscriptions, pricing plans, invoices or financial management features.

## 2. Academic specialities

Support exactly six academic specialities:

- Sciences expérimentales — علوم تجريبية
- Mathématiques — رياضيات
- Technique mathématique — تقني رياضي
- Gestion et économie — تسيير واقتصاد
- Lettres et philosophie — آداب وفلسفة
- Langues étrangères — لغات أجنبية

Mathematics is the only subject.

Each speciality must have its own curriculum, chapters, lessons, live classes, exercises and educational resources.

Allow the administrator to assign the same educational content to multiple specialities without duplicating files.

## 3. User roles

Implement two user roles.

**Administrator**

- Create and manage student accounts.
- Assign students to academic specialities.
- Activate, suspend or archive accounts.
- Reset student passwords.
- Manage chapters and lessons.
- Schedule live Zoom classes.
- Upload recorded videos.
- Publish educational resources.
- Manage exercises and examinations.
- Send notifications.
- Monitor student attendance and learning progress.
- Manage platform settings.

**Student**

- Log in using administrator-provided credentials.
- Access mathematics courses for their speciality.
- Attend live Zoom classes.
- Watch recorded courses.
- Access PDF documents.
- Complete exercises and examinations.
- Track learning progress.
- Receive notifications.
- Customize platform appearance.

## 4. Authentication and student registration

Implement a closed authentication system.

There must be no public registration page or sign-up functionality.

Only the administrator can create student accounts.

The student creation form must contain:

- First name.
- Last name.
- Unique username.
- Phone number (optional).
- Email address (optional).
- Academic speciality.
- Temporary password.
- Account status.
- Internal administrative notes (optional).

Automatically generate a secure temporary password when requested.

Require students to change their temporary password during their first login.

Account statuses:

- Active.
- Suspended.
- Archived.

Students with active accounts can access all published content assigned to their speciality for free.

Do not implement subscription expiration dates.

Implement secure password hashing, session management, password resets, role-based authorization and login rate limiting.

## 5. Public landing page

Create a premium public landing page containing:

- Hero section.
- Teacher introduction.
- BAC 2027 branding.
- Platform presentation.
- Six academic specialities.
- Educational features.
- Live course presentation.
- Recorded course presentation.
- Frequently asked questions.
- Contact information.
- WhatsApp contact button.
- Student login button.

Do not include pricing cards, payment buttons or registration forms.

Display a message explaining that students must contact the teacher to obtain their login credentials.

Arabic call-to-action labels:

- تسجيل الدخول
- تواصل مع الأستاذ
- اكتشف المنصة
- احصل على حسابك

## 6. Student dashboard

Create a personalized Arabic RTL student dashboard.

Display:

- Student name.
- Academic speciality.
- Motivational welcome message.
- BAC examination countdown.
- Upcoming live classes.
- Recently published lessons.
- Continue watching section.
- Learning progress.
- Latest announcements.
- Quick access to exercises and documents.

Student navigation:

- الرئيسية
- الحصص المباشرة
- الدروس المسجلة
- البرنامج الدراسي
- التمارين
- الاختبارات
- مواضيع البكالوريا
- الملفات
- جدول الحصص
- الإشعارات
- الإعدادات
- تسجيل الخروج

## 7. Integrated live Zoom classes

Integrate Zoom Meeting SDK directly into the platform using Component View.

Students must be able to attend live classes inside the website on supported devices and browsers without being redirected to the Zoom application.

The administrator must be able to:

- Create and schedule Zoom meetings.
- Define class titles and descriptions.
- Select one or multiple specialities.
- Configure dates, times and durations.
- Enable cloud recording when supported.
- Start, cancel or reschedule classes.
- Monitor attendance.

The classroom must support available Zoom functionality, including:

- Teacher video.
- Screen sharing.
- Audio.
- Camera controls.
- Microphone controls.
- Live chat.
- Fullscreen mode.

Live session statuses:

- Scheduled.
- Live.
- Completed.
- Cancelled.

Generate meeting authorization credentials securely on the backend.

Only active students assigned to an authorized speciality may join a session.

## 8. Recorded video courses

Use Cloudflare Stream for private video hosting.

Do not use YouTube.

All recorded courses must play directly inside the platform.

Create a professional course player containing:

- Responsive video player.
- Chapter navigation sidebar.
- Lesson title and description.
- Attached PDF resources.
- Previous and next lesson buttons.
- Lesson completion indicator.

Video player functionality:

- Play and pause.
- Volume control.
- Fullscreen mode.
- Playback speed.
- Adaptive video quality.
- Resume from last watched position.
- Automatic progress saving.
- Secure signed playback URLs.

Only authorized students can access private videos.

## 9. Automatic Zoom recording import

Implement an optional automatic recording workflow.

When a Zoom cloud recording is completed:

1. Receive the Zoom webhook.
2. Verify webhook authenticity.
3. Retrieve the authorized recording.
4. Transfer it to Cloudflare Stream.
5. Wait for video processing.
6. Create a draft recorded lesson.
7. Allow the administrator to review and publish it.
8. Notify students from the selected specialities.

Handle failed transfers and duplicate webhook events.

Clearly inform participants when a live class is being recorded.

## 10. Mathematics curriculum

Organize content using the following hierarchy:

Speciality → Chapter → Lesson → Educational Resources

Each chapter may contain:

- Recorded lessons.
- Live class recordings.
- PDF lessons.
- Course summaries.
- Exercises.
- Detailed corrections.
- Quizzes.
- Practice examinations.
- Previous BAC examinations.

Allow the administrator to create, edit, reorder, publish and unpublish chapters and lessons.

Allow content sharing across multiple specialities.

Do not assume that every speciality has the same mathematics curriculum.

## 11. Exercises and examinations

Create a dedicated mathematics exercise section.

Support:

- PDF exercise sheets.
- Detailed solutions.
- Multiple-choice questions.
- Practice examinations.
- Previous BAC examinations.
- Automatic correction for supported questions.
- Student examination results.

Use KaTeX or MathJax to render mathematical equations.

Include an integrated PDF viewer so students can read documents without leaving the platform.

## 12. Administration dashboard

Create a complete centralized administration dashboard.

**Overview**

Display:

- Total registered students.
- Active students.
- Suspended students.
- Students by speciality.
- Upcoming live classes.
- Completed live classes.
- Published lessons.
- Total recorded videos.
- Attendance statistics.
- Learning progress statistics.
- Recent activity.

**Student management**

Provide a searchable and filterable student table.

Support:

- Create student.
- Edit student.
- View student profile.
- Assign or change speciality.
- Activate account.
- Suspend account.
- Archive account.
- Reset password.
- View learning progress.
- View attendance.
- Import students from CSV.
- Export student records.

**Speciality management**

Manage the six academic specialities, associated students and curriculum.

**Course management**

Manage chapters, lessons, recorded videos and educational resources.

**Live class management**

Create, schedule and manage Zoom sessions using calendar and list views.

**Video management**

Upload videos, assign specialities, monitor processing status, edit video information and publish recordings.

**Exercise management**

Create exercises, quizzes, examinations and corrections.

**Notification management**

Send notifications to all students, selected specialities or individual students.

**Platform settings**

Manage teacher information, branding, academic year, contact details and appearance.

Do not include financial dashboards, payment management or subscription management.

## 13. Notifications

Implement in-app notifications for:

- Upcoming live classes.
- Newly published lessons.
- New recorded courses.
- New exercises.
- New educational documents.
- Class cancellations.
- Class rescheduling.
- Teacher announcements.

Include read and unread states and notification counters.

## 14. responsiveness



Optimize the platform for desktop, tablet and mobile devices.

## 15. Database architecture

Use PostgreSQL with Prisma ORM.

Create the following database entities:

- User
- StudentProfile
- Speciality
- Chapter
- ChapterSpeciality
- Lesson
- LessonSpeciality
- CurriculumItem
- Video
- LiveSession
- LiveSessionSpeciality
- Resource
- ResourceSpeciality
- Exercise
- Exam
- Question
- ExamAttempt
- Attendance
- LessonProgress
- Notification
- NotificationRecipient
- UserPreference
- AuditLog
- PlatformSettings

Do not create Subscription, Payment, Invoice or PricingPlan entities.

Implement proper relationships, foreign keys, indexes, validation and timestamps.

Seed the database with the six academic specialities.

Provide a secure initial administrator setup process.

## 16. Technology stack

Use:

- Next.js with App Router.
- TypeScript.
- Tailwind CSS.
- Shadcn/UI.
- Framer Motion.
- PostgreSQL hosted on Neon.
- Prisma ORM.
- Auth.js.
- Zoom Meeting SDK.
- Zoom REST API.
- Zoom Webhooks.
- Cloudflare Stream for private videos.
- Cloudflare R2 for educational documents.
- KaTeX for mathematical notation.
- React Hook Form.
- Zod.
- Recharts for analytics.

Use a clean, modular and maintainable project architecture.

## 17. Security and privacy

Implement strict server-side access control.

Students must never access:

- Administrator routes.
- Other students' personal information.
- Unauthorized speciality content.
- Unpublished educational content.
- Permanent private video URLs.
- Server API credentials.

Implement secure cookies, password hashing, input validation, rate limiting, signed video URLs, protected document downloads, webhook verification and administrator activity logs.

Collect only necessary student personal information.

## 18. Development requirements

Build a complete functional application, not a static UI prototype.

Implement all frontend pages, backend functionality, database operations, authentication, authorization, file uploads and external integrations.

Every button, form, search field, filter and management action must work.

Provide:

- Complete source code.
- README documentation.
- Environment variable example file.
- Database migrations.
- Database seed script.
- Administrator setup guide.
- Zoom configuration guide.
- Cloudflare configuration guide.
- Deployment instructions.
- Automated tests for critical authentication and authorization workflows.

If external API credentials are unavailable, implement clearly labeled development adapters and document the real integration setup.

Keep the architecture extensible so a payment or subscription module can be added in a future version, but do not implement it now.

The final result must be a premium, private and completely free mathematics learning platform for BAC 2027 students, supporting six academic specialities, administrator-controlled accounts, integrated live Zoom classes and private recorded courses.