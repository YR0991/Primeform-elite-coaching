export const sportProfiles = [
  {
    id: 'hyrox_recreational',
    name: 'Hyrox Recreational',
    gender_neutral: true,
    energy_system: 'Hybride aeroob dominant',
    critical_limiters: [
      'algemene conditie',
      'basissterkte sled en wall ball',
      'looptempo volhouden',
      'race-dag logistiek'
    ],
    periodization_model: 'Base → Race Specifiek → Taper',
    min_prep_weeks_beginner: 12,
    min_prep_weeks_advanced: 8,
    taper_weeks: 1,
    deload_frequency_weeks: 4,
    intensity_distribution: { zone2_pct: 70, high_pct: 30 },
    volume_character: 'Moderate volume, race-specific focus',
    nutrition_strategy: {
      protein_per_kg_min: 1.8,
      protein_per_kg_max: 1.8,
      carb_character: 'balanced',
      race_day_protocol: 'standard'
    },
    weakest_link_logic: 'eerst conditie, dan stations, dan combinaties'
  },
  {
    id: 'hyrox_pro',
    name: 'Hyrox Pro',
    gender_neutral: true,
    energy_system: 'Hybride aeroob en anaeroob',
    critical_limiters: [
      'functionele kracht onder vermoeidheid',
      'loopeconomie Roxzone',
      'CZS-herstel',
      'mentale weerstand stations 6-8',
      'splits-management'
    ],
    periodization_model: 'Strength-Endurance Base → Race Specifiek → Taper',
    min_prep_weeks_beginner: 8,
    min_prep_weeks_advanced: 4,
    taper_weeks: 2,
    deload_frequency_weeks: 3,
    intensity_distribution: { zone2_pct: 55, high_pct: 45 },
    volume_character: 'High intensity, race-specific emphasis',
    nutrition_strategy: {
      protein_per_kg_min: 2.0,
      protein_per_kg_max: 2.2,
      carb_character: 'moderate-high',
      race_day_protocol: 'creatine supplementation'
    },
    weakest_link_logic: 'benchmarken week 1, zwakste station prioriteit weken 2-4, combinaties vanaf week 5'
  },
  {
    id: 'triathlon_703',
    name: 'Triathlon 70.3',
    gender_neutral: true,
    energy_system: 'Aeroob dominant',
    critical_limiters: [
      'zwemefficiëntie',
      'fietseconomie W/kg',
      'lopen op vermoeide benen',
      'T1/T2 transities',
      'voeding onderweg'
    ],
    periodization_model: 'Base → Build → Race Specifiek → Taper',
    min_prep_weeks_beginner: 16,
    min_prep_weeks_advanced: 10,
    taper_weeks: 2,
    deload_frequency_weeks: 4,
    intensity_distribution: { zone2_pct: 75, high_pct: 25 },
    volume_character: 'High volume, multi-discipline',
    nutrition_strategy: {
      protein_per_kg_min: 1.8,
      protein_per_kg_max: 1.8,
      carb_character: 'periodized',
      race_day_protocol: '60-75g carbs per hour'
    },
    weakest_link_logic: 'zwemmen eerst, fietsen is motor, lopen is resultaat'
  },
  {
    id: 'triathlon_ironman',
    name: 'Triathlon Ironman',
    gender_neutral: true,
    energy_system: 'Aeroob 90%+',
    critical_limiters: [
      'zwemefficiëntie 3.8km',
      'fietseconomie 180km',
      'marathon op lege benen',
      'maagmanagement',
      'mentale duurzaamheid'
    ],
    periodization_model: 'Base → Build → Peak → Taper',
    min_prep_weeks_beginner: 24,
    min_prep_weeks_advanced: 16,
    taper_weeks: 3,
    deload_frequency_weeks: 3,
    intensity_distribution: { zone2_pct: 80, high_pct: 20 },
    volume_character: 'Extreme volume, endurance focus',
    nutrition_strategy: {
      protein_per_kg_min: 1.8,
      protein_per_kg_max: 1.8,
      carb_character: 'periodized',
      race_day_protocol: 'up to 90g carbs per hour'
    },
    weakest_link_logic: 'volume is de enige weg, nooit door blessures heen lopen'
  },
  {
    id: 'marathon',
    name: 'Marathon',
    gender_neutral: true,
    energy_system: 'Aeroob dominant',
    critical_limiters: [
      'loopeconomie',
      'glycogeenbeheer wall km 30-35',
      'blessurebestendigheid',
      'tempobeheersing eerste helft'
    ],
    periodization_model: 'Base → Tempo Build → Peak → Taper',
    min_prep_weeks_beginner: 16,
    min_prep_weeks_advanced: 10,
    taper_weeks: 3,
    deload_frequency_weeks: 4,
    intensity_distribution: { zone2_pct: 80, high_pct: 20 },
    volume_character: 'High volume, long run emphasis',
    nutrition_strategy: {
      protein_per_kg_min: 1.6,
      protein_per_kg_max: 1.8,
      carb_character: 'balanced',
      race_day_protocol: 'carb load + in-race fueling'
    },
    weakest_link_logic: 'lange duurloop is heilig, drempeltraining pas na aerobe basis'
  },
  {
    id: 'half_marathon',
    name: 'Half Marathon',
    gender_neutral: true,
    energy_system: 'Aeroob met anaeroob component',
    critical_limiters: [
      'drempelvermogen 85-90% HRmax',
      'loopeconomie',
      'startpacing'
    ],
    periodization_model: 'Base → Tempo Build → Taper',
    min_prep_weeks_beginner: 10,
    min_prep_weeks_advanced: 6,
    taper_weeks: 2,
    deload_frequency_weeks: 4,
    intensity_distribution: { zone2_pct: 70, high_pct: 30 },
    volume_character: 'Moderate-high volume, threshold focus',
    nutrition_strategy: {
      protein_per_kg_min: 1.6,
      protein_per_kg_max: 1.8,
      carb_character: 'balanced',
      race_day_protocol: 'standard'
    },
    weakest_link_logic: 'drempeltraining is de sleutel, max 2 harde sessies per week'
  },
  {
    id: '10km',
    name: '10km',
    gender_neutral: true,
    energy_system: 'Aeroob en anaeroob 50/50',
    critical_limiters: [
      'VO2max',
      'loopeconomie bij hoog tempo',
      'lactaatdrempel',
      'startsnelheid zonder verzuren'
    ],
    periodization_model: 'Base → Interval Build → Taper',
    min_prep_weeks_beginner: 8,
    min_prep_weeks_advanced: 4,
    taper_weeks: 1,
    deload_frequency_weeks: 3,
    intensity_distribution: { zone2_pct: 60, high_pct: 40 },
    volume_character: 'Moderate volume, interval emphasis',
    nutrition_strategy: {
      protein_per_kg_min: 1.8,
      protein_per_kg_max: 1.8,
      carb_character: 'moderate',
      race_day_protocol: 'standard'
    },
    weakest_link_logic: '3 weken basis eerst, dan intervallen introduceren'
  }
]
