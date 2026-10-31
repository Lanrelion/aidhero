import fs from 'fs';
import path from 'path';

const SCENARIOS_DIR = path.join(process.cwd(), 'data', 'scenarios');
const TREES_DIR = path.join(process.cwd(), 'data', 'decision-trees');

const TRUST = {
  medical_reviewer: "[PENDING — Nigerian emergency medicine doctor required]",
  reviewer_institution: "Pending",
  last_medically_reviewed: new Date().toISOString(),
  medical_references: ["WHO First Aid", "Nigerian Emergency Medicine Association Guidelines"]
};

function t(en: string) {
  return { en, ha: `[NEEDS_REVIEW] ${en}`, ig: `[NEEDS_REVIEW] ${en}`, yo: `[NEEDS_REVIEW] ${en}`, pcm: `[NEEDS_REVIEW] ${en}` };
}

function stepTranslations(steps: { id: number; instruction: string }[]) {
  return steps.map(s => ({
    id: s.id,
    instruction: s.instruction,
    instruction_translations: t(s.instruction),
    audio_path: `/audio/{slug}/{lang}/step-${s.id}.mp3`
  }));
}

function signsT(signs: string[]) {
  const out: Record<string, any> = {};
  signs.forEach((s, i) => { out[String(i)] = t(s); });
  return out;
}

function doNotT(items: string[]) {
  const out: Record<string, any> = {};
  items.forEach((s, i) => { out[String(i)] = t(s); });
  return out;
}

function optionNode(label: string, next: string) {
  return { label, translations: t(label), next_node_id: next };
}

function qNode(text: string, options: any[]) {
  return { type: 'question', text, translations: t(text), options };
}

function iNode(variant: string, ref: string) {
  return { type: 'instruction', steps_reference: ref, variant };
}

// ─── SCENARIOS ───────────────────────────────────────────────────────────────

