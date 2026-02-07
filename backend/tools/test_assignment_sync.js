const fetch = require('node-fetch');

(async () => {
  try {
    const body = {
      facultyId: '13001',
      title: 'Test Assignment Sync',
      description: 'Sync test',
      subject: 'Software Engineering',
      year: '3',
      section: '13',
      branch: 'CSE',
      dueDate: '2026-03-01T00:00:00.000Z'
    };

    const post = await fetch('http://127.0.0.1:5000/api/teaching-assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const postText = await post.text();
    console.log('POST status:', post.status);
    console.log('POST body:', postText);

    const teaching = await fetch('http://127.0.0.1:5000/api/faculty/teaching?year=3&section=13&branch=CSE');
    console.log('\nTEACHING status:', teaching.status);
    console.log('TEACHING body:', await teaching.text());

    const fac = await fetch('http://127.0.0.1:5000/api/faculty/13001');
    console.log('\nFACULTY status:', fac.status);
    console.log('FACULTY body:', await fac.text());
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
})();
