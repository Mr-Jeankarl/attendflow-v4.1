// src/firebase/demoData.js
// Données de démonstration pour AttendFlow mode démo

const today = new Date();
const formatDate = (d) => d.toISOString().split('T')[0];
const daysAgo = (n) => { const d = new Date(today); d.setDate(d.getDate() - n); return d; };

// Membres de démonstration
export const DEMO_MEMBERS = {
  'm1': { id: 'm1', name: 'Adja Konaté', pupitre: 'Soprano', phone: '70 11 22 33', email: 'adja@demo.bf', birthday: '15/03', createdAt: '2024-01-10T10:00:00Z' },
  'm2': { id: 'm2', name: 'Mamadou Traoré', pupitre: 'Ténor', phone: '76 98 76 54', email: 'mamadou@demo.bf', birthday: '22/07', createdAt: '2024-01-10T10:00:00Z' },
  'm3': { id: 'm3', name: 'Fatimata Sawadogo', pupitre: 'Alto', phone: '65 11 22 33', email: 'fatimata@demo.bf', birthday: '08/11', createdAt: '2024-01-15T10:00:00Z' },
  'm4': { id: 'm4', name: 'Issouf Ouédraogo', pupitre: 'Basse', phone: '74 55 66 77', email: 'issouf@demo.bf', birthday: '30/05', createdAt: '2024-02-01T10:00:00Z' },
  'm5': { id: 'm5', name: 'Aminata Compaoré', pupitre: 'Soprano', phone: '70 44 33 22', email: 'aminata@demo.bf', birthday: '12/01', createdAt: '2024-02-10T10:00:00Z' },
  'm6': { id: 'm6', name: 'Lamine Coulibaly', pupitre: 'Ténor', phone: '76 66 55 44', email: 'lamine@demo.bf', birthday: '25/09', createdAt: '2024-02-15T10:00:00Z' },
  'm7': { id: 'm7', name: 'Salimata Diallo', pupitre: 'Alto', phone: '65 77 88 99', email: 'salimata@demo.bf', birthday: '03/12', createdAt: '2024-03-01T10:00:00Z' },
  'm8': { id: 'm8', name: 'Boureima Zongo', pupitre: 'Basse', phone: '74 22 11 00', email: 'boureima@demo.bf', birthday: '17/06', createdAt: '2024-03-05T10:00:00Z' },
  'm9': { id: 'm9', name: 'Raïssa Tapsoba', pupitre: 'Soprano', phone: '70 33 44 55', email: 'raissa@demo.bf', birthday: '20/04', createdAt: '2024-03-10T10:00:00Z' },
  'm10': { id: 'm10', name: 'Abdoulaye Sanogo', pupitre: 'Instrumentistes', phone: '76 88 77 66', email: 'abdoulaye@demo.bf', birthday: '14/08', createdAt: '2024-03-15T10:00:00Z' },
  'm11': { id: 'm11', name: 'Mariam Ouattara', pupitre: 'Alto', phone: '65 99 00 11', email: 'mariam@demo.bf', birthday: '28/02', createdAt: '2024-04-01T10:00:00Z' },
  'm12': { id: 'm12', name: 'Karl Méda', pupitre: 'Maître de chœur', phone: '70 00 99 88', email: 'karl@demo.bf', birthday: '07/10', createdAt: '2024-01-05T10:00:00Z' },
};