const scenarios: any[] = [

  // 6. Cardiac Arrest
  {
    id: 'cardiac-arrest', slug: 'cardiac-arrest', content_version: 1,
    content_version_date: new Date().toISOString(), category: 'cardiac',
    title: 'Cardiac Arrest', title_translations: t('Cardiac Arrest'),
    aliases: ['no pulse', 'heart stopped', 'collapse', 'person not breathing', 'ọkan duro', 'zuciya ta tsaya', 'obi kwusiri', 'heart don stop'],
    severity: 'critical',
    immediate_warning: 'Call emergency services immediately. Begin CPR right now.',
    immediate_warning_translations: t('Call emergency services immediately. Begin CPR right now.'),
    description: 'Cardiac arrest occurs when the heart suddenly stops pumping blood. Without immediate CPR, death can occur within minutes.',
    description_translations: t('Cardiac arrest occurs when the heart suddenly stops pumping blood. Without immediate CPR, death can occur within minutes.'),
    signs: ['Sudden collapse', 'No pulse', 'No breathing or gasping', 'Loss of consciousness'],
    signs_translations: signsT(['Sudden collapse', 'No pulse', 'No breathing or gasping', 'Loss of consciousness']),
    steps: stepTranslations([
      { id: 1, instruction: 'Call emergency services immediately (112 or 767).' },
      { id: 2, instruction: 'Check for responsiveness — tap shoulder, shout "Are you okay?"' },
      { id: 3, instruction: 'Begin chest compressions: place heel of hand on centre of chest, push down hard and fast — 100–120 per minute.' },
      { id: 4, instruction: 'After 30 compressions, give 2 rescue breaths (tilt head back, lift chin, seal mouth, blow in).' },
      { id: 5, instruction: 'Continue 30:2 cycle until emergency services arrive or person recovers.' },
      { id: 6, instruction: 'Use an AED if available — turn it on and follow the voice instructions.' },
    ]),
    do_not: ['Do not leave the person unattended.', 'Do not stop CPR until help arrives.'],
    do_not_translations: doNotT(['Do not leave the person unattended.', 'Do not stop CPR until help arrives.']),
    hospital_threshold: 'Always required immediately.',
    hospital_threshold_translations: t('Always required immediately.'),
    trust_signals: TRUST
  },

  // 7. Angina
  {
    id: 'angina', slug: 'angina', content_version: 1,
    content_version_date: new Date().toISOString(), category: 'cardiac',
    title: 'Angina (Chest Pain)', title_translations: t('Angina (Chest Pain)'),
    aliases: ['chest pain', 'angina', 'chest tightness', 'ọkan nnu mi', 'zuciya tana ciwo', 'chest dey pain me'],
    severity: 'urgent',
    immediate_warning: 'If chest pain lasts more than 15 minutes, suspect a heart attack — call emergency services.',
    immediate_warning_translations: t('If chest pain lasts more than 15 minutes, suspect a heart attack — call emergency services.'),
    description: 'Angina is chest pain caused by reduced blood flow to the heart muscle. It is usually triggered by physical activity or stress.',
    description_translations: t('Angina is chest pain caused by reduced blood flow to the heart muscle. It is usually triggered by physical activity or stress.'),
    signs: ['Chest pressure or tightness', 'Pain spreading to arm, neck, or jaw', 'Shortness of breath', 'Nausea'],
    signs_translations: signsT(['Chest pressure or tightness', 'Pain spreading to arm, neck, or jaw', 'Shortness of breath', 'Nausea']),
    steps: stepTranslations([
      { id: 1, instruction: 'Help the person sit or lie down in a comfortable position.' },
      { id: 2, instruction: 'Loosen any tight clothing around the neck and chest.' },
      { id: 3, instruction: 'If the person has prescribed nitroglycerin, help them take it.' },
      { id: 4, instruction: 'Keep them calm and still. Do not let them walk around.' },
      { id: 5, instruction: 'If pain does not improve within 15 minutes, call emergency services immediately.' },
    ]),
    do_not: ['Do not ignore chest pain.', 'Do not give aspirin unless advised by a medical professional.'],
    do_not_translations: doNotT(['Do not ignore chest pain.', 'Do not give aspirin unless advised by a medical professional.']),
    hospital_threshold: 'Go to hospital if pain is new, severe, or lasts more than 15 minutes.',
    hospital_threshold_translations: t('Go to hospital if pain is new, severe, or lasts more than 15 minutes.'),
    trust_signals: TRUST
  },

  // 8. Choking Child
  {
    id: 'choking-child', slug: 'choking-child', content_version: 1,
    content_version_date: new Date().toISOString(), category: 'paediatric',
    title: 'Choking Child (1–8 years)', title_translations: t('Choking Child (1–8 years)'),
    aliases: ['child choking', 'pikin choke', 'baby choke', 'child cannot breathe', 'pikin no fit breathe'],
    severity: 'critical',
    immediate_warning: 'Act immediately. If the child cannot breathe, cough, or cry, begin back blows now.',
    immediate_warning_translations: t('Act immediately. If the child cannot breathe, cough, or cry, begin back blows now.'),
    description: 'Choking in children is a life-threatening emergency. A blocked airway can cause brain damage within minutes.',
    description_translations: t('Choking in children is a life-threatening emergency. A blocked airway can cause brain damage within minutes.'),
    signs: ['Cannot breathe or speak', 'High-pitched noise when inhaling', 'Bluish lips or skin', 'Clutching throat'],
    signs_translations: signsT(['Cannot breathe or speak', 'High-pitched noise when inhaling', 'Bluish lips or skin', 'Clutching throat']),
    steps: stepTranslations([
      { id: 1, instruction: 'Encourage the child to cough — if they can cough forcefully, let them.' },
      { id: 2, instruction: 'Lean the child forward and give 5 firm back blows between the shoulder blades with the heel of your hand.' },
      { id: 3, instruction: 'If back blows fail: give 5 abdominal thrusts — kneel behind the child, make a fist above the navel, thrust inward and upward.' },
      { id: 4, instruction: 'Alternate 5 back blows and 5 abdominal thrusts.' },
      { id: 5, instruction: 'If the child loses consciousness, call 112 and begin CPR immediately.' },
    ]),
    do_not: ['Do not do a blind finger sweep of the mouth.', 'Do not use adult-force abdominal thrusts on infants.'],
    do_not_translations: doNotT(['Do not do a blind finger sweep of the mouth.', 'Do not use adult-force abdominal thrusts on infants.']),
    hospital_threshold: 'Always go to hospital after a choking episode, even if resolved.',
    hospital_threshold_translations: t('Always go to hospital after a choking episode, even if resolved.'),
    trust_signals: TRUST
  },

  // 9. Asthma Attack
  {
    id: 'asthma-attack', slug: 'asthma-attack', content_version: 1,
    content_version_date: new Date().toISOString(), category: 'respiratory',
    title: 'Asthma Attack', title_translations: t('Asthma Attack'),
    aliases: ['asthma', 'cannot breathe', 'wheezing', 'breathing difficulty', 'inhaler', 'asma', 'no fit breathe', 'person dey wheeze'],
    severity: 'urgent',
    immediate_warning: 'If the person cannot speak, lips are blue, or reliever inhaler is not helping after 10 minutes — call 112.',
    immediate_warning_translations: t('If the person cannot speak, lips are blue, or reliever inhaler is not helping after 10 minutes — call 112.'),
    description: 'An asthma attack causes the airways to narrow, making breathing very difficult. Most attacks can be managed with the correct inhaler.',
    description_translations: t('An asthma attack causes the airways to narrow, making breathing very difficult. Most attacks can be managed with the correct inhaler.'),
    signs: ['Wheezing', 'Shortness of breath', 'Chest tightness', 'Coughing', 'Difficulty speaking in full sentences'],
    signs_translations: signsT(['Wheezing', 'Shortness of breath', 'Chest tightness', 'Coughing', 'Difficulty speaking in full sentences']),
    steps: stepTranslations([
      { id: 1, instruction: 'Keep the person calm and help them sit upright. Do not let them lie down.' },
      { id: 2, instruction: 'Help them use their reliever inhaler (usually blue). Give 1 puff every 30–60 seconds, up to 10 puffs.' },
      { id: 3, instruction: 'If they do not have their inhaler, call 112 immediately.' },
      { id: 4, instruction: 'Stay with them. If they are not better after 15 minutes, call 112.' },
      { id: 5, instruction: 'If they become unconscious and stop breathing, begin CPR.' },
    ]),
    do_not: ['Do not give the person water or food during an attack.', 'Do not leave them alone.'],
    do_not_translations: doNotT(['Do not give the person water or food during an attack.', 'Do not leave them alone.']),
    hospital_threshold: 'Go to hospital if the attack does not fully resolve or is unusually severe.',
    hospital_threshold_translations: t('Go to hospital if the attack does not fully resolve or is unusually severe.'),
    trust_signals: TRUST
  },

  // 10. Drowning
  {
    id: 'drowning', slug: 'drowning', content_version: 1,
    content_version_date: new Date().toISOString(), category: 'respiratory',
    title: 'Drowning', title_translations: t('Drowning'),
    aliases: ['drowning', 'drown', 'fall inside water', 'person dey sink', 'underwater', 'near-drowning'],
    severity: 'critical',
    immediate_warning: 'Remove the person from water safely. Do not put yourself at risk. Call 112 immediately.',
    immediate_warning_translations: t('Remove the person from water safely. Do not put yourself at risk. Call 112 immediately.'),
    description: 'Drowning can cause death within minutes due to lack of oxygen. Immediate rescue breathing and CPR are critical.',
    description_translations: t('Drowning can cause death within minutes due to lack of oxygen. Immediate rescue breathing and CPR are critical.'),
    signs: ['Unresponsive or confused after water rescue', 'Coughing or vomiting water', 'Bluish skin', 'Not breathing'],
    signs_translations: signsT(['Unresponsive or confused after water rescue', 'Coughing or vomiting water', 'Bluish skin', 'Not breathing']),
    steps: stepTranslations([
      { id: 1, instruction: 'Get the person out of water safely — use a rope, branch, or float. Do not jump in unless trained.' },
      { id: 2, instruction: 'Call 112 immediately.' },
      { id: 3, instruction: 'Lay the person on their back on a flat surface.' },
      { id: 4, instruction: 'Check for breathing. If not breathing, give 5 rescue breaths immediately.' },
      { id: 5, instruction: 'Begin CPR: 30 chest compressions followed by 2 rescue breaths. Continue until help arrives.' },
      { id: 6, instruction: 'If they regain consciousness, place in recovery position on their side.' },
    ]),
    do_not: ['Do not leave the person alone.', 'Do not give food or water immediately after rescue.'],
    do_not_translations: doNotT(['Do not leave the person alone.', 'Do not give food or water immediately after rescue.']),
    hospital_threshold: 'Always go to hospital — even if the person seems recovered. Secondary drowning can occur hours later.',
    hospital_threshold_translations: t('Always go to hospital — even if the person seems recovered. Secondary drowning can occur hours later.'),
    trust_signals: TRUST
  },

  // 11. Minor Burn
  {
    id: 'minor-burn', slug: 'minor-burn', content_version: 1,
    content_version_date: new Date().toISOString(), category: 'burns',
    title: 'Minor Burn', title_translations: t('Minor Burn'),
    aliases: ['burn', 'small burn', 'hot water burn', 'kerosene burn', 'fire burn small', 'first degree burn', 'boil water wound'],
    severity: 'moderate',
    immediate_warning: 'Cool the burn immediately with cool running water for at least 10 minutes.',
    immediate_warning_translations: t('Cool the burn immediately with cool running water for at least 10 minutes.'),
    description: 'A minor burn affects only the outer layer of skin. It causes redness, pain, and sometimes blisters but heals without surgery.',
    description_translations: t('A minor burn affects only the outer layer of skin. It causes redness, pain, and sometimes blisters but heals without surgery.'),
    signs: ['Red or pink skin', 'Pain', 'Swelling', 'Small blisters'],
    signs_translations: signsT(['Red or pink skin', 'Pain', 'Swelling', 'Small blisters']),
    steps: stepTranslations([
      { id: 1, instruction: 'Immediately hold the burned area under cool (not cold) running water for 10–20 minutes.' },
      { id: 2, instruction: 'Remove jewellery or tight items near the burn before swelling starts.' },
      { id: 3, instruction: 'Do not break any blisters — they protect against infection.' },
      { id: 4, instruction: 'Cover loosely with a clean, non-fluffy bandage or cloth.' },
      { id: 5, instruction: 'Give paracetamol or ibuprofen if available to reduce pain.' },
    ]),
    do_not: ['Do not apply toothpaste, oil, egg white, or any home remedy.', 'Do not use ice or ice water — it can worsen the burn.', 'Do not burst blisters.'],
    do_not_translations: doNotT(['Do not apply toothpaste, oil, egg white, or any home remedy.', 'Do not use ice or ice water — it can worsen the burn.', 'Do not burst blisters.']),
    hospital_threshold: 'Go to hospital if the burn is on the face, hands, genitals, or larger than 3cm.',
    hospital_threshold_translations: t('Go to hospital if the burn is on the face, hands, genitals, or larger than 3cm.'),
    trust_signals: TRUST
  },

  // 12. Severe Burn
  {
    id: 'severe-burn', slug: 'severe-burn', content_version: 1,
    content_version_date: new Date().toISOString(), category: 'burns',
    title: 'Severe Burn', title_translations: t('Severe Burn'),
    aliases: ['severe burn', 'deep burn', 'big burn', 'fire accident', 'chemical burn', 'third degree burn', 'body don burn', 'kerosene explosion'],
    severity: 'critical',
    immediate_warning: 'Call 112 now. Do not remove clothing stuck to the burn.',
    immediate_warning_translations: t('Call 112 now. Do not remove clothing stuck to the burn.'),
    description: 'A severe burn damages deep layers of skin and tissue. It is a life-threatening emergency requiring immediate hospital care.',
    description_translations: t('A severe burn damages deep layers of skin and tissue. It is a life-threatening emergency requiring immediate hospital care.'),
    signs: ['Charred, white, or leathery skin', 'Large blistered area', 'Severe pain or no pain (nerve damage)', 'Swelling', 'Shock symptoms'],
    signs_translations: signsT(['Charred, white, or leathery skin', 'Large blistered area', 'Severe pain or no pain (nerve damage)', 'Swelling', 'Shock symptoms']),
    steps: stepTranslations([
      { id: 1, instruction: 'Call 112 immediately.' },
      { id: 2, instruction: 'Remove the person from the source of heat. Stop any flames by rolling them on the ground.' },
      { id: 3, instruction: 'Cool the burn with cool running water for at least 20 minutes.' },
      { id: 4, instruction: 'Do NOT remove clothing stuck to the burn — cut around it carefully.' },
      { id: 5, instruction: 'Cover loosely with a clean sheet, cling wrap, or a sterile dressing.' },
      { id: 6, instruction: 'Keep the person warm to prevent shock. Elevate burned limbs if possible.' },
      { id: 7, instruction: 'Monitor breathing and consciousness until help arrives.' },
    ]),
    do_not: ['Do not apply any ointment, toothpaste, or oil.', 'Do not remove stuck clothing.', 'Do not give anything by mouth if person may need surgery.'],
    do_not_translations: doNotT(['Do not apply any ointment, toothpaste, or oil.', 'Do not remove stuck clothing.', 'Do not give anything by mouth if person may need surgery.']),
    hospital_threshold: 'Always required. Transport to hospital immediately.',
    hospital_threshold_translations: t('Always required. Transport to hospital immediately.'),
    trust_signals: TRUST
  },

  // 13. Generator Fumes / CO Poisoning
  {
    id: 'generator-fumes', slug: 'generator-fumes', content_version: 1,
    content_version_date: new Date().toISOString(), category: 'environmental',
    title: 'Generator Fumes (Carbon Monoxide Poisoning)', title_translations: t('Generator Fumes (Carbon Monoxide Poisoning)'),
    aliases: ['generator fumes', 'carbon monoxide', 'CO poisoning', 'gen poisoning', 'generator poison', 'fumes', 'generator smoke', 'gen don affect person'],
    severity: 'critical',
    immediate_warning: 'Move the person to fresh air immediately. Call 112. Do not re-enter the building alone.',
    immediate_warning_translations: t('Move the person to fresh air immediately. Call 112. Do not re-enter the building alone.'),
    description: 'Carbon monoxide from generators is colourless and odourless. Running a generator indoors or in poorly ventilated spaces can kill within minutes.',
    description_translations: t('Carbon monoxide from generators is colourless and odourless. Running a generator indoors or in poorly ventilated spaces can kill within minutes.'),
    signs: ['Headache', 'Dizziness or confusion', 'Nausea or vomiting', 'Shortness of breath', 'Unconsciousness', 'Cherry-red skin (late sign)'],
    signs_translations: signsT(['Headache', 'Dizziness or confusion', 'Nausea or vomiting', 'Shortness of breath', 'Unconsciousness', 'Cherry-red skin (late sign)']),
    steps: stepTranslations([
      { id: 1, instruction: 'Move the person to fresh air IMMEDIATELY — outdoors or open all windows and doors.' },
      { id: 2, instruction: 'Call 112 or take to the nearest hospital at once.' },
      { id: 3, instruction: 'Turn off the generator if it is safe to do so.' },
      { id: 4, instruction: 'If unconscious, check for breathing. If not breathing, start CPR.' },
      { id: 5, instruction: 'Place a conscious person in the recovery position on their side.' },
      { id: 6, instruction: 'Keep the person warm and still until help arrives.' },
    ]),
    do_not: ['Do not re-enter the building alone without fresh air.', 'Do not leave the person alone.', 'Do not run a generator inside any enclosed space — ever.'],
    do_not_translations: doNotT(['Do not re-enter the building alone without fresh air.', 'Do not leave the person alone.', 'Do not run a generator inside any enclosed space — ever.']),
    hospital_threshold: 'Always required. CO poisoning can cause lasting brain damage.',
    hospital_threshold_translations: t('Always required. CO poisoning can cause lasting brain damage.'),
    trust_signals: TRUST
  },

  // 14. Heatstroke
  {
    id: 'heatstroke', slug: 'heatstroke', content_version: 1,
    content_version_date: new Date().toISOString(), category: 'environmental',
    title: 'Heatstroke', title_translations: t('Heatstroke'),
    aliases: ['heatstroke', 'heat exhaustion', 'sun stroke', 'too much sun', 'body temperature high', 'heat don catch am', 'sun dey affect am'],
    severity: 'critical',
    immediate_warning: 'Cool the person down immediately. Heatstroke can cause death or brain damage within minutes.',
    immediate_warning_translations: t('Cool the person down immediately. Heatstroke can cause death or brain damage within minutes.'),
    description: 'Heatstroke occurs when the body temperature rises dangerously high (above 40°C). It is a medical emergency common in hot Nigerian weather.',
    description_translations: t('Heatstroke occurs when the body temperature rises dangerously high (above 40°C). It is a medical emergency common in hot Nigerian weather.'),
    signs: ['Very high body temperature', 'Hot, red, and dry skin (no sweating)', 'Rapid heartbeat', 'Confusion or unconsciousness', 'Headache'],
    signs_translations: signsT(['Very high body temperature', 'Hot, red, and dry skin (no sweating)', 'Rapid heartbeat', 'Confusion or unconsciousness', 'Headache']),
    steps: stepTranslations([
      { id: 1, instruction: 'Call 112 immediately.' },
      { id: 2, instruction: 'Move the person to a cool, shaded area immediately.' },
      { id: 3, instruction: 'Remove excess clothing.' },
      { id: 4, instruction: 'Cool them rapidly: apply cool water to skin, fan vigorously, or use wet towels on neck, armpits, and groin.' },
      { id: 5, instruction: 'If conscious and able to swallow, give cool water to drink slowly.' },
      { id: 6, instruction: 'Do not give paracetamol or aspirin — they do not help in heatstroke.' },
    ]),
    do_not: ['Do not give medication for fever in heatstroke.', 'Do not leave the person alone.', 'Do not use ice-cold water — it can cause shock.'],
    do_not_translations: doNotT(['Do not give medication for fever in heatstroke.', 'Do not leave the person alone.', 'Do not use ice-cold water — it can cause shock.']),
    hospital_threshold: 'Always required. Heatstroke is a medical emergency.',
    hospital_threshold_translations: t('Always required. Heatstroke is a medical emergency.'),
    trust_signals: TRUST
  },

  // 15. Broken Bone
  {
    id: 'broken-bone', slug: 'broken-bone', content_version: 1,
    content_version_date: new Date().toISOString(), category: 'trauma',
    title: 'Broken Bone (Fracture)', title_translations: t('Broken Bone (Fracture)'),
    aliases: ['broken bone', 'fracture', 'broken arm', 'broken leg', 'bone fracture', 'fall wound', 'bone break', 'bone don crack'],
    severity: 'urgent',
    immediate_warning: 'If the bone is piercing the skin or the person cannot move their limbs, call 112 immediately.',
    immediate_warning_translations: t('If the bone is piercing the skin or the person cannot move their limbs, call 112 immediately.'),
    description: 'A broken bone (fracture) requires immobilisation to prevent further injury. Never try to straighten the bone.',
    description_translations: t('A broken bone (fracture) requires immobilisation to prevent further injury. Never try to straighten the bone.'),
    signs: ['Severe pain at injury site', 'Swelling and bruising', 'Deformity or unnatural angle', 'Inability to use the limb'],
    signs_translations: signsT(['Severe pain at injury site', 'Swelling and bruising', 'Deformity or unnatural angle', 'Inability to use the limb']),
    steps: stepTranslations([
      { id: 1, instruction: 'Keep the person still and calm. Do not attempt to move them if a spine injury is possible.' },
      { id: 2, instruction: 'Immobilise the injured limb in the position you find it — use a splint made from stiff material (wood, rolled newspaper) padded with cloth.' },
      { id: 3, instruction: 'If bone is through skin, cover with a clean cloth. Do not push it back.' },
      { id: 4, instruction: 'Apply an ice pack wrapped in cloth to reduce swelling. Do not apply ice directly to skin.' },
      { id: 5, instruction: 'Elevate the injured limb if possible to reduce swelling.' },
      { id: 6, instruction: 'Transport to hospital carefully, keeping the limb still.' },
    ]),
    do_not: ['Do not try to straighten the bone.', 'Do not ignore a suspected fracture.'],
    do_not_translations: doNotT(['Do not try to straighten the bone.', 'Do not ignore a suspected fracture.']),
    hospital_threshold: 'Always required for X-ray and proper immobilisation.',
    hospital_threshold_translations: t('Always required for X-ray and proper immobilisation.'),
    trust_signals: TRUST
  },

  // 16. Head Injury
  {
    id: 'head-injury', slug: 'head-injury', content_version: 1,
    content_version_date: new Date().toISOString(), category: 'trauma',
    title: 'Head Injury', title_translations: t('Head Injury'),
    aliases: ['head injury', 'head wound', 'concussion', 'head trauma', 'fall head', 'head don knock', 'head cut', 'skull injury'],
    severity: 'critical',
    immediate_warning: 'Any loss of consciousness, vomiting, or confusion after a head injury requires immediate hospital attention.',
    immediate_warning_translations: t('Any loss of consciousness, vomiting, or confusion after a head injury requires immediate hospital attention.'),
    description: 'Head injuries can range from minor cuts to serious brain injuries. Always take head injuries seriously, especially in children.',
    description_translations: t('Head injuries can range from minor cuts to serious brain injuries. Always take head injuries seriously, especially in children.'),
    signs: ['Headache', 'Confusion or memory loss', 'Vomiting', 'Loss of consciousness', 'Unequal pupils', 'Clear fluid from nose or ears'],
    signs_translations: signsT(['Headache', 'Confusion or memory loss', 'Vomiting', 'Loss of consciousness', 'Unequal pupils', 'Clear fluid from nose or ears']),
    steps: stepTranslations([
      { id: 1, instruction: 'Call 112 if unconscious, vomiting, confused, or if there is clear fluid from nose/ears.' },
      { id: 2, instruction: 'Keep the person still. Do not move them if a neck injury is possible.' },
      { id: 3, instruction: 'Apply gentle pressure to any scalp wound with a clean cloth to stop bleeding.' },
      { id: 4, instruction: 'Do not remove any object embedded in the head.' },
      { id: 5, instruction: 'Monitor consciousness — speak to them regularly and check their responses.' },
      { id: 6, instruction: 'If unconscious but breathing, place in recovery position on their side.' },
    ]),
    do_not: ['Do not give aspirin (increases bleeding).', 'Do not leave a head-injured person alone for 24 hours.', 'Do not allow them to sleep unless assessed by a doctor.'],
    do_not_translations: doNotT(['Do not give aspirin (increases bleeding).', 'Do not leave a head-injured person alone for 24 hours.', 'Do not allow them to sleep unless assessed by a doctor.']),
    hospital_threshold: 'Always required. Any loss of consciousness must be evaluated immediately.',
    hospital_threshold_translations: t('Always required. Any loss of consciousness must be evaluated immediately.'),
    trust_signals: TRUST
  },

  // 17. Fainting
  {
    id: 'fainting', slug: 'fainting', content_version: 1,
    content_version_date: new Date().toISOString(), category: 'neurological',
    title: 'Fainting (Syncope)', title_translations: t('Fainting (Syncope)'),
    aliases: ['fainting', 'faint', 'blackout', 'passed out', 'collapse', 'person fall down', 'syncope', 'person don faint', 'dizziness fall'],
    severity: 'moderate',
    immediate_warning: 'If the person does not regain consciousness within 1 minute, call 112.',
    immediate_warning_translations: t('If the person does not regain consciousness within 1 minute, call 112.'),
    description: 'Fainting is a brief loss of consciousness caused by a sudden drop in blood flow to the brain. It is usually harmless but can indicate a serious condition.',
    description_translations: t('Fainting is a brief loss of consciousness caused by a sudden drop in blood flow to the brain. It is usually harmless but can indicate a serious condition.'),
    signs: ['Sudden brief loss of consciousness', 'Pale or grey skin before fainting', 'Weak pulse', 'Dizziness before collapse'],
    signs_translations: signsT(['Sudden brief loss of consciousness', 'Pale or grey skin before fainting', 'Weak pulse', 'Dizziness before collapse']),
    steps: stepTranslations([
      { id: 1, instruction: 'Lay the person flat on the ground on their back.' },
      { id: 2, instruction: 'Raise their legs about 30cm (12 inches) to improve blood flow to the brain.' },
      { id: 3, instruction: 'Loosen any tight clothing around the neck and chest.' },
      { id: 4, instruction: 'Check for breathing. If not breathing, begin CPR and call 112.' },
      { id: 5, instruction: 'When they recover, have them sit up slowly. Do not let them stand immediately.' },
    ]),
    do_not: ['Do not give water until fully conscious.', 'Do not leave them alone.', 'Do not prop them upright.'],
    do_not_translations: doNotT(['Do not give water until fully conscious.', 'Do not leave them alone.', 'Do not prop them upright.']),
    hospital_threshold: 'Go to hospital if fainting recurs, the person has heart disease, or there is chest pain.',
    hospital_threshold_translations: t('Go to hospital if fainting recurs, the person has heart disease, or there is chest pain.'),
    trust_signals: TRUST
  },

  // 18. Snake Bite
  {
    id: 'snake-bite', slug: 'snake-bite', content_version: 1,
    content_version_date: new Date().toISOString(), category: 'poisoning',
    title: 'Snake Bite', title_translations: t('Snake Bite'),
    aliases: ['snake bite', 'snakebite', 'snake wound', 'dangerous snake', 'viper bite', 'cobra bite', 'python bite', 'snake don bite am', 'ọra ejò', 'macijin ya cije', 'agwo tara ya', 'snake bite am'],
    severity: 'critical',
    immediate_warning: 'Take the person to hospital immediately. Time is critical — do not wait for symptoms to appear. Nigeria has deadly species including puff adder, Gaboon viper, and black-necked spitting cobra.',
    immediate_warning_translations: t('Take the person to hospital immediately. Time is critical — do not wait for symptoms to appear. Nigeria has deadly species including puff adder, Gaboon viper, and black-necked spitting cobra.'),
    description: 'Nigeria has many venomous snakes including puff adder, Gaboon viper, carpet viper, and black-necked spitting cobra. All snake bites must be treated as medical emergencies until proven otherwise.',
    description_translations: t('Nigeria has many venomous snakes including puff adder, Gaboon viper, carpet viper, and black-necked spitting cobra. All snake bites must be treated as medical emergencies until proven otherwise.'),
    signs: ['Two small puncture marks', 'Severe pain at bite site', 'Swelling rapidly spreading', 'Nausea and vomiting', 'Difficulty breathing', 'Blurred vision', 'Paralysis'],
    signs_translations: signsT(['Two small puncture marks', 'Severe pain at bite site', 'Swelling rapidly spreading', 'Nausea and vomiting', 'Difficulty breathing', 'Blurred vision', 'Paralysis']),
    steps: stepTranslations([
      { id: 1, instruction: 'Keep the person calm and still. Movement spreads venom faster through the body.' },
      { id: 2, instruction: 'Transport to the nearest hospital immediately — antivenom is the only effective treatment.' },
      { id: 3, instruction: 'Remove jewellery and tight clothing near the bite before swelling starts.' },
      { id: 4, instruction: 'Keep the bitten limb at or below heart level.' },
      { id: 5, instruction: 'Note the snake\'s appearance if safe to do so — do not try to catch or kill it.' },
      { id: 6, instruction: 'Monitor breathing. If not breathing, start CPR.' },
    ]),
    do_not: ['Do not suck the venom or cut the bite.', 'Do not apply a tourniquet.', 'Do not apply ice.', 'Do not give alcohol.', 'Do not try to catch the snake.'],
    do_not_translations: doNotT(['Do not suck the venom or cut the bite.', 'Do not apply a tourniquet.', 'Do not apply ice.', 'Do not give alcohol.', 'Do not try to catch the snake.']),
    hospital_threshold: 'Always required. Antivenom must be given in a hospital setting.',
    hospital_threshold_translations: t('Always required. Antivenom must be given in a hospital setting.'),
    trust_signals: TRUST
  },

  // 19. Food Poisoning
  {
    id: 'food-poisoning', slug: 'food-poisoning', content_version: 1,
    content_version_date: new Date().toISOString(), category: 'gastrointestinal',
    title: 'Food Poisoning', title_translations: t('Food Poisoning'),
    aliases: ['food poisoning', 'bad food', 'food make person sick', 'stomach poisoning', 'diarrhea vomiting', 'food don spoil', 'expired food sick', 'stomach upset bad'],
    severity: 'moderate',
    immediate_warning: 'Call 112 if the person is severely dehydrated, has bloody diarrhoea, is unconscious, or cannot keep fluids down for 8 hours.',
    immediate_warning_translations: t('Call 112 if the person is severely dehydrated, has bloody diarrhoea, is unconscious, or cannot keep fluids down for 8 hours.'),
    description: 'Food poisoning is caused by eating contaminated food. Most cases resolve within 1–3 days with rest and fluids.',
    description_translations: t('Food poisoning is caused by eating contaminated food. Most cases resolve within 1–3 days with rest and fluids.'),
    signs: ['Nausea and vomiting', 'Diarrhoea', 'Stomach cramps', 'Fever', 'Weakness'],
    signs_translations: signsT(['Nausea and vomiting', 'Diarrhoea', 'Stomach cramps', 'Fever', 'Weakness']),
    steps: stepTranslations([
      { id: 1, instruction: 'Have the person rest and drink plenty of fluids — water, oral rehydration salts (ORS), or weak tea.' },
      { id: 2, instruction: 'Give ORS sachets mixed in clean water to replace lost fluids and electrolytes.' },
      { id: 3, instruction: 'Avoid solid food until vomiting stops. Then start with bland food like plain rice or bread.' },
      { id: 4, instruction: 'Monitor for signs of severe dehydration: very dry mouth, sunken eyes, little or no urine.' },
      { id: 5, instruction: 'Seek hospital care if symptoms worsen after 24 hours or severe dehydration occurs.' },
    ]),
    do_not: ['Do not give anti-diarrhoea medication unless advised by a doctor.', 'Do not give children aspirin.', 'Do not ignore bloody stool or high fever.'],
    do_not_translations: doNotT(['Do not give anti-diarrhoea medication unless advised by a doctor.', 'Do not give children aspirin.', 'Do not ignore bloody stool or high fever.']),
    hospital_threshold: 'Go to hospital if symptoms persist beyond 48 hours, or signs of severe dehydration appear.',
    hospital_threshold_translations: t('Go to hospital if symptoms persist beyond 48 hours, or signs of severe dehydration appear.'),
    trust_signals: TRUST
  },

  // 20. Anaphylaxis
  {
    id: 'anaphylaxis', slug: 'anaphylaxis', content_version: 1,
    content_version_date: new Date().toISOString(), category: 'allergic',
    title: 'Severe Allergic Reaction (Anaphylaxis)', title_translations: t('Severe Allergic Reaction (Anaphylaxis)'),
    aliases: ['anaphylaxis', 'allergic reaction', 'severe allergy', 'allergy shock', 'drug reaction', 'bee sting allergy', 'food allergy severe', 'injection reaction', 'body react bad'],
    severity: 'critical',
    immediate_warning: 'Call 112 immediately. This is a life-threatening emergency. Use adrenaline (epinephrine) auto-injector if available.',
    immediate_warning_translations: t('Call 112 immediately. This is a life-threatening emergency. Use adrenaline (epinephrine) auto-injector if available.'),
    description: 'Anaphylaxis is a severe, sudden, life-threatening allergic reaction. Common triggers include foods (groundnuts, shellfish), medications, and insect stings.',
    description_translations: t('Anaphylaxis is a severe, sudden, life-threatening allergic reaction. Common triggers include foods (groundnuts, shellfish), medications, and insect stings.'),
    signs: ['Swollen face, lips, or throat', 'Difficulty breathing or wheezing', 'Rash or hives spreading rapidly', 'Dizziness or collapse', 'Rapid or weak pulse'],
    signs_translations: signsT(['Swollen face, lips, or throat', 'Difficulty breathing or wheezing', 'Rash or hives spreading rapidly', 'Dizziness or collapse', 'Rapid or weak pulse']),
    steps: stepTranslations([
      { id: 1, instruction: 'Call 112 immediately.' },
      { id: 2, instruction: 'If the person has an adrenaline (epinephrine) auto-injector (EpiPen), use it on the outer thigh immediately.' },
      { id: 3, instruction: 'Lay the person flat with their legs elevated. If breathing is difficult, let them sit up slightly.' },
      { id: 4, instruction: 'Remove or avoid the trigger allergen if still present (e.g. remove a bee stinger).' },
      { id: 5, instruction: 'If unconscious and not breathing, begin CPR immediately.' },
      { id: 6, instruction: 'If a second EpiPen is available and no improvement in 5 minutes, use it.' },
    ]),
    do_not: ['Do not leave the person alone.', 'Do not give oral medication if they cannot swallow.', 'Do not let them stand up.'],
    do_not_translations: doNotT(['Do not leave the person alone.', 'Do not give oral medication if they cannot swallow.', 'Do not let them stand up.']),
    hospital_threshold: 'Always required even if symptoms resolve — reactions can return after 8–24 hours.',
    hospital_threshold_translations: t('Always required even if symptoms resolve — reactions can return after 8–24 hours.'),
    trust_signals: TRUST
  },
];

