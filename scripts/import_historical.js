const fs = require('fs');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const lines = fs.readFileSync('/Users/kevinmonin/the-ridery-wingclass/historical_bookings.tsv', 'utf-8').split('\n');

async function run() {
   const { data: courseTypes } = await supabaseAdmin.from('course_types').select('*');
   const defaultCourseTypeId = courseTypes.find(ct => ct.name === 'Cours (Ven-Dim)')?.id || courseTypes[0]?.id;

   let sessionsCreated = 0;
   let participationsLinked = 0;
   let customersCreated = 0;

   for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = line.split('\t');
      if (cols.length < 8) continue;

      const dateStr = cols[0];
      const nom = cols[2]?.trim();
      const prenom = cols[3]?.trim();
      let hoursStr = cols[4]?.trim();
      const address = cols[5]?.trim();
      let birthDateStr = cols[6]?.trim();
      let email = cols[7]?.trim().toLowerCase();

      if (!email || !email.includes('@')) continue;

      const dateParts = dateStr.split('/');
      if (dateParts.length !== 3) continue;
      const day = parseInt(dateParts[0]);
      const month = parseInt(dateParts[1]) - 1;
      const year = parseInt(dateParts[2].length === 2 ? '20' + dateParts[2] : dateParts[2]);

      let startH = 0, startM = 0, endH = 0, endM = 0;
      const hMatch = hoursStr.match(/(\d+)h(\d*).*?(\d+)h(\d*)/i);
      if (hMatch) {
         startH = parseInt(hMatch[1]);
         startM = hMatch[2] ? parseInt(hMatch[2]) : 0;
         endH = parseInt(hMatch[3]);
         endM = hMatch[4] ? parseInt(hMatch[4]) : 0;
      } else {
         continue;
      }

      const startTime = new Date(Date.UTC(year, month, day, startH - 2, startM)).toISOString();
      const endTime = new Date(Date.UTC(year, month, day, endH - 2, endM)).toISOString();

      let { data: customer } = await supabaseAdmin.from('customers').select('*').eq('email', email).maybeSingle();
      
      let parsedBd = null;
      if (birthDateStr && birthDateStr.includes('/')) {
         const bdParts = birthDateStr.split('/');
         if (bdParts.length === 3) {
            let bY = bdParts[2].length === 2 ? (parseInt(bdParts[2]) > 30 ? '19' : '20') + bdParts[2] : bdParts[2];
            parsedBd = `${bY}-${bdParts[1].padStart(2, '0')}-${bdParts[0].padStart(2, '0')}`;
         }
      } else if (birthDateStr && birthDateStr.includes('.')) {
         const bdParts = birthDateStr.split('.');
         if (bdParts.length === 3) {
            parsedBd = `${bdParts[2]}-${bdParts[1]}-${bdParts[0]}`;
         }
      }

      if (!customer) {
         const newCust = {
             id: crypto.randomUUID(),
             email,
             first_name: prenom || '',
             last_name: nom || '',
             address: address || '',
             birth_date: parsedBd
         };
         const { data: createdC } = await supabaseAdmin.from('customers').insert([newCust]).select().single();
         customer = createdC;
         customersCreated++;
      } else {
         let needsUpdate = false;
         const updateData = {};
         if (!customer.address && address && address !== 'x' && address !== 'X') { updateData.address = address; needsUpdate = true; }
         if (!customer.birth_date && parsedBd) { updateData.birth_date = parsedBd; needsUpdate = true; }
         if (!customer.first_name && prenom) { updateData.first_name = prenom; needsUpdate = true; }
         if (!customer.last_name && nom) { updateData.last_name = nom; needsUpdate = true; }
         if (needsUpdate) {
             await supabaseAdmin.from('customers').update(updateData).eq('id', customer.id);
         }
      }

      if (!customer) continue;

      let { data: session } = await supabaseAdmin.from('sessions')
          .select('*')
          .eq('course_type_id', defaultCourseTypeId)
          .eq('start_time', startTime)
          .maybeSingle();

      if (!session) {
         const { data: createdS } = await supabaseAdmin.from('sessions').insert([{
             id: crypto.randomUUID(),
             course_type_id: defaultCourseTypeId,
             start_time: startTime,
             end_time: endTime,
             spot_location: 'Marseille'
         }]).select().single();
         session = createdS;
         sessionsCreated++;
      }

      if (!session) continue;

      const { data: existingPart } = await supabaseAdmin.from('session_participants')
          .select('*')
          .eq('session_id', session.id)
          .eq('customer_id', customer.id)
          .maybeSingle();

      if (!existingPart) {
         await supabaseAdmin.from('session_participants').insert([{
             id: crypto.randomUUID(),
             session_id: session.id,
             customer_id: customer.id,
             status: 'booked'
         }]);
         participationsLinked++;
      }
   }

   console.log(`Historical import done! Created ${customersCreated} new customers, ${sessionsCreated} sessions, linked ${participationsLinked} participations.`);
}

run().catch(console.error);
