import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { addDays, setHours, setMinutes, parseISO } from 'date-fns';

export async function GET(req) {
  try {
    // 1. Authentifier le CRON
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Récupérer les Settings et Closed Dates
    const { data: settingsRow } = await supabaseAdmin
      .from('course_types')
      .select('description')
      .eq('name', '__SETTINGS__')
      .single();

    let closedDates = [];
    if (settingsRow && settingsRow.description) {
      try {
        const parsed = JSON.parse(settingsRow.description);
        if (parsed.closedDates) closedDates = parsed.closedDates;
      } catch (e) {}
    }

    // 3. Récupérer les types de cours
    const { data: courses } = await supabaseAdmin
      .from('course_types')
      .select('*')
      .neq('name', '__SETTINGS__');

    const courseMerJeu = courses.find(c => c.name.includes('Mer-Jeu'));
    const courseVenDim = courses.find(c => c.name.includes('Ven-Dim'));
    const courseNav = courses.find(c => c.name.includes('surveillée') || c.name.includes('Surveillée'));

    if (!courseMerJeu || !courseVenDim) {
      return NextResponse.json({ error: 'Course types not found' }, { status: 400 });
    }

    // 4. Générer les 30 prochains jours
    const today = new Date();
    const sessionsToInsert = [];
    const slotHours = [9, 11, 13, 15, 17]; // 5 créneaux de 2h : 9-11, 11-13, 13-15, 15-17, 17-19

    for (let i = 0; i < 30; i++) {
      const currentDate = addDays(today, i);
      const dayOfWeek = currentDate.getDay(); // 0=Dim, 1=Lun, 2=Mar, 3=Mer, 4=Jeu, 5=Ven, 6=Sam

      // Exclure Lundi (1) et Mardi (2)
      if (dayOfWeek === 1 || dayOfWeek === 2) continue;

      // Déterminer quels cours on donne ce jour-là
      const coursesForDay = [];
      if (dayOfWeek === 3 || dayOfWeek === 4) {
        coursesForDay.push(courseMerJeu);
      } else {
        coursesForDay.push(courseVenDim);
      }
      if (courseNav) coursesForDay.push(courseNav);

      const dateString = currentDate.toISOString().split('T')[0];

      // Filtrer les Fermetures Exceptionnelles pour ce jour
      const closuresForDay = closedDates.filter(c => c.date === dateString);

      // Générer les créneaux pour ce jour
      for (const hour of slotHours) {
        const startTime = setMinutes(setHours(currentDate, hour), 0);
        const endTime = setMinutes(setHours(currentDate, hour + 2), 0);

        // Vérifier si le créneau est bloqué par une fermeture exceptionnelle
        let isBlocked = false;
        for (const closure of closuresForDay) {
          if (closure.time_type === 'full_day') {
            isBlocked = true;
          } else {
            const blockStart = parseISO(`${dateString}T${closure.start_time}:00`);
            const blockEnd = parseISO(`${dateString}T${closure.end_time}:00`);
            // Si le cours commence pendant le blocage ou finit pendant le blocage
            if ((startTime >= blockStart && startTime < blockEnd) || 
                (endTime > blockStart && endTime <= blockEnd)) {
              isBlocked = true;
            }
          }
        }

        if (isBlocked) continue; // On passe au créneau suivant sans le générer

        for (const course of coursesForDay) {
          sessionsToInsert.push({
            course_type_id: course.id,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            status: 'scheduled'
          });
        }
      }
    }

    // 5. Insérer uniquement ceux qui n'existent pas déjà
    let insertedCount = 0;
    for (const session of sessionsToInsert) {
      // Check if exists
      const { data: existing } = await supabaseAdmin
        .from('sessions')
        .select('id')
        .eq('course_type_id', session.course_type_id)
        .eq('start_time', session.start_time)
        .maybeSingle();

      if (!existing) {
        const { error } = await supabaseAdmin
          .from('sessions')
          .insert([{
            id: crypto.randomUUID(),
            ...session
          }]);
        if (!error) insertedCount++;
      }
    }

    return NextResponse.json({ message: 'Success', inserted: insertedCount }, { status: 200 });

  } catch (error) {
    console.error('CRON Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