// ─── DECISION TREES ──────────────────────────────────────────────────────────

const trees: Record<string, any> = {
  'cardiac-arrest': {
    id: 'cardiac-arrest-flow', incident_id: 'cardiac-arrest', root_node_id: 'q1',
    nodes: {
      q1: qNode('Is the person breathing?', [
        optionNode('No', 'start-cpr'),
        optionNode('Yes — barely / gasping', 'start-cpr'),
        optionNode('Yes — normally', 'q2'),
      ]),
      q2: qNode('Are they conscious and responsive?', [
        optionNode('Yes', 'recovery-steps'),
        optionNode('No', 'start-cpr'),
      ]),
      'start-cpr': iNode('cpr', 'cardiac-arrest'),
      'recovery-steps': iNode('recovery', 'cardiac-arrest'),
    }
  },
  'angina': {
    id: 'angina-flow', incident_id: 'angina', root_node_id: 'q1',
    nodes: {
      q1: qNode('Is this chest pain new or different from before?', [
        optionNode('Yes — new pain', 'q2'),
        optionNode('No — same as usual angina', 'standard-steps'),
      ]),
      q2: qNode('Has it lasted more than 15 minutes?', [
        optionNode('Yes', 'emergency-steps'),
        optionNode('No', 'standard-steps'),
      ]),
      'emergency-steps': iNode('emergency', 'angina'),
      'standard-steps': iNode('standard', 'angina'),
    }
  },
  'choking-child': {
    id: 'choking-child-flow', incident_id: 'choking-child', root_node_id: 'q1',
    nodes: {
      q1: qNode('Can the child cough, cry, or breathe?', [
        optionNode('Yes — weakly', 'back-blows'),
        optionNode('No — completely blocked', 'back-blows'),
        optionNode('Yes — strongly coughing', 'encourage-cough'),
      ]),
      'back-blows': iNode('back-blows', 'choking-child'),
      'encourage-cough': iNode('cough', 'choking-child'),
    }
  },
  'asthma-attack': {
    id: 'asthma-attack-flow', incident_id: 'asthma-attack', root_node_id: 'q1',
    nodes: {
      q1: qNode('Does the person have their reliever inhaler (usually blue)?', [
        optionNode('Yes', 'inhaler-steps'),
        optionNode('No', 'no-inhaler-steps'),
      ]),
      'inhaler-steps': iNode('with-inhaler', 'asthma-attack'),
      'no-inhaler-steps': iNode('no-inhaler', 'asthma-attack'),
    }
  },
  'drowning': {
    id: 'drowning-flow', incident_id: 'drowning', root_node_id: 'q1',
    nodes: {
      q1: qNode('Is the person out of the water?', [
        optionNode('Yes', 'q2'),
        optionNode('No — still in water', 'rescue-first'),
      ]),
      q2: qNode('Are they breathing?', [
        optionNode('Yes', 'recovery-steps'),
        optionNode('No', 'cpr-steps'),
      ]),
      'rescue-first': iNode('rescue', 'drowning'),
      'cpr-steps': iNode('cpr', 'drowning'),
      'recovery-steps': iNode('recovery', 'drowning'),
    }
  },
  'minor-burn': {
    id: 'minor-burn-flow', incident_id: 'minor-burn', root_node_id: 'q1',
    nodes: {
      q1: qNode('How large is the burn?', [
        optionNode('Smaller than palm of hand', 'minor-steps'),
        optionNode('Larger than palm or on face/hands', 'major-burn'),
      ]),
      'minor-steps': iNode('minor', 'minor-burn'),
      'major-burn': iNode('severe', 'severe-burn'),
    }
  },
  'severe-burn': {
    id: 'severe-burn-flow', incident_id: 'severe-burn', root_node_id: 'q1',
    nodes: {
      q1: qNode('Is the person still on fire or in contact with the heat source?', [
        optionNode('Yes', 'stop-burning'),
        optionNode('No', 'treat-burn'),
      ]),
      'stop-burning': iNode('stop-fire', 'severe-burn'),
      'treat-burn': iNode('treat', 'severe-burn'),
    }
  },
  'generator-fumes': {
    id: 'generator-fumes-flow', incident_id: 'generator-fumes', root_node_id: 'q1',
    nodes: {
      q1: qNode('Is the person conscious?', [
        optionNode('Yes', 'conscious-steps'),
        optionNode('No', 'unconscious-steps'),
      ]),
      'conscious-steps': iNode('conscious', 'generator-fumes'),
      'unconscious-steps': iNode('unconscious', 'generator-fumes'),
    }
  },
  'heatstroke': {
    id: 'heatstroke-flow', incident_id: 'heatstroke', root_node_id: 'q1',
    nodes: {
      q1: qNode('Is the person conscious?', [
        optionNode('Yes', 'cooling-steps'),
        optionNode('No', 'emergency-cooling'),
      ]),
      'cooling-steps': iNode('conscious', 'heatstroke'),
      'emergency-cooling': iNode('unconscious', 'heatstroke'),
    }
  },
  'broken-bone': {
    id: 'broken-bone-flow', incident_id: 'broken-bone', root_node_id: 'q1',
    nodes: {
      q1: qNode('Is the bone breaking through the skin?', [
        optionNode('Yes — open fracture', 'open-fracture'),
        optionNode('No — skin intact', 'closed-fracture'),
      ]),
      'open-fracture': iNode('open', 'broken-bone'),
      'closed-fracture': iNode('closed', 'broken-bone'),
    }
  },
  'head-injury': {
    id: 'head-injury-flow', incident_id: 'head-injury', root_node_id: 'q1',
    nodes: {
      q1: qNode('Did the person lose consciousness?', [
        optionNode('Yes — even briefly', 'serious-steps'),
        optionNode('No', 'q2'),
      ]),
      q2: qNode('Are they confused, vomiting, or have a severe headache?', [
        optionNode('Yes', 'serious-steps'),
        optionNode('No', 'minor-steps'),
      ]),
      'serious-steps': iNode('serious', 'head-injury'),
      'minor-steps': iNode('minor', 'head-injury'),
    }
  },
  'fainting': {
    id: 'fainting-flow', incident_id: 'fainting', root_node_id: 'q1',
    nodes: {
      q1: qNode('Has the person regained consciousness?', [
        optionNode('Yes — within 1 minute', 'recovery-steps'),
        optionNode('No — still unconscious', 'emergency-steps'),
      ]),
      'recovery-steps': iNode('recovery', 'fainting'),
      'emergency-steps': iNode('emergency', 'fainting'),
    }
  },
  'snake-bite': {
    id: 'snake-bite-flow', incident_id: 'snake-bite', root_node_id: 'q1',
    nodes: {
      q1: qNode('Is the person conscious and breathing normally?', [
        optionNode('Yes', 'stabilise-steps'),
        optionNode('No', 'cpr-steps'),
      ]),
      'stabilise-steps': iNode('conscious', 'snake-bite'),
      'cpr-steps': iNode('unconscious', 'snake-bite'),
    }
  },
  'food-poisoning': {
    id: 'food-poisoning-flow', incident_id: 'food-poisoning', root_node_id: 'q1',
    nodes: {
      q1: qNode('How severe are the symptoms?', [
        optionNode('Mild — nausea, vomiting, diarrhoea', 'home-care'),
        optionNode('Severe — bloody stool, cannot keep fluids down, very weak', 'hospital-steps'),
      ]),
      'home-care': iNode('home', 'food-poisoning'),
      'hospital-steps': iNode('severe', 'food-poisoning'),
    }
  },
  'anaphylaxis': {
    id: 'anaphylaxis-flow', incident_id: 'anaphylaxis', root_node_id: 'q1',
    nodes: {
      q1: qNode('Does the person have an adrenaline auto-injector (EpiPen)?', [
        optionNode('Yes', 'epipen-steps'),
        optionNode('No', 'no-epipen-steps'),
      ]),
      'epipen-steps': iNode('epipen', 'anaphylaxis'),
      'no-epipen-steps': iNode('no-epipen', 'anaphylaxis'),
    }
  },
};

// ─── WRITE FILES ─────────────────────────────────────────────────────────────

let written = 0;

for (const scenario of scenarios) {
  // Fix audio_path with actual slug
  scenario.steps = scenario.steps.map((s: any) => ({
    ...s,
    audio_path: `/audio/${scenario.slug}/{lang}/step-${s.id}.mp3`
  }));
  
  const filePath = path.join(SCENARIOS_DIR, `${scenario.slug}.json`);
  fs.writeFileSync(filePath, JSON.stringify(scenario, null, 2), 'utf-8');
  console.log(`✅ Written scenario: ${scenario.slug}`);
  written++;
}

for (const [slug, tree] of Object.entries(trees)) {
  const filePath = path.join(TREES_DIR, `${slug}-flow.json`);
  fs.writeFileSync(filePath, JSON.stringify(tree, null, 2), 'utf-8');
  console.log(`✅ Written tree: ${slug}-flow`);
  written++;
}

console.log(`\n🎉 Done — ${written} files written.`);
