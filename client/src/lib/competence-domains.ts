/**
 * Competence domains extracted from GEN 14 – Matrice des compétences V21
 * Structure: Catégorie → Domaine Général → Sous-Domaines
 */

export interface CompetenceCategory {
  label: string;
  code: string;
  domaines: {
    label: string;
    sousDomaines: string[];
  }[];
}

export const COMPETENCE_CATEGORIES: CompetenceCategory[] = [
  {
    label: "Inspection",
    code: "INS",
    domaines: [
      { label: "Management de la qualité", sousDomaines: ["Système de management"] },
      { label: "Levage", sousDomaines: ["Transport mécanique", "Equipements de travail"] },
      { label: "Electricité", sousDomaines: ["Equipements et installations", "Protection cathodique"] },
      { label: "Génie civil et bâtiment", sousDomaines: ["Génie Civil", "Bâtiment", "Matériaux de construction"] },
      { label: "Transport", sousDomaines: ["Transport Routier", "Transports guides", "Transport Aérien"] },
      { label: "Produits et composants Industriels", sousDomaines: ["Contrôle Non Destructif (CND)"] },
      { label: "Installation gaz vapeur", sousDomaines: ["Equipement sous pression"] },
      { label: "Soudage", sousDomaines: ["Qualification des Soudeurs et du Mode Opératoire de soudage (QS / QMOS)"] },
      { label: "Agréage", sousDomaines: ["Agroalimentaire / Alimentaire", "Sidérurgique / Minerais", "Produits chimiques / pétrochimiques", "Manufacturés divers"] },
      { label: "Criminalistique", sousDomaines: ["Empreintes Digitales", "Véhicule", "Médecine légale", "Faune et flore cadavérique", "Balistique mécanique", "Expertise Documents"] },
    ],
  },
  {
    label: "Étalonnage",
    code: "LET",
    domaines: [
      { label: "Management de la qualité", sousDomaines: ["Système de management"] },
      { label: "Mécanique", sousDomaines: ["Dimensionnel", "Physique", "Pression", "Débit", "Energie"] },
      { label: "Thermique", sousDomaines: ["Température", "Humidité"] },
      { label: "Electricité", sousDomaines: ["Courant continu", "Courant alternatif BT", "Courant alternatif HT"] },
      { label: "Temps / Fréquence", sousDomaines: ["Temps / Fréquence"] },
    ],
  },
  {
    label: "Essais",
    code: "LES",
    domaines: [
      { label: "Management de la qualité", sousDomaines: ["Système de management"] },
      { label: "Génie Civil", sousDomaines: ["Géo matériaux", "Géotechnique", "Travaux Publics"] },
      { label: "Génie des matériaux", sousDomaines: ["Métallurgie"] },
      { label: "Electricité", sousDomaines: ["Sécurité électrique"] },
      { label: "Pétrochimie", sousDomaines: ["Raffinage Pétrole"] },
      { label: "Géologie", sousDomaines: ["Géochimie"] },
      { label: "Criminalistique", sousDomaines: ["Toxicologie médico-légale", "Physico-Chimie", "Biologie moléculaire", "Informatique", "Vidéo/Image", "Microbiologie"] },
      { label: "Sciences Vétérinaires", sousDomaines: ["Zoonoses", "Hygiène alimentaire"] },
      { label: "Sciences Agronomiques", sousDomaines: ["Technologie alimentaire", "Science du sol", "Phytotechnie", "Phytopathologie", "Phytopharmacie"] },
      { label: "Sciences pharmaceutiques et biologiques", sousDomaines: ["Toxicologie médicale", "Toxicologie Professionnelle", "Toxicologie Alimentaire", "Microbiologie", "Pharmacologie", "Chimie Analytique"] },
      { label: "Echantillonnage", sousDomaines: ["Génie Civil", "Génie des matériaux", "Pétrochimie", "Géologie", "Sciences agronomiques", "Sciences pharmaceutiques et biologiques"] },
      { label: "Mécanique Physique", sousDomaines: ["Equipements industriels et produits d'ingénierie", "Physique des matériaux"] },
      { label: "Génie électrique", sousDomaines: ["Electronique"] },
      { label: "Energies renouvelable", sousDomaines: ["Energie solaire"] },
      { label: "Environnement", sousDomaines: ["Sciences du sol", "Technologie alimentaire"] },
    ],
  },
  {
    label: "Biomédicale",
    code: "LBM",
    domaines: [
      { label: "Management de la qualité", sousDomaines: ["Système de management"] },
      { label: "Biologie Médicale", sousDomaines: ["Biochimie", "Hématologie", "Immunologie", "Microbiologie", "Génétique", "Biologie de reproduction"] },
      { label: "Anatomie et cytologie", sousDomaines: ["Pathologie"] },
      { label: "Biologie médicolégale", sousDomaines: ["Médicolégal"] },
    ],
  },
  {
    label: "Certification Systèmes Management",
    code: "CSM",
    domaines: [
      { label: "Système de management", sousDomaines: [] },
      { label: "Agriculture, forêt et pêche", sousDomaines: [] },
      { label: "Mines et carrières", sousDomaines: [] },
      { label: "Produits alimentaires, boissons et tabacs", sousDomaines: [] },
      { label: "Textiles et articles d'habillement", sousDomaines: [] },
      { label: "Cuir et produits connexes", sousDomaines: [] },
      { label: "Bois et produits de bois", sousDomaines: [] },
      { label: "Papier et produits de papier", sousDomaines: [] },
      { label: "Activités d'édition", sousDomaines: [] },
      { label: "Impression et activités de service liées à l'impression", sousDomaines: [] },
      { label: "Fabrication de coke et de produits pétroliers raffinés", sousDomaines: [] },
      { label: "Traitement de combustible nucléaire", sousDomaines: [] },
      { label: "Produits Chimiques et fabrication de produits chimiques et de fibres", sousDomaines: [] },
      { label: "Fabrication de Produits pharmaceutiques", sousDomaines: [] },
      { label: "Fabrication de produits en plastiques et de caoutchouc", sousDomaines: [] },
      { label: "Fabrication d'autres produits minéraux non métalliques", sousDomaines: [] },
      { label: "Fabrication de Ciment, chaux et plâtre", sousDomaines: [] },
      { label: "Fabrication de métaux de base et d'ouvrages en métaux", sousDomaines: [] },
      { label: "Machines et équipements", sousDomaines: [] },
      { label: "Equipements électriques et optiques", sousDomaines: [] },
      { label: "Construction navale", sousDomaines: [] },
      { label: "Construction aéronautique", sousDomaines: [] },
      { label: "Autre matériel de transport", sousDomaines: [] },
      { label: "Autres industries manufacturières", sousDomaines: [] },
      { label: "Recyclage", sousDomaines: [] },
      { label: "Production et distribution d'énergie électrique", sousDomaines: [] },
      { label: "Production et distribution de gaz", sousDomaines: [] },
      { label: "Production et distribution d'eau", sousDomaines: [] },
      { label: "Construction", sousDomaines: [] },
      { label: "Commerce en gros et en détail", sousDomaines: [] },
      { label: "Restauration et hébergement", sousDomaines: [] },
      { label: "Transport, entreposage et communication", sousDomaines: [] },
      { label: "Activités financières, immobilières et de locations", sousDomaines: [] },
      { label: "Activités informatiques", sousDomaines: [] },
      { label: "Engineering de services", sousDomaines: [] },
      { label: "Autres services", sousDomaines: [] },
      { label: "Administration publique", sousDomaines: [] },
      { label: "Education", sousDomaines: [] },
      { label: "Santé et activités sociales", sousDomaines: [] },
      { label: "Autres services sociaux", sousDomaines: [] },
    ],
  },
  {
    label: "Certification SMSDA",
    code: "SDA",
    domaines: [
      { label: "Système de management", sousDomaines: ["Système de management"] },
      { label: "Production primaire", sousDomaines: ["Production animales ou manipulation d'animaux", "Productions végétales ou manipulation de plantes"] },
      { label: "Transformation des denrées alimentaires", sousDomaines: ["Transformation de denrées alimentaires, d'ingrédients et d'aliment.", "Transformation aliments pour animaux"] },
      { label: "Restauration", sousDomaines: ["Restauration"] },
      { label: "Vente au détail, transport et stockage", sousDomaines: ["Négoce, commerce de détail et commerce en ligne", "Service de transport et de stockage"] },
      { label: "Services auxiliaires", sousDomaines: ["Services"] },
      { label: "Matériaux d'emballage", sousDomaines: ["Production de matériaux d'emballage"] },
      { label: "Équipements auxiliaires", sousDomaines: ["Équipement"] },
      { label: "(Bio) chimiques", sousDomaines: ["Chimie et biochimie"] },
    ],
  },
  {
    label: "Certification Produits",
    code: "CPG",
    domaines: [
      { label: "Système de management", sousDomaines: ["Système de management"] },
      { label: "Produits métallurgiques", sousDomaines: ["Produits sidérurgiques de base et ferro-alliages"] },
    ],
  },
  {
    label: "Certification Personnes",
    code: "CPE",
    domaines: [
      { label: "Système de management", sousDomaines: ["Système de management"] },
      { label: "Personnes réalisant des essais non destructifs industriels (END)", sousDomaines: ["ISO 9712", "SNT-TC-1A"] },
    ],
  },
];
