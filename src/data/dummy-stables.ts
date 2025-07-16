import { Stable } from '@/types/stable';

export const dummyStables: Stable[] = [
  {
    id: '1',
    name: 'Bjørkerud Ridestall',
    description: 'Moderne stall med høy standard i naturskjønne omgivelser. Vi tilbyr daglig utgang på store beiter og individuell oppfølging av hver hest.',
    location: 'Asker, Akershus',
    price: 4500,
    availableSpaces: 3,
    totalSpaces: 20,
    rating: 4.8,
    reviewCount: 24,
    images: [
      'https://keyassets.timeincuk.net/inspirewp/live/wp-content/uploads/sites/14/2019/09/stabling-vet-5-alamy-PH51E1_338800492_577723531-920x518.jpg',
      'https://www.titangarages.com.au/wp-content/uploads/2016/02/How-to-Properly-Prepare-Stables-for-a-Horse.gif'
    ],
    amenities: ['Daglig utgang', 'Ridehall', 'Solarium', 'Vaskeboks'],
    owner: {
      name: 'Kari Nordahl',
      phone: '92345678',
      email: 'kari@bjorkerud.no'
    },
    createdAt: new Date('2024-01-15'),
    featured: true
  },
  {
    id: '2',
    name: 'Grønli Gård',
    description: 'Tradisjonell gård med fokus på hesters velbefinnende. Store beiter og god tilgang til turstier.',
    location: 'Lillehammer, Oppland',
    price: 3800,
    availableSpaces: 5,
    totalSpaces: 15,
    rating: 4.5,
    reviewCount: 18,
    images: [
      'https://www.titangarages.com.au/wp-content/uploads/2016/02/How-to-Properly-Prepare-Stables-for-a-Horse.gif',
      'https://keyassets.timeincuk.net/inspirewp/live/wp-content/uploads/sites/14/2019/09/stabling-vet-5-alamy-PH51E1_338800492_577723531-920x518.jpg'
    ],
    amenities: ['Daglig utgang', 'Turstier', 'Hestesvømming'],
    owner: {
      name: 'Ole Grønli',
      phone: '98765432',
      email: 'ole@gronli.no'
    },
    createdAt: new Date('2024-02-01'),
    featured: false
  },
  {
    id: '3',
    name: 'Solhøi Ridesenter',
    description: 'Profesjonelt ridesenter med erfarne instruktører. Perfekt for både nybegynnere og erfarne ryttere.',
    location: 'Drammen, Buskerud',
    price: 5200,
    availableSpaces: 2,
    totalSpaces: 25,
    rating: 4.9,
    reviewCount: 31,
    images: [
      'https://keyassets.timeincuk.net/inspirewp/live/wp-content/uploads/sites/14/2019/09/stabling-vet-5-alamy-PH51E1_338800492_577723531-920x518.jpg',
      'https://www.titangarages.com.au/wp-content/uploads/2016/02/How-to-Properly-Prepare-Stables-for-a-Horse.gif'
    ],
    amenities: ['Ridehall', 'Springbane', 'Dressurarena', 'Instruktører'],
    owner: {
      name: 'Linda Solberg',
      phone: '91234567',
      email: 'linda@solhoi.no'
    },
    createdAt: new Date('2024-01-20'),
    featured: true
  },
  {
    id: '4',
    name: 'Eikåsen Stall',
    description: 'Koselig familiedrevet stall med personlig oppfølging. Rolige omgivelser og god atmosfære.',
    location: 'Hamar, Hedmark',
    price: 4200,
    availableSpaces: 4,
    totalSpaces: 12,
    rating: 4.6,
    reviewCount: 15,
    images: [
      'https://www.titangarages.com.au/wp-content/uploads/2016/02/How-to-Properly-Prepare-Stables-for-a-Horse.gif',
      'https://keyassets.timeincuk.net/inspirewp/live/wp-content/uploads/sites/14/2019/09/stabling-vet-5-alamy-PH51E1_338800492_577723531-920x518.jpg'
    ],
    amenities: ['Daglig utgang', 'Familievennlig', 'Personlig oppfølging'],
    owner: {
      name: 'Erik Eikåsen',
      phone: '95678901',
      email: 'erik@eikasen.no'
    },
    createdAt: new Date('2024-02-10'),
    featured: false
  },
  {
    id: '5',
    name: 'Vestfjell Hestefarm',
    description: 'Stor hestefarm med omfattende fasiliteter. Spesialisert på konkurransehester og dressur.',
    location: 'Tønsberg, Vestfold',
    price: 6000,
    availableSpaces: 1,
    totalSpaces: 30,
    rating: 4.7,
    reviewCount: 28,
    images: [
      'https://keyassets.timeincuk.net/inspirewp/live/wp-content/uploads/sites/14/2019/09/stabling-vet-5-alamy-PH51E1_338800492_577723531-920x518.jpg',
      'https://www.titangarages.com.au/wp-content/uploads/2016/02/How-to-Properly-Prepare-Stables-for-a-Horse.gif'
    ],
    amenities: ['Dressurarena', 'Springbane', 'Treningsspor', 'Veterinær'],
    owner: {
      name: 'Mette Vestfjell',
      phone: '92987654',
      email: 'mette@vestfjell.no'
    },
    createdAt: new Date('2024-01-05'),
    featured: true
  },
  {
    id: '6',
    name: 'Åsane Rideklubb',
    description: 'Aktiv rideklubb med sosiale aktiviteter og kurs. Godt miljø for både hest og rytter.',
    location: 'Bergen, Hordaland',
    price: 4800,
    availableSpaces: 6,
    totalSpaces: 18,
    rating: 4.4,
    reviewCount: 22,
    images: [
      'https://www.titangarages.com.au/wp-content/uploads/2016/02/How-to-Properly-Prepare-Stables-for-a-Horse.gif',
      'https://keyassets.timeincuk.net/inspirewp/live/wp-content/uploads/sites/14/2019/09/stabling-vet-5-alamy-PH51E1_338800492_577723531-920x518.jpg'
    ],
    amenities: ['Ridehall', 'Sosiale aktiviteter', 'Kurs', 'Klubbhus'],
    owner: {
      name: 'Tone Åsane',
      phone: '94567890',
      email: 'tone@asane.no'
    },
    createdAt: new Date('2024-01-25'),
    featured: false
  }
];