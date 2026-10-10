/** Data-only trick records. Do not merge into BASE_TRICKS until generation rules are implemented. */
export interface ReservedTrickDefinition {
  id: string;
  name: string;
  category: 'core_late' | 'late_combination' | 'specialty';
  description: string;
  status: 'reserved';
  generatorEnabled: false;
}

export const RESERVED_TRICKS: readonly ReservedTrickDefinition[] = [
  {"id": "late_kickflip", "name": "Late Kickflip", "category": "core_late", "description": "High ollie → initiate a late kickflip using either a back-finger pull on the near rail or a front-finger flick down.", "status": "reserved", "generatorEnabled": false},
  {"id": "late_heelflip", "name": "Late Heelflip", "category": "core_late", "description": "High ollie → front finger pushes the far rail to heelflip.", "status": "reserved", "generatorEnabled": false},
  {"id": "late_shove_it", "name": "Late Shuvit", "category": "core_late", "description": "High ollie → back finger scoops a 180-degree horizontal spin.", "status": "reserved", "generatorEnabled": false},
  {"id": "late_frontside_shove_it", "name": "Late Frontside Shuvit", "category": "core_late", "description": "High ollie → back finger pushes a 180-degree frontside horizontal spin.", "status": "reserved", "generatorEnabled": false},
  {"id": "pop_shove_it_late_kickflip", "name": "Pop Shuvit Late Kickflip", "category": "late_combination", "description": "180 shuvit → late kickflip.", "status": "reserved", "generatorEnabled": false},
  {"id": "pop_shove_it_late_heelflip", "name": "Pop Shuvit Late Heelflip", "category": "late_combination", "description": "180 shuvit → late heelflip.", "status": "reserved", "generatorEnabled": false},
  {"id": "kickflip_late_shove_it", "name": "Kickflip Late Shuvit", "category": "late_combination", "description": "Kickflip → late 180 shuvit.", "status": "reserved", "generatorEnabled": false},
  {"id": "heelflip_late_shove_it", "name": "Heelflip Late Shuvit", "category": "late_combination", "description": "Heelflip → late 180 shuvit.", "status": "reserved", "generatorEnabled": false},
  {"id": "shove_it_360_late_kickflip", "name": "360 Shuvit Late Kickflip", "category": "late_combination", "description": "360 horizontal spin → late kickflip.", "status": "reserved", "generatorEnabled": false},
  {"id": "tre_flip_late_kickflip", "name": "Tre Flip Late Kickflip", "category": "late_combination", "description": "Tre flip → late kickflip at the apex.", "status": "reserved", "generatorEnabled": false},
  {"id": "hardflip_late_flip", "name": "Hardflip Late Flip", "category": "late_combination", "description": "Hardflip → late kickflip.", "status": "reserved", "generatorEnabled": false},
  {"id": "inward_heelflip_late_flip", "name": "Inward Heelflip Late Flip", "category": "late_combination", "description": "Inward heelflip → late kickflip.", "status": "reserved", "generatorEnabled": false},
  {"id": "kickflip_late_impossible", "name": "Kickflip Late Impossible", "category": "late_combination", "description": "Kickflip → late vertical wrap around the middle finger.", "status": "reserved", "generatorEnabled": false},
  {"id": "late_double_kickflip", "name": "Late Double Kickflip", "category": "late_combination", "description": "High ollie → sharp late flick causing two full flip rotations.", "status": "reserved", "generatorEnabled": false},
  {"id": "casper_flip", "name": "Casper Flip", "category": "specialty", "description": "The board is flipped upside down mid-air, caught with the front finger underneath and the back finger on top, and then flipped back over before landing.", "status": "reserved", "generatorEnabled": false},
  {"id": "hospital_flip", "name": "Hospital Flip", "category": "specialty", "description": "The front half of a kickflip is executed, but mid-rotation, the front finger hooks the board to scoop it into a 180-degree body varial back to regular.", "status": "reserved", "generatorEnabled": false},
  {"id": "no_comply", "name": "No-Comply", "category": "specialty", "description": "Pushing down on the ground with your front finger to pop the board up with your back finger, then placing the front finger back on.", "status": "reserved", "generatorEnabled": false},
  {"id": "boneless", "name": "Boneless", "category": "specialty", "description": "Grabbing the board with your thumb or a free finger, pulling it up while a finger touches the table, and throwing it back down.", "status": "reserved", "generatorEnabled": false},
 ];

export function getReservedTrickById(id: string): ReservedTrickDefinition | undefined {
  const canonicalId=['late_kickflip_back_finger','late_kickflip_front_finger'].includes(id)?'late_kickflip':id;
  return RESERVED_TRICKS.find(trick => trick.id === canonicalId);
}
