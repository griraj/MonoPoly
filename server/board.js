// Official US Monopoly board data.
// rent = [base, 1house, 2house, 3house, 4house, hotel] for properties
// railroads: rent depends on how many railroads the owner has (index 0..3 -> 1..4 owned)
// utilities: rent multiplier depends on dice roll and number of utilities owned (handled in gameLogic)

export const BOARD = [
  { id: 0, type: 'go', name: 'GO' },
  { id: 1, type: 'property', name: 'Mediterranean Avenue', color: 'brown', price: 60, rent: [2, 10, 30, 90, 160, 250], houseCost: 50, mortgage: 30 },
  { id: 2, type: 'community_chest', name: 'Community Chest' },
  { id: 3, type: 'property', name: 'Baltic Avenue', color: 'brown', price: 60, rent: [4, 20, 60, 180, 320, 450], houseCost: 50, mortgage: 30 },
  { id: 4, type: 'tax', name: 'Income Tax', amount: 200 },
  { id: 5, type: 'railroad', name: 'Reading Railroad', price: 200, mortgage: 100 },
  { id: 6, type: 'property', name: 'Oriental Avenue', color: 'lightblue', price: 100, rent: [6, 30, 90, 270, 400, 550], houseCost: 50, mortgage: 50 },
  { id: 7, type: 'chance', name: 'Chance' },
  { id: 8, type: 'property', name: 'Vermont Avenue', color: 'lightblue', price: 100, rent: [6, 30, 90, 270, 400, 550], houseCost: 50, mortgage: 50 },
  { id: 9, type: 'property', name: 'Connecticut Avenue', color: 'lightblue', price: 120, rent: [8, 40, 100, 300, 450, 600], houseCost: 50, mortgage: 60 },
  { id: 10, type: 'jail', name: 'Jail / Just Visiting' },
  { id: 11, type: 'property', name: 'St. Charles Place', color: 'pink', price: 140, rent: [10, 50, 150, 450, 625, 750], houseCost: 100, mortgage: 70 },
  { id: 12, type: 'utility', name: 'Electric Company', price: 150, mortgage: 75 },
  { id: 13, type: 'property', name: 'States Avenue', color: 'pink', price: 140, rent: [10, 50, 150, 450, 625, 750], houseCost: 100, mortgage: 70 },
  { id: 14, type: 'property', name: 'Virginia Avenue', color: 'pink', price: 160, rent: [12, 60, 180, 500, 700, 900], houseCost: 100, mortgage: 80 },
  { id: 15, type: 'railroad', name: 'Pennsylvania Railroad', price: 200, mortgage: 100 },
  { id: 16, type: 'property', name: 'St. James Place', color: 'orange', price: 180, rent: [14, 70, 200, 550, 750, 950], houseCost: 100, mortgage: 90 },
  { id: 17, type: 'community_chest', name: 'Community Chest' },
  { id: 18, type: 'property', name: 'Tennessee Avenue', color: 'orange', price: 180, rent: [14, 70, 200, 550, 750, 950], houseCost: 100, mortgage: 90 },
  { id: 19, type: 'property', name: 'New York Avenue', color: 'orange', price: 200, rent: [16, 80, 220, 600, 800, 1000], houseCost: 100, mortgage: 100 },
  { id: 20, type: 'free_parking', name: 'Free Parking' },
  { id: 21, type: 'property', name: 'Kentucky Avenue', color: 'red', price: 220, rent: [18, 90, 250, 700, 875, 1050], houseCost: 150, mortgage: 110 },
  { id: 22, type: 'chance', name: 'Chance' },
  { id: 23, type: 'property', name: 'Indiana Avenue', color: 'red', price: 220, rent: [18, 90, 250, 700, 875, 1050], houseCost: 150, mortgage: 110 },
  { id: 24, type: 'property', name: 'Illinois Avenue', color: 'red', price: 240, rent: [20, 100, 300, 750, 925, 1100], houseCost: 150, mortgage: 120 },
  { id: 25, type: 'railroad', name: 'B. & O. Railroad', price: 200, mortgage: 100 },
  { id: 26, type: 'property', name: 'Atlantic Avenue', color: 'yellow', price: 260, rent: [22, 110, 330, 800, 975, 1150], houseCost: 150, mortgage: 130 },
  { id: 27, type: 'property', name: 'Ventnor Avenue', color: 'yellow', price: 260, rent: [22, 110, 330, 800, 975, 1150], houseCost: 150, mortgage: 130 },
  { id: 28, type: 'utility', name: 'Water Works', price: 150, mortgage: 75 },
  { id: 29, type: 'property', name: 'Marvin Gardens', color: 'yellow', price: 280, rent: [24, 120, 360, 850, 1025, 1200], houseCost: 150, mortgage: 140 },
  { id: 30, type: 'go_to_jail', name: 'Go To Jail' },
  { id: 31, type: 'property', name: 'Pacific Avenue', color: 'green', price: 300, rent: [26, 130, 390, 900, 1100, 1275], houseCost: 200, mortgage: 150 },
  { id: 32, type: 'property', name: 'North Carolina Avenue', color: 'green', price: 300, rent: [26, 130, 390, 900, 1100, 1275], houseCost: 200, mortgage: 150 },
  { id: 33, type: 'community_chest', name: 'Community Chest' },
  { id: 34, type: 'property', name: 'Pennsylvania Avenue', color: 'green', price: 320, rent: [28, 150, 450, 1000, 1200, 1400], houseCost: 200, mortgage: 160 },
  { id: 35, type: 'railroad', name: 'Short Line', price: 200, mortgage: 100 },
  { id: 36, type: 'chance', name: 'Chance' },
  { id: 37, type: 'property', name: 'Park Place', color: 'darkblue', price: 350, rent: [35, 175, 500, 1100, 1300, 1500], houseCost: 200, mortgage: 175 },
  { id: 38, type: 'tax', name: 'Luxury Tax', amount: 100 },
  { id: 39, type: 'property', name: 'Boardwalk', color: 'darkblue', price: 400, rent: [50, 200, 600, 1400, 1700, 2000], houseCost: 200, mortgage: 200 },
];

export const COLOR_GROUPS = BOARD.reduce((acc, space) => {
  if (space.type === 'property') {
    acc[space.color] = acc[space.color] || [];
    acc[space.color].push(space.id);
  }
  return acc;
}, {});

export const RAILROAD_RENTS = [25, 50, 100, 200]; // by number owned (1-4)

export const PLAYER_COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

export const JAIL_POSITION = 10;
export const GO_TO_JAIL_POSITION = 30;
export const GO_SALARY = 200;
