// ═══════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════
const POINTS = [
  {id:0,x:0,y:0,nom:"Dépôt"},
  {id:1,x:2.5,y:3.1,nom:"Quartier Nord"},
  {id:2,x:5.2,y:4.8,nom:"Centre Ville"},
  {id:3,x:7.8,y:1.2,nom:"Zone Industrielle"},
  {id:4,x:3.0,y:7.5,nom:"Quartier Est"},
  {id:5,x:6.5,y:6.0,nom:"Quartier Ouest"},
  {id:6,x:9.0,y:4.5,nom:"Zone Commerciale"},
  {id:7,x:1.0,y:5.5,nom:"Quartier Sud"},
  {id:8,x:4.5,y:2.0,nom:"Zone Résidentielle"},
  {id:9,x:8.5,y:8.0,nom:"Nouveau Quartier"}
];
const EDGES = [[0,1],[0,7],[0,8],[1,2],[1,4],[1,7],[2,3],[2,5],[2,6],[3,6],[3,8],[4,5],[5,6],[5,9],[6,9]];
const MATRIX = [[0.0,3.9825,8.1825,8.32,8.4108,9.9516,11.8314,5.5902,4.9244,12.7801],[3.9825,0.0,4.2,8.6407,4.4283,5.9692,8.0118,2.8302,8.9069,8.7976],[8.1825,4.2,0.0,4.4407,5.5771,1.7692,3.8118,7.0302,7.8363,4.5976],[8.32,8.6407,4.4407,0.0,10.0178,6.2099,3.5114,11.4709,3.3956,7.0469],[8.4108,4.4283,5.5771,10.0178,0.0,3.8079,6.7234,7.2585,13.3352,6.6363],[9.9516,5.9692,1.7692,6.2099,3.8079,0.0,2.9155,8.7994,9.6055,2.8284],[11.8314,8.0118,3.8118,3.5114,6.7234,2.9155,0.0,10.842,6.907,3.5355],[5.5902,2.8302,7.0302,11.4709,7.2585,8.7994,10.842,0.0,10.5146,11.6278],[4.9244,8.9069,7.8363,3.3956,13.3352,9.6055,6.907,10.5146,0.0,10.4425],[12.7801,8.7976,4.5976,7.0469,6.6363,2.8284,3.5355,11.6278,10.4425,0.0]];

const CAMIONS = [
  {id:1, zones:[4,3], cap:5000, charge:3000, color:'#3b82f6', icon:'🚛'},
  {id:2, zones:[5,1], cap:4000, charge:2700, color:'#f59e0b', icon:'🚚'},
  {id:3, zones:[2,6], cap:6000, charge:2900, color:'#00d4aa', icon:'🚐'},
];
const ZONES = [
  {id:1,vol:1200,cx:3.5,cy:4.2,nom:"Zone 1"},
  {id:2,vol:1800,cx:6.0,cy:3.0,nom:"Zone 2"},
  {id:3,vol:900,cx:6.5,cy:6.0,nom:"Zone 3"},
  {id:4,vol:2100,cx:5.0,cy:7.5,nom:"Zone 4"},
  {id:5,vol:1500,cx:4.5,cy:2.0,nom:"Zone 5"},
  {id:6,vol:1100,cx:8.5,cy:8.0,nom:"Zone 6"},
];

const PLANNING = {
  lundi: [
    {camion:1,zone:4,debut:"06:00",fin:"08:00",cong:1.0},
    {camion:1,zone:3,debut:"10:00",fin:"12:00",cong:1.1},
    {camion:2,zone:5,debut:"06:00",fin:"08:00",cong:1.0},
    {camion:2,zone:1,debut:"10:00",fin:"12:00",cong:1.1},
    {camion:3,zone:2,debut:"10:00",fin:"12:00",cong:1.1},
    {camion:3,zone:6,debut:"06:00",fin:"08:00",cong:1.0},
  ],
  mardi: [
    {camion:1,zone:4,debut:"06:00",fin:"08:00",cong:1.0},
    {camion:2,zone:1,debut:"08:00",fin:"10:00",cong:1.4},
    {camion:3,zone:2,debut:"06:00",fin:"08:00",cong:1.0},
  ],
  mercredi: [
    {camion:1,zone:3,debut:"10:00",fin:"12:00",cong:1.0},
    {camion:2,zone:5,debut:"10:00",fin:"12:00",cong:1.0},
    {camion:3,zone:6,debut:"10:00",fin:"12:00",cong:1.0},
  ],
  jeudi: [
    {camion:1,zone:4,debut:"08:00",fin:"10:00",cong:1.2},
    {camion:2,zone:1,debut:"08:00",fin:"10:00",cong:1.2},
  ],
  vendredi: [
    {camion:1,zone:3,debut:"06:00",fin:"08:00",cong:1.0},
    {camion:3,zone:6,debut:"06:00",fin:"08:00",cong:1.0},
  ],
};

const VRP_TOURS_INIT = [[0,1,7,2,5,9,6,3,8,4,0]];
const VRP_TOURS_OPT  = [[0,8,3,6,9,5,2,4,1,7,0]];
const TOUR_COLORS = ['#3b82f6','#f59e0b','#00d4aa'];

// ═══════════════════════════════════════════════════════════
// N5 — SENSORS
// ═══════════════════════════════════════════════════════════
const SENSORS = [
  {id:1,nom:'Quartier Nord',level:45,rate:4.5},
  {id:2,nom:'Centre Ville',level:70,rate:6.0},
  {id:3,nom:'Zone Industrielle',level:30,rate:3.0},
  {id:4,nom:'Quartier Est',level:85,rate:5.0},
  {id:5,nom:'Zone Commerciale',level:55,rate:4.0},
  {id:6,nom:'Zone Résidentielle',level:40,rate:3.5},
  {id:7,nom:'Quartier Sud',level:60,rate:5.5},
  {id:8,nom:'Quartier Ouest',level:25,rate:3.2},
];
