export interface TrickTreeDefinition {id:string;name:string;family:string;prerequisites:string[];guideId?:string;stance?:'fakie'|'switch'|'nollie';}
// Learning dependencies mirror the existing Trick Guides and can be revised separately.
export const TRICK_TREE_CATALOG:TrickTreeDefinition[]=[
  {
    "id": "ollie",
    "name": "Ollie",
    "family": "Fundamentals",
    "prerequisites": []
  },
  {
    "id": "kickflip",
    "name": "Kickflip",
    "family": "Flip tricks",
    "prerequisites": [
      "ollie"
    ]
  },
  {
    "id": "pop-shuvit",
    "name": "Pop Shuvit",
    "family": "Spin tricks",
    "prerequisites": [
      "ollie"
    ]
  },
  {
    "id": "heelflip",
    "name": "Heelflip",
    "family": "Flip tricks",
    "prerequisites": [
      "ollie"
    ]
  },
  {
    "id": "50-50",
    "name": "50-50 Grind",
    "family": "Grinds & slides",
    "prerequisites": [
      "ollie"
    ]
  },
  {
    "id": "frontside_pop_shuvit",
    "name": "FS Pop Shuvit",
    "family": "Spin tricks",
    "prerequisites": [
      "ollie",
      "pop-shuvit"
    ]
  },
  {
    "id": "boardslide",
    "name": "Boardslide",
    "family": "Grinds & slides",
    "prerequisites": [
      "ollie"
    ]
  },
  {
    "id": "double_kickflip",
    "name": "Double Kickflip",
    "family": "Flip tricks",
    "prerequisites": [
      "kickflip"
    ]
  },
  {
    "id": "shuvit_360",
    "name": "360 Shuvit",
    "family": "Spin tricks",
    "prerequisites": [
      "pop-shuvit"
    ]
  },
  {
    "id": "shuvit_540",
    "name": "540 Shuvit",
    "family": "Spin tricks",
    "prerequisites": [
      "shuvit_360"
    ]
  },
  {
    "id": "varial_kickflip",
    "name": "Varial Kickflip",
    "family": "Flip tricks",
    "prerequisites": [
      "pop-shuvit",
      "kickflip"
    ]
  },
  {
    "id": "varial_heelflip",
    "name": "Varial Heelflip",
    "family": "Flip tricks",
    "prerequisites": [
      "frontside_pop_shuvit",
      "heelflip"
    ]
  },
  {
    "id": "hardflip",
    "name": "Hardflip",
    "family": "Flip tricks",
    "prerequisites": [
      "frontside_pop_shuvit",
      "kickflip"
    ]
  },
  {
    "id": "inward_heelflip",
    "name": "Inward Heelflip",
    "family": "Flip tricks",
    "prerequisites": [
      "pop-shuvit",
      "heelflip"
    ]
  },
  {
    "id": "tre_flip",
    "name": "Tre Flip",
    "family": "Flip tricks",
    "prerequisites": [
      "shuvit_360",
      "varial_kickflip"
    ]
  },
  {
    "id": "laser_flip",
    "name": "Laser Flip",
    "family": "Flip tricks",
    "prerequisites": [
      "varial_heelflip",
      "shuvit_360"
    ]
  },
  {
    "id": "nightmare_flip",
    "name": "Nightmare Flip",
    "family": "Flip tricks",
    "prerequisites": [
      "varial_kickflip",
      "double_kickflip"
    ]
  },
  {
    "id": "bigspin",
    "name": "Bigspin",
    "family": "Spin tricks",
    "prerequisites": [
      "shuvit_360"
    ]
  },
  {
    "id": "bigger_spin",
    "name": "Bigger Spin",
    "family": "Spin tricks",
    "prerequisites": [
      "bigspin",
      "shuvit_540"
    ]
  },
  {
    "id": "bigflip",
    "name": "Bigflip",
    "family": "Flip tricks",
    "prerequisites": [
      "bigspin",
      "tre_flip"
    ]
  },
  {
    "id": "bigger_flip",
    "name": "Bigger Flip",
    "family": "Flip tricks",
    "prerequisites": [
      "bigflip",
      "bigger_spin"
    ]
  },
  {
    "id": "bigheel",
    "name": "Bigheel",
    "family": "Flip tricks",
    "prerequisites": [
      "bigspin",
      "laser_flip"
    ]
  },
  {
    "id": "bigspin_inward_heelflip",
    "name": "Bigspin Inward Heelflip",
    "family": "Flip tricks",
    "prerequisites": [
      "inward_heelflip",
      "bigspin"
    ]
  },
  {
    "id": "impossible",
    "name": "Impossible",
    "family": "Flip tricks",
    "prerequisites": [
      "ollie",
      "pop-shuvit"
    ]
  },
  {
    "id": "5_0",
    "name": "5-0",
    "family": "Grinds & slides",
    "prerequisites": [
      "ollie",
      "50-50"
    ]
  },
  {
    "id": "nosegrind",
    "name": "Nosegrind",
    "family": "Grinds & slides",
    "prerequisites": [
      "ollie",
      "50-50"
    ]
  },
  {
    "id": "crooked",
    "name": "Crooked Grind",
    "family": "Grinds & slides",
    "prerequisites": [
      "ollie",
      "50-50"
    ]
  },
  {
    "id": "overcrook",
    "name": "Overcrook",
    "family": "Grinds & slides",
    "prerequisites": [
      "nosegrind",
      "crooked"
    ]
  },
  {
    "id": "smith",
    "name": "Smith Grind",
    "family": "Grinds & slides",
    "prerequisites": [
      "ollie",
      "50-50"
    ]
  },
  {
    "id": "feeble",
    "name": "Feeble Grind",
    "family": "Grinds & slides",
    "prerequisites": [
      "ollie",
      "50-50"
    ]
  },
  {
    "id": "suski",
    "name": "Suski Grind",
    "family": "Grinds & slides",
    "prerequisites": [
      "ollie",
      "50-50"
    ]
  },
  {
    "id": "salad",
    "name": "Salad Grind",
    "family": "Grinds & slides",
    "prerequisites": [
      "ollie",
      "50-50"
    ]
  },
  {
    "id": "willy",
    "name": "Willy Grind",
    "family": "Grinds & slides",
    "prerequisites": [
      "ollie",
      "50-50"
    ]
  },
  {
    "id": "overwilly",
    "name": "Overwilly",
    "family": "Grinds & slides",
    "prerequisites": [
      "ollie",
      "50-50"
    ]
  },
  {
    "id": "lipslide",
    "name": "Lipslide",
    "family": "Grinds & slides",
    "prerequisites": [
      "ollie",
      "boardslide"
    ]
  },
  {
    "id": "noseslide",
    "name": "Noseslide",
    "family": "Grinds & slides",
    "prerequisites": [
      "ollie",
      "boardslide"
    ]
  },
  {
    "id": "tailslide",
    "name": "Tailslide",
    "family": "Grinds & slides",
    "prerequisites": [
      "ollie",
      "boardslide"
    ]
  },
  {
    "id": "bluntslide",
    "name": "Bluntslide",
    "family": "Grinds & slides",
    "prerequisites": [
      "ollie",
      "boardslide"
    ]
  },
  {
    "id": "nosebluntslide",
    "name": "Nosebluntslide",
    "family": "Grinds & slides",
    "prerequisites": [
      "ollie",
      "boardslide"
    ]
  },
  {
    "id": "darkslide",
    "name": "Darkslide",
    "family": "Grinds & slides",
    "prerequisites": [
      "kickflip",
      "boardslide"
    ]
  },
  {
    "id": "primo_slide",
    "name": "Primo Slide",
    "family": "Grinds & slides",
    "prerequisites": [
      "kickflip",
      "boardslide"
    ]
  },
  {
    "id": "banana_slide",
    "name": "Banana Slide",
    "family": "Grinds & slides",
    "prerequisites": [
      "ollie",
      "boardslide"
    ]
  },
  {
    "id": "hurricane",
    "name": "Hurricane Grind",
    "family": "Grinds & slides",
    "prerequisites": [
      "ollie",
      "feeble"
    ]
  },
  {
    "id": "sugarcane",
    "name": "Sugarcane Grind",
    "family": "Grinds & slides",
    "prerequisites": [
      "ollie",
      "smith"
    ]
  },
  {
    "id": "bennett",
    "name": "Bennett Grind",
    "family": "Grinds & slides",
    "prerequisites": [
      "ollie",
      "smith"
    ]
  },
  {
    "id": "barley",
    "name": "Barley Grind",
    "family": "Grinds & slides",
    "prerequisites": [
      "ollie",
      "smith"
    ]
  }
];
// Each stance has its own Ollie foundation and same-stance progression.
const flatgroundBases=TRICK_TREE_CATALOG.filter(n=>n.family!=='Grinds & slides'&&!n.stance);
for(const node of flatgroundBases){
 for(const stance of ['fakie','switch','nollie'] as const){
  const prerequisites=node.prerequisites.map(id=>`${id}:${stance}`);
  TRICK_TREE_CATALOG.push({id:`${node.id}:${stance}`,name:node.id==='ollie'&&stance==='nollie'?'Nollie':`${stance.charAt(0).toUpperCase()+stance.slice(1)} ${node.name}`,family:node.family,prerequisites,guideId:node.id,stance});
 }
}