// Sessions de démonstration
export const DEMO_SESSIONS = {
  's1': {
    id: 's1',
    activityName: 'Répétition générale',
    date: formatDate(daysAgo(28)),
    startTime: '19:00',
    endTime: '21:30',
    location: 'Salle paroissiale Saint-Michel',
    createdBy: 'demo_user',
    createdByName: 'Utilisateur Démo',
    createdAt: daysAgo(28).toISOString(),
    attendances: { m1: 'present', m2: 'present', m3: 'present', m4: 'justified', m5: 'present', m6: 'present', m7: 'unjustified', m8: 'present', m9: 'present', m10: 'present', m11: 'present', m12: 'present' },
    comments: { m4: 'Voyage professionnel', m7: 'Non prévenu' },
    punctuality: { m1: 'on_time', m2: 'late', m3: 'on_time', m5: 'on_time', m6: 'on_time', m8: 'on_time', m9: 'late', m10: 'on_time', m11: 'on_time', m12: 'on_time' }
  },
  's2': {
    id: 's2',
    activityName: 'Répétition par pupitre',
    date: formatDate(daysAgo(21)),
    startTime: '18:30',
    endTime: '20:00',
    location: 'Église Sainte-Marie',
    createdBy: 'demo_user',
    createdByName: 'Utilisateur Démo',
    createdAt: daysAgo(21).toISOString(),
    attendances: { m1: 'present', m2: 'present', m3: 'justified', m4: 'present', m5: 'present', m6: 'unjustified', m7: 'present', m8: 'present', m9: 'present', m10: 'present', m11: 'justified', m12: 'present' },
    comments: { m3: 'Rendez-vous médical', m6: 'Sans nouvelles', m11: 'Maladie' },
    punctuality: { m1: 'on_time', m2: 'on_time', m4: 'on_time', m5: 'late', m7: 'on_time', m8: 'on_time', m9: 'on_time', m10: 'on_time', m12: 'on_time' }
  },
  's3': {
    id: 's3',
    activityName: 'Concert de Noël',
    date: formatDate(daysAgo(14)),
    startTime: '20:00',
    endTime: '22:00',
    location: 'Cathédrale Notre-Dame',
    createdBy: 'demo_user',
    createdByName: 'Utilisateur Démo',
    createdAt: daysAgo(14).toISOString(),
    attendances: { m1: 'present', m2: 'present', m3: 'present', m4: 'present', m5: 'present', m6: 'present', m7: 'present', m8: 'present', m9: 'present', m10: 'present', m11: 'present', m12: 'present' },
    comments: {},
    punctuality: { m1: 'on_time', m2: 'on_time', m3: 'on_time', m4: 'on_time', m5: 'on_time', m6: 'on_time', m7: 'on_time', m8: 'on_time', m9: 'on_time', m10: 'on_time', m11: 'on_time', m12: 'on_time' }
  },
  's4': {
    id: 's4',
    activityName: 'Répétition hebdomadaire',
    date: formatDate(daysAgo(7)),
    startTime: '19:00',
    endTime: '21:00',
    location: 'Salle paroissiale Saint-Michel',
    createdBy: 'demo_user',
    createdByName: 'Utilisateur Démo',
    createdAt: daysAgo(7).toISOString(),
    attendances: { m1: 'present', m2: 'justified', m3: 'present', m4: 'present', m5: 'unjustified', m6: 'present', m7: 'present', m8: 'justified', m9: 'present', m10: 'present', m11: 'present', m12: 'present' },
    comments: { m2: 'Garde d\'enfant', m5: 'Non prévenu', m8: 'Déplacement' },
    punctuality: { m1: 'on_time', m3: 'on_time', m4: 'late', m6: 'on_time', m7: 'on_time', m9: 'on_time', m10: 'on_time', m11: 'late', m12: 'on_time' }
  }
};

// Répertoire de démonstration
export const DEMO_REPERTOIRE = {
  'r1': { id: 'r1', title: 'Ave Maria', composer: 'Franz Schubert', pupitres: ['Soprano', 'Alto', 'Ténor', 'Basse'], category: 'Classique', notes: 'À travailler pour le concert de Pâques', createdAt: '2024-01-20T10:00:00Z' },
  'r2': { id: 'r2', title: 'Hallelujah', composer: 'Leonard Cohen', pupitres: ['Soprano', 'Alto', 'Ténor', 'Basse'], category: 'Contemporain', notes: 'Arrangement à 4 voix', createdAt: '2024-02-05T10:00:00Z' },
  'r3': { id: 'r3', title: 'O Magnum Mysterium', composer: 'Tomás Luis de Victoria', pupitres: ['Soprano', 'Alto', 'Ténor', 'Basse'], category: 'Classique', notes: 'Renaissance - Concert de Noël', createdAt: '2024-02-15T10:00:00Z' },
  'r4': { id: 'r4', title: 'Cantique de Jean Racine', composer: 'Gabriel Fauré', pupitres: ['Soprano', 'Alto', 'Ténor', 'Basse', 'Instrumentistes'], category: 'Classique', notes: 'Accompagnement piano', createdAt: '2024-03-01T10:00:00Z' },
  'r5': { id: 'r5', title: 'Total Praise', composer: 'Richard Smallwood', pupitres: ['Soprano', 'Alto', 'Ténor', 'Basse'], category: 'Gospel', notes: 'Gospel - énergie et joie !', createdAt: '2024-03-20T10:00:00Z' },
};

// Organisation de démonstration complète
export const DEMO_ORGANIZATION = {
  info: {
    name: 'Grand Chœur Polyphonique de Bobo-Dioulasso',
    createdAt: '2024-01-01T10:00:00Z',
    createdBy: 'demo_user'
  },
  admins: {
    'demo_user': { role: 'owner', addedAt: '2024-01-01T10:00:00Z' }
  },
  members: DEMO_MEMBERS,
  sessions: DEMO_SESSIONS,
  repertoire: DEMO_REPERTOIRE
};

// Utilisateur de démonstration
export const DEMO_USER = {
  uid: 'demo_user',
  displayName: 'karl',
  email: 'karl@attendflow.local',
  photoURL: null
};
