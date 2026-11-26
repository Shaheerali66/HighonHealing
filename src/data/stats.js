import { getPsychologists } from '../services/db';

export const stats = {
  happyStudents: '18+',
  get counselors() {
    try {
      return String(getPsychologists(true).length);
    } catch (e) {
      return '6';
    }
  },
  satisfaction: '94%',
};
